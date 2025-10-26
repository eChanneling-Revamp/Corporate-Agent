import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  
  // Handle development-only requests that cause annoying 404s
  if (process.env.NODE_ENV === 'development') {
    // Block webpack hot-update requests - return 200 to stop the noise
    if (pathname.includes('webpack.hot-update') || pathname.includes('hot-update.json')) {
      return new NextResponse('{}', { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Block chrome devtools and well-known requests
    if (pathname.includes('.well-known') || pathname.includes('appspecific')) {
      return new NextResponse(null, { status: 204 })
    }
    
    // Block sockjs and development websocket requests
    if (pathname.includes('sockjs-node') || pathname.includes('__webpack')) {
      return new NextResponse(null, { status: 204 })
    }
    
    // Handle favicon requests properly
    if (pathname.includes('favicon.ico') && !pathname.startsWith('/favicon.ico')) {
      return NextResponse.redirect(new URL('/favicon.ico', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}