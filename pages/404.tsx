import Link from 'next/link'
import Head from 'next/head'
import { Home, ArrowLeft } from 'lucide-react'

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found - eChanneling Corporate Agent</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h1 className="text-9xl font-bold text-blue-600">404</h1>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Page not found
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="btn-primary">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
            <button 
              onClick={() => window.history.back()} 
              className="btn-secondary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </>
  )
}