import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { createHash } from "crypto"

// Add this export to mark the route as dynamic
export const dynamic = "force-dynamic"

// Simple hash function to match the one used in seed.ts
function simpleHash(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Check password
    const hashedPassword = simpleHash(password)
    if (user.passwordHash !== hashedPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Create session
    const sessionToken = crypto.randomUUID()
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Set session cookie
    cookies().set({
      name: "session_token",
      value: sessionToken,
      httpOnly: true,
      path: "/",
      expires,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    // Store user ID in another cookie for client-side access
    cookies().set({
      name: "user_id",
      value: user.id.toString(),
      path: "/",
      expires,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    // Return user data (excluding password)
    const { passwordHash, ...userData } = user
    return NextResponse.json({
      user: userData,
      activity: {
        action: "Login",
        details: `Logged in from ${request.headers.get("user-agent") || "unknown device"}`,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

