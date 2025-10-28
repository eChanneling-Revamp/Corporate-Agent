import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store/store'
import { refreshTokenThunk } from '../store/slices/authSlice'
import Cookies from 'js-cookie'

interface AuthContextType {
  isAuthenticated: boolean
  user: any
  isLoading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const router = useRouter()
  const dispatch = useDispatch<any>()
  const { user, isAuthenticated, isLoading, token } = useSelector((state: RootState) => state.auth)

  // Removed automatic token refresh to prevent Fast Refresh issues

  const logout = () => {
    Cookies.remove('authToken')
    Cookies.remove('refreshToken')
    dispatch({ type: 'auth/logout' })
    router.push('/auth/login')
  }

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}