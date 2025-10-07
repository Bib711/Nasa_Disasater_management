import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongoose"
import { Alert } from "@/models/alert"
import { Report } from "@/models/report"

export async function GET(req: Request) {
  try {
    await getDb()
    console.log("Alerts API: Database connected")
    
    const url = new URL(req.url)
    const lat = parseFloat(url.searchParams.get("lat") || "0")
    const lng = parseFloat(url.searchParams.get("lng") || "0")
    const radius = parseFloat(url.searchParams.get("radius") || "250") // Default 250km radius
    
    console.log(`Alerts API: Query params - lat: ${lat}, lng: ${lng}, radius: ${radius}`)
    
    let manualAlerts, acceptedReports
    
    if (lat && lng) {
      // Find manual alerts within the specified radius
      console.log("Alerts API: Searching manual alerts within radius...")
      manualAlerts = await Alert.find({
        status: "active",
        location: {
          $geoWithin: {
            $centerSphere: [[lng, lat], radius / 6378.1] // radius in radians (radius_km / 6378.1)
          }
        }
      }).sort({ createdAt: -1 }).limit(25).lean()
      
      // Find accepted incident reports within the specified radius
      console.log("Alerts API: Searching accepted reports within radius...")
      acceptedReports = await Report.find({
        status: "accepted",
        location: {
          $geoWithin: {
            $centerSphere: [[lng, lat], radius / 6378.1]
          }
        }
      }).sort({ createdAt: -1 }).limit(25).lean()
    } else {
      // Fallback: get all active alerts and accepted reports
      console.log("Alerts API: Getting all active alerts and accepted reports (no location provided)")
      manualAlerts = await Alert.find({ status: "active" }).sort({ createdAt: -1 }).limit(25).lean()
      acceptedReports = await Report.find({ status: "accepted" }).sort({ createdAt: -1 }).limit(25).lean()
    }
    
    // Transform accepted reports to match alert format
    const transformedReports = acceptedReports.map(report => ({
      _id: report._id,
      type: report.type || 'incident',
      title: `${report.type || 'Incident'} Report - VERIFIED`,
      details: report.details || 'Citizen reported incident verified by rescue team',
      location: report.location,
      severity: mapPriorityToSeverity(report.priority),
      status: 'active',
      source: 'Citizen Report (Verified)',
      createdAt: report.createdAt,
      updatedAt: report.updatedAt
    }))
    
    // Add source field to manual alerts  
    const alertsWithSource = manualAlerts.map(alert => ({
      ...alert,
      source: alert.source || (alert.title?.includes('NASA EONET') ? 'NASA Import' : 'Manual Alert')
    }))
    
    // Combine and sort all alerts by creation time
    const allAlerts = [...alertsWithSource, ...transformedReports]
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50) // Limit total results
    
    console.log(`Alerts API: Found ${manualAlerts.length} manual alerts + ${transformedReports.length} verified reports = ${allAlerts.length} total`)
    
    return NextResponse.json({ alerts: allAlerts })
  } catch (error) {
    console.error("Alerts API Error:", error)
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 })
  }
}

// Helper function to map report priority to alert severity
function mapPriorityToSeverity(priority: string): string {
  switch (priority) {
    case 'critical':
    case 'high':
      return 'high'
    case 'medium':
      return 'moderate'
    case 'low':
    default:
      return 'low'
  }
}

export async function POST(req: Request) {
  await getDb()
  
  const body = await req.json().catch(() => ({}))
  const { type, title, details, location, severity, source } = body || {}
  
  if (!type || !title || !location?.coordinates?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  
  const alert = await Alert.create({
    type,
    title,
    details,
    location, // { type: "Point", coordinates: [lng, lat] }
    severity: severity || "moderate",
    status: "active",
    source: source || "Manual Alert"
  })
  
  return NextResponse.json({ alert: { _id: alert._id } }, { status: 201 })
}
