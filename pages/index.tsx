import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Auto redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      router.push('/auth/login')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
        <div className="loading-spinner mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          eChanneling Corporate Agent
        </h1>
        <p className="text-gray-600 mb-6">
          System is running successfully!
        </p>
        <div className="space-y-3">
          <Link href="/auth/login" className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
            Go to Login
          </Link>
          <Link href="/test" className="block w-full bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition-colors">
            Test Page
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Redirecting to login in 3 seconds...
        </p>
      </div>
    </div>
  )
}