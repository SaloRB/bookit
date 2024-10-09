import { NextResponse } from 'next/server'
import { checkAuth } from '@/app/actions/auth.actions'

export async function middleware(request) {
  const { isAuthenticated } = await checkAuth()

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/bookings'],
}
