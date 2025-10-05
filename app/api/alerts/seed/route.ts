import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongoose"
import { Alert } from "@/models/alert"

export async function POST() {
  await getDb()
  
  // Sample local alerts around different Indian cities
  const sampleAlerts = [
    // Kerala (Kothamangalam area - default location)
    {
      type: "flood",
      title: "Flash Flood Alert - Periyar River",
      details: "Heavy rainfall causing water levels to rise rapidly in Periyar river. Residents in low-lying areas advised to move to higher ground.",
      location: { type: "Point", coordinates: [76.6280, 10.0680] }, // Kothamangalam
      severity: "high",
      status: "active",
      createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    },
    {
      type: "landslide",
      title: "Landslide Warning - Munnar Hills", 
      details: "Unstable soil conditions detected on hillside near tea plantations. Local authorities monitoring the situation.",
      location: { type: "Point", coordinates: [77.0873, 10.0889] }, // Munnar
      severity: "moderate",
      status: "active",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      type: "storm",
      title: "Cyclone Warning - Bay of Bengal",
      details: "Tropical cyclone forming in Bay of Bengal. Coastal areas of Tamil Nadu and Andhra Pradesh on high alert.",
      location: { type: "Point", coordinates: [80.2707, 13.0827] }, // Chennai coast
      severity: "critical",
      status: "active",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    },
    {
      type: "fire",
      title: "Wildfire Emergency - Western Ghats",
      details: "Large forest fire spreading rapidly due to dry conditions. Multiple fire teams deployed. Nearby villages evacuated.",
      location: { type: "Point", coordinates: [76.9366, 9.8560] }, // Idukki
      severity: "critical",
      status: "active",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    },
    {
      type: "earthquake",
      title: "Earthquake Alert - Himachal Pradesh",
      details: "Magnitude 4.2 earthquake detected near Shimla. No major damage reported, monitoring aftershocks.",
      location: { type: "Point", coordinates: [77.1734, 31.1048] }, // Shimla
      severity: "moderate",
      status: "active",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
    },
    
    // Delhi area alerts
    {
      type: "air_quality",
      title: "Severe Air Pollution - Delhi NCR",
      details: "Air quality index reaching hazardous levels (AQI 450+). Residents advised to stay indoors and use air purifiers.",
      location: { type: "Point", coordinates: [77.2090, 28.6139] }, // Delhi
      severity: "high",
      status: "active",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
    },
    {
      type: "traffic",
      title: "Major Traffic Disruption - Ring Road",
      details: "Multi-vehicle accident on Outer Ring Road causing severe traffic jams. Emergency services on site.",
      location: { type: "Point", coordinates: [77.2167, 28.6333] }, // Delhi Ring Road
      severity: "moderate",
      status: "active",
      createdAt: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
    },
    {
      type: "flood",
      title: "Urban Flooding - South Delhi",
      details: "Heavy rainfall causing waterlogging in multiple areas. Several roads temporarily closed to traffic.",
      location: { type: "Point", coordinates: [77.2411, 28.5244] }, // South Delhi
      severity: "moderate",
      status: "active",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
    },
    
    // Mumbai area alerts
    {
      type: "flood",
      title: "Urban Flooding - Mumbai Central",
      details: "Heavy monsoon rains causing severe waterlogging in Mumbai Central area. Local train services disrupted.",
      location: { type: "Point", coordinates: [72.8777, 19.1136] }, // Mumbai
      severity: "high",
      status: "active",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
    },
    {
      type: "cyclone",
      title: "Cyclone Warning - Arabian Sea",
      details: "Tropical cyclone forming in Arabian Sea. Coastal areas of Mumbai on high alert. Fishermen advised to return.",
      location: { type: "Point", coordinates: [72.8777, 19.0760] }, // Mumbai coast
      severity: "critical",
      status: "active",
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
    },
    
    // Bangalore area alerts
    {
      type: "drought",
      title: "Water Crisis - Bangalore",
      details: "Severe water shortage affecting multiple districts. Emergency water tankers deployed to affected areas.",
      location: { type: "Point", coordinates: [77.5946, 12.9716] }, // Bangalore
      severity: "high",
      status: "active",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      type: "earthquake",
      title: "Seismic Activity - Karnataka",
      details: "Minor earthquake tremors (magnitude 3.1) detected. No damage reported but monitoring continues.",
      location: { type: "Point", coordinates: [77.6031, 12.9698] }, // East Bangalore
      severity: "low",
      status: "active",
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000) // 18 hours ago
    },
    
    // Chennai area alerts
    {
      type: "heatwave",
      title: "Extreme Heat Warning - Chennai",
      details: "Temperature reaching 45°C. Heat stroke warnings issued. Residents advised to stay hydrated and indoors during peak hours.",
      location: { type: "Point", coordinates: [80.2707, 13.0827] }, // Chennai
      severity: "high",
      status: "active",
      createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000) // 7 hours ago
    },
    {
      type: "flood",
      title: "Coastal Flooding Risk - Chennai",
      details: "High tide and storm surge creating flooding risk along Chennai coastline. Coastal areas evacuated.",
      location: { type: "Point", coordinates: [80.2785, 13.0878] }, // Chennai coast
      severity: "moderate",
      status: "active",
      createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000) // 10 hours ago
    }
  ]
  
  try {
    // Clear existing alerts first
    await Alert.deleteMany({})
    
    // Insert new sample alerts
    const results = await Alert.insertMany(sampleAlerts)
    
    return NextResponse.json({ 
      message: "Sample alerts created successfully", 
      count: results.length,
      alerts: results.map(alert => ({
        id: alert._id,
        title: alert.title,
        type: alert.type,
        location: alert.location.coordinates
      }))
    })
  } catch (error) {
    console.error("Error creating sample alerts:", error)
    return NextResponse.json({ error: "Failed to create sample alerts" }, { status: 500 })
  }
}