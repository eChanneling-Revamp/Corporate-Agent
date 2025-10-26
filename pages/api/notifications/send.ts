import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

// SMS and Email Notification Service
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'POST':
      return await sendNotifications(req, res)
    case 'GET':
      return await getNotificationStatus(req, res)
    default:
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      })
  }
}

// Send notifications (SMS and Email)
async function sendNotifications(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      type, // 'appointment_confirmation', 'appointment_reminder', 'acb_confirmation', 'payment_success', 'cancellation'
      recipients, // Array of { type: 'sms'|'email', destination: string, templateData: object }
      appointmentId,
      triggeredBy,
      priority = 'normal', // 'high', 'normal', 'low'
      scheduledFor // Optional: schedule for future sending
    } = req.body

    // Validate required fields
    if (!type || !recipients || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Notification type and recipients are required'
      })
    }

    // Get notification templates
    const templates = await getNotificationTemplates(type)
    if (!templates) {
      return res.status(404).json({
        success: false,
        message: `No templates found for notification type: ${type}`
      })
    }

    const notifications = []
    const results = []

    // Process each recipient
    for (const recipient of recipients) {
      const notificationId = `NOT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      
      // Create notification record
      const notification = await prisma.notificationLog.create({
        data: {
          notificationId,
          type,
          method: recipient.type, // 'sms' or 'email'
          recipient: recipient.destination,
          status: scheduledFor ? 'scheduled' : 'pending',
          priority,
          templateData: recipient.templateData || {},
          appointmentId,
          triggeredBy,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          createdAt: new Date()
        }
      })

      notifications.push(notification)

      // Send immediately if not scheduled
      if (!scheduledFor) {
        try {
          let sendResult
          if (recipient.type === 'sms') {
            sendResult = await sendSMS(
              recipient.destination,
              templates.sms,
              recipient.templateData || {}
            )
          } else if (recipient.type === 'email') {
            sendResult = await sendEmail(
              recipient.destination,
              templates.email,
              recipient.templateData || {}
            )
          }

          // Update notification status
          await prisma.notificationLog.update({
            where: { id: notification.id },
            data: {
              status: sendResult.success ? 'sent' : 'failed',
              sentAt: sendResult.success ? new Date() : null,
              failureReason: sendResult.success ? null : sendResult.error,
              providerResponse: sendResult.response || null
            }
          })

          results.push({
            notificationId,
            method: recipient.type,
            recipient: recipient.destination,
            success: sendResult.success,
            message: sendResult.message
          })

        } catch (error) {
          // Update notification as failed
          await prisma.notificationLog.update({
            where: { id: notification.id },
            data: {
              status: 'failed',
              failureReason: error instanceof Error ? error.message : 'Unknown error'
            }
          })

          results.push({
            notificationId,
            method: recipient.type,
            recipient: recipient.destination,
            success: false,
            message: 'Failed to send notification'
          })
        }
      } else {
        results.push({
          notificationId,
          method: recipient.type,
          recipient: recipient.destination,
          success: true,
          message: 'Notification scheduled successfully'
        })
      }
    }

    // Log notification activity
    if (triggeredBy) {
      await prisma.activityLog.create({
        data: {
          userId: triggeredBy,
          action: 'NOTIFICATIONS_SENT',
          entityType: 'NOTIFICATION',
          entityId: appointmentId || 'bulk',
          details: {
            notificationType: type,
            recipientCount: recipients.length,
            scheduledFor: scheduledFor,
            results: results.map(r => ({
              method: r.method,
              success: r.success
            }))
          },
          ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      })
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    return res.status(200).json({
      success: true,
      data: {
        message: `Notifications processed: ${successCount} successful, ${failureCount} failed`,
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
          scheduled: scheduledFor ? results.length : 0
        }
      }
    })

  } catch (error) {
    console.error('Send Notifications Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Get notification status and history
async function getNotificationStatus(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      appointmentId, 
      notificationId, 
      method, 
      status,
      page = 1,
      limit = 20 
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    const where: any = {}

    if (appointmentId) where.appointmentId = appointmentId as string
    if (notificationId) where.notificationId = notificationId as string
    if (method) where.method = method as string
    if (status) where.status = status as string

    const [notifications, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          appointment: {
            select: {
              appointmentNumber: true,
              patientName: true,
              appointmentDate: true,
              status: true
            }
          }
        }
      }),
      prisma.notificationLog.count({ where })
    ])

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    })

  } catch (error) {
    console.error('Get Notification Status Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Helper function to get notification templates
async function getNotificationTemplates(type: string) {
  const templates = {
    appointment_confirmation: {
      sms: "Dear {{patientName}}, your appointment with Dr. {{doctorName}} on {{appointmentDate}} at {{appointmentTime}} has been confirmed. Ref: {{appointmentNumber}}. Thank you!",
      email: {
        subject: "Appointment Confirmation - {{appointmentNumber}}",
        body: `
          <h2>Appointment Confirmed</h2>
          <p>Dear {{patientName}},</p>
          <p>Your appointment has been successfully confirmed:</p>
          <ul>
            <li><strong>Doctor:</strong> Dr. {{doctorName}}</li>
            <li><strong>Date:</strong> {{appointmentDate}}</li>
            <li><strong>Time:</strong> {{appointmentTime}}</li>
            <li><strong>Hospital:</strong> {{hospitalName}}</li>
            <li><strong>Reference:</strong> {{appointmentNumber}}</li>
          </ul>
          <p>Please arrive 15 minutes before your appointment time.</p>
        `
      }
    },
    acb_confirmation: {
      sms: "ACB Confirmed: Your advance appointment with Dr. {{doctorName}} on {{appointmentDate}} is confirmed. Payment pending. Ref: {{acbNumber}}",
      email: {
        subject: "ACB Appointment Confirmation - {{acbNumber}}",
        body: `
          <h2>ACB Appointment Confirmed</h2>
          <p>Dear {{patientName}},</p>
          <p>Your advance cash back (ACB) appointment has been confirmed:</p>
          <ul>
            <li><strong>Doctor:</strong> Dr. {{doctorName}}</li>
            <li><strong>Date:</strong> {{appointmentDate}}</li>
            <li><strong>Time:</strong> {{appointmentTime}}</li>
            <li><strong>ACB Number:</strong> {{acbNumber}}</li>
            <li><strong>Fee:</strong> LKR {{consultationFee}}</li>
          </ul>
          <p><em>Note: Payment is pending and should be completed before the appointment.</em></p>
        `
      }
    },
    appointment_reminder: {
      sms: "Reminder: You have an appointment with Dr. {{doctorName}} tomorrow at {{appointmentTime}}. Ref: {{appointmentNumber}}",
      email: {
        subject: "Appointment Reminder - Tomorrow",
        body: `
          <h2>Appointment Reminder</h2>
          <p>Dear {{patientName}},</p>
          <p>This is a reminder that you have an appointment tomorrow:</p>
          <ul>
            <li><strong>Doctor:</strong> Dr. {{doctorName}}</li>
            <li><strong>Date:</strong> {{appointmentDate}}</li>
            <li><strong>Time:</strong> {{appointmentTime}}</li>
            <li><strong>Hospital:</strong> {{hospitalName}}</li>
          </ul>
        `
      }
    },
    payment_success: {
      sms: "Payment received! LKR {{amount}} for appointment {{appointmentNumber}}. Thank you!",
      email: {
        subject: "Payment Confirmation - {{appointmentNumber}}",
        body: `
          <h2>Payment Successful</h2>
          <p>Dear {{patientName}},</p>
          <p>We have successfully received your payment:</p>
          <ul>
            <li><strong>Amount:</strong> LKR {{amount}}</li>
            <li><strong>Appointment:</strong> {{appointmentNumber}}</li>
            <li><strong>Transaction ID:</strong> {{transactionId}}</li>
            <li><strong>Payment Method:</strong> {{paymentMethod}}</li>
          </ul>
        `
      }
    },
    cancellation: {
      sms: "Your appointment {{appointmentNumber}} with Dr. {{doctorName}} on {{appointmentDate}} has been cancelled. {{refundInfo}}",
      email: {
        subject: "Appointment Cancelled - {{appointmentNumber}}",
        body: `
          <h2>Appointment Cancelled</h2>
          <p>Dear {{patientName}},</p>
          <p>Your appointment has been cancelled:</p>
          <ul>
            <li><strong>Doctor:</strong> Dr. {{doctorName}}</li>
            <li><strong>Date:</strong> {{appointmentDate}}</li>
            <li><strong>Time:</strong> {{appointmentTime}}</li>
            <li><strong>Reason:</strong> {{cancellationReason}}</li>
          </ul>
          <p>{{refundInfo}}</p>
        `
      }
    }
  }

  return templates[type as keyof typeof templates] || null
}

// Mock SMS sending function (integrate with actual SMS provider)
async function sendSMS(phoneNumber: string, template: string, data: Record<string, any>) {
  try {
    // Replace template variables
    let message = template
    Object.keys(data).forEach(key => {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || '')
    })

    // TODO: Integrate with actual SMS provider (Twilio, Dialog, etc.)
    console.log(`SMS to ${phoneNumber}: ${message}`)

    // Simulate SMS sending
    const success = Math.random() > 0.1 // 90% success rate
    
    return {
      success,
      message: success ? 'SMS sent successfully' : 'Failed to send SMS',
      response: { messageId: `sms_${Date.now()}`, provider: 'mock' },
      error: success ? null : 'Mock SMS failure'
    }

  } catch (error) {
    return {
      success: false,
      message: 'SMS sending failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Mock Email sending function (integrate with actual email provider)
async function sendEmail(email: string, template: any, data: Record<string, any>) {
  try {
    // Replace template variables in subject and body
    let subject = template.subject
    let body = template.body

    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, data[key] || '')
      body = body.replace(regex, data[key] || '')
    })

    // TODO: Integrate with actual email provider (SendGrid, SES, etc.)
    console.log(`Email to ${email}:`)
    console.log(`Subject: ${subject}`)
    console.log(`Body: ${body}`)

    // Simulate email sending
    const success = Math.random() > 0.05 // 95% success rate
    
    return {
      success,
      message: success ? 'Email sent successfully' : 'Failed to send email',
      response: { messageId: `email_${Date.now()}`, provider: 'mock' },
      error: success ? null : 'Mock email failure'
    }

  } catch (error) {
    return {
      success: false,
      message: 'Email sending failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
