import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { SessionData } from '@/lib/session'

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ['/login', '/api/auth/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Vérifier si la route est publique
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Vérifier la session
  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, {
    password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
    cookieName: 'suiviaddiction_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
    },
  })

  // Si pas connecté, rediriger vers login
  if (!session.isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
