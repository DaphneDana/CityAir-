import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createHash } from "crypto"
import { cookies } from "next/headers"

// Add this export to mark the route as dynamic
export const dynamic = "force-dynamic"

// Simple hash function to match the one used in seed.ts
function simpleHash(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const userId = cookies().get("user_id")?.value
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: Number.parseInt(userId) },
      select: { role: true },
    })

    if (!currentUser || currentUser.role.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const id = Number.parseInt(params.id)
    const { username, email, password, role } = await request.json()

    if (!username || !email || !role) {
      return NextResponse.json({ error: "Username, email, and role are required" }, { status: 400 })
    }

    // Check if email is already in use by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id,
        },
      },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use by another user" }, { status: 400 })
    }

    // Update user
    const updateData: any = {
      username,
      email,
      role,
      updatedAt: new Date(),
    }

    // Only update password if provided
    if (password) {
      updateData.passwordHash = simpleHash(password)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const userId = cookies().get("user_id")?.value
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: Number.parseInt(userId) },
      select: { role: true },
    })

    if (!currentUser || currentUser.role.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const id = Number.parseInt(params.id)

    // Prevent deleting yourself
    if (id === Number.parseInt(userId)) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

