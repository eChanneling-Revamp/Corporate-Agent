import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'agent' | 'admin'
  redirectTo?: string
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole,
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) => {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'loading') {
      if (!session) {
        router.push(redirectTo)
        return
      }

      // Check agent type if required role is specified
      if (requiredRole && requiredRole === 'agent') {
        const userAgentType = (session.user as any)?.agentType
        if (!userAgentType || !['CORPORATE', 'INDIVIDUAL', 'BANK', 'PHARMACY', 'FACTORY', 'TELCO'].includes(userAgentType)) {
          router.push('/unauthorized')
          return
        }
      }

      // Check if agent is active
      const userStatus = (session.user as any)?.status
      if (userStatus && userStatus !== 'ACTIVE') {
        router.push('/account/pending')
        return
      }
    }
  }, [session, status, router, requiredRole, redirectTo])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (requiredRole && requiredRole === 'agent' && !(session.user as any)?.agentType) {
    return null
  }

  const userStatus = (session.user as any)?.status
  if (userStatus && userStatus !== 'ACTIVE') {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute