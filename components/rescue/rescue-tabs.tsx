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

  async function act(id: string, action: "confirm" | "reject") {
    const res = await fetch(`/api/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      toast({ title: action === "confirm" ? "Report confirmed" : "Report rejected" })
      mutate()
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
                      act(r._id, "confirm")
                    }}
                    className="flex-1"
                  >
                    ✅ Accept & Resolve
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
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🚨</div>
          <div className="text-sm text-muted-foreground">No active emergency alerts</div>
          <div className="text-xs text-muted-foreground mt-1">System-generated alerts will appear here</div>
        </div>
      </TabsContent>

      <TabsContent value="global" className="space-y-3">
        <div className="text-sm font-medium">Global Disaster Events</div>
        <GlobalEvents />
      </TabsContent>

      <TabsContent value="prediction" className="space-y-2">
        <div className="text-sm text-muted-foreground">Prototype polygons for flood/landslide risk (coming soon).</div>
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
