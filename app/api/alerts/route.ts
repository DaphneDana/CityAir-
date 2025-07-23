import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number.parseInt(searchParams.get("limit") || "20")
  const severity = searchParams.get("severity")
  const acknowledged = searchParams.get("acknowledged")

  try {
    const alerts = await prisma.alert.findMany({
      where: {
        ...(severity && { severity }),
        ...(acknowledged !== null && { acknowledged: acknowledged === "true" }),
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
      include: {
        user: true,
      },
    })

    return NextResponse.json(alerts)
  } catch (error) {
    console.error("Error fetching alerts:", error)
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { alertId, userId } = body

    if (!alertId || !userId) {
      return NextResponse.json({ error: "Alert ID and User ID are required" }, { status: 400 })
    }

    const updatedAlert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        acknowledged: true,
        acknowledgedBy: userId,
        acknowledgedTimestamp: new Date(),
      },
    })

    return NextResponse.json(updatedAlert)
  } catch (error) {
    console.error("Error acknowledging alert:", error)
    return NextResponse.json({ error: "Failed to acknowledge alert" }, { status: 500 })
  }
}

