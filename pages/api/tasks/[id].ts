import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const taskUpdateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional(),
  assignedToId: z.string().cuid().optional(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  category: z.string().optional(),
  completionNotes: z.string().optional()
})

const taskCommentSchema = z.object({
  comment: z.string().min(1).max(1000),
  userId: z.string().cuid()
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid task ID' })
  }

  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res, id)
        break
      case 'PUT':
        await handlePut(req, res, id)
        break
      case 'DELETE':
        await handleDelete(req, res, id)
        break
      case 'PATCH':
        await handlePatch(req, res, id)
        break
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'PATCH'])
        res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Task API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const task = await prisma.task.findUnique({
      where: { id },
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

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Get task history/activity logs
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        entityType: 'Task',
        entityId: id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Get related tasks (if this task has sub-tasks or is a sub-task)
    const subtasks = await prisma.task.findMany({
      where: {
        parentTaskId: id
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    let parentTask = null
    if ((task as any).parentTaskId) {
      parentTask = await prisma.task.findUnique({
        where: { id: (task as any).parentTaskId },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true
        }
      })
    }

    // Calculate task statistics
    const taskStats = {
      timeSpent: (task as any).actualHours || 0,
      estimatedTime: (task as any).estimatedHours || 0,
      isOverdue: task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' : false,
      daysUntilDue: task.dueDate ? Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null,
      createdDaysAgo: Math.ceil((new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 3600 * 24)),
      priorityWeight: getPriorityWeight(task.priority),
      completionPercentage: getCompletionPercentage(task.status)
    }

    res.status(200).json({
      data: {
        ...task,
        tags: (task as any).tags || [],
        estimatedHours: (task as any).estimatedHours,
        actualHours: (task as any).actualHours,
        category: (task as any).category,
        completionNotes: (task as any).completionNotes,
        ...taskStats,
        subtasks,
        parentTask,
        activityHistory: activityLogs
      }
    })
  } catch (error) {
    throw error
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const validatedData = taskUpdateSchema.parse(req.body)
    const currentUser = req.headers['x-user-id'] as string // Assume user ID is passed in header
    
    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
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

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Verify assigned user exists if changing assignment
    if (validatedData.assignedToId && validatedData.assignedToId !== existingTask.assignedToId) {
      const newAssignee = await prisma.user.findUnique({
        where: { id: validatedData.assignedToId },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true
        }
      })

      if (!newAssignee) {
        return res.status(404).json({ error: 'New assignee not found' })
      }

      if (!newAssignee.isActive) {
        return res.status(409).json({ error: 'Cannot assign task to inactive user' })
      }
    }

    // Track changes for activity log
    const changes: any = {}
    const fieldsToTrack = ['title', 'priority', 'status', 'dueDate', 'assignedToId']
    
    fieldsToTrack.forEach(field => {
      if (validatedData[field as keyof typeof validatedData] !== undefined && 
          validatedData[field as keyof typeof validatedData] !== (existingTask as any)[field]) {
        changes[field] = {
          from: (existingTask as any)[field],
          to: validatedData[field as keyof typeof validatedData]
        }
      }
    })

    // Prepare update data
    const updateData: any = {}
    Object.keys(validatedData).forEach(key => {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        if (key === 'dueDate') {
          updateData[key] = new Date(validatedData[key] as string)
        } else {
          updateData[key] = validatedData[key as keyof typeof validatedData]
        }
      }
    })

    // Set completion timestamp if status changed to completed
    if (validatedData.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      updateData.completedAt = new Date()
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      // Update the task
      const task = await tx.task.update({
        where: { id },
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

      // Log activity for significant changes
      if (Object.keys(changes).length > 0) {
        await tx.activityLog.create({
          data: {
            userId: currentUser || existingTask.assignedToId,
            action: 'TASK_UPDATED',
            entityType: 'Task',
            entityId: id,
            details: {
              changes,
              updatedFields: Object.keys(changes)
            }
          }
        })
      }

      // Create notifications for assignment changes
      if (changes.assignedToId) {
        await tx.notification.create({
          data: {
            userId: changes.assignedToId.to,
            title: 'Task Assigned',
            message: `You have been assigned the task: ${task.title}`,
            type: 'TASK_ASSIGNED',
            data: {
              taskId: task.id,
              taskTitle: task.title,
              priority: task.priority
            }
          }
        })
      }

      // Create notifications for status changes
      if (changes.status && changes.status.to === 'COMPLETED') {
        await tx.notification.create({
          data: {
            userId: existingTask.assignedToId,
            title: 'Task Completed',
            message: `Task completed: ${task.title}`,
            type: 'TASK_ASSIGNED', // Using existing enum value
            data: {
              taskId: task.id,
              taskTitle: task.title,
              completedAt: new Date().toISOString()
            }
          }
        })
      }

      return task
    })

    res.status(200).json({
      message: 'Task updated successfully',
      data: {
        ...updatedTask,
        isOverdue: updatedTask.dueDate ? new Date(updatedTask.dueDate) < new Date() && updatedTask.status !== 'COMPLETED' : false,
        daysUntilDue: updatedTask.dueDate ? Math.ceil((new Date(updatedTask.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null,
        priorityWeight: getPriorityWeight(updatedTask.priority),
        completionPercentage: getCompletionPercentage(updatedTask.status),
        changes: Object.keys(changes)
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

async function handlePatch(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { action, ...data } = req.body
    const currentUser = req.headers['x-user-id'] as string

    const existingTask = await prisma.task.findUnique({
      where: { id },
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

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' })
    }

    switch (action) {
      case 'changeStatus':
        return await handleStatusChange(res, id, data.status, currentUser, existingTask)
      case 'changePriority':
        return await handlePriorityChange(res, id, data.priority, currentUser, existingTask)
      case 'addComment':
        return await handleAddComment(res, id, data.comment, currentUser)
      case 'updateProgress':
        return await handleProgressUpdate(res, id, data.progress, currentUser, existingTask)
      case 'logTime':
        return await handleTimeLog(res, id, data.hours, data.description, currentUser)
      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    throw error
  }
}

async function handleStatusChange(
  res: NextApiResponse, 
  id: string, 
  status: string, 
  currentUser: string,
  existingTask: any
) {
  const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status',
      validStatuses 
    })
  }

  const updateData: any = { status }
  
  if (status === 'COMPLETED') {
    updateData.completedAt = new Date()
  } else if (status === 'IN_PROGRESS' && !existingTask.startedAt) {
    updateData.startedAt = new Date()
  }

  const updatedTask = await prisma.$transaction(async (tx) => {
    const task = await tx.task.update({
      where: { id },
      data: updateData,
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

    // Log activity
    await tx.activityLog.create({
      data: {
        userId: currentUser || existingTask.assignedToId,
        action: 'TASK_STATUS_CHANGED',
        entityType: 'Task',
        entityId: id,
        details: {
          from: existingTask.status,
          to: status
        }
      }
    })

    return task
  })

  res.status(200).json({
    message: `Task status changed to ${status}`,
    data: {
      id: updatedTask.id,
      status: updatedTask.status,
      completedAt: updateData.completedAt,
      startedAt: updateData.startedAt,
      updatedAt: updatedTask.updatedAt
    }
  })
}

async function handlePriorityChange(
  res: NextApiResponse, 
  id: string, 
  priority: string, 
  currentUser: string,
  existingTask: any
) {
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
  
  if (!validPriorities.includes(priority)) {
    return res.status(400).json({ 
      error: 'Invalid priority',
      validPriorities 
    })
  }

  const updatedTask = await prisma.$transaction(async (tx) => {
    const task = await tx.task.update({
      where: { id },
      data: { priority },
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

    // Log activity
    await tx.activityLog.create({
      data: {
        userId: currentUser || existingTask.assignedToId,
        action: 'TASK_PRIORITY_CHANGED',
        entityType: 'Task',
        entityId: id,
        details: {
          from: existingTask.priority,
          to: priority
        }
      }
    })

    return task
  })

  res.status(200).json({
    message: `Task priority changed to ${priority}`,
    data: {
      id: updatedTask.id,
      priority: updatedTask.priority,
      priorityWeight: getPriorityWeight(priority),
      updatedAt: updatedTask.updatedAt
    }
  })
}

async function handleAddComment(
  res: NextApiResponse, 
  id: string, 
  comment: string, 
  currentUser: string
) {
  if (!comment || comment.trim().length === 0) {
    return res.status(400).json({ error: 'Comment cannot be empty' })
  }

  await prisma.activityLog.create({
    data: {
      userId: currentUser,
      action: 'TASK_COMMENT_ADDED',
      entityType: 'Task',
      entityId: id,
      details: {
        comment: comment.trim()
      }
    }
  })

  res.status(200).json({
    message: 'Comment added successfully',
    data: {
      comment: comment.trim(),
      addedAt: new Date().toISOString()
    }
  })
}

async function handleProgressUpdate(
  res: NextApiResponse, 
  id: string, 
  progress: number, 
  currentUser: string,
  existingTask: any
) {
  if (progress < 0 || progress > 100) {
    return res.status(400).json({ error: 'Progress must be between 0 and 100' })
  }

  // Auto-update status based on progress
  let newStatus = existingTask.status
  if (progress === 100 && existingTask.status !== 'COMPLETED') {
    newStatus = 'COMPLETED'
  } else if (progress > 0 && progress < 100 && existingTask.status === 'PENDING') {
    newStatus = 'IN_PROGRESS'
  }

  const updateData: any = { progress }
  if (newStatus !== existingTask.status) {
    updateData.status = newStatus
    if (newStatus === 'COMPLETED') {
      updateData.completedAt = new Date()
    }
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: updateData
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: currentUser,
      action: 'TASK_PROGRESS_UPDATED',
      entityType: 'Task',
      entityId: id,
      details: {
        progress,
        statusChanged: newStatus !== existingTask.status,
        newStatus
      }
    }
  })

  res.status(200).json({
    message: 'Progress updated successfully',
    data: {
      id: updatedTask.id,
      progress,
      status: updatedTask.status,
      updatedAt: updatedTask.updatedAt
    }
  })
}

async function handleTimeLog(
  res: NextApiResponse, 
  id: string, 
  hours: number, 
  description: string,
  currentUser: string
) {
  if (hours <= 0) {
    return res.status(400).json({ error: 'Hours must be greater than 0' })
  }

  // Get current actual hours
  const currentTask = await prisma.task.findUnique({
    where: { id },
    select: { actualHours: true }
  })

  const currentHours = (currentTask as any)?.actualHours || 0
  const newTotalHours = currentHours + hours

  const updatedTask = await prisma.task.update({
    where: { id },
    data: { actualHours: newTotalHours }
  })

  // Log time entry
  await prisma.activityLog.create({
    data: {
      userId: currentUser,
      action: 'TASK_TIME_LOGGED',
      entityType: 'Task',
      entityId: id,
      details: {
        hoursLogged: hours,
        description: description || 'Time logged',
        totalHours: newTotalHours
      }
    }
  })

  res.status(200).json({
    message: 'Time logged successfully',
    data: {
      id: updatedTask.id,
      hoursLogged: hours,
      totalActualHours: newTotalHours,
      loggedAt: new Date().toISOString()
    }
  })
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        // Check for subtasks
        _count: {
          select: {
            // This would need to be added to your schema
            // subtasks: true
          }
        }
      }
    })

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Check if task can be deleted (business rules)
    if (existingTask.status === 'IN_PROGRESS') {
      return res.status(409).json({ 
        error: 'Cannot delete task that is in progress. Change status first.' 
      })
    }

    // Soft delete by updating status to CANCELLED
    const deletedTask = await prisma.task.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        // You might want to add a deletedAt field to your schema
        // deletedAt: new Date()
      }
    })

    // Log deletion
    await prisma.activityLog.create({
      data: {
        userId: req.headers['x-user-id'] as string || existingTask.assignedToId,
        action: 'TASK_DELETED',
        entityType: 'Task',
        entityId: id,
        details: {
          taskTitle: existingTask.title,
          previousStatus: existingTask.status
        }
      }
    })

    res.status(200).json({
      message: 'Task deleted successfully',
      data: {
        id: deletedTask.id,
        status: deletedTask.status,
        deletedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    throw error
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

function getCompletionPercentage(status: string): number {
  switch (status) {
    case 'PENDING': return 0
    case 'IN_PROGRESS': return 50
    case 'COMPLETED': return 100
    case 'CANCELLED': return 0
    default: return 0
  }
}
