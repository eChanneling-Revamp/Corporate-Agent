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
    const {
      patientName,
      patientPhone,
      patientEmail,
      patientNIC,
      doctorId,
      doctorName,
      specialty,
      hospitalId,
      hospitalName,
      sessionId,
      sessionDate,
      sessionTime,
      appointmentType,
      amount,
    } = req.body;

    // Validate required fields
    if (!patientName || !patientPhone || !doctorId || !sessionId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        appointmentNumber: `APT-${Date.now()}-${uuidv4().slice(0, 8)}`,
        patientName,
        patientPhone,
        patientEmail,
        patientNIC,
        doctorId,
        doctorName,
        specialty,
        hospitalId,
        hospitalName,
        sessionId,
        sessionDate: new Date(sessionDate),
        sessionTime,
        appointmentType: appointmentType || 'REGULAR',
        amount,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        agentId: (session.user as any).id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        agentId: (session.user as any).id,
        agentEmail: session.user?.email || '',
        action: 'CREATE_APPOINTMENT',
        entityType: 'APPOINTMENT',
        entityId: appointment.id,
        newValue: appointment as any,
      },
    });

    // TODO: Publish event to Kafka
    // await publishToKafka('appointment.created', {
    //   appointmentId: appointment.id,
    //   appointmentNumber: appointment.appointmentNumber,
    //   agentId: (session.user as any).id,
    //   patientPhone,
    //   timestamp: new Date().toISOString(),
    // });

    return res.status(201).json({
      success: true,
      appointment,
    });
  } catch (error: any) {
    console.error('Create appointment error:', error);
    return res.status(500).json({
      message: 'Failed to create appointment',
      error: error.message,
    });
  }
}