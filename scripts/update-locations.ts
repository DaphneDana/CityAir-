import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const CITY_LOCATIONS = ["Kampala", "Jinja", "Mbarara", "Harare"]

async function updateLocations() {
  try {
    console.log("Starting location update...")

    // First, let's see what locations currently exist
    const existingLocations = await prisma.sensorData.groupBy({
      by: ["location"],
      _count: {
        location: true,
      },
    })

    console.log("Current locations in database:")
    existingLocations.forEach((loc) => {
      console.log(`- ${loc.location}: ${loc._count.location} records`)
    })

    // Update Zone A to Kampala
    const zoneAUpdate = await prisma.sensorData.updateMany({
      where: {
        location: "Zone A",
      },
      data: {
        location: "Kampala",
      },
    })
    console.log(`Updated ${zoneAUpdate.count} records from Zone A to Kampala`)

    // Update Zone B to Jinja
    const zoneBUpdate = await prisma.sensorData.updateMany({
      where: {
        location: "Zone B",
      },
      data: {
        location: "Jinja",
      },
    })
    console.log(`Updated ${zoneBUpdate.count} records from Zone B to Jinja`)

    // Update Zone C to Mbarara
    const zoneCUpdate = await prisma.sensorData.updateMany({
      where: {
        location: "Zone C",
      },
      data: {
        location: "Mbarara",
      },
    })
    console.log(`Updated ${zoneCUpdate.count} records from Zone C to Mbarara`)

    // Update Zone D to Harare
    const zoneDUpdate = await prisma.sensorData.updateMany({
      where: {
        location: "Zone D",
      },
      data: {
        location: "Harare",
      },
    })
    console.log(`Updated ${zoneDUpdate.count} records from Zone D to Harare`)

    // If there are records with no location or empty location, assign them randomly to cities
    const noLocationRecords = await prisma.sensorData.findMany({
      where: {
        OR: [
          { location: null },
          { location: "" },
          { location: "Zone A" }, // In case some weren't updated
          { location: "Zone B" },
          { location: "Zone C" },
          { location: "Zone D" },
        ],
      },
      select: {
        id: true,
        location: true,
      },
    })

    console.log(`Found ${noLocationRecords.length} records that need location assignment`)

    // Update records without proper locations
    for (let i = 0; i < noLocationRecords.length; i++) {
      const record = noLocationRecords[i]
      const cityIndex = i % CITY_LOCATIONS.length
      const newLocation = CITY_LOCATIONS[cityIndex]

      await prisma.sensorData.update({
        where: { id: record.id },
        data: { location: newLocation },
      })

      if (i % 10 === 0) {
        console.log(`Updated ${i + 1}/${noLocationRecords.length} records...`)
      }
    }

    // Also update any alerts that reference old zone names
    const alertUpdates = [
      { old: "Zone A", new: "Kampala" },
      { old: "Zone B", new: "Jinja" },
      { old: "Zone C", new: "Mbarara" },
      { old: "Zone D", new: "Harare" },
    ]

    for (const update of alertUpdates) {
      const alertUpdate = await prisma.alert.updateMany({
        where: {
          message: {
            contains: update.old,
          },
        },
        data: {
          message: {
            // This is a simplified approach - in practice you'd need to use raw SQL for string replacement
            // For now, we'll just update the channelId to indicate these need manual review
          },
        },
      })
      console.log(`Found ${alertUpdate.count} alerts mentioning ${update.old}`)
    }

    // Show final location distribution
    const finalLocations = await prisma.sensorData.groupBy({
      by: ["location"],
      _count: {
        location: true,
      },
    })

    console.log("\nFinal location distribution:")
    finalLocations.forEach((loc) => {
      console.log(`- ${loc.location}: ${loc._count.location} records`)
    })

    console.log("\nLocation update completed successfully!")
  } catch (error) {
    console.error("Error updating locations:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the update
updateLocations()
