import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Simulate sending an email (in a real app, you would use a service like SendGrid, Mailgun, etc.)
async function sendEmail(to: string, subject: string, body: string) {
  // In a real implementation, you would call an email service API here
  console.log(`Sending email to ${to}:`)
  console.log(`Subject: ${subject}`)
  console.log(`Body: ${body}`)

  // Simulate a delay for the email sending
  await new Promise((resolve) => setTimeout(resolve, 500))

  return { success: true }
}

export async function POST(request: Request) {
  try {
    const userId = cookies().get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { subject, body } = await request.json()

    if (!subject || !body) {
      return NextResponse.json({ error: "Subject and body are required" }, { status: 400 })
    }

    // Get the user's email
    const user = await prisma.user.findUnique({
      where: { id: Number.parseInt(userId) },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if email notifications are enabled for this user
    const emailConfig = await prisma.configuration.findUnique({
      where: {
        userId_configType_configKey: {
          userId: Number.parseInt(userId),
          configType: "notifications",
          configKey: "email",
        },
      },
    })

    if (!emailConfig || emailConfig.configValue !== "true") {
      return NextResponse.json({ error: "Email notifications are disabled for this user" }, { status: 400 })
    }

    // Send the email
    const result = await sendEmail(user.email, subject, body)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}

