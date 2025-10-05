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
  
  // Build API URL with location parameters
  const alertsUrl = userLocation 
    ? `/api/alerts?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=150`
    : '/api/alerts'
  
  const { data: localAlertsData, error: localError, isLoading: localLoading } = useSWR(
    userLocation ? alertsUrl : null,
    fetcher, 
    { 
      revalidateOnFocus: false,
      refreshInterval: 120000 // 2 minutes
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

  // Transform and combine alerts
  const localAlerts = (localAlertsData?.alerts || []).map((alert: any) => ({
    id: alert._id,
    title: alert.title || alert.type,
    type: alert.type,
    severity: alert.severity || 'moderate',
    description: alert.details || alert.title,
    lat: alert.location?.coordinates?.[1] || 0,
    lng: alert.location?.coordinates?.[0] || 0,
    date: alert.createdAt || new Date().toISOString(),
    source: 'Local Alert',
    distance: userLocation ? calculateDistance(
      userLocation.lat, userLocation.lng,
      alert.location?.coordinates?.[1] || 0,
      alert.location?.coordinates?.[0] || 0
    ) : null
  }))

  // Transform NASA events and filter by distance
  const nasaEvents = (nasaData?.events || [])
    .map((event: any) => {
      const geometry = event.geometries?.[event.geometries.length - 1]
      if (!geometry?.coordinates || geometry.coordinates.length < 2) return null
      
      const [lng, lat] = geometry.coordinates
      const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng) : null
      
      // Only include NASA events within 150km
      if (distance && distance > 150) return null
      
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
          📍 Showing alerts within 150km of your location
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {getLocationStatus()}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-lg p-3 h-20" />
        ))}
      </div>
    )
  }

  if (hasError) {
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

  if (allAlerts.length === 0) {
    return (
      <div className="space-y-2">
        {getLocationStatus()}
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No active alerts nearby</p>
          <p className="text-xs text-muted-foreground mt-1">All clear in your 150km radius</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {getLocationStatus()}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {allAlerts.map((alert: any) => (
          <div
            key={`${alert.source}-${alert.id}`}
            className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer bg-card"
            onClick={() => viewOnMap(alert)}
            title="Click to view on map"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg">{getAlertIcon(alert.type)}</span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm leading-tight truncate">
                    {alert.title || alert.type || 'Unnamed Alert'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {alert.severity && (
                      <Badge 
                        variant={getSeverityVariant(alert.severity)} 
                        className="text-xs"
                      >
                        {alert.severity.toUpperCase()}
                      </Badge>
                    )}
                    <Badge 
                      variant={alert.source === 'Local Alert' ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      {alert.source}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {alert.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {alert.description}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(alert.date)}
                </div>
                {alert.distance && (
                  <div className="flex items-center gap-1">
                    <LocateFixed className="w-3 h-3" />
                    {alert.distance.toFixed(1)}km away
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-blue-600">
                <MapPin className="w-3 h-3" />
                <span className="text-xs font-medium">View on Map</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
