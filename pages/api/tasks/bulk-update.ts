import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const bulkUpdateSchema = z.object({
  taskIds: z.array(z.string().cuid()).min(1),
  updates: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format"
    }).optional(),
    assignedToId: z.string().cuid().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional()
  }),
  updatedById: z.string().cuid(),
  reason: z.string().optional()
})

const bulkDeleteSchema = z.object({
  taskIds: z.array(z.string().cuid()).min(1),
  deletedById: z.string().cuid(),
  reason: z.string().min(5).max(500),
  hardDelete: z.boolean().optional().default(false)
})

const bulkStatusChangeSchema = z.object({
  taskIds: z.array(z.string().cuid()).min(1),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  updatedById: z.string().cuid(),
  completionNotes: z.string().optional(),
  reason: z.string().optional()
})

const bulkPriorityChangeSchema = z.object({
  taskIds: z.array(z.string().cuid()).min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  updatedById: z.string().cuid(),
  reason: z.string().optional()
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'PUT':
        await handlePut(req, res)
        break
      case 'PATCH':
        await handlePatch(req, res)
        break
      case 'DELETE':
        await handleDelete(req, res)
        break
      default:
        res.setHeader('Allow', ['PUT', 'PATCH', 'DELETE'])
        res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Bulk update API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = bulkUpdateSchema.parse(req.body)
    
    const {
      taskIds,
      updates,
      updatedById,
      reason
    } = validatedData

    // Verify all tasks exist
    const existingTasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds }
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (existingTasks.length !== taskIds.length) {
      const foundIds = existingTasks.map(t => t.id)
      const missingIds = taskIds.filter(id => !foundIds.includes(id))
      return res.status(404).json({ 
        error: 'Some tasks not found',
        missingTaskIds: missingIds
      })
    }

    // Verify updater exists
    const updater = await prisma.user.findUnique({
      where: { id: updatedById },
      select: {
        id: true,
        name: true,
        role: true
      }
    })

    if (!updater) {
      return res.status(404).json({ error: 'Updater not found' })
    }

    // Verify new assignee if assignment is being changed
    let newAssignee = null
    if (updates.assignedToId) {
      newAssignee = await prisma.user.findUnique({
        where: { id: updates.assignedToId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        }
      })

      if (!newAssignee) {
        return res.status(404).json({ error: 'New assignee not found' })
      }

      if (!newAssignee.isActive) {
        return res.status(409).json({ error: 'Cannot assign tasks to inactive user' })
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (updates.status) updateData.status = updates.status
    if (updates.priority) updateData.priority = updates.priority
    if (updates.dueDate) updateData.dueDate = new Date(updates.dueDate)
    if (updates.assignedToId) updateData.assignedToId = updates.assignedToId
    if (updates.category) updateData.category = updates.category
    if (updates.tags) updateData.tags = updates.tags

    // Set completion timestamp if status changed to completed
    if (updates.status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }

    // Perform bulk update
    const results = await prisma.$transaction(async (tx) => {
      // Update all tasks
      const updateResult = await tx.task.updateMany({
        where: {
          id: { in: taskIds }
        },
        data: updateData
      })

      // Create individual activity logs
      const activityPromises = existingTasks.map(task => {
        const changes: any = {}
        
        if (updates.status && updates.status !== task.status) {
          changes.status = { from: task.status, to: updates.status }
        }
        if (updates.priority && updates.priority !== task.priority) {
          changes.priority = { from: task.priority, to: updates.priority }
        }
        if (updates.assignedToId && updates.assignedToId !== task.assignedToId) {
          changes.assignedTo = { 
            from: task.assignedTo ? { id: task.assignedTo.id, name: task.assignedTo.name } : null,
            to: newAssignee ? { id: newAssignee.id, name: newAssignee.name } : null
          }
        }
        if (updates.dueDate) {
          const newDueDate = new Date(updates.dueDate)
          if (!task.dueDate || newDueDate.getTime() !== task.dueDate.getTime()) {
            changes.dueDate = { 
              from: task.dueDate?.toISOString(),
              to: newDueDate.toISOString()
            }
          }
        }

        return tx.activityLog.create({
          data: {
            userId: updatedById,
            action: 'TASK_BULK_UPDATED',
            entityType: 'Task',
            entityId: task.id,
            details: {
              changes,
              updater: {
                id: updater.id,
                name: updater.name
              },
              bulkOperation: true,
              totalTasksInBatch: taskIds.length,
              reason,
              updatedFields: Object.keys(changes)
            }
          }
        })
      })

      await Promise.all(activityPromises)

      // Create notifications for assignment changes
      if (updates.assignedToId && newAssignee) {
        // Get tasks that were actually reassigned
        const reassignedTasks = existingTasks.filter(task => task.assignedToId !== updates.assignedToId)
        
        if (reassignedTasks.length > 0) {
          // Notify new assignee
          await tx.notification.create({
            data: {
              userId: updates.assignedToId,
              title: 'Multiple Tasks Assigned',
              message: `${reassignedTasks.length} task(s) have been assigned to you by ${updater.name}${reason ? ` - ${reason}` : ''}`,
              type: 'TASK_ASSIGNED',
              data: {
                taskIds: reassignedTasks.map(t => t.id),
                taskCount: reassignedTasks.length,
                assignedBy: updater.name,
                reason,
                bulkAssignment: true,
                bulkUpdate: true
              }
            }
          })

          // Notify previous assignees (group by assignee)
          const previousAssignees = new Map()
          reassignedTasks.forEach(task => {
            if (task.assignedToId) {
              if (!previousAssignees.has(task.assignedToId)) {
                previousAssignees.set(task.assignedToId, [])
              }
              previousAssignees.get(task.assignedToId).push(task)
            }
          })

          for (const [prevAssigneeId, tasks] of previousAssignees) {
            await tx.notification.create({
              data: {
                userId: prevAssigneeId,
                title: 'Tasks Reassigned',
                message: `${tasks.length} of your task(s) have been reassigned to ${newAssignee.name} by ${updater.name}`,
                type: 'TASK_ASSIGNED',
                data: {
                  taskIds: tasks.map((t: any) => t.id),
                  taskCount: tasks.length,
                  newAssignee: newAssignee.name,
                  reassignedBy: updater.name,
                  reason,
                  bulkReassignment: true
                }
              }
            })
          }
        }
      }

      // Create notifications for status changes to completed
      if (updates.status === 'COMPLETED') {
        const completedTaskAssignees = new Map()
        existingTasks.forEach(task => {
          if (task.assignedToId && task.status !== 'COMPLETED') {
            if (!completedTaskAssignees.has(task.assignedToId)) {
              completedTaskAssignees.set(task.assignedToId, [])
            }
            completedTaskAssignees.get(task.assignedToId).push(task)
          }
        })

        for (const [assigneeId, tasks] of completedTaskAssignees) {
          await tx.notification.create({
            data: {
              userId: assigneeId,
              title: 'Tasks Marked as Completed',
              message: `${tasks.length} of your task(s) have been marked as completed by ${updater.name}`,
              type: 'TASK_ASSIGNED',
              data: {
                taskIds: tasks.map((t: any) => t.id),
                taskCount: tasks.length,
                completedBy: updater.name,
                reason,
                bulkCompletion: true
              }
            }
          })
        }
      }

      return {
        updatedCount: updateResult.count,
        taskIds
      }
    })

    res.status(200).json({
      message: `${results.updatedCount} tasks updated successfully`,
      data: {
        updatedTaskCount: results.updatedCount,
        taskIds: results.taskIds,
        updates: updates,
        updatedBy: {
          id: updater.id,
          name: updater.name
        },
        updatedAt: new Date().toISOString(),
        reason
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      })
    } else {
      throw error
    }
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { action } = req.body

    switch (action) {
      case 'changeStatus':
        return await handleBulkStatusChange(req, res)
      case 'changePriority':
        return await handleBulkPriorityChange(req, res)
      default:
        return res.status(400).json({ error: 'Invalid action. Use: changeStatus, changePriority' })
    }
  } catch (error) {
    throw error
  }
}

async function handleBulkStatusChange(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = bulkStatusChangeSchema.parse(req.body)
    
    const {
      taskIds,
      status,
      updatedById,
      completionNotes,
      reason
    } = validatedData

    // Verify tasks exist
    const existingTasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds }
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (existingTasks.length !== taskIds.length) {
      const foundIds = existingTasks.map(t => t.id)
      const missingIds = taskIds.filter(id => !foundIds.includes(id))
      return res.status(404).json({ 
        error: 'Some tasks not found',
        missingTaskIds: missingIds
      })
    }

    // Verify updater
    const updater = await prisma.user.findUnique({
      where: { id: updatedById },
      select: {
        id: true,
        name: true,
        role: true
      }
    })

    if (!updater) {
      return res.status(404).json({ error: 'Updater not found' })
    }

    // Prepare update data
    const updateData: any = { status }
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date()
      if (completionNotes) {
        updateData.completionNotes = completionNotes
      }
    } else if (status === 'IN_PROGRESS') {
      updateData.startedAt = new Date()
    }

    // Perform bulk status change
    const results = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.task.updateMany({
        where: {
          id: { in: taskIds }
        },
        data: updateData
      })

      // Log activities
      const activityPromises = existingTasks.map(task => 
        tx.activityLog.create({
          data: {
            userId: updatedById,
            action: 'TASK_STATUS_BULK_CHANGED',
            entityType: 'Task',
            entityId: task.id,
            details: {
              from: task.status,
              to: status,
              updater: {
                id: updater.id,
                name: updater.name
              },
              bulkOperation: true,
              totalTasksInBatch: taskIds.length,
              reason,
              completionNotes
            }
          }
        })
      )

      await Promise.all(activityPromises)

      return {
        updatedCount: updateResult.count
      }
    })

    res.status(200).json({
      message: `${results.updatedCount} tasks status changed to ${status}`,
      data: {
        updatedTaskCount: results.updatedCount,
        taskIds,
        newStatus: status,
        updatedBy: {
          id: updater.id,
          name: updater.name
        },
        updatedAt: new Date().toISOString(),
        reason,
        completionNotes
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      })
    } else {
      throw error
    }
  }
}

