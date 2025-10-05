"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, AlertTriangle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AlertList() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const { data, error, isLoading } = useSWR(
    "https://eonet.gsfc.nasa.gov/api/v2.1/events?status=open&limit=10", 
    fetcher, 
    { 
      revalidateOnFocus: false,
      refreshInterval: 300000 // 5 minutes
    }
  )

  // Transform NASA EONET data
  const events = data?.events || []
  const transformedEvents = events.map((event: any) => ({
    id: event.id,
    title: event.title,
    type: event.categories?.[0]?.title || 'Unknown',
    severity: event.categories?.[0]?.id === 8 ? 'critical' : // Wildfires
              event.categories?.[0]?.id === 10 ? 'high' :    // Severe Storms
              event.categories?.[0]?.id === 12 ? 'critical' : // Volcanoes
              'medium',
    description: event.description || event.title,
    lat: event.geometries?.[0]?.coordinates?.[1] || 0,
    lng: event.geometries?.[0]?.coordinates?.[0] || 0,
    date: event.geometries?.[0]?.date || new Date().toISOString(),
    source: 'NASA EONET'
  }))

  function viewOnMap(alert: any) {
    if (alert.lat && alert.lng) {
      // Dispatch event to pan map to alert location
      window.dispatchEvent(new CustomEvent("jaagratha:panTo", { 
        detail: { 
          lat: alert.lat, 
          lng: alert.lng, 
          title: alert.title || alert.type || "Alert Location",
          zoom: 12 
        } 
      }))
      toast({ 
        title: "Viewing on map", 
        description: alert.title || alert.type || "Alert location" 
      })
    } else {
      toast({ 
        title: "No location data", 
        description: "This alert doesn't have location information",
        variant: "destructive" 
      })
    }
  }

  function getAlertIcon(type: string) {
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

  function getSeverityVariant(severity: string) {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'destructive'
      case 'medium':
      case 'moderate':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  function formatDate(dateString: string) {
    if (!mounted) return 'Recently' // Prevent hydration mismatch
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Recently'
    }
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
        <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Failed to load alerts</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  if (transformedEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No active events</p>
        <p className="text-xs text-muted-foreground mt-1">No disasters detected by NASA EONET</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {transformedEvents.map((alert: any) => (
        <div
          key={alert.id}
          className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => viewOnMap(alert)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-lg">{getAlertIcon(alert.type)}</span>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm leading-tight truncate">
                  {alert.title || alert.type || 'Unnamed Alert'}
                </h4>
                {alert.severity && (
                  <Badge 
                    variant={getSeverityVariant(alert.severity)} 
                    className="text-xs mt-1"
                  >
                    {alert.severity.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {alert.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {alert.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {alert.createdAt ? formatDate(alert.createdAt) : 'Recently'}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">{alert.status}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  viewOnMap(alert)
                }}
              >
                <MapPin className="w-3 h-3 mr-1" />
                View
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
