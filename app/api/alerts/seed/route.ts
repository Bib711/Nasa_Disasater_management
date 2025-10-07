import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongoose"
import { Alert } from "@/models/alert"

export async function POST() {
  try {
    await getDb()
    console.log("Database connected successfully")
    
    // Simple sample alerts - only valid severity values: high, moderate, low
    const sampleAlerts = [
      {
        type: "flood",
        title: "Flash Flood Alert - Periyar River",
        details: "Heavy rainfall causing water levels to rise rapidly in Periyar river.",
        location: { type: "Point", coordinates: [76.6280, 10.0680] }, // Kothamangalam
        severity: "high",
        status: "active"
      },
      {
        type: "landslide", 
        title: "Landslide Warning - Munnar Hills",
        details: "Unstable soil conditions detected on hillside near tea plantations.",
        location: { type: "Point", coordinates: [77.0873, 10.0889] }, // Munnar
        severity: "moderate",
        status: "active"
      },
      {
        type: "storm",
        title: "Cyclone Warning - Bay of Bengal", 
        details: "Tropical cyclone forming in Bay of Bengal. Coastal areas on high alert.",
        location: { type: "Point", coordinates: [80.2707, 13.0827] }, // Chennai
        severity: "high",
        status: "active"
      },
      {
        type: "fire",
        title: "Wildfire Emergency - Western Ghats",
        details: "Large forest fire spreading rapidly due to dry conditions.",
        location: { type: "Point", coordinates: [76.9366, 9.8560] }, // Idukki
        severity: "high", 
        status: "active"
      },
      {
        type: "earthquake",
        title: "Earthquake Alert - Himachal Pradesh",
        details: "Magnitude 4.2 earthquake detected near Shimla.",
        location: { type: "Point", coordinates: [77.1734, 31.1048] }, // Shimla
        severity: "moderate",
        status: "active"
      },
      {
        type: "flood",
        title: "Urban Flooding - Delhi NCR",
        details: "Heavy rainfall causing waterlogging in multiple areas.",
        location: { type: "Point", coordinates: [77.2090, 28.6139] }, // Delhi
        severity: "moderate",
        status: "active"
      },
      {
        type: "heatwave",
        title: "Extreme Heat Warning - Rajasthan",
        details: "Temperature reaching 45°C. Heat stroke warnings issued.",
        location: { type: "Point", coordinates: [75.7873, 26.9124] }, // Jaipur
        severity: "high",
        status: "active"
      },
      {
        type: "drought",
        title: "Water Crisis - Maharashtra",
        details: "Severe water shortage affecting multiple districts.",
        location: { type: "Point", coordinates: [75.3433, 19.8762] }, // Aurangabad
        severity: "moderate",
        status: "active"
      }
    ]
    
    console.log(`Attempting to create ${sampleAlerts.length} alerts...`)
    
    // Clear existing alerts first
    const deleteResult = await Alert.deleteMany({})
    console.log(`Deleted ${deleteResult.deletedCount} existing alerts`)
    
    // Insert new sample alerts
    const results = await Alert.insertMany(sampleAlerts)
    console.log(`Successfully created ${results.length} alerts`)
    
    return NextResponse.json({ 
      message: "Sample alerts created successfully", 
      count: results.length,
      alerts: results.map(alert => ({
        id: alert._id,
        title: alert.title,
        type: alert.type,
        severity: alert.severity,
        coordinates: alert.location.coordinates
      }))
    })
  } catch (error) {
    console.error("Detailed error creating sample alerts:", error)
    return NextResponse.json({ 
      error: "Failed to create sample alerts", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}