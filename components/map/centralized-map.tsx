"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import { mapService, generateMapId } from "@/lib/map-service"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Dynamic Map Component with centralized management
const CentralizedMapComponent = dynamic(
  () => {
    if (typeof window === 'undefined') {
      return Promise.resolve(() => <div>Loading map...</div>)
    }
    
    return import("react-leaflet").then((mod) => {
      const { MapContainer, TileLayer, Marker, Popup, WMSTileLayer, useMapEvents } = mod
      
      // Map events handler
      const MapEvents = ({ mapRef, pinModeRef, setPinned, mapId }: any) => {
        const map = useMapEvents({
          click: (ev: any) => {
            if (!pinModeRef.current) return
            pinModeRef.current = false
            const { lat, lng } = ev.latlng
            setPinned({ lat, lng })
            window.dispatchEvent(new CustomEvent("jaagratha:pinned", { detail: { lat, lng } }))
          },
          moveend: () => {
            if (!map) return
            const b = map.getBounds()
            const detail = {
              bounds: {
                north: b.getNorth(),
                south: b.getSouth(),
                east: b.getEast(),
                west: b.getWest(),
              },
              center: map.getCenter(),
              zoom: map.getZoom(),
            }
            window.dispatchEvent(new CustomEvent("jaagratha:bounds", { detail }))
          }
        })

        useEffect(() => {
          if (map && mapRef && !mapRef.current) {
            mapRef.current = map
            mapService.registerMap(mapId, map)
          }
        }, [map, mapRef, mapId])

        return null
      }

      // Main Map Component
      const ManagedMap = ({ 
        center, 
        alerts, 
        reliefCenters, 
        highlight, 
        pinned, 
        precipOn, 
        firmsOn, 
        mapRef, 
        pinModeRef, 
        setPinned,
        mapId,
        userType
      }: any) => {
        const position = useMemo(() => ({ lat: center[0], lng: center[1] }), [center])
        const containerRef = useRef<HTMLDivElement>(null)

        // Register this map with the service
        useEffect(() => {
          if (containerRef.current) {
            mapService.createMap(mapId, containerRef.current, {
              center,
              zoom: 11,
              scrollWheelZoom: true
            }).then(() => {
              console.log(`[${userType}Map] Initialized: ${mapId}`)
            }).catch(error => {
              console.error(`[${userType}Map] Failed to initialize:`, error)
            })
          }

          return () => {
            mapService.destroyMap(mapId)
            console.log(`[${userType}Map] Cleaned up: ${mapId}`)
          }
        }, [mapId, userType])

        return (
          <div 
            ref={containerRef}
            style={{ height: '100%', width: '100%' }}
            data-map-id={mapId}
            data-user-type={userType}
            data-map-active="true"
          >
            {/* @ts-ignore */}
            <MapContainer
              // @ts-ignore
              center={center}
              zoom={11}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', zIndex: 1 }}
              key={mapId}
            >
              <MapEvents 
                mapRef={mapRef} 
                pinModeRef={pinModeRef} 
                setPinned={setPinned}
                mapId={mapId}
              />
              
              {/* @ts-ignore */}
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                // @ts-ignore
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* NASA GIBS WMS overlays */}
              {precipOn && (
                // @ts-ignore
                <WMSTileLayer
                  url="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
                  // @ts-ignore
                  params={{
                    layers: "IMERG_Precipitation_Rate",
                    format: "image/png",
                    transparent: true
                  }}
                  // @ts-ignore
                  opacity={0.6}
                />
              )}
              
              {firmsOn && (
                // @ts-ignore
                <WMSTileLayer
                  url="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
                  // @ts-ignore
                  params={{
                    layers: "FIRMS",
                    format: "image/png",
                    transparent: true
                  }}
                  // @ts-ignore
                  opacity={0.6}
                />
              )}

              {/* User location marker */}
              <Marker position={[position.lat, position.lng]}>
                <Popup>You are here ({userType})</Popup>
              </Marker>

              {/* Alert markers */}
              {alerts.map((alert: any) => {
                if (!alert.location?.coordinates?.length) return null
                const [lng, lat] = alert.location.coordinates
                return (
                  <Marker
                    key={alert._id}
                    position={[lat, lng]}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <div className="font-semibold text-sm">{alert.title}</div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {alert.type} • {alert.severity} severity
                        </div>
                        {alert.details && (
                          <div className="text-xs">{alert.details}</div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
              })}

              {/* Relief center markers */}
              {reliefCenters.map((center: any) => {
                if (!center.location?.coordinates?.length) return null
                const [lng, lat] = center.location.coordinates
                return (
                  <Marker
                    key={center._id}
                    position={[lat, lng]}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <div className="font-semibold text-sm">{center.name}</div>
                        {center.details && (
                          <div className="text-xs mt-1">{center.details}</div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
              })}

              {/* Highlight marker */}
              {highlight && (
                <Marker position={[highlight.lat, highlight.lng]}>
                  <Popup>
                    <div className="text-sm font-medium">{highlight.title || "Location"}</div>
                  </Popup>
                </Marker>
              )}

              {/* Pinned location marker */}
              {pinned && (
                <Marker position={[pinned.lat, pinned.lng]}>
                  <Popup>Pinned incident location</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        )
      }

      return ManagedMap
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
  userType: 'citizen' | 'rescuer'
  mapId?: string
}

export function CentralizedMap({ initial, height = 420, userType, mapId }: Props) {
  // Generate or use provided map ID
  const uniqueMapId = useMemo(() => mapId || generateMapId(userType), [mapId, userType])
  
  // Default coordinates
  const defaultLat = 28.6139
  const defaultLng = 77.2090
  
  const stableCenter = useMemo(() => {
    const lat = typeof initial.lat === 'number' && !isNaN(initial.lat) ? initial.lat : defaultLat
    const lng = typeof initial.lng === 'number' && !isNaN(initial.lng) ? initial.lng : defaultLng
    return [lat, lng] as [number, number]
  }, [initial.lat, initial.lng])
  
  const [center, setCenter] = useState<[number, number]>(stableCenter)
  const [precipOn, setPrecipOn] = useState(false)
  const [firmsOn, setFirmsOn] = useState(false)
  const [highlight, setHighlight] = useState<{ lat: number; lng: number; title?: string } | null>(null)
  const [pinned, setPinned] = useState<{ lat: number; lng: number } | null>(null)
  const mapRef = useRef<any>(null)
  const pinModeRef = useRef(false)

  // Fetch data
const { data: nasaData } = useSWR(
  "https://eonet.gsfc.nasa.gov/api/v2.1/events?status=open&limit=20", 
  fetcher, 
  { refreshInterval: 300000 }
)

const events = nasaData?.events || []
const transformedEvents = events.map((event: any) => ({
  id: event.id,
  title: event.title,
  type: event.categories?.[0]?.title || 'Unknown',
  severity: event.categories?.[0]?.id === 8 ? 'critical' : 'medium',
  location: {
    coordinates: event.geometries?.[0]?.coordinates || [0, 0]
  },
  source: 'NASA EONET'
}))  // Initialize map service on component mount
  useEffect(() => {
    mapService.initialize()
    console.log(`[${userType}Map] Component mounted with ID: ${uniqueMapId}`)
    
    return () => {
      console.log(`[${userType}Map] Component unmounting: ${uniqueMapId}`)
    }
  }, [uniqueMapId, userType])

  // Handle geolocation
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const map = mapService.getMap(uniqueMapId)
        if (map) {
          try {
            map.setView([lat, lng], Math.max(map.getZoom(), 12))
            setCenter([lat, lng])
          } catch (e) {
            console.warn(`[${userType}Map] Geolocation error:`, e)
          }
        }
      },
      (error) => {
        console.warn(`[${userType}Map] Geolocation failed:`, error)
      }
    )
  }, [uniqueMapId, userType])

  // Custom events
  useEffect(() => {
    function onPanTo(e: Event) {
      const detail = (e as CustomEvent).detail as { lat: number; lng: number; title?: string }
      if (!detail) return
      setHighlight({ lat: detail.lat, lng: detail.lng, title: detail.title })
      const map = mapService.getMap(uniqueMapId)
      if (map) {
        try {
          map.setView([detail.lat, detail.lng], Math.max(map.getZoom(), 12))
          setCenter([detail.lat, detail.lng])
        } catch (e) {
          console.warn(`[${userType}Map] Pan to error:`, e)
        }
      }
    }
    
    function onStartPin() {
      pinModeRef.current = true
      setPinned(null)
    }

    window.addEventListener("jaagratha:panTo" as any, onPanTo)
    window.addEventListener("jaagratha:startPin" as any, onStartPin)
    
    return () => {
      window.removeEventListener("jaagratha:panTo" as any, onPanTo)
      window.removeEventListener("jaagratha:startPin" as any, onStartPin)
    }
  }, [uniqueMapId, userType])

  return (
    <div className="relative overflow-hidden rounded-lg" style={{ height }}>
      <CentralizedMapComponent
        center={stableCenter}
        events={transformedEvents}
        highlight={highlight}
        pinned={pinned}
        precipOn={precipOn}
        firmsOn={firmsOn}
        mapRef={mapRef}
        pinModeRef={pinModeRef}
        setPinned={setPinned}
        mapId={uniqueMapId}
        userType={userType}
      />

      <div className="absolute right-3 bottom-3 flex gap-2 z-[1000]">
        <button
          onClick={handleLocateMe}
          className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded shadow-lg text-sm flex items-center gap-1"
        >
          📍 Locate Me
        </button>
        <button
          onClick={() => setPrecipOn(!precipOn)}
          className={`px-3 py-2 border rounded shadow-lg text-sm ${
            precipOn 
              ? 'bg-blue-100 text-blue-900 border-blue-200' 
              : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200'
          }`}
        >
          🌧️ Rain
        </button>
        <button
          onClick={() => setFirmsOn(!firmsOn)}
          className={`px-3 py-2 border rounded shadow-lg text-sm ${
            firmsOn 
              ? 'bg-orange-100 text-orange-900 border-orange-200' 
              : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200'
          }`}
        >
          🔥 Fire
        </button>
      </div>
      
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-600 z-[1000]">
        {userType} view • {uniqueMapId}
      </div>
    </div>
  )
}
