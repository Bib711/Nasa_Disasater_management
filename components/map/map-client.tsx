'use client'

import { useMemo, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { LocateFixed } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

// Function to get alert icon based on type
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

// Enhanced Dynamic Map Component with proper SSR handling
const DynamicMap = dynamic(
  () => {
    return import('leaflet').then((L) => {
      // Configure Leaflet icons only on client side
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })

      return import('react-leaflet').then(({ MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents }) => {
        function MapEvents({ onLocationFound }: { onLocationFound?: (lat: number, lng: number) => void }) {
          const map = useMap()
          
          useMapEvents({
            click: (e) => {
              // Enable pin mode for incident reporting
              if ((window as any).pinModeEnabled) {
                const { lat, lng } = e.latlng
                window.dispatchEvent(new CustomEvent("jaagratha:pinned", { 
                  detail: { lat, lng } 
                }))
              }
            }
          })

          // Listen for pan to events
          useEffect(() => {
            const handlePanTo = (e: CustomEvent) => {
              const { lat, lng, title, zoom = 11 } = e.detail
              if (lat && lng) {
                map.setView([lat, lng], zoom)
                // Add a temporary marker if title is provided
                if (title && typeof window !== 'undefined' && (window as any).L) {
                  const L = (window as any).L
                  const marker = L.marker([lat, lng]).addTo(map)
                  marker.bindPopup(title).openPopup()
                  // Remove marker after 5 seconds
                  setTimeout(() => {
                    map.removeLayer(marker)
                  }, 5000)
                }
              }
            }

            const handleEnablePin = () => {
              (window as any).pinModeEnabled = true
              map.getContainer().style.cursor = 'crosshair'
            }

            const handleDisablePin = () => {
              (window as any).pinModeEnabled = false
              map.getContainer().style.cursor = ''
            }

            window.addEventListener("jaagratha:panTo", handlePanTo as any)
            window.addEventListener("jaagratha:enablePin", handleEnablePin)
            window.addEventListener("jaagratha:disablePin", handleDisablePin)

            return () => {
              window.removeEventListener("jaagratha:panTo", handlePanTo as any)
              window.removeEventListener("jaagratha:enablePin", handleEnablePin)
              window.removeEventListener("jaagratha:disablePin", handleDisablePin)
            }
          }, [map])

          return null
        }

        function LocateButton({ onLocationFound }: { onLocationFound?: (lat: number, lng: number) => void }) {
          const map = useMap()
          const [locating, setLocating] = useState(false)

          const getCurrentLocation = () => {
            if (!navigator.geolocation) return

            setLocating(true)
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude
                map.setView([lat, lng], 15)
                
                // Add a marker for current location
                if (typeof window !== 'undefined' && (window as any).L) {
                  const L = (window as any).L
                  const marker = L.marker([lat, lng], {
                    icon: L.divIcon({
                      className: 'current-location-marker',
                      html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                      iconSize: [20, 20],
                      iconAnchor: [10, 10]
                    })
                  }).addTo(map)
                  
                  marker.bindPopup('Your Current Location').openPopup()
                }
                
                if (onLocationFound) {
                  onLocationFound(lat, lng)
                }
                
                setLocating(false)
              },
              () => {
                setLocating(false)
              }
            )
          }

          return (
            <div className="absolute top-2 right-2 z-[1000]">
              <Button
                size="sm"
                variant="secondary"
                onClick={getCurrentLocation}
                disabled={locating}
                className="shadow-lg"
              >
                <LocateFixed className="w-4 h-4" />
              </Button>
            </div>
          )
        }

        function SimpleMap({ center, events, localAlerts, height, showLocateButton = true }: any) {
          // Store Leaflet in window for access in other functions
          useEffect(() => {
            if (typeof window !== 'undefined') {
              (window as any).L = L
            }
          }, [])

          return (
            <div style={{ height: `${height}px`, width: '100%', position: 'relative' }}>
              <MapContainer
                center={center}
                zoom={11}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
              >
                <MapEvents />
                {showLocateButton && <LocateButton />}
                
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                
                {/* User location marker */}
                <Marker position={center}>
                  <Popup>Your Location</Popup>
                </Marker>

                {/* Local alerts markers */}
                {localAlerts && localAlerts.map((alert: any) => {
                  if (!alert.lat || !alert.lng || isNaN(alert.lat) || isNaN(alert.lng)) return null
                  
                  const alertIcon = getAlertIcon(alert.type)
                  const severityColor = alert.severity === 'high' ? '#ef4444' : 
                                      alert.severity === 'moderate' ? '#f59e0b' : '#10b981'
                  
                  return (
                    <Marker
                      key={`local-${alert.id}`}
                      position={[alert.lat, alert.lng]}
                      icon={L.divIcon({
                        className: 'local-alert-marker',
                        html: `<div style="
                          background: ${severityColor};
                          width: 30px;
                          height: 30px;
                          border-radius: 50%;
                          border: 3px solid white;
                          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 14px;
                        ">${alertIcon}</div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                      })}
                    >
                      <Popup>
                        <div className="min-w-[220px]">
                          <div className="font-semibold text-sm mb-1">{alert.title || alert.type}</div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {alert.type} • {alert.severity} severity
                          </div>
                          {alert.description && (
                            <div className="text-xs mb-2 max-w-[200px]">
                              {alert.description}
                            </div>
                          )}
                          {alert.distance && (
                            <div className="text-xs text-blue-600 mb-2">
                              📍 {alert.distance.toFixed(1)} km away
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Source: {alert.source}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(alert.date).toLocaleDateString()}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}

                {/* NASA EONET Event markers */}
                {events && events.map((event: any) => {
                  if (!event.geometries || !event.geometries.length) return null
                  
                  const geometry = event.geometries[event.geometries.length - 1]
                  if (!geometry.coordinates || geometry.coordinates.length < 2) return null
                  
                  const [lng, lat] = geometry.coordinates
                  
                  if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null
                  
                  const eventType = event.categories?.[0]?.title || 'Unknown Event'
                  const eventIcon = getAlertIcon(eventType)
                  
                  return (
                    <Marker
                      key={`nasa-${event.id}`}
                      position={[lat, lng]}
                      icon={L.divIcon({
                        className: 'nasa-event-marker',
                        html: `<div style="
                          background: #6366f1;
                          width: 28px;
                          height: 28px;
                          border-radius: 50%;
                          border: 2px solid white;
                          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 12px;
                        ">${eventIcon}</div>`,
                        iconSize: [28, 28],
                        iconAnchor: [14, 14]
                      })}
                    >
                      <Popup>
                        <div className="min-w-[200px]">
                          <div className="font-semibold text-sm">{event.title}</div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {eventType}
                          </div>
                          <div className="text-xs mb-2">
                            Source: NASA EONET
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(geometry.date).toLocaleDateString()}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            </div>
          )
        }

        return SimpleMap
      })
    })
  },
  { 
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-muted">Loading map...</div>
  }
)

