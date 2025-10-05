"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { GlobalEvents } from "./global-events"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function RescueTabs() {
  const { toast } = useToast()
  const [message, setMessage] = useState("")
  const [targetGroup, setTargetGroup] = useState("citizens")

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

  // Fetch accepted incidents for live alerts
  const { data: acceptedData, mutate: mutateAccepted } = useSWR("/api/reports?status=accepted", fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: false,
  })

  async function act(id: string, action: "accept" | "reject" | "resolve") {
    const res = await fetch(`/api/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      const actionMessages = {
        accept: "Report accepted and moved to live alerts",
        reject: "Report rejected",
        resolve: "Incident resolved successfully"
      }
      toast({ title: actionMessages[action] })
      mutate() // Refresh pending reports
      mutateAccepted() // Refresh accepted reports
    } else {
      const j = await res.json().catch(() => ({}))
      toast({ title: "Action failed", description: j?.error || "Try again.", variant: "destructive" })
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
        ) : data?.reports === undefined ? (
          // Show sample data when no API data is available
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {[
              {
                _id: "sample1",
                type: "🌊 Flood Emergency",
                details: "Water level rising rapidly in residential area. Multiple families requesting immediate evacuation assistance.",
                location: { coordinates: [77.2090, 28.6139] },
                status: "pending",
                priority: "high"
              },
              {
                _id: "sample2", 
                type: "🔥 House Fire",
                details: "Structure fire reported on 3rd floor apartment. Fire brigade notified, rescue support needed for trapped residents.",
                location: { coordinates: [72.8777, 19.0760] },
                status: "pending",
                priority: "critical"
              },
              {
                _id: "sample3",
                type: "⛰️ Landslide Block",
                details: "Road completely blocked by landslide debris. 15+ vehicles stranded, requesting immediate clearance and rescue.",
                location: { coordinates: [76.2711, 10.8505] },
                status: "pending", 
                priority: "medium"
              },
              {
                _id: "sample4",
                type: "🌪️ Storm Damage",
                details: "Severe thunderstorm caused tree fall on main highway. Power lines down, traffic disrupted.",
                location: { coordinates: [78.4867, 17.3850] },
                status: "pending",
                priority: "medium"
              }
            ].map((r: any) => (
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
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    r.priority === 'critical' ? 'bg-red-100 text-red-800' :
                    r.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {r.priority?.toUpperCase()}
                  </span>
                </div>
                
                {(() => {
                  let lat, lng
                  if (r.location?.coordinates?.length === 2) {
                    [lng, lat] = r.location.coordinates
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
            <div className="text-4xl mb-2">✅</div>
            <div className="text-sm text-muted-foreground">No pending reports</div>
            <div className="text-xs text-muted-foreground mt-1">All incidents are resolved</div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="live" className="space-y-3">
        <div className="text-sm font-medium">Live Emergency Alerts</div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {/* Dynamic accepted incidents */}
          {acceptedData?.reports?.length > 0 && (
            <>
              <div className="text-xs font-medium text-blue-600 mb-2">🚨 Active Incidents (Accepted Reports)</div>
              {acceptedData.reports.map((incident: any) => (
                <div key={incident._id} className="rounded-md border-2 border-blue-200 bg-blue-50 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">{getReportIcon(incident.type)}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{incident.type}</h4>
                        <p className="text-xs text-gray-700">{incident.details}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        ACTIVE
                      </span>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(incident.createdAt || Date.now()).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  {(() => {
                    let lat, lng
                    if (incident.location?.coordinates?.length === 2) {
                      [lng, lat] = incident.location.coordinates
                    }
                    if (lat && lng) {
                      return (
                        <div className="text-xs text-muted-foreground">📍 {lat.toFixed(4)}, {lng.toFixed(4)}</div>
                      )
                    }
                    return null
                  })()}
                  <div className="pt-2 border-t border-blue-200">
                    <Button 
                      size="sm" 
                      onClick={() => act(incident._id, "resolve")}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      ✅ Mark as Resolved
                    </Button>
                  </div>
                </div>
              ))}
              <div className="border-t pt-2 mb-2"></div>
            </>
          )}
          
          {/* Static sample emergency alerts */}
          <div className="text-xs font-medium text-orange-600 mb-2">⚠️ System Alerts</div>
          {[
            {
              id: 1,
              type: "🔥 Wildfire",
              location: "Northern Hills, Uttarakhand",
              severity: "High",
              time: "2 min ago",
              description: "Rapidly spreading forest fire detected. Evacuation recommended for nearby villages.",
              coordinates: "30.0668°N, 79.0193°E"
            },
            {
              id: 2,
              type: "🌊 Flood Warning",
              location: "Brahmaputra Basin, Assam",
              severity: "Critical", 
              time: "15 min ago",
              description: "River water levels rising above danger mark. Immediate evacuation advised.",
              coordinates: "26.2006°N, 92.9376°E"
            },
            {
              id: 3,
              type: "🌪️ Cyclone Alert",
              location: "Bay of Bengal Coast",
              severity: "Medium",
              time: "1 hour ago",
              description: "Cyclonic storm approaching eastern coast. Fishermen advised not to venture into sea.",
              coordinates: "19.0760°N, 72.8777°E"
            },
            {
              id: 4,
              type: "⛰️ Landslide Risk",
              location: "Western Ghats, Kerala",
              severity: "High",
              time: "3 hours ago", 
              description: "Heavy rainfall causing soil instability. Monitoring ongoing in vulnerable areas.",
              coordinates: "10.8505°N, 76.2711°E"
            }
          ].map((alert) => (
            <div key={alert.id} className="rounded-md border p-3 space-y-2 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{alert.type.split(' ')[0]}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{alert.type}</h4>
                    <p className="text-xs text-muted-foreground">{alert.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    alert.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.severity}
                  </span>
                  <div className="text-xs text-muted-foreground mt-1">{alert.time}</div>
                </div>
              </div>
              <p className="text-xs text-gray-600">{alert.description}</p>
              <div className="text-xs text-muted-foreground">📍 {alert.coordinates}</div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="global" className="space-y-3">
        <div className="text-sm font-medium">Global Disaster Events</div>
        <GlobalEvents />
      </TabsContent>

      <TabsContent value="prediction" className="space-y-3">
        <div className="text-sm font-medium">AI-Powered Risk Predictions</div>
        <div className="space-y-3">
          {/* Weather-based Predictions */}
          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌧️</span>
              <h4 className="font-medium text-sm">Monsoon Flood Risk</h4>
              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 ml-auto">85% Risk</span>
            </div>
            <p className="text-xs text-gray-600">High probability of flooding in low-lying areas within next 48 hours</p>
            <div className="text-xs text-muted-foreground">🎯 Affected: Ganga-Brahmaputra Delta, Coastal Odisha</div>
          </div>

          {/* Seismic Predictions */}
          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌍</span>
              <h4 className="font-medium text-sm">Seismic Activity Monitor</h4>
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 ml-auto">62% Risk</span>
            </div>
            <p className="text-xs text-gray-600">Moderate earthquake risk detected in Himalayan foothills</p>
            <div className="text-xs text-muted-foreground">🎯 Zones: Delhi-NCR, Uttarakhand, Himachal Pradesh</div>
          </div>

          {/* Fire Risk Predictions */}
          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <h4 className="font-medium text-sm">Wildfire Risk Analysis</h4>
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 ml-auto">73% Risk</span>
            </div>
            <p className="text-xs text-gray-600">Dry conditions and high temperatures increase fire risk</p>
            <div className="text-xs text-muted-foreground">🎯 Areas: Western Ghats, Central Highlands</div>
          </div>

          {/* Cyclone Tracking */}
          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌪️</span>
              <h4 className="font-medium text-sm">Tropical Cyclone Forecast</h4>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 ml-auto">42% Risk</span>
            </div>
            <p className="text-xs text-gray-600">Low pressure system monitored in Bay of Bengal</p>
            <div className="text-xs text-muted-foreground">🎯 Coastal: Tamil Nadu, Andhra Pradesh, Odisha</div>
          </div>

          {/* AI Model Status */}
          <div className="rounded-md bg-muted p-3 mt-4">
            <div className="text-xs font-medium mb-1">🤖 AI Model Status</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Weather Model: ✅ Active</div>
              <div>Seismic Model: ✅ Active</div>
              <div>Satellite Data: ✅ Real-time</div>
              <div>Risk Analysis: 🔄 Updating</div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">Last updated: 5 minutes ago</div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="comms" className="space-y-2">
        <Textarea placeholder="Message to broadcast..." value={message} onChange={(e) => setMessage(e.target.value)} />
        <div className="flex items-center gap-2">
          <select
            className="px-2 py-1 rounded-md border bg-background"
            value={targetGroup}
            onChange={(e) => setTargetGroup(e.target.value)}
          >
            <option value="citizens">Citizens</option>
            <option value="rescue">Rescue Workers</option>
            <option value="all">All Users</option>
          </select>
          <Button onClick={broadcast}>Send SMS</Button>
        </div>
        <div className="text-xs text-muted-foreground">Requires Twilio env vars.</div>
      </TabsContent>
    </Tabs>
  )
}
