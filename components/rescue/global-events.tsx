"use client"

import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, AlertTriangle, Clock, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function GlobalEvents() {
  const { toast } = useToast()
  const { data, isLoading, error } = useSWR("https://eonet.gsfc.nasa.gov/api/v2.1/events", fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  })

  function viewEventOnMap(event: any) {
    // Get the latest geometry from the event
    const geometry = event.geometries?.[event.geometries.length - 1]
    if (geometry?.coordinates) {
      const [lng, lat] = geometry.coordinates
      // Dispatch event to pan map to event location
      window.dispatchEvent(new CustomEvent("jaagratha:panTo", { 
        detail: { 
          lat, 
          lng, 
          title: event.title || "Global Event",
          zoom: 8 
        } 
      }))
      toast({ 
        title: "Viewing on map", 
        description: event.title || "Global disaster event" 
      })
    } else {
      toast({ 
        title: "No location data", 
        description: "This event doesn't have location information",
        variant: "destructive" 
      })
    }
  }

  function getEventIcon(categories: any[]) {
    if (!categories?.length) return '🌍'
    
    const category = categories[0]?.title?.toLowerCase() || ''
    
    switch (true) {
      case category.includes('wildfire'):
      case category.includes('fire'):
        return '🔥'
      case category.includes('flood'):
        return '🌊'
      case category.includes('earthquake'):
        return '🌍'
      case category.includes('storm'):
      case category.includes('cyclone'):
      case category.includes('hurricane'):
        return '🌪️'
      case category.includes('volcano'):
        return '🌋'
      case category.includes('drought'):
        return '🏜️'
      case category.includes('landslide'):
        return '⛰️'
      case category.includes('snow'):
      case category.includes('ice'):
        return '❄️'
      default:
        return '⚠️'
    }
  }

  function getCategorySeverity(categories: any[]) {
    if (!categories?.length) return 'secondary'
    
    const category = categories[0]?.title?.toLowerCase() || ''
    const severeEvents = ['wildfire', 'earthquake', 'volcano', 'hurricane', 'cyclone']
    
    return severeEvents.some(event => category.includes(event)) ? 'destructive' : 'default'
  }

  function formatDate(dateString: string) {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown date'
    }
  }

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-lg p-3 h-20" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Failed to load global events</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  const events = data?.events || []
  
  // Filter to recent events and sort by date
  const recentEvents = events
    .filter((event: any) => {
      const geometry = event.geometries?.[event.geometries.length - 1]
      return geometry?.coordinates && geometry.date
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(a.geometries[a.geometries.length - 1]?.date)
      const dateB = new Date(b.geometries[b.geometries.length - 1]?.date)
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, 10) // Show only the 10 most recent events

  if (recentEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No recent global events</p>
        <p className="text-xs text-muted-foreground mt-1">All quiet worldwide</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {recentEvents.map((event: any) => {
        const geometry = event.geometries[event.geometries.length - 1]
        const [lng, lat] = geometry.coordinates
        
        return (
          <div
            key={event.id}
            className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer bg-card"
            onClick={() => viewEventOnMap(event)}
            title="Click to view on map"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg">{getEventIcon(event.categories)}</span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm leading-tight truncate">
                    {event.title || 'Unnamed Event'}
                  </h4>
                  {event.categories?.[0]?.title && (
                    <Badge 
                      variant={getCategorySeverity(event.categories)} 
                      className="text-xs mt-1"
                    >
                      {event.categories[0].title}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {event.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {event.description}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(geometry.date)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">📍 {lat.toFixed(2)}, {lng.toFixed(2)}</span>
                <div className="flex items-center gap-1 text-blue-600">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs font-medium">View on Map</span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
      
      <div className="text-center pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          Data from NASA Earth Observatory (EONET)
        </p>
      </div>
    </div>
  )
}
