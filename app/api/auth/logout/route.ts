import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Add this export to mark the route as dynamic
export const dynamic = "force-dynamic"

export async function POST() {
  // Clear cookies
  cookies().set({
    name: "session_token",
    value: "",
    expires: new Date(0),
    path: "/",
  })

  cookies().set({
    name: "user_id",
    value: "",
    expires: new Date(0),
    path: "/",
  })

  return NextResponse.json({ success: true })
}

