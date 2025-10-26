import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const taskCreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional(),
  assignedToId: z.string().cuid(),
  tags: z.array(z.string()).optional().default([]),
  estimatedHours: z.number().min(0).optional(),
  category: z.string().optional(),
  parentTaskId: z.string().cuid().optional()
})

const taskUpdateSchema = taskCreateSchema.partial()

const taskFiltersSchema = z.object({
  assignedToId: z.string().cuid().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.string().optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  search: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  overdue: z.string().transform(val => val === 'true').optional(),
  completed: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => parseInt(val)).optional().default(50),
  offset: z.string().transform(val => parseInt(val)).optional().default(0),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'title']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res)
        break
      case 'POST':
        await handlePost(req, res)
        break
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Tasks API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedFilters = taskFiltersSchema.parse(req.query)
    
    const {
      assignedToId,
      status,
      priority,
      category,
      dueDateFrom,
      dueDateTo,
      createdFrom,
      createdTo,
      search,
      tags,
      overdue,
      completed,
      limit,
      offset,
      sortBy,
      sortOrder
    } = validatedFilters

    // Build where clause
    const where: any = {}
    
    if (assignedToId) {
      where.assignedToId = assignedToId
    }
    
    if (status) {
      where.status = status
    } else if (completed !== undefined) {
      where.status = completed ? 'COMPLETED' : { not: 'COMPLETED' }
    }
    
    if (priority) {
      where.priority = priority
    }
    
    if (category) {
      where.category = {
        contains: category,
        mode: 'insensitive'
      }
    }
    
    // Date filters
    if (dueDateFrom || dueDateTo) {
      where.dueDate = {}
      if (dueDateFrom) where.dueDate.gte = new Date(dueDateFrom)
      if (dueDateTo) where.dueDate.lte = new Date(dueDateTo)
    }
    
    if (createdFrom || createdTo) {
      where.createdAt = {}
      if (createdFrom) where.createdAt.gte = new Date(createdFrom)
      if (createdTo) where.createdAt.lte = new Date(createdTo)
    }
    
    // Overdue filter
    if (overdue) {
      where.dueDate = {
        lt: new Date(),
        ...where.dueDate
      }
      where.status = {
        notIn: ['COMPLETED', 'CANCELLED']
      }
    }
    
    // Search filter
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Build order by
    const orderBy: any = {}
    if (sortBy === 'priority') {
      // Custom priority ordering: URGENT > HIGH > MEDIUM > LOW
      orderBy.priority = sortOrder === 'asc' ? 'asc' : 'desc'
    } else {
      orderBy[sortBy] = sortOrder
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy,
      take: limit,
      skip: offset
    })

    // Filter by tags if provided (since Prisma doesn't support JSON array queries well)
    let filteredTasks = tasks
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase())
      filteredTasks = tasks.filter(task => {
        const taskTags = (task as any).tags || []
        return tagArray.some(tag => 
          taskTags.some((taskTag: string) => taskTag.toLowerCase().includes(tag))
        )
      })
    }

    // Transform tasks with additional computed fields
    const transformedTasks = filteredTasks.map(task => ({
      ...task,
      isOverdue: task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' : false,
      daysUntilDue: task.dueDate ? Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null,
      priorityWeight: getPriorityWeight(task.priority),
      completionStatus: getCompletionStatus(task.status),
      tags: (task as any).tags || []
    }))

    // Get total count for pagination
    const totalCount = await prisma.task.count({ where })

    // Calculate task statistics
    const stats = await calculateTaskStats(where)

    res.status(200).json({
      data: transformedTasks,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats,
      filters: validatedFilters
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

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validatedData = taskCreateSchema.parse(req.body)
    
    const {
      title,
      description,
      priority,
      dueDate,
      assignedToId,
      tags,
      estimatedHours,
      category,
      parentTaskId
    } = validatedData

    // Verify assigned user exists
    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    })

    if (!assignedUser) {
      return res.status(404).json({ error: 'Assigned user not found' })
    }

    if (!assignedUser.isActive) {
      return res.status(409).json({ error: 'Cannot assign task to inactive user' })
    }

    // Verify parent task exists if provided
    if (parentTaskId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: parentTaskId }
      })

      if (!parentTask) {
        return res.status(404).json({ error: 'Parent task not found' })
      }
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId,
        status: 'PENDING',
        // Store additional fields in a metadata JSON if your schema supports it
        // or add these fields to your Prisma schema
        ...(tags && { tags } as any),
        ...(estimatedHours && { estimatedHours } as any),
        ...(category && { category } as any),
        ...(parentTaskId && { parentTaskId } as any)
      },
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

    // Create notification for assigned user
    await createTaskNotification(task, 'TASK_ASSIGNED')

    // Log task creation activity
    await logTaskActivity(task.id, assignedToId, 'CREATED', {
      title,
      priority,
      dueDate
    })

    res.status(201).json({
      message: 'Task created successfully',
      data: {
        ...task,
        isOverdue: false,
        daysUntilDue: task.dueDate ? Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null,
        priorityWeight: getPriorityWeight(task.priority),
        completionStatus: getCompletionStatus(task.status),
        tags: tags || []
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

async function calculateTaskStats(where: any) {
  const [
    totalTasks,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    overdueTasks,
    highPriorityTasks,
    urgentTasks
  ] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.count({ where: { ...where, status: 'PENDING' } }),
    prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.task.count({ 
      where: { 
        ...where, 
        dueDate: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'CANCELLED'] }
      } 
    }),
    prisma.task.count({ where: { ...where, priority: 'HIGH' } }),
    prisma.task.count({ where: { ...where, priority: 'URGENT' } })
  ])

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return {
    totalTasks,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    overdueTasks,
    highPriorityTasks,
    urgentTasks,
    completionRate,
    tasksByStatus: {
      PENDING: pendingTasks,
      IN_PROGRESS: inProgressTasks,
      COMPLETED: completedTasks,
      CANCELLED: totalTasks - (pendingTasks + inProgressTasks + completedTasks)
    },
    tasksByPriority: {
      URGENT: urgentTasks,
      HIGH: highPriorityTasks,
      MEDIUM: totalTasks - (urgentTasks + highPriorityTasks + await prisma.task.count({ where: { ...where, priority: 'LOW' } })),
      LOW: await prisma.task.count({ where: { ...where, priority: 'LOW' } })
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

function getCompletionStatus(status: string): string {
  switch (status) {
    case 'PENDING': return 'Not Started'
    case 'IN_PROGRESS': return 'In Progress'
    case 'COMPLETED': return 'Completed'
    case 'CANCELLED': return 'Cancelled'
    default: return 'Unknown'
  }
}

async function createTaskNotification(task: any, type: string) {
  try {
    await prisma.notification.create({
      data: {
        userId: task.assignedToId,
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${task.title}`,
        type: type as any,
        data: {
          taskId: task.id,
          taskTitle: task.title,
          priority: task.priority,
          dueDate: task.dueDate
        }
      }
    })
  } catch (error) {
    console.error('Failed to create task notification:', error)
  }
}

async function logTaskActivity(taskId: string, userId: string, action: string, details: any) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action: `TASK_${action}`,
        entityType: 'Task',
        entityId: taskId,
        details
      }
    })
  } catch (error) {
    console.error('Failed to log task activity:', error)
  }
}
