

import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Get the token from the request
    const token = req.nextauth.token
    
    // If user is suspended, redirect to sign out
    if (token?.status === 'SUSPENDED') {
      return NextResponse.redirect(new URL('/api/auth/signout', req.url))
    }
    
    // If accessing admin routes, check if user is admin
    if (req.nextUrl.pathname.startsWith('/admin') && !token?.isAdmin) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        if (req.nextUrl.pathname.startsWith('/auth') || 
            req.nextUrl.pathname === '/' ||
            req.nextUrl.pathname.startsWith('/api/auth') ||
            req.nextUrl.pathname.startsWith('/api/signup')) {
          return true
        }
        
        // Allow public access to posts feed and projects feed when public=true
        if ((req.nextUrl.pathname === '/api/posts/feed' || 
             req.nextUrl.pathname === '/api/projects/feed') &&
            req.nextUrl.searchParams.get('public') === 'true') {
          return true
        }
        
        // For protected routes, require valid token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    // Protect these routes
    '/profile/:path*',
    '/projects/:path*',
    '/admin/:path*',
    '/api/profile/:path*',
    '/api/projects/:path*',
    '/api/posts/:path*',
    '/api/admin/:path*',
  ]
}

