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
      severity: "high"
    },
    {
      type: "landslide",
      title: "Landslide Warning - Munnar Hills",
      details: "Unstable soil conditions detected on hillside near tea plantations. Local authorities monitoring the situation.",
      location: { type: "Point", coordinates: [77.0873, 10.0889] }, // Munnar (about 50km from Kothamangalam)
      severity: "moderate"
    },
    {
      type: "storm",
      title: "Severe Weather Alert - Kochi",
      details: "Thunderstorm with heavy winds approaching coastal areas. Fishermen advised not to venture into sea.",
      location: { type: "Point", coordinates: [76.2673, 9.9312] }, // Kochi (about 40km from Kothamangalam)
      severity: "moderate"
    },
    {
      type: "fire",
      title: "Forest Fire - Idukki District",
      details: "Wildfire reported in forest area. Fire department and forest officials are on site. No immediate threat to populated areas.",
      location: { type: "Point", coordinates: [76.9366, 9.8560] }, // Idukki (about 60km from Kothamangalam)
      severity: "moderate"
    },
    
    // Delhi area alerts
    {
      type: "air_quality",
      title: "Air Quality Alert - Delhi NCR",
      details: "Air quality index reaching hazardous levels. Residents advised to stay indoors and use air purifiers.",
      location: { type: "Point", coordinates: [77.2090, 28.6139] }, // Delhi
      severity: "high"
    },
    {
      type: "traffic",
      title: "Traffic Disruption - Ring Road",
      details: "Major traffic jam due to waterlogging on Ring Road. Alternative routes recommended.",
      location: { type: "Point", coordinates: [77.2167, 28.6358] }, // North Delhi
      severity: "low"
    },
    {
      type: "medical",
      title: "Hospital Overflow Alert - AIIMS",
      details: "Emergency department at capacity. Non-urgent cases directed to nearby hospitals.",
      location: { type: "Point", coordinates: [77.2084, 28.5672] }, // AIIMS Delhi
      severity: "moderate"
    },
    
    // Mumbai area alerts
    {
      type: "flood",
      title: "Urban Flooding - Andheri",
      details: "Heavy monsoon rains causing waterlogging in Andheri area. Local train services affected.",
      location: { type: "Point", coordinates: [72.8777, 19.1136] }, // Andheri, Mumbai
      severity: "high"
    },
    {
      type: "cyclone",
      title: "Cyclone Warning - Arabian Sea",
      details: "Tropical cyclone forming in Arabian Sea. Coastal areas of Mumbai on high alert.",
      location: { type: "Point", coordinates: [72.8777, 19.0760] }, // Mumbai
      severity: "high"
    },
    
    // Bangalore area alerts
    {
      type: "drought",
      title: "Water Shortage Alert - Bangalore",
      details: "Severe water shortage in several areas. Water tankers being deployed for emergency supply.",
      location: { type: "Point", coordinates: [77.5946, 12.9716] }, // Bangalore
      severity: "moderate"
    },
    {
      type: "earthquake",
      title: "Seismic Activity Detected",
      details: "Minor earthquake tremors detected. No damage reported but monitoring continues.",
      location: { type: "Point", coordinates: [77.6031, 12.9698] }, // East Bangalore
      severity: "low"
    },
    
    // Chennai area alerts
    {
      type: "heatwave",
      title: "Extreme Heat Warning - Chennai",
      details: "Temperature reaching dangerous levels. Heat stroke warnings issued for outdoor workers.",
      location: { type: "Point", coordinates: [80.2707, 13.0827] }, // Chennai
      severity: "high"
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