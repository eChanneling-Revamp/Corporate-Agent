import { createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'

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
  const { data: session, status } = useSession()

  const logout = async () => {
    await signOut({ redirect: false })
    router.push('/auth/login')
  }

  const value: AuthContextType = {
    isAuthenticated: !!session,
    user: session?.user,
    isLoading: status === 'loading',
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}