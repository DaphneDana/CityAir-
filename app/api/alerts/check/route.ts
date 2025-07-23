import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// This endpoint would be called by a cron job or scheduled task
// to check for new alerts based on the latest sensor data and user thresholds
export async function POST() {
  try {
    // Get the latest sensor data
    const latestData = await prisma.sensorData.findFirst({
      orderBy: {
        timestamp: "desc",
      },
    })

    if (!latestData) {
      return NextResponse.json({ message: "No sensor data found" })
    }

    // Get all users with their threshold configurations
    const users = await prisma.user.findMany({
      include: {
        configurations: {
          where: {
            configType: "thresholds",
          },
        },
      },
    })

    const alerts = []

    // Check each user's thresholds against the latest data
    for (const user of users) {
      // Convert configurations to a more usable format
      const thresholds = {}
      user.configurations.forEach((config) => {
        thresholds[config.configKey] = Number.parseFloat(config.configValue)
      })

      // Check each pollutant against its threshold
      const pollutants = [
        { key: "co", name: "Carbon Monoxide", value: latestData.co },
        { key: "voc", name: "VOCs", value: latestData.voc },
        { key: "pm2_5", name: "PM2.5", value: latestData.pm2_5 },
        { key: "pm10", name: "PM10", value: latestData.pm10 },
        { key: "methane", name: "Methane", value: latestData.methane },
      ]

      for (const pollutant of pollutants) {
        // Skip if no threshold set or no value to check
        if (!thresholds[pollutant.key] || pollutant.value === null) continue

        // Check if value exceeds threshold
        if (pollutant.value > thresholds[pollutant.key]) {
          // Create an alert
          const alert = await prisma.alert.create({
            data: {
              channelId: latestData.channelId,
              alertType: `ThresholdBreach_${pollutant.key.toUpperCase()}`,
              severity: getSeverity(pollutant.value, thresholds[pollutant.key]),
              message: `${pollutant.name} level (${pollutant.value}) has exceeded your threshold (${thresholds[pollutant.key]}) in ${latestData.location}.`,
              timestamp: new Date(),
              acknowledged: false,
            },
          })

          alerts.push(alert)

          // Check if user has notifications enabled
          const emailEnabled = await prisma.configuration.findUnique({
            where: {
              userId_configType_configKey: {
                userId: user.id,
                configType: "notifications",
                configKey: "email",
              },
            },
          })

          const appEnabled = await prisma.configuration.findUnique({
            where: {
              userId_configType_configKey: {
                userId: user.id,
                configType: "notifications",
                configKey: "app",
              },
            },
          })

          // Send email notification if enabled
          if (emailEnabled && emailEnabled.configValue === "true") {
            // In a real implementation, you would call an email service here
            console.log(`Sending email alert to ${user.email} about ${pollutant.name} threshold breach`)
          }

          // For in-app notifications, we're just creating the alert in the database
          // The frontend will fetch these alerts
        }
      }
    }

    return NextResponse.json({
      message: `Alert check completed. ${alerts.length} new alerts created.`,
      alerts,
    })
  } catch (error) {
    console.error("Error checking alerts:", error)
    return NextResponse.json({ error: "Failed to check alerts" }, { status: 500 })
  }
}

// Helper function to determine alert severity based on how much the value exceeds the threshold
function getSeverity(value: number, threshold: number): string {
  const ratio = value / threshold

  if (ratio >= 2) return "High"
  if (ratio >= 1.5) return "Medium"
  return "Low"
}

