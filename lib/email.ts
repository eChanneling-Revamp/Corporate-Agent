import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function sendAppointmentConfirmationEmail(
  email: string,
  appointmentDetails: any
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #0066cc; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Confirmed</h1>
        </div>
        <div class="content">
          <p>Dear ${appointmentDetails.patientName},</p>
          <p>Your appointment has been successfully confirmed.</p>
          
          <div class="details">
            <h3>Appointment Details:</h3>
            <p><strong>Appointment Number:</strong> ${appointmentDetails.appointmentNumber}</p>
            <p><strong>Doctor:</strong> ${appointmentDetails.doctorName}</p>
            <p><strong>Specialty:</strong> ${appointmentDetails.specialty}</p>
            <p><strong>Hospital:</strong> ${appointmentDetails.hospitalName}</p>
            <p><strong>Date:</strong> ${appointmentDetails.sessionDate}</p>
            <p><strong>Time:</strong> ${appointmentDetails.sessionTime}</p>
          </div>
          
          <p>Please arrive 15 minutes before your appointment time.</p>
        </div>
        <div class="footer">
          <p>eChannelling - Making Healthcare Accessible</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(
    email,
    `Appointment Confirmed - ${appointmentDetails.appointmentNumber}`,
    html
  );
}