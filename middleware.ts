import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("session_token")?.value
  const userId = request.cookies.get("user_id")?.value



  // Check if the request is for the dashboard or its subpaths
  const isDashboardPath = request.nextUrl.pathname.startsWith("/dashboard")

  // Check if the request is for the login page
  const isLoginPath = request.nextUrl.pathname === "/login"

  // If trying to access dashboard without being logged in
  if (isDashboardPath && (!sessionToken || !userId)) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If already logged in and trying to access login page
  if (isLoginPath && sessionToken && userId) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Configure the paths that should be checked by the middleware
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}