async function handleBulkPriorityChange(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = bulkPriorityChangeSchema.parse(req.body)
    
    const {
      taskIds,
      priority,
      updatedById,
      reason
    } = validatedData

    // Verify tasks and updater
    const [existingTasks, updater] = await Promise.all([
      prisma.task.findMany({
        where: {
          id: { in: taskIds }
        },
        select: {
          id: true,
          title: true,
          priority: true,
          assignedToId: true
        }
      }),
      prisma.user.findUnique({
        where: { id: updatedById },
        select: {
          id: true,
          name: true,
          role: true
        }
      })
    ])

    if (existingTasks.length !== taskIds.length) {
      const foundIds = existingTasks.map(t => t.id)
      const missingIds = taskIds.filter(id => !foundIds.includes(id))
      return res.status(404).json({ 
        error: 'Some tasks not found',
        missingTaskIds: missingIds
      })
    }

    if (!updater) {
      return res.status(404).json({ error: 'Updater not found' })
    }

    // Perform bulk priority change
    const results = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.task.updateMany({
        where: {
          id: { in: taskIds }
        },
        data: { priority }
      })

      // Log activities
      const activityPromises = existingTasks.map(task => 
        tx.activityLog.create({
          data: {
            userId: updatedById,
            action: 'TASK_PRIORITY_BULK_CHANGED',
            entityType: 'Task',
            entityId: task.id,
            details: {
              from: task.priority,
              to: priority,
              updater: {
                id: updater.id,
                name: updater.name
              },
              bulkOperation: true,
              totalTasksInBatch: taskIds.length,
              reason
            }
          }
        })
      )

      await Promise.all(activityPromises)

      return {
        updatedCount: updateResult.count
      }
    })

    res.status(200).json({
      message: `${results.updatedCount} tasks priority changed to ${priority}`,
      data: {
        updatedTaskCount: results.updatedCount,
        taskIds,
        newPriority: priority,
        priorityWeight: getPriorityWeight(priority),
        updatedBy: {
          id: updater.id,
          name: updater.name
        },
        updatedAt: new Date().toISOString(),
        reason
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      })
    } else {
      throw error
    }
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = bulkDeleteSchema.parse(req.body)
    
    const {
      taskIds,
      deletedById,
      reason,
      hardDelete
    } = validatedData

    // Verify tasks exist
    const existingTasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds }
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (existingTasks.length !== taskIds.length) {
      const foundIds = existingTasks.map(t => t.id)
      const missingIds = taskIds.filter(id => !foundIds.includes(id))
      return res.status(404).json({ 
        error: 'Some tasks not found',
        missingTaskIds: missingIds
      })
    }

    // Check if any tasks are in progress (business rule)
    const inProgressTasks = existingTasks.filter(task => task.status === 'IN_PROGRESS')
    if (inProgressTasks.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete tasks that are in progress',
        inProgressTaskIds: inProgressTasks.map(t => t.id)
      })
    }

    // Verify deleter
    const deleter = await prisma.user.findUnique({
      where: { id: deletedById },
      select: {
        id: true,
        name: true,
        role: true
      }
    })

    if (!deleter) {
      return res.status(404).json({ error: 'Deleter not found' })
    }

    // Perform bulk deletion
    const results = await prisma.$transaction(async (tx) => {
      let deleteResult

      if (hardDelete) {
        // Hard delete - permanently remove from database
        deleteResult = await tx.task.deleteMany({
          where: {
            id: { in: taskIds }
          }
        })
      } else {
        // Soft delete - mark as cancelled
        deleteResult = await tx.task.updateMany({
          where: {
            id: { in: taskIds }
          },
          data: {
            status: 'CANCELLED'
            // You might want to add deletedAt field to your schema
            // deletedAt: new Date()
          }
        })
      }

      // Log deletion activities
      const activityPromises = existingTasks.map(task => 
        tx.activityLog.create({
          data: {
            userId: deletedById,
            action: hardDelete ? 'TASK_HARD_DELETED' : 'TASK_SOFT_DELETED',
            entityType: 'Task',
            entityId: task.id,
            details: {
              taskTitle: task.title,
              previousStatus: task.status,
              assignedTo: task.assignedTo ? {
                id: task.assignedTo.id,
                name: task.assignedTo.name
              } : null,
              deleter: {
                id: deleter.id,
                name: deleter.name
              },
              bulkOperation: true,
              totalTasksInBatch: taskIds.length,
              reason,
              hardDelete
            }
          }
        })
      )

      await Promise.all(activityPromises)

      // Notify affected assignees
      const assigneeNotifications = new Map()
      existingTasks.forEach(task => {
        if (task.assignedToId) {
          if (!assigneeNotifications.has(task.assignedToId)) {
            assigneeNotifications.set(task.assignedToId, [])
          }
          assigneeNotifications.get(task.assignedToId).push(task)
        }
      })

      for (const [assigneeId, tasks] of assigneeNotifications) {
        await tx.notification.create({
          data: {
            userId: assigneeId,
            title: 'Tasks Deleted',
            message: `${tasks.length} of your task(s) have been ${hardDelete ? 'permanently deleted' : 'cancelled'} by ${deleter.name}. Reason: ${reason}`,
            type: 'SYSTEM_ALERT',
            data: {
              taskIds: tasks.map((t: any) => t.id),
              taskCount: tasks.length,
              deletedBy: deleter.name,
              reason,
              hardDelete,
              deletedAt: new Date().toISOString()
            }
          }
        })
      }

      return {
        deletedCount: deleteResult.count
      }
    })

    res.status(200).json({
      message: `${results.deletedCount} tasks ${hardDelete ? 'permanently deleted' : 'cancelled'} successfully`,
      data: {
        deletedTaskCount: results.deletedCount,
        taskIds,
        deletionType: hardDelete ? 'hard' : 'soft',
        deletedBy: {
          id: deleter.id,
          name: deleter.name
        },
        deletedAt: new Date().toISOString(),
        reason
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      })
    } else {
      throw error
    }
  }
}

function getPriorityWeight(priority: string): number {
  switch (priority) {
    case 'LOW': return 1
    case 'MEDIUM': return 2
    case 'HIGH': return 3
    case 'URGENT': return 4
    default: return 2
  }
}
