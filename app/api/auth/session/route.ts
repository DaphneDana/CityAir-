import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

// Add this export to mark the route as dynamic
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Get user ID from cookie
    const userId = cookies().get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ user: null })
    }

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: Number.parseInt(userId) },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Session error:", error)
    return NextResponse.json({ user: null })
  }
}