type Props = {
  initial: { lat: number; lng: number }
  height?: number
  showLocateButton?: boolean
}

export function MapClient({ initial, height = 420, showLocateButton = true }: Props) {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const defaultLat = 28.6139
  const defaultLng = 77.2090
  
  // Ensure component only renders on client side
  useEffect(() => {
    setMounted(true)
    // Import CSS only on client side
    import('leaflet/dist/leaflet.css')
    
    // Get user location for filtering alerts
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
          // Default to center location if GPS is denied
          const lat = typeof initial.lat === 'number' && !isNaN(initial.lat) ? initial.lat : defaultLat
          const lng = typeof initial.lng === 'number' && !isNaN(initial.lng) ? initial.lng : defaultLng
          setUserLocation({ lat, lng })
        }
      )
    } else {
      // Default location
      const lat = typeof initial.lat === 'number' && !isNaN(initial.lat) ? initial.lat : defaultLat
      const lng = typeof initial.lng === 'number' && !isNaN(initial.lng) ? initial.lng : defaultLng
      setUserLocation({ lat, lng })
    }
  }, [initial.lat, initial.lng])
  
  const center = useMemo(() => {
    const lat = typeof initial.lat === 'number' && !isNaN(initial.lat) ? initial.lat : defaultLat
    const lng = typeof initial.lng === 'number' && !isNaN(initial.lng) ? initial.lng : defaultLng
    return [lat, lng] as [number, number]
  }, [initial.lat, initial.lng])

  // Build API URL with location parameters for local alerts
  const alertsUrl = userLocation 
    ? `/api/alerts?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=150`
    : '/api/alerts'

  // Fetch local alerts
  const { data: localAlertsData, error: localError } = useSWR(
    mounted && userLocation ? alertsUrl : null,
    fetcher, 
    { 
      revalidateOnFocus: false,
      refreshInterval: 120000 // 2 minutes
    }
  )

  // Fetch NASA data
  const { data: nasaData, error: nasaError, isLoading } = useSWR(
    mounted ? "https://eonet.gsfc.nasa.gov/api/v2.1/events?status=open&limit=20" : null, 
    fetcher, 
    { 
      refreshInterval: 300000,
      revalidateOnFocus: false
    }
  )

  const events = nasaData?.events || []
  
  // Transform local alerts data
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

  // Don't render anything on server side
  if (!mounted) {
    return (
      <div className="w-full" style={{ height: `${height}px` }}>
        <div className="h-full w-full flex items-center justify-center bg-muted rounded-md">
          <div className="text-center">
            <div className="text-lg font-medium">Loading Map...</div>
            <div className="text-sm text-muted-foreground">Initializing...</div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full" style={{ height: `${height}px` }}>
        <div className="h-full w-full flex items-center justify-center bg-muted rounded-md">
          <div className="text-center">
            <div className="text-lg font-medium">Loading Map...</div>
            <div className="text-sm text-muted-foreground">Fetching alerts and disaster data</div>
          </div>
        </div>
      </div>
    )
  }

  if (nasaError && localError) {
    return (
      <div className="w-full" style={{ height: `${height}px` }}>
        <div className="h-full w-full flex items-center justify-center bg-muted rounded-md">
          <div className="text-center">
            <div className="text-lg font-medium text-red-600">Map Error</div>
            <div className="text-sm text-muted-foreground">Failed to load alert data</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <DynamicMap 
        center={center} 
        events={events} 
        localAlerts={localAlerts}
        height={height} 
        showLocateButton={showLocateButton} 
      />
    </div>
  )
}