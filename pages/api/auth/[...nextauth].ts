import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const agent = await prisma.agent.findUnique({
          where: { username: credentials.username },
          include: { branches: true },
        });

        if (!agent) {
          throw new Error('No agent found with this username');
        }

        if (agent.status !== 'ACTIVE') {
          throw new Error('Account is not active. Please contact support.');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          agent.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        // Update last login
        await prisma.agent.update({
          where: { id: agent.id },
          data: { lastLoginAt: new Date() },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            agentId: agent.id,
            agentEmail: agent.email,
            action: 'LOGIN',
            entityType: 'AGENT',
            entityId: agent.id,
          },
        });

        return {
          id: agent.id,
          email: agent.email,
          name: agent.contactPerson,
          username: agent.username,
          agentType: agent.agentType,
          status: agent.status,
          companyName: agent.companyName,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.agentType = (user as any).agentType;
        token.status = (user as any).status;
        token.companyName = (user as any).companyName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).username = token.username as string;
        (session.user as any).agentType = token.agentType as string;
        (session.user as any).status = token.status as string;
        (session.user as any).companyName = token.companyName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);