import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { apiResponse, handleApiError } from '../../../lib/validation'
import { requireAuth } from '../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return await getNotifications(req, res)
    case 'POST':
      return await createNotification(req, res)
    case 'PATCH':
      return await updateNotification(req, res)
    default:
      return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
  }
}

async function getNotifications(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      isRead,
      type,
      limit = '20',
      offset = '0'
    } = req.query

    const userId = (req as any).user.id

    const whereClause: any = {
      userId: userId
    }

    if (isRead !== undefined) {
      whereClause.isRead = isRead === 'true'
    }

    if (type) {
      whereClause.type = type
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    })

    const total = await prisma.notification.count({
      where: whereClause
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        isRead: false
      }
    })

    res.status(200).json(apiResponse.paginated(
      notifications,
      {
        total,
        unread: unreadCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + parseInt(limit as string)
      }
    ))

  } catch (error) {
    return handleApiError(error, res)
  }
}

async function createNotification(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, title, message, type, data } = req.body

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        data: data || {}
      }
    })

    res.status(201).json(apiResponse.success(notification, 'Notification created successfully'))

  } catch (error) {
    return handleApiError(error, res)
  }
}

async function updateNotification(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query
    const { isRead } = req.body
    const userId = (req as any).user.id

    const notification = await prisma.notification.updateMany({
      where: {
        id: id as string,
        userId: userId
      },
      data: {
        isRead,
        readAt: isRead ? new Date() : null
      }
    })

    if (notification.count === 0) {
      return res.status(404).json(apiResponse.error('Notification not found', 404))
    }

    res.status(200).json(apiResponse.success(null, 'Notification updated successfully'))

  } catch (error) {
    return handleApiError(error, res)
  }
}

export default requireAuth(handler)
