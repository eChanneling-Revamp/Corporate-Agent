import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { appointments } = req.body;

    if (!Array.isArray(appointments) || appointments.length === 0) {
      return res.status(400).json({ message: 'Invalid appointments data' });
    }

    const bulkBookingId = `BULK-${Date.now()}-${uuidv4().slice(0, 8)}`;

    // Create all appointments in a transaction
    const createdAppointments = await prisma.$transaction(
      appointments.map((apt) =>
        prisma.appointment.create({
          data: {
            appointmentNumber: `APT-${Date.now()}-${uuidv4().slice(0, 8)}`,
            patientName: apt.patientName,
            patientPhone: apt.patientPhone,
            patientEmail: apt.patientEmail,
            patientNIC: apt.patientNIC,
            doctorId: apt.doctorId,
            doctorName: apt.doctorName,
            specialty: apt.specialty,
            hospitalId: apt.hospitalId,
            hospitalName: apt.hospitalName,
            sessionId: apt.sessionId,
            sessionDate: new Date(apt.sessionDate),
            sessionTime: apt.sessionTime,
            appointmentType: apt.appointmentType || 'REGULAR',
            amount: apt.amount,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            agentId: (session.user as any).id,
            bulkBookingId,
          },
        })
      )
    );

    // Calculate total amount
    const totalAmount = createdAppointments.reduce(
      (sum, apt) => sum + apt.amount,
      0
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        agentId: (session.user as any).id,
        agentEmail: session.user?.email || '',
        action: 'BULK_APPOINTMENT_CREATE',
        entityType: 'APPOINTMENT',
        entityId: bulkBookingId,
        newValue: { count: createdAppointments.length, totalAmount } as any,
      },
    });

    // TODO: Publish event to Kafka
    // await publishToKafka('appointments.bulk.created', {
    //   bulkBookingId,
    //   agentId: (session.user as any).id,
    //   count: createdAppointments.length,
    //   totalAmount,
    //   timestamp: new Date().toISOString(),
    // });

    return res.status(201).json({
      success: true,
      bulkBookingId,
      appointments: createdAppointments,
      totalAmount,
    });
  } catch (error: any) {
    console.error('Bulk appointment error:', error);
    return res.status(500).json({
      message: 'Failed to create bulk appointments',
      error: error.message,
    });
  }
}