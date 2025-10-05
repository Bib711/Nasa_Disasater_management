import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongoose"
import { Report } from "@/models/report"

export async function POST() {
  await getDb()
  
  // Sample incident reports from citizens
  const sampleReports = [
    {
      type: "🌊 Flash Flood",
      details: "Water level rising rapidly near my house in Periyar riverbank area. Multiple families need immediate evacuation assistance. Water has reached first floor level.",
      location: { 
        type: "Point", 
        coordinates: [76.6280, 10.0680] // Kothamangalam, Kerala
      },
      status: "pending",
      priority: "critical",
      createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      submittedBy: "citizen_001"
    },
    {
      type: "🔥 House Fire",
      details: "Electrical fire started in apartment building on 3rd floor. Fire is spreading quickly. Residents on upper floors are trapped and need immediate rescue support.",
      location: { 
        type: "Point", 
        coordinates: [77.2090, 28.6139] // Delhi
      },
      status: "pending",
      priority: "critical",
      createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
      submittedBy: "citizen_002"
    },
    {
      type: "⛰️ Road Blocked",
      details: "Large landslide has completely blocked the main highway near Munnar. About 20 vehicles are stranded including a bus with 40 passengers. Need immediate clearance.",
      location: { 
        type: "Point", 
        coordinates: [77.0873, 10.0889] // Munnar, Kerala
      },
      status: "pending", 
      priority: "high",
      createdAt: new Date(Date.now() - 90 * 60 * 1000), // 1.5 hours ago
      submittedBy: "citizen_003"
    },
    {
      type: "🌪️ Storm Damage",
      details: "Severe thunderstorm brought down multiple trees on the main road. Power lines are down and there's risk of electrocution. Traffic is completely blocked.",
      location: { 
        type: "Point", 
        coordinates: [72.8777, 19.0760] // Mumbai
      },
      status: "pending",
      priority: "high",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      submittedBy: "citizen_004"
    },
    {
      type: "🏥 Medical Emergency",
      details: "Local hospital is overwhelmed with patients from recent flooding. Need additional medical teams and ambulances for patient transport to other facilities.",
      location: { 
        type: "Point", 
        coordinates: [80.2707, 13.0827] // Chennai
      },
      status: "pending",
      priority: "high",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      submittedBy: "citizen_005"
    },
    {
      type: "💧 Water Contamination",
      details: "Local water supply has been contaminated after flooding. Many people getting sick. Need immediate alternative water supply and medical attention.",
      location: { 
        type: "Point", 
        coordinates: [77.5946, 12.9716] // Bangalore
      },
      status: "pending",
      priority: "medium",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      submittedBy: "citizen_006"
    },
    {
      type: "🚧 Infrastructure Damage",
      details: "Main bridge connecting our village has structural damage after heavy rains. Visible cracks and unsafe for vehicles. Need inspection and alternate route.",
      location: { 
        type: "Point", 
        coordinates: [76.2673, 9.9312] // Kochi, Kerala
      },
      status: "pending",
      priority: "medium",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      submittedBy: "citizen_007"
    },
    {
      type: "⚡ Power Outage",
      details: "Complete power failure in our area after storm. Transformer blown. Elderly residents need assistance and backup power for medical equipment.",
      location: { 
        type: "Point", 
        coordinates: [78.4867, 17.3850] // Hyderabad
      },
      status: "pending",
      priority: "medium",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      submittedBy: "citizen_008"
    }
  ]
  
  try {
    // Clear existing reports first
    await Report.deleteMany({})
    
    // Insert new sample reports
    const results = await Report.insertMany(sampleReports)
    
    return NextResponse.json({ 
      message: "Sample reports created successfully", 
      count: results.length,
      reports: results.map(report => ({
        id: report._id,
        type: report.type,
        details: report.details.substring(0, 100) + "...",
        location: report.location.coordinates
      }))
    })
  } catch (error) {
    console.error("Error creating sample reports:", error)
    return NextResponse.json({ error: "Failed to create sample reports" }, { status: 500 })
  }
}