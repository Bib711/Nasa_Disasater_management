"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, AlertTriangle, Clock, LocateFixed } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AlertList() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  
  useEffect(() => {
    setMounted(true)
    // Try to get user's location for filtering nearby alerts
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.warn("Location access denied:", error)
          setLocationError("Location access denied")
          // Default to Kothamangalam, Kerala if location is denied
          setUserLocation({ lat: 10.068, lng: 76.628 })
        }
      )
    } else {
      setLocationError("Geolocation not supported")
      // Default location
      setUserLocation({ lat: 10.068, lng: 76.628 })
    }
  }, [])
  
  // Build API URL - use same as rescue worker dashboard (no location filtering)
  const alertsUrl = '/api/alerts'
  
  const { data: localAlertsData, error: localError, isLoading: localLoading } = useSWR(
    alertsUrl,
    fetcher, 
    { 
      revalidateOnFocus: true,
      refreshInterval: 5000 // Same as rescue dashboard - 5 seconds
    }
  )

  // Also fetch NASA EONET data
  const { data: nasaData, error: nasaError, isLoading: nasaLoading } = useSWR(
    "https://eonet.gsfc.nasa.gov/api/v2.1/events?status=open&limit=10", 
    fetcher, 
    { 
      revalidateOnFocus: false,
      refreshInterval: 300000 // 5 minutes
    }
  )

  // Function to calculate distance between two points
  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Use the alerts directly from the API (same as rescue dashboard)
  const localAlerts = localAlertsData?.alerts || []

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

  // Transform NASA events and filter by distance
  const nasaEvents = (nasaData?.events || [])
    .map((event: any) => {
      const geometry = event.geometries?.[event.geometries.length - 1]
      if (!geometry?.coordinates || geometry.coordinates.length < 2) return null
      
      const [lng, lat] = geometry.coordinates
      const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng) : null
      
      // Only include NASA events within 250km
      if (distance && distance > 250) return null
      
      return {
        id: event.id,
        title: event.title,
        type: event.categories?.[0]?.title || 'Unknown',
        severity: event.categories?.[0]?.id === 8 ? 'high' : // Wildfires
                  event.categories?.[0]?.id === 10 ? 'high' :    // Severe Storms
                  event.categories?.[0]?.id === 12 ? 'high' : // Volcanoes
                  'moderate',
        description: event.description || event.title,
        lat,
        lng,
        date: geometry.date || new Date().toISOString(),
        source: 'NASA EONET',
        distance
      }
    })
    .filter(Boolean)

  // Combine and sort all alerts by distance
  const allAlerts = [...localAlerts, ...nasaEvents].sort((a, b) => {
    if (a.distance && b.distance) return a.distance - b.distance
    if (a.distance && !b.distance) return -1
    if (!a.distance && b.distance) return 1
    return 0
  })

  const isLoading = localLoading || nasaLoading
  const hasError = localError || nasaError

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
      case 'wildfires':
        return '🔥'
      case 'flood':
      case 'flooding':
        return '🌊'
      case 'earthquake':
      case 'earthquakes':
        return '🌍'
      case 'storm':
      case 'severe storms':
      case 'cyclone':
        return '🌪️'
      case 'landslide':
      case 'landslides':
        return '⛰️'
      case 'medical':
        return '🚑'
      case 'accident':
      case 'traffic':
        return '🚗'
      case 'drought':
        return '🌵'
      case 'heatwave':
      case 'heat':
        return '🌡️'
      case 'air_quality':
      case 'pollution':
        return '💨'
      case 'volcanoes':
      case 'volcanic':
        return '🌋'
      case 'sea and lake ice':
        return '🧊'
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

  function getSourceVariant(source: string) {
    switch (source) {
      case 'Citizen Report (Verified)':
        return 'default' // Blue badge for verified citizen reports
      case 'Local Alert':
        return 'secondary' // Gray badge for manual alerts
      case 'NASA EONET':
        return 'outline' // Outlined badge for NASA data
      default:
        return 'secondary'
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

  function getLocationStatus() {
    if (locationError) {
      return (
        <div className="text-xs text-amber-600 mb-2 p-2 bg-amber-50 rounded">
          📍 Using default location (Kerala)
        </div>
      )
    }
    if (userLocation) {
      return (
        <div className="text-xs text-green-600 mb-2 p-2 bg-green-50 rounded">
          📍 Showing alerts within 250km of your location
        </div>
      )
    }
    return null
  }

  if (localLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-lg p-3 h-20" />
        ))}
      </div>
    )
  }

  if (localError) {
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

  if (localAlerts.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No active alerts</p>
        <p className="text-xs text-muted-foreground mt-1">All clear</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {localAlerts.map((alert: any) => (
          <div
            key={alert._id}
            className={`border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer ${
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
          </div>
        ))}
      </div>
    </div>
  )
}
