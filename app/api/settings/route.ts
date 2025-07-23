import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Get settings for the current user
export async function GET(request: Request) {
  try {
    const userId = cookies().get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all configurations for the user
    const configurations = await prisma.configuration.findMany({
      where: {
        userId: Number.parseInt(userId),
      },
    })

    // Transform into a more usable format
    const settings: Record<string, Record<string, string>> = {}

    configurations.forEach((config) => {
      if (!settings[config.configType]) {
        settings[config.configType] = {}
      }
      settings[config.configType][config.configKey] = config.configValue
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

// Update settings for the current user
export async function POST(request: Request) {
  try {
    const userId = cookies().get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { settings } = await request.json()

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid settings data" }, { status: 400 })
    }

    const userIdNum = Number.parseInt(userId)
    const now = new Date()

    // Process each setting type and key
    for (const [configType, configValues] of Object.entries(settings)) {
      if (typeof configValues !== "object") continue

      for (const [configKey, configValue] of Object.entries(configValues as Record<string, string>)) {
        // Upsert the configuration (create if doesn't exist, update if it does)
        await prisma.configuration.upsert({
          where: {
            userId_configType_configKey: {
              userId: userIdNum,
              configType,
              configKey,
            },
          },
          update: {
            configValue: String(configValue),
            updatedAt: now,
          },
          create: {
            userId: userIdNum,
            configType,
            configKey,
            configValue: String(configValue),
            createdAt: now,
            updatedAt: now,
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

