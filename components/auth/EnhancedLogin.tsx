import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useDispatch } from 'react-redux'
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Shield,
  Fingerprint,
  Smartphone,
  Key,
  AlertCircle,
  CheckCircle,
  Loader2,
  Building,
  UserCheck,
  Activity,
  Globe,
  Clock,
  ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { setCredentials } from '../../store/slices/authSlice'

interface LoginMetrics {
  lastLogin?: Date
  loginAttempts: number
  deviceInfo: {
    browser: string
    os: string
    ip: string
  }
  location?: string
}

interface SecurityFeatures {
  twoFactorEnabled: boolean
  biometricEnabled: boolean
  sessionTimeout: number
  ipWhitelisting: boolean
  deviceTrust: boolean
}

const EnhancedLogin: React.FC = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  
  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Security states
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [trustedDevice, setTrustedDevice] = useState(false)
  
  // Validation states
  const [errors, setErrors] = useState<{ email?: string; password?: string; twoFactor?: string }>({})
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [capsLockOn, setCapsLockOn] = useState(false)
  
  // Session tracking
  const [sessionInfo, setSessionInfo] = useState<LoginMetrics | null>(null)
  const [loginHistory, setLoginHistory] = useState<LoginMetrics[]>([])
  
  // Security features
  const [securityFeatures, setSecurityFeatures] = useState<SecurityFeatures>({
    twoFactorEnabled: false,
    biometricEnabled: false,
    sessionTimeout: 30,
    ipWhitelisting: false,
    deviceTrust: false
  })

  // Check for biometric support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'credentials' in navigator) {
      setBiometricAvailable(true)
    }
    
    // Check for trusted device
    const deviceId = localStorage.getItem('deviceId')
    if (deviceId) {
      setTrustedDevice(true)
    }
    
    // Load login history
    const history = localStorage.getItem('loginHistory')
    if (history) {
      setLoginHistory(JSON.parse(history))
    }
    
    // Detect caps lock
    const handleCapsLock = (e: KeyboardEvent) => {
      setCapsLockOn(e.getModifierState('CapsLock'))
    }
    
    window.addEventListener('keydown', handleCapsLock)
    window.addEventListener('keyup', handleCapsLock)
    
    return () => {
      window.removeEventListener('keydown', handleCapsLock)
      window.removeEventListener('keyup', handleCapsLock)
    }
  }, [])

  // Password strength calculator
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0)
      return
    }
    
    let strength = 0
    if (password.length >= 8) strength += 25
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25
    if (password.match(/\d/)) strength += 25
    if (password.match(/[^a-zA-Z\d]/)) strength += 25
    
    setPasswordStrength(strength)
  }, [password])

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Invalid email format'
    }
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    setLoading(true)
    
    try {
      // Simulate biometric authentication
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success('Biometric authentication successful')
      await handleSuccessfulLogin({
        email: 'agent@echanneling.com',
        role: 'agent',
        authMethod: 'biometric'
      })
    } catch (error) {
      toast.error('Biometric authentication failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle successful login
  const handleSuccessfulLogin = async (userData: any) => {
    // Update login metrics
    const metrics: LoginMetrics = {
      lastLogin: new Date(),
      loginAttempts: 0,
      deviceInfo: {
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                 navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                 navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
        os: navigator.platform,
        ip: '192.168.1.1' // Would come from backend
      },
      location: 'Colombo, Sri Lanka' // Would come from IP geolocation
    }
    
    // Store session info
    setSessionInfo(metrics)
    
    // Update login history
    const newHistory = [metrics, ...loginHistory].slice(0, 5)
    setLoginHistory(newHistory)
    localStorage.setItem('loginHistory', JSON.stringify(newHistory))
    
    // Store trusted device if remember me is checked
    if (rememberMe && !trustedDevice) {
      const deviceId = Math.random().toString(36).substring(7)
      localStorage.setItem('deviceId', deviceId)
      setTrustedDevice(true)
    }
    
    // Dispatch to Redux store
    dispatch(setCredentials({
      user: userData,
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token'
    }))
    
    // Show success message
    toast.success(`Welcome back, ${userData.email}!`)
    
    // Redirect based on role
    switch (userData.role) {
      case 'admin':
        router.push('/admin/dashboard')
        break
      case 'supervisor':
        router.push('/supervisor/dashboard')
        break
      default:
        router.push('/dashboard')
    }
  }

  // Handle login submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Check for two-factor authentication
      if (email === 'admin@echanneling.com') {
        setShowTwoFactor(true)
        setLoading(false)
        return
      }
      
      // Mock successful login
      await handleSuccessfulLogin({
        email,
        role: email.includes('admin') ? 'admin' : 
              email.includes('supervisor') ? 'supervisor' : 'agent',
        authMethod: 'password'
      })
    } catch (error) {
      toast.error('Invalid credentials')
      setErrors({ password: 'Invalid email or password' })
    } finally {
      setLoading(false)
    }
  }

  // Handle two-factor verification
  const handleTwoFactorSubmit = async () => {
    if (!twoFactorCode) {
      setErrors({ twoFactor: 'Code is required' })
      return
    }
    
    if (twoFactorCode.length !== 6) {
      setErrors({ twoFactor: 'Code must be 6 digits' })
      return
    }
    
    setLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (twoFactorCode === '123456') {
        await handleSuccessfulLogin({
          email,
          role: 'admin',
          authMethod: '2fa'
        })
      } else {
        setErrors({ twoFactor: 'Invalid code' })
      }
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500'
    if (passwordStrength < 50) return 'bg-orange-500'
    if (passwordStrength < 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak'
    if (passwordStrength < 50) return 'Fair'
    if (passwordStrength < 75) return 'Good'
    return 'Strong'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Panel - Login Form */}
        <div className="p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">eChanneling Agent</h1>
              <p className="text-gray-600 mt-2">Secure Enterprise Portal</p>
            </div>

            {!showTwoFactor ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="agent@echanneling.com"
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                  
                  {/* Caps Lock Warning */}
                  {capsLockOn && (
                    <p className="mt-1 text-sm text-yellow-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Caps Lock is on
                    </p>
                  )}
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Password Strength</span>
                        <span>{getPasswordStrengthText()}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Trust this device
                    </span>
                  </label>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </a>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </button>

                {/* Alternative Login Methods */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {biometricAvailable && (
                    <button
                      type="button"
                      onClick={handleBiometricAuth}
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Fingerprint className="h-5 w-5 mr-2 text-gray-600" />
                      <span className="text-sm text-gray-700">Biometric</span>
                    </button>
                  )}
                  
                  <button
                    type="button"
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Key className="h-5 w-5 mr-2 text-gray-600" />
                    <span className="text-sm text-gray-700">SSO</span>
                  </button>
                </div>
              </form>
            ) : (
              // Two-Factor Authentication Form
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-4">
                    <Smartphone className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h2>
                  <p className="text-sm text-gray-600 mt-2">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`w-full px-4 py-3 text-center text-2xl tracking-widest border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.twoFactor ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="000000"
                    maxLength={6}
                  />
                  {errors.twoFactor && (
                    <p className="mt-1 text-sm text-red-600 text-center">{errors.twoFactor}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleTwoFactorSubmit}
                    disabled={loading || twoFactorCode.length !== 6}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Code'
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setShowTwoFactor(false)
                      setTwoFactorCode('')
                    }}
                    className="w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>

                <p className="text-sm text-center text-gray-600">
                  Didn't receive a code?{' '}
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    Resend
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Info Section */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 lg:p-12 text-white flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-6">Enterprise Security Features</h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Multi-Factor Authentication</p>
                  <p className="text-sm text-blue-100 mt-1">
                    Enhanced security with 2FA and biometric options
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Role-Based Access Control</p>
                  <p className="text-sm text-blue-100 mt-1">
                    Granular permissions for agents, supervisors, and admins
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Session Management</p>
                  <p className="text-sm text-blue-100 mt-1">
                    Automatic timeout and concurrent session detection
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Audit Logging</p>
                  <p className="text-sm text-blue-100 mt-1">
                    Complete activity tracking and compliance reporting
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Login History */}
          {loginHistory.length > 0 && (
            <div className="mt-8 p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur">
              <h3 className="text-sm font-semibold mb-3">Recent Login Activity</h3>
              <div className="space-y-2">
                {loginHistory.slice(0, 2).map((login, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-3 w-3" />
                      <span>{login.location || 'Unknown'}</span>
                    </div>
                    <span className="text-blue-200">
                      {login.lastLogin && formatDistanceToNow(new Date(login.lastLogin), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Status */}
          <div className="mt-8">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>All Systems Operational</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minutes${options?.addSuffix ? ' ago' : ''}`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}${options?.addSuffix ? ' ago' : ''}`
  
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''}${options?.addSuffix ? ' ago' : ''}`
}

export default EnhancedLogin
