import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'

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
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      if (requiredRole && user?.role !== requiredRole) {
        router.push('/unauthorized')
        return
      }

      // Check if user is verified and approved
      if (user && (!user.isVerified || user.registrationStatus !== 'approved')) {
        router.push('/account/pending')
        return
      }
    }
  }, [isAuthenticated, user, isLoading, router, requiredRole, redirectTo])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null
  }

  if (user && (!user.isVerified || user.registrationStatus !== 'approved')) {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute