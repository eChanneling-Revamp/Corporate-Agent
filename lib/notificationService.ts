import nodemailer from 'nodemailer'
import { prisma } from '../lib/prisma'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface EmailData {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

interface SMSData {
  to: string
  message: string
}

interface NotificationData {
  userId: string
  title: string
  message: string
  type: 'APPOINTMENT_CONFIRMED' | 'APPOINTMENT_CANCELLED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'TASK_ASSIGNED' | 'SYSTEM_ALERT' | 'REMINDER'
  data?: any
  sendEmail?: boolean
  sendSMS?: boolean
  emailData?: Partial<EmailData>
  smsData?: Partial<SMSData>
}

class NotificationService {
  private emailTransporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeEmailTransporter()
  }

  private initializeEmailTransporter() {
    try {
      const emailConfig: EmailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASSWORD || ''
        }
      }

      this.emailTransporter = nodemailer.createTransporter(emailConfig)
    } catch (error) {
      console.error('Failed to initialize email transporter:', error)
    }
  }

  // Send email notification
  async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!this.emailTransporter) {
      console.error('Email transporter not initialized')
      return false
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        attachments: emailData.attachments
      }

      const info = await this.emailTransporter.sendMail(mailOptions)
      console.log('Email sent successfully:', info.messageId)
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  // Send SMS notification (mock implementation - integrate with actual SMS provider)
  async sendSMS(smsData: SMSData): Promise<boolean> {
    try {
      // Mock SMS implementation
      // In production, integrate with providers like Twilio, Nexmo, etc.
      console.log(`SMS sent to ${smsData.to}: ${smsData.message}`)
      
      // Example with fetch to SMS API:
      /*
      const response = await fetch(process.env.SMS_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SMS_API_KEY}`
        },
        body: JSON.stringify({
          to: smsData.to,
          message: smsData.message,
          from: process.env.SMS_SENDER_ID || 'eChanneling'
        })
      })
      
      return response.ok
      */
      
      return true
    } catch (error) {
      console.error('Failed to send SMS:', error)
      return false
    }
  }

  // Create in-app notification
  async createNotification(data: NotificationData): Promise<any> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          data: data.data || {},
          isRead: false
        }
      })

      // Send email if requested
      if (data.sendEmail && data.emailData) {
        await this.sendEmail({
          to: data.emailData.to || '',
          subject: data.emailData.subject || data.title,
          html: data.emailData.html || data.message,
          text: data.emailData.text,
          attachments: data.emailData.attachments
        })
      }

      // Send SMS if requested
      if (data.sendSMS && data.smsData) {
        await this.sendSMS({
          to: data.smsData.to || '',
          message: data.smsData.message || data.message
        })
      }

      return notification
    } catch (error) {
      console.error('Failed to create notification:', error)
      throw error
    }
  }

  // Send appointment confirmation email
  async sendAppointmentConfirmation(appointmentData: any): Promise<void> {
    const emailHtml = this.generateAppointmentConfirmationEmail(appointmentData)
    
    await this.createNotification({
      userId: appointmentData.bookedById,
      title: 'Appointment Confirmed',
      message: `Your appointment with ${appointmentData.doctor?.name} has been confirmed for ${appointmentData.appointmentDate}`,
      type: 'APPOINTMENT_CONFIRMED',
      data: { appointmentId: appointmentData.id },
      sendEmail: true,
      emailData: {
        to: appointmentData.patientEmail,
        subject: 'Appointment Confirmation - eChanneling',
        html: emailHtml
      },
      sendSMS: true,
      smsData: {
        to: appointmentData.patientPhone,
        message: `Your appointment with ${appointmentData.doctor?.name} is confirmed for ${appointmentData.appointmentDate}. Appointment #: ${appointmentData.appointmentNumber}`
      }
    })
  }

  // Send appointment cancellation email
  async sendAppointmentCancellation(appointmentData: any, reason?: string): Promise<void> {
    const emailHtml = this.generateAppointmentCancellationEmail(appointmentData, reason)
    
    await this.createNotification({
      userId: appointmentData.bookedById,
      title: 'Appointment Cancelled',
      message: `Your appointment with ${appointmentData.doctor?.name} has been cancelled`,
      type: 'APPOINTMENT_CANCELLED',
      data: { appointmentId: appointmentData.id, reason },
      sendEmail: true,
      emailData: {
        to: appointmentData.patientEmail,
        subject: 'Appointment Cancellation - eChanneling',
        html: emailHtml
      },
      sendSMS: true,
      smsData: {
        to: appointmentData.patientPhone,
        message: `Your appointment #${appointmentData.appointmentNumber} has been cancelled. ${reason ? 'Reason: ' + reason : ''}`
      }
    })
  }

  // Send payment confirmation
  async sendPaymentConfirmation(paymentData: any): Promise<void> {
    const emailHtml = this.generatePaymentConfirmationEmail(paymentData)
    
    await this.createNotification({
      userId: paymentData.appointment?.bookedById,
      title: 'Payment Received',
      message: `Payment of LKR ${paymentData.amount} has been successfully processed`,
      type: 'PAYMENT_SUCCESS',
      data: { paymentId: paymentData.id },
      sendEmail: true,
      emailData: {
        to: paymentData.appointment?.patientEmail,
        subject: 'Payment Confirmation - eChanneling',
        html: emailHtml
      }
    })
  }

  // Generate appointment confirmation email template
  private generateAppointmentConfirmationEmail(appointment: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .appointment-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .qr-code { text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>eChanneling Corporate</h1>
            <h2>Appointment Confirmation</h2>
          </div>
          <div class="content">
            <p>Dear ${appointment.patientName},</p>
            <p>Your appointment has been successfully confirmed. Here are the details:</p>
            
            <div class="appointment-details">
              <h3>Appointment Details</h3>
              <p><strong>Appointment Number:</strong> ${appointment.appointmentNumber}</p>
              <p><strong>Doctor:</strong> ${appointment.doctor?.name}</p>
              <p><strong>Specialization:</strong> ${appointment.doctor?.specialization}</p>
              <p><strong>Date:</strong> ${appointment.appointmentDate}</p>
              <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
              <p><strong>Hospital:</strong> ${appointment.hospital?.name}</p>
              <p><strong>Queue Position:</strong> #${appointment.queuePosition}</p>
              <p><strong>Estimated Wait Time:</strong> ${appointment.estimatedWaitTime} minutes</p>
              <p><strong>Consultation Fee:</strong> LKR ${appointment.consultationFee}</p>
            </div>
            
            <div class="qr-code">
              <p><strong>Show this QR code at the hospital for quick check-in:</strong></p>
              <!-- QR code would be generated here -->
              <p>Appointment ID: ${appointment.id}</p>
            </div>
            
            <p><strong>Important Instructions:</strong></p>
            <ul>
              <li>Please arrive 15 minutes before your appointment time</li>
              <li>Bring a valid ID and any previous medical records</li>
              <li>Contact us if you need to reschedule or cancel</li>
            </ul>
            
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2025 eChanneling Corporate. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Generate appointment cancellation email template
  private generateAppointmentCancellationEmail(appointment: any, reason?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .cancellation-details { background: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>eChanneling Corporate</h1>
            <h2>Appointment Cancellation</h2>
          </div>
          <div class="content">
            <p>Dear ${appointment.patientName},</p>
            <p>We regret to inform you that your appointment has been cancelled.</p>
            
            <div class="cancellation-details">
              <h3>Cancelled Appointment Details</h3>
              <p><strong>Appointment Number:</strong> ${appointment.appointmentNumber}</p>
              <p><strong>Doctor:</strong> ${appointment.doctor?.name}</p>
              <p><strong>Original Date:</strong> ${appointment.appointmentDate}</p>
              <p><strong>Original Time:</strong> ${appointment.appointmentTime}</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>
            
            <p>We apologize for any inconvenience caused. If you have already made payment, it will be refunded within 3-5 business days.</p>
            
            <p>To reschedule your appointment, please contact our support team or book a new appointment through our website.</p>
          </div>
          <div class="footer">
            <p>© 2025 eChanneling Corporate. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Generate payment confirmation email template
  private generatePaymentConfirmationEmail(payment: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .payment-details { background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>eChanneling Corporate</h1>
            <h2>Payment Confirmation</h2>
          </div>
          <div class="content">
            <p>Dear ${payment.appointment?.patientName},</p>
            <p>Your payment has been successfully processed. Here are the details:</p>
            
            <div class="payment-details">
              <h3>Payment Details</h3>
              <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
              <p><strong>Amount:</strong> LKR ${payment.amount}</p>
              <p><strong>Payment Method:</strong> ${payment.paymentMethod}</p>
              <p><strong>Date:</strong> ${payment.paidAt}</p>
              <p><strong>Status:</strong> ${payment.status}</p>
            </div>
            
            <p>Your appointment is now confirmed. Please keep this receipt for your records.</p>
          </div>
          <div class="footer">
            <p>© 2025 eChanneling Corporate. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
export default notificationService