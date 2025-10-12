import axios from 'axios';

export async function sendSMS(to: string, message: string) {
  try {
    const response = await axios.post(
      process.env.SMS_API_URL!,
      {
        apiKey: process.env.SMS_API_KEY,
        senderId: process.env.SMS_SENDER_ID,
        to,
        message,
      }
    );

    return {
      success: true,
      messageId: response.data.messageId,
    };
  } catch (error: any) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function sendAppointmentConfirmationSMS(
  phone: string,
  appointmentNumber: string,
  doctorName: string,
  sessionDate: string,
  sessionTime: string
) {
  const message = `Your appointment ${appointmentNumber} with Dr. ${doctorName} on ${sessionDate} at ${sessionTime} is confirmed. -eChannelling`;
  return await sendSMS(phone, message);
}

export async function sendBulkAppointmentSMS(appointments: any[]) {
  const results = await Promise.all(
    appointments.map((apt) =>
      sendAppointmentConfirmationSMS(
        apt.patientPhone,
        apt.appointmentNumber,
        apt.doctorName,
        apt.sessionDate,
        apt.sessionTime
      )
    )
  );
  return results;
}