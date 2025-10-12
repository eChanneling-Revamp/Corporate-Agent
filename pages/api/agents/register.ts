import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  agentType: z.enum(['CORPORATE', 'INDIVIDUAL', 'BANK', 'PHARMACY', 'FACTORY', 'TELCO']),
  companyName: z.string().optional(),
  registrationNumber: z.string().optional(),
  contactPerson: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().optional(),
  username: z.string().min(4),
  password: z.string().min(8),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);

    // Check if email or username already exists
    const existingAgent = await prisma.agent.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username },
        ],
      },
    });

    if (existingAgent) {
      return res.status(400).json({
        message: 'Email or username already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create agent
    const agent = await prisma.agent.create({
      data: {
        ...validatedData,
        password: hashedPassword,
        status: 'PENDING', // Requires admin approval
      },
      select: {
        id: true,
        agentType: true,
        companyName: true,
        contactPerson: true,
        email: true,
        phone: true,
        username: true,
        status: true,
        createdAt: true,
      },
    });

    // TODO: Send email notification to admin for approval
    // TODO: Send confirmation email to agent

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Awaiting admin approval.',
      agent,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Registration error:', error);
    return res.status(500).json({
      message: 'Failed to register agent',
      error: error.message,
    });
  }
}