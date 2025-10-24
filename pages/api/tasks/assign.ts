import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const assignTaskSchema = z.object({
  taskId: z.string().cuid(),
  assignedToId: z.string().cuid(),
  assignedById: z.string().cuid(),
  notes: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional()
})

const bulkAssignSchema = z.object({
  taskIds: z.array(z.string().cuid()).min(1),
  assignedToId: z.string().cuid(),
  assignedById: z.string().cuid(),
  notes: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional()
})

const reassignTaskSchema = z.object({
  fromUserId: z.string().cuid(),
  toUserId: z.string().cuid(),
  reassignedById: z.string().cuid(),
  reason: z.string().min(5).max(500),
  taskIds: z.array(z.string().cuid()).optional() // If not provided, reassign all pending tasks
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'POST':
        await handlePost(req, res)
        break
      case 'PUT':
        await handlePut(req, res)
        break
      default:
        res.setHeader('Allow', ['POST', 'PUT'])
        res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Task assignment API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { action } = req.body

    switch (action) {
      case 'assign':
        return await handleAssignTask(req, res)
      case 'bulkAssign':
        return await handleBulkAssign(req, res)
      case 'reassign':
        return await handleReassignTasks(req, res)
      default:
        return res.status(400).json({ error: 'Invalid action. Use: assign, bulkAssign, or reassign' })
    }
  } catch (error) {
    throw error
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Handle task reassignment updates
    const validatedData = reassignTaskSchema.parse(req.body)
    return await handleReassignTasks(req, res, validatedData)
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

async function handleAssignTask(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = assignTaskSchema.parse(req.body)
    
    const {
      taskId,
      assignedToId,
      assignedById,
      notes,
      priority,
      dueDate
    } = validatedData

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
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

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Verify new assignee exists and is active
    const newAssignee = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    })

    if (!newAssignee) {
      return res.status(404).json({ error: 'Assignee not found' })
    }

    if (!newAssignee.isActive) {
      return res.status(409).json({ error: 'Cannot assign task to inactive user' })
    }

    // Verify assigner exists
    const assigner = await prisma.user.findUnique({
      where: { id: assignedById },
      select: {
        id: true,
        name: true,
        role: true
      }
    })

    if (!assigner) {
      return res.status(404).json({ error: 'Assigner not found' })
    }

    // Prepare update data
    const updateData: any = {
      assignedToId
    }

    if (priority) updateData.priority = priority
    if (dueDate) updateData.dueDate = new Date(dueDate)

    // Update task and create notifications
    const updatedTask = await prisma.$transaction(async (tx) => {
      // Update the task
      const updated = await tx.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      })

      // Log assignment activity
      await tx.activityLog.create({
        data: {
          userId: assignedById,
          action: 'TASK_ASSIGNED',
          entityType: 'Task',
          entityId: taskId,
          details: {
            previousAssignee: task.assignedTo ? {
              id: task.assignedTo.id,
              name: task.assignedTo.name
            } : null,
            newAssignee: {
              id: newAssignee.id,
              name: newAssignee.name
            },
            assigner: {
              id: assigner.id,
              name: assigner.name
            },
            notes,
            priorityChanged: priority && priority !== task.priority,
            dueDateChanged: dueDate && new Date(dueDate).getTime() !== task.dueDate?.getTime()
          }
        }
      })

      // Create notification for new assignee
      await tx.notification.create({
        data: {
          userId: assignedToId,
          title: 'Task Assigned',
          message: `You have been assigned a new task: ${task.title}${notes ? ` - ${notes}` : ''}`,
          type: 'TASK_ASSIGNED',
          data: {
            taskId: updated.id,
            taskTitle: updated.title,
            priority: updated.priority,
            dueDate: updated.dueDate,
            assignedBy: assigner.name,
            notes
          }
        }
      })

      // Notify previous assignee if task was reassigned
      if (task.assignedToId && task.assignedToId !== assignedToId) {
        await tx.notification.create({
          data: {
            userId: task.assignedToId,
            title: 'Task Reassigned',
            message: `Task "${task.title}" has been reassigned to ${newAssignee.name}`,
            type: 'TASK_ASSIGNED',
            data: {
              taskId: updated.id,
              taskTitle: updated.title,
              newAssignee: newAssignee.name,
              reassignedBy: assigner.name,
              reason: notes || 'No reason provided'
            }
          }
        })
      }

      return updated
    })

    res.status(200).json({
      message: 'Task assigned successfully',
      data: {
        id: updatedTask.id,
        title: updatedTask.title,
        assignedTo: updatedTask.assignedTo,
        priority: updatedTask.priority,
        dueDate: updatedTask.dueDate,
        updatedAt: updatedTask.updatedAt,
        assignment: {
          assignedBy: assigner.name,
          assignedAt: new Date().toISOString(),
          notes
        }
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

async function handleBulkAssign(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = bulkAssignSchema.parse(req.body)
    
    const {
      taskIds,
      assignedToId,
      assignedById,
      notes,
      priority,
      dueDate
    } = validatedData

    // Verify all tasks exist
    const tasks = await prisma.task.findMany({
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

    if (tasks.length !== taskIds.length) {
      const foundIds = tasks.map(t => t.id)
      const missingIds = taskIds.filter(id => !foundIds.includes(id))
      return res.status(404).json({ 
        error: 'Some tasks not found',
        missingTaskIds: missingIds
      })
    }

    // Verify assignee and assigner
    const [newAssignee, assigner] = await Promise.all([
      prisma.user.findUnique({
        where: { id: assignedToId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        }
      }),
      prisma.user.findUnique({
        where: { id: assignedById },
        select: {
          id: true,
          name: true,
          role: true
        }
      })
    ])

    if (!newAssignee) {
      return res.status(404).json({ error: 'Assignee not found' })
    }

    if (!newAssignee.isActive) {
      return res.status(409).json({ error: 'Cannot assign tasks to inactive user' })
    }

    if (!assigner) {
      return res.status(404).json({ error: 'Assigner not found' })
    }

    // Prepare update data
    const updateData: any = {
      assignedToId
    }

    if (priority) updateData.priority = priority
    if (dueDate) updateData.dueDate = new Date(dueDate)

    // Bulk update tasks
    const results = await prisma.$transaction(async (tx) => {
      // Update all tasks
      const updateResult = await tx.task.updateMany({
        where: {
          id: { in: taskIds }
        },
        data: updateData
      })

      // Create individual activity logs and notifications
      const activityPromises = taskIds.map(taskId => {
        const task = tasks.find(t => t.id === taskId)
        return tx.activityLog.create({
          data: {
            userId: assignedById,
            action: 'TASK_BULK_ASSIGNED',
            entityType: 'Task',
            entityId: taskId,
            details: {
              previousAssignee: task?.assignedTo ? {
                id: task.assignedTo.id,
                name: task.assignedTo.name
              } : null,
              newAssignee: {
                id: newAssignee.id,
                name: newAssignee.name
              },
              assigner: {
                id: assigner.id,
                name: assigner.name
              },
              bulkOperation: true,
              totalTasksInBatch: taskIds.length,
              notes
            }
          }
        })
      })

      await Promise.all(activityPromises)

      // Create single notification for bulk assignment
      await tx.notification.create({
        data: {
          userId: assignedToId,
          title: 'Multiple Tasks Assigned',
          message: `You have been assigned ${taskIds.length} new tasks by ${assigner.name}${notes ? ` - ${notes}` : ''}`,
          type: 'TASK_ASSIGNED',
          data: {
            taskIds,
            taskCount: taskIds.length,
            assignedBy: assigner.name,
            priority,
            dueDate,
            notes,
            bulkAssignment: true
          }
        }
      })

      return {
        updatedCount: updateResult.count,
        taskIds
      }
    })

    res.status(200).json({
      message: `${results.updatedCount} tasks assigned successfully`,
      data: {
        assignedTaskCount: results.updatedCount,
        taskIds: results.taskIds,
        assignedTo: {
          id: newAssignee.id,
          name: newAssignee.name,
          email: newAssignee.email
        },
        assignment: {
          assignedBy: assigner.name,
          assignedAt: new Date().toISOString(),
          priority,
          dueDate,
          notes
        }
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

async function handleReassignTasks(req: NextApiRequest, res: NextApiResponse, validatedData?: any) {
  try {
    const data = validatedData || reassignTaskSchema.parse(req.body)
    
    const {
      fromUserId,
      toUserId,
      reassignedById,
      reason,
      taskIds
    } = data

    // Verify users exist
    const [fromUser, toUser, reassigner] = await Promise.all([
      prisma.user.findUnique({
        where: { id: fromUserId },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true
        }
      }),
      prisma.user.findUnique({
        where: { id: toUserId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        }
      }),
      prisma.user.findUnique({
        where: { id: reassignedById },
        select: {
          id: true,
          name: true,
          role: true
        }
      })
    ])

    if (!fromUser) {
      return res.status(404).json({ error: 'Source user not found' })
    }

    if (!toUser) {
      return res.status(404).json({ error: 'Target user not found' })
    }

    if (!toUser.isActive) {
      return res.status(409).json({ error: 'Cannot reassign tasks to inactive user' })
    }

    if (!reassigner) {
      return res.status(404).json({ error: 'Reassigner not found' })
    }

    // Get tasks to reassign
    const whereClause: any = {
      assignedToId: fromUserId,
      status: { in: ['PENDING', 'IN_PROGRESS'] }
    }

    if (taskIds && taskIds.length > 0) {
      whereClause.id = { in: taskIds }
    }

    const tasksToReassign = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
        status: true
      }
    })

    if (tasksToReassign.length === 0) {
      return res.status(404).json({ 
        error: 'No eligible tasks found for reassignment',
        criteria: 'Tasks must be PENDING or IN_PROGRESS'
      })
    }

    // Perform reassignment
    const reassignmentResults = await prisma.$transaction(async (tx) => {
      // Update all tasks
      const updateResult = await tx.task.updateMany({
        where: {
          id: { in: tasksToReassign.map(t => t.id) }
        },
        data: {
          assignedToId: toUserId
        }
      })

      // Log reassignment activities
      const activityPromises = tasksToReassign.map(task => 
        tx.activityLog.create({
          data: {
            userId: reassignedById,
            action: 'TASK_REASSIGNED',
            entityType: 'Task',
            entityId: task.id,
            details: {
              fromUser: {
                id: fromUser.id,
                name: fromUser.name
              },
              toUser: {
                id: toUser.id,
                name: toUser.name
              },
              reassigner: {
                id: reassigner.id,
                name: reassigner.name
              },
              reason,
              taskTitle: task.title,
              taskPriority: task.priority
            }
          }
        })
      )

      await Promise.all(activityPromises)

      // Notify new assignee
      await tx.notification.create({
        data: {
          userId: toUserId,
          title: 'Tasks Reassigned to You',
          message: `${tasksToReassign.length} task(s) have been reassigned to you from ${fromUser.name}. Reason: ${reason}`,
          type: 'TASK_ASSIGNED',
          data: {
            taskIds: tasksToReassign.map(t => t.id),
            taskCount: tasksToReassign.length,
            fromUser: fromUser.name,
            reassignedBy: reassigner.name,
            reason,
            reassignmentDate: new Date().toISOString()
          }
        }
      })

      // Notify original assignee
      if (fromUser.isActive) {
        await tx.notification.create({
          data: {
            userId: fromUserId,
            title: 'Tasks Reassigned from You',
            message: `${tasksToReassign.length} of your task(s) have been reassigned to ${toUser.name}. Reason: ${reason}`,
            type: 'TASK_ASSIGNED',
            data: {
              taskIds: tasksToReassign.map(t => t.id),
              taskCount: tasksToReassign.length,
              toUser: toUser.name,
              reassignedBy: reassigner.name,
              reason,
              reassignmentDate: new Date().toISOString()
            }
          }
        })
      }

      return {
        reassignedCount: updateResult.count,
        tasks: tasksToReassign
      }
    })

    res.status(200).json({
      message: `${reassignmentResults.reassignedCount} tasks reassigned successfully`,
      data: {
        reassignedTaskCount: reassignmentResults.reassignedCount,
        tasks: reassignmentResults.tasks,
        fromUser: {
          id: fromUser.id,
          name: fromUser.name
        },
        toUser: {
          id: toUser.id,
          name: toUser.name
        },
        reassignment: {
          reassignedBy: reassigner.name,
          reason,
          reassignedAt: new Date().toISOString()
        }
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
