import React from 'react'
import { GetServerSideProps } from 'next'
import DashboardLayout from '../components/layout/DashboardLayout'
import PerformanceDashboard from '../components/dashboard/PerformanceDashboard'

interface PerformanceDashboardPageProps {
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
}

export default function PerformanceDashboardPage({ user }: PerformanceDashboardPageProps) {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PerformanceDashboard />
        </div>
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // For now, return mock user data since auth system might not be fully set up
  // In production, you would check authentication here
  const mockUser = {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin'
  }

  return {
    props: {
      user: mockUser
    }
  }
}