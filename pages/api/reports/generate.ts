import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

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
    const { reportType, startDate, endDate, parameters } = req.body;

    let reportData: any = {};

    switch (reportType) {
      case 'APPOINTMENT_SUMMARY':
        reportData = await generateAppointmentSummary(
          (session.user as any).id,
          startDate,
          endDate
        );
        break;

      case 'FINANCIAL_SUMMARY':
        reportData = await generateFinancialSummary(
          (session.user as any).id,
          startDate,
          endDate
        );
        break;

      case 'EMPLOYEE_UTILIZATION':
        reportData = await generateEmployeeUtilization(
          (session.user as any).id,
          startDate,
          endDate
        );
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    // Save report
    const report = await prisma.report.create({
      data: {
        reportType,
        reportName: `${reportType}_${new Date().toISOString()}`,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        parameters: parameters || {},
        data: reportData,
        agentId: (session.user as any).id,
      },
    });

    return res.status(201).json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return res.status(500).json({
      message: 'Failed to generate report',
      error: error.message,
    });
  }
}

async function generateAppointmentSummary(
  agentId: string,
  startDate: string,
  endDate: string
) {
  const appointments = await prisma.appointment.findMany({
    where: {
      agentId,
      sessionDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
  });

  const summary = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
    cancelled: appointments.filter((a) => a.status === 'CANCELLED').length,
    completed: appointments.filter((a) => a.status === 'COMPLETED').length,
    totalRevenue: appointments.reduce((sum: number, a: any) => sum + a.amount, 0),
    bySpecialty: {} as Record<string, number>,
    byHospital: {} as Record<string, number>,
  };

  appointments.forEach((apt) => {
    summary.bySpecialty[apt.specialty] =
      (summary.bySpecialty[apt.specialty] || 0) + 1;
    summary.byHospital[apt.hospitalName] =
      (summary.byHospital[apt.hospitalName] || 0) + 1;
  });

  return summary;
}

async function generateFinancialSummary(
  agentId: string,
  startDate: string,
  endDate: string
) {
  const transactions = await prisma.transaction.findMany({
    where: {
      agentId,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
  });

  return {
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum: number, t: any) => sum + t.amount, 0),
    successfulPayments: transactions.filter((t) => t.status === 'PAID').length,
    failedPayments: transactions.filter((t) => t.status === 'FAILED').length,
    refundedAmount: transactions
      .filter((t) => t.status === 'REFUNDED')
      .reduce((sum: number, t: any) => sum + t.amount, 0),
    byPaymentMethod: transactions.reduce((acc: Record<string, number>, t: any) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

async function generateEmployeeUtilization(
  agentId: string,
  startDate: string,
  endDate: string
) {
  const employees = await prisma.corporateEmployee.findMany({
    where: { agentId },
  });

  // Get appointments for each employee's phone number
  const utilization = await Promise.all(
    employees.map(async (emp) => {
      const appointments = await prisma.appointment.count({
        where: {
          agentId,
          patientPhone: emp.phone,
          sessionDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      });

      return {
        employeeId: emp.employeeId,
        name: emp.name,
        department: emp.department,
        appointmentCount: appointments,
        utilization: emp.monthlyLimit
          ? (emp.usedLimit / emp.monthlyLimit) * 100
          : 0,
      };
    })
  );

  return {
    totalEmployees: employees.length,
    activeEmployees: employees.filter((e) => e.isActive).length,
    utilization,
  };
}