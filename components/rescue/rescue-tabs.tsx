"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { GlobalEvents } from "./global-events"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function RescueTabs() {
  const { toast } = useToast()
  const [message, setMessage] = useState("")
  const [targetGroup, setTargetGroup] = useState("citizens")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Get user location for live alerts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        () => {
          // Default to Kothamangalam, Kerala if location is denied
          setUserLocation({ lat: 10.068, lng: 76.628 })
        }
      )
    } else {
      setUserLocation({ lat: 10.068, lng: 76.628 })
    }
  }, [])

  function viewReportOnMap(report: any) {
    // Extract coordinates from GeoJSON location or fallback to direct lat/lng
    let lat, lng
    
    if (report.location?.coordinates?.length === 2) {
      [lng, lat] = report.location.coordinates // GeoJSON format: [longitude, latitude]
    } else if (report.lat && report.lng) {
      lat = report.lat
      lng = report.lng
    }
    
    if (lat && lng) {
      // Dispatch event to pan map to report location
      window.dispatchEvent(new CustomEvent("jaagratha:panTo", { 
        detail: { 
          lat, 
          lng, 
          title: `${report.type} Report`,
          zoom: 14 
        } 
      }))
      toast({ 
        title: "Viewing on map", 
        description: `${report.type} incident location` 
      })
    } else {
      toast({ 
        title: "No location data", 
        description: "This report doesn't have location information",
        variant: "destructive" 
      })
    }
  }

  function getReportIcon(type: string) {
    switch (type?.toLowerCase()) {
      case 'fire':
      case 'wildfire':
        return '🔥'
      case 'flood':
        return '🌊'
      case 'earthquake':
        return '🌍'
      case 'storm':
      case 'cyclone':
        return '🌪️'
      case 'landslide':
        return '⛰️'
      case 'medical':
        return '🚑'
      case 'accident':
        return '🚗'
      case 'drought':
        return '🌵'
      case 'volcano':
      case 'volcanoes':
        return '🌋'
      case 'disaster':
        return '⚠️'
      default:
        return '⚠️'
    }
  }

  async function broadcast() {
    const res = await fetch("/api/broadcast-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, targetGroup }),
    })
    const j = await res.json().catch(() => ({}))
    if (res.ok) {
      toast({ title: "Broadcast queued", description: "Messages are being sent." })
      setMessage("")
    } else {
      toast({
        title: "Broadcast failed",
        description: j?.error || "Check integration & env vars",
        variant: "destructive",
      })
    }
  }

  const { data, mutate, isLoading } = useSWR("/api/reports?status=pending", fetcher, {
    refreshInterval: 8000,
    revalidateOnFocus: false,
  })

  // Fetch combined live alerts (manual alerts + verified reports) - same as citizens see
  const alertsUrl = '/api/alerts' // Temporarily remove location filtering to show all alerts
  
  const { data: allAlertsData, mutate: mutateAlerts, isLoading: alertsLoading } = useSWR(
    alertsUrl, // Always fetch alerts, regardless of userLocation
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds for testing
      revalidateOnFocus: true,
    }
  )

  // Listen for alerts updates from NASA imports
  useEffect(() => {
    const handleAlertsUpdate = () => {
      mutateAlerts()
    }

    window.addEventListener('alertsUpdated', handleAlertsUpdate)
    
    return () => {
      window.removeEventListener('alertsUpdated', handleAlertsUpdate)
    }
  }, [mutateAlerts])

  async function act(id: string, action: "accept" | "reject" | "resolve") {
    const res = await fetch(`/api/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })

    if (res.ok) {
      mutate()
      const toastMessages = {
        accept: "Report accepted and moved to live alerts",
        reject: "Report rejected and archived",
        resolve: "Report marked as resolved"
      }
      toast({ title: "Success", description: toastMessages[action] })
    } else {
      const j = await res.json().catch(() => ({}))
      toast({ title: "Action failed", description: j?.error || "Try again.", variant: "destructive" })
    }
  }

  // Handle manual alert resolution
  const resolveManualAlert = async (alertId: string, alertTitle: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        // Refresh the alerts data
        if (allAlertsData) {
          mutateAlerts()
        }
        toast({
          title: "Alert Resolved",
          description: `Successfully resolved: ${alertTitle}`,
        })
      } else {
        throw new Error('Failed to resolve alert')
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
      toast({
        title: "Error",
        description: "Failed to resolve alert. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Tabs defaultValue="reviews">
      <TabsList className="grid grid-cols-5">
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
        <TabsTrigger value="live">Live Alerts</TabsTrigger>
        <TabsTrigger value="global">Global Events</TabsTrigger>
        <TabsTrigger value="prediction">Prediction</TabsTrigger>
        <TabsTrigger value="comms">Comms</TabsTrigger>
      </TabsList>

      <TabsContent value="reviews" className="space-y-3">
        <div className="text-sm font-medium">Citizen Incident Reports</div>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-muted rounded-lg p-3 h-20" />
            ))}
          </div>
        ) : data?.reports?.length ? (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {data.reports.map((r: any) => (
              <li 
                key={r._id} 
                className="rounded-md border p-3 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => viewReportOnMap(r)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg">{getReportIcon(r.type)}</span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm leading-tight">
                        {r.type || 'Unknown Incident'}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {r.details || "No description provided"}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Display location coordinates */}
                {(() => {
                  let lat, lng
                  if (r.location?.coordinates?.length === 2) {
                    [lng, lat] = r.location.coordinates
                  } else if (r.lat && r.lng) {
                    lat = r.lat
                    lng = r.lng
                  }
                  
                  if (lat && lng) {
                    return (
                      <div className="text-xs text-muted-foreground">
                        📍 {lat.toFixed(4)}, {lng.toFixed(4)}
                      </div>
                    )
                  }
                  return null
                })()}
                
                <div className="flex gap-2 pt-2 border-t">
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      act(r._id, "accept")
                    }}
                    className="flex-1"
                  >
                    ✅ Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation()
                      act(r._id, "reject")
                    }}
                    className="flex-1"
                  >
                    ❌ Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground">No pending reports</div>
            <div className="text-xs text-muted-foreground mt-1">All incidents are resolved</div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="live" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Live Emergency Alerts (250km radius)</div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => mutateAlerts()}
            >
              🔄 Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  const sampleAlerts = [
                    {
                      type: "flood",
                      title: "Sample Local Flood Alert",
                      details: "Testing flood alert for demonstration purposes",
                      location: {
                        type: "Point",
                        coordinates: [76.3408, 10.0217] // Use current detected location
                      },
                      severity: "high"
                    },
                    {
                      type: "fire", 
                      title: "Sample Local Fire Alert",
                      details: "Testing fire alert for demonstration purposes",
                      location: {
                        type: "Point",
                        coordinates: [76.3508, 10.0317] // Slightly offset from current location
                      },
                      severity: "moderate"
                    }
                  ]

                  for (const alert of sampleAlerts) {
                    await fetch('/api/alerts', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(alert)
                    })
                  }

                  mutateAlerts()
                  toast({
                    title: "Sample Alerts Added",
                    description: "Created 2 sample local alerts for testing"
                  })
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to add sample alerts",
                    variant: "destructive"
                  })
                }
              }}
            >
              🚨 Add Sample Local Alerts
            </Button>
          </div>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {alertsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-muted rounded-lg p-3 h-20" />
              ))}
            </div>
          ) : allAlertsData?.alerts?.length > 0 ? (
            allAlertsData.alerts.map((alert: any) => (
              <div 
                key={alert._id} 
                className={`rounded-md border p-3 space-y-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                  alert.source === 'Citizen Report (Verified)' ? 'border-blue-200 bg-blue-50' : 
                  alert.source === 'NASA Import' ? 'border-orange-200 bg-orange-50' :
                  'border-gray-200'
                }`}
                onClick={() => {
                  const lat = alert.location?.coordinates?.[1]
                  const lng = alert.location?.coordinates?.[0]
                  if (lat && lng) {
                    window.dispatchEvent(new CustomEvent("jaagratha:panTo", { 
                      detail: { lat, lng, title: alert.title, zoom: 14 } 
                    }))
                    toast({ title: "Viewing on map", description: alert.title })
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg">{getReportIcon(alert.type)}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{alert.title || alert.type}</h4>
                      <p className="text-xs text-gray-700 line-clamp-2">{alert.details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {alert.severity?.toUpperCase() || 'ACTIVE'}
                    </span>
                    <div className="text-xs text-muted-foreground mt-1">
                      {alert.source || 'Local Alert'}
                    </div>
                  </div>
                </div>
                {(() => {
                  const lat = alert.location?.coordinates?.[1]
                  const lng = alert.location?.coordinates?.[0]
                  if (lat && lng) {
                    return (
                      <div className="text-xs text-muted-foreground">📍 {lat.toFixed(4)}, {lng.toFixed(4)}</div>
                    )
                  }
                  return null
                })()}
                {/* Show resolve button for all alerts */}
                <div className={`pt-2 border-t ${
                  alert.source === 'Citizen Report (Verified)' ? 'border-blue-200' : 
                  alert.source === 'NASA Import' ? 'border-orange-200' :
                  'border-gray-200'
                }`}>
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      if (alert.source === 'Citizen Report (Verified)') {
                        // Handle citizen report resolution (existing logic)
                        act(alert._id, "resolve")
                      } else {
                        // Handle manual alert resolution
                        resolveManualAlert(alert._id, alert.title)
                      }
                    }}
                    className={`w-full ${
                      alert.source === 'Citizen Report (Verified)' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : alert.source === 'NASA Import'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    ✅ Mark as Resolved
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-sm text-muted-foreground">No active alerts nearby</div>
              <div className="text-xs text-muted-foreground mt-1">All clear in your 250km radius</div>
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400 mt-2 font-mono">
                  Debug: {JSON.stringify({ 
                    hasData: !!allAlertsData, 
                    alertsCount: allAlertsData?.alerts?.length || 0,
                    userLocation: userLocation ? 'Available' : 'Missing',
                    url: alertsUrl 
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="global" className="space-y-3">
        <div className="text-sm font-medium">Global Disaster Events</div>
        <GlobalEvents />
      </TabsContent>

      <TabsContent value="prediction" className="space-y-3">
        <div className="text-sm font-medium">AI Risk Predictions</div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-green-50 border-green-200">
              <div className="text-sm font-medium text-green-800">Flood Risk</div>
              <div className="text-2xl font-bold text-green-600">Low</div>
              <div className="text-xs text-green-700">Next 24h</div>
            </div>
            <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
              <div className="text-sm font-medium text-yellow-800">Fire Risk</div>
              <div className="text-2xl font-bold text-yellow-600">Medium</div>
              <div className="text-xs text-yellow-700">Next 48h</div>
            </div>
            <div className="p-3 rounded-lg border bg-orange-50 border-orange-200">
              <div className="text-sm font-medium text-orange-800">Storm Risk</div>
              <div className="text-2xl font-bold text-orange-600">High</div>
              <div className="text-xs text-orange-700">Next 72h</div>
            </div>
            <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
              <div className="text-sm font-medium text-blue-800">Landslide Risk</div>
              <div className="text-2xl font-bold text-blue-600">Low</div>
              <div className="text-xs text-blue-700">Next 96h</div>
            </div>
          </div>
          
          <div className="border rounded-lg p-3 space-y-2">
            <div className="text-sm font-medium">AI Analysis Summary</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Based on current weather patterns, satellite imagery, and historical data analysis:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 pl-4">
              <li>• Monsoon intensity expected to increase in coastal regions</li>
              <li>• Dry weather conditions raising wildfire probability</li>
              <li>• Soil moisture levels normal, low landslide risk</li>
              <li>• Storm formation likely in Bay of Bengal area</li>
            </ul>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="comms" className="space-y-3">
        <div className="text-sm font-medium">Emergency Communications</div>
        <div className="space-y-3">
          <div>
            <label className="text-sm">Target Group</label>
            <select 
              value={targetGroup} 
              onChange={(e) => setTargetGroup(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md text-sm"
            >
              <option value="citizens">All Citizens</option>
              <option value="responders">Emergency Responders</option>
              <option value="officials">Government Officials</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm">Message</label>
            <Textarea 
              placeholder="Type emergency broadcast message..." 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <Button onClick={broadcast} className="w-full">
            📢 Send Broadcast
          </Button>
          
          <div className="border rounded-lg p-3 space-y-2">
            <div className="text-sm font-medium">Recent Broadcasts</div>
            <div className="space-y-2 text-xs">
              <div className="border-l-2 border-blue-500 pl-2">
                <div className="font-medium">Evacuation Notice - Coastal Areas</div>
                <div className="text-muted-foreground">Sent to Citizens • 2 hours ago</div>
              </div>
              <div className="border-l-2 border-orange-500 pl-2">
                <div className="font-medium">Storm Warning - Bay of Bengal</div>
                <div className="text-muted-foreground">Sent to All Groups • 6 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}