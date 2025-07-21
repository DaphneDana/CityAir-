const { PrismaClient } = require("@prisma/client")
const { createHash } = require("crypto")

const prisma = new PrismaClient()

function simpleHash(password: string) {
  return createHash("sha256").update(password).digest("hex")
}

async function main() {
  // Create a test user
  const passwordHash = simpleHash("password123")

  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      username: "admin",
      email: "admin@example.com",
      passwordHash,
      role: "Admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  console.log({ user })

  // Create some test sensor data
  const locations = ["Zone A", "Zone B", "Zone C", "Zone D"]
  const channelIds = ["channel_1", "channel_2", "channel_3", "channel_4"]

  // Generate random sensor data for the past 24 hours
  const now = new Date()
  const sensorData = []

  for (let i = 0; i < 100; i++) {
    const timestamp = new Date(now.getTime() - i * 15 * 60 * 1000) // 15-minute intervals
    const locationIndex = i % locations.length
    const channelId = channelIds[locationIndex]

    // Generate random values with some variation
    const baseTemp = 22 + Math.sin(i / 10) * 3
    const baseHumidity = 45 + Math.sin(i / 8) * 10
    const baseCO = 3 + Math.sin(i / 12) * 2
    const basePM25 = 10 + Math.sin(i / 9) * 5
    const basePM10 = 20 + Math.sin(i / 7) * 10
    const baseVOC = 120 + Math.sin(i / 11) * 50
    const baseMethane = 800 + Math.sin(i / 13) * 300

    // Add some random noise
    const randomFactor = () => (Math.random() - 0.5) * 2

    sensorData.push({
      channelId,
      location: locations[locationIndex],
      timestamp,
      temperature: baseTemp + randomFactor(),
      humidity: baseHumidity + randomFactor() * 5,
      co: baseCO + randomFactor(),
      pm2_5: basePM25 + randomFactor() * 2,
      pm10: basePM10 + randomFactor() * 4,
      voc: baseVOC + randomFactor() * 20,
      methane: baseMethane + randomFactor() * 100,
    })
  }

  // Insert sensor data in batches
  await prisma.sensorData.createMany({
    data: sensorData,
    skipDuplicates: true,
  })

  console.log(`Created ${sensorData.length} sensor readings`)

  // Create some test alerts
  const alertTypes = [
    "ThresholdBreach_CO",
    "ThresholdBreach_PM2.5",
    "ThresholdBreach_PM10",
    "ThresholdBreach_VOC",
    "ThresholdBreach_Methane",
  ]

  const severities = ["Low", "Medium", "High"]
  const alerts = []

  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000) // 1-hour intervals
    const locationIndex = i % locations.length
    const channelId = channelIds[locationIndex]
    const alertType = alertTypes[i % alertTypes.length]
    const severity = severities[i % severities.length]

    // Some alerts are acknowledged, some are not
    const acknowledged = i % 3 === 0

    alerts.push({
      channelId,
      alertType,
      severity,
      message: `${alertType} detected in ${locations[locationIndex]}. Value exceeded threshold.`,
      timestamp,
      acknowledged,
      acknowledgedBy: acknowledged ? user.id : null,
      acknowledgedTimestamp: acknowledged ? new Date(timestamp.getTime() + 15 * 60 * 1000) : null, // 15 minutes later
    })
  }

  // Insert alerts
  await prisma.alert.createMany({
    data: alerts,
    skipDuplicates: true,
  })

  console.log(`Created ${alerts.length} alerts`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

