"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { LocateFixed, Flame, CloudRain } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MapContainerManager, safeInitializeContainer } from "@/lib/map-container-manager"
import useSWR from "swr"
import "mapbox-gl/dist/mapbox-gl.css"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Generate unique container ID
const generateContainerId = () => `mapbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

interface MapboxMapProps {
  initial: { lat: number; lng: number }
  height?: string | number
  onMapReady?: (map: any) => void
  className?: string
}

export function MapboxMap({ initial, height = 420, onMapReady, className }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [containerId, setContainerId] = useState<string>('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [precipOn, setPrecipOn] = useState(false)
  const [firmsOn, setFirmsOn] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Generate container ID only on client to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    setContainerId(generateContainerId())
  }, [])
  const [highlight, setHighlight] = useState<{ lat: number; lng: number; title?: string } | null>(null)
  const [pinned, setPinned] = useState<{ lat: number; lng: number } | null>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const { toast } = useToast()
  const manager = MapContainerManager.getInstance()
  const mapboxRef = useRef<any>(null)

  // Fetch NASA EONET disaster events
  const { data: nasaData, error: nasaError } = useSWR(
    "https://eonet.gsfc.nasa.gov/api/v2.1/events?status=open&limit=20", 
    fetcher, 
    { refreshInterval: 300000 }
  )

  const events = nasaData?.events || []
  
  // Transform NASA events to our format
  const transformedEvents = events.map((event: any) => ({
    id: event.id,
    title: event.title,
    type: event.categories?.[0]?.title || 'Unknown',
    severity: event.categories?.[0]?.id === 8 ? 'critical' : // Wildfires
              event.categories?.[0]?.id === 10 ? 'high' :    // Severe Storms
              event.categories?.[0]?.id === 12 ? 'critical' : // Volcanoes
              'medium',
    description: event.description || event.title,
    location: {
      coordinates: event.geometries?.[0]?.coordinates || [0, 0]
    },
    date: event.geometries?.[0]?.date || new Date().toISOString(),
    source: 'NASA EONET'
  }))

  // Initialize map when container ID is available
  useEffect(() => {
    if (!mapContainer.current || !containerId) return

    const initializeMap = async () => {
      try {
        const mapInstance = await safeInitializeContainer(containerId, mapContainer.current!, async () => {
          console.log(`[MapboxMap] Initializing map with container ID: ${containerId}`)

          // Import Mapbox GL
          const mapboxgl = await import("mapbox-gl")
          ;(mapboxgl as any).accessToken = (mapboxgl as any).accessToken || "no-token"
          mapboxRef.current = mapboxgl

          // Create map instance
          const newMap = new (mapboxgl as any).Map({
            container: mapContainer.current!,
            style: {
              version: 8,
              sources: {
                osm: {
                  type: "raster",
                  tiles: [
                    "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
                  ],
                  tileSize: 256,
                  attribution: "© OpenStreetMap contributors",
                },
              },
              layers: [
                {
                  id: "osm",
                  type: "raster",
                  source: "osm",
                },
              ],
            },
            center: [initial.lng, initial.lat],
            zoom: 11,
          })

          return newMap
        })

        map.current = mapInstance

        map.current.on("load", () => {
          setIsLoaded(true)
          onMapReady?.(map.current)

          // Add NASA GIBS sources for overlays
          map.current.addSource("precipitation", {
            type: "raster",
            tiles: [
              "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=IMERG_Precipitation_Rate&CRS=EPSG%3A3857&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}",
            ],
            tileSize: 256,
          })

          map.current.addSource("firms", {
            type: "raster",
            tiles: [
              "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=FIRMS&CRS=EPSG%3A3857&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}",
            ],
            tileSize: 256,
          })

          // Add precipitation layer (initially hidden)
          map.current.addLayer({
            id: "precipitation-layer",
            type: "raster",
            source: "precipitation",
            layout: {
              visibility: "none",
            },
            paint: {
              "raster-opacity": 0.6,
            },
          })

          // Add FIRMS layer (initially hidden)
          map.current.addLayer({
            id: "firms-layer",
            type: "raster",
            source: "firms",
            layout: {
              visibility: "none",
            },
            paint: {
              "raster-opacity": 0.7,
            },
          })
        })

        // Handle click for pin mode
        map.current.on("click", (e: any) => {
          if ((window as any).pinModeActive) {
            const { lng, lat } = e.lngLat
            setPinned({ lat, lng })
            ;(window as any).pinModeActive = false
            window.dispatchEvent(new CustomEvent("jaagratha:pinned", { detail: { lat, lng } }))
          }
        })

        // Handle map move events
        map.current.on("moveend", () => {
          if (!map.current) return
          const bounds = map.current.getBounds()
          const center = map.current.getCenter()
          const detail = {
            bounds: {
              north: bounds.getNorth(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              west: bounds.getWest(),
            },
            center: { lat: center.lat, lng: center.lng },
            zoom: map.current.getZoom(),
          }
          window.dispatchEvent(new CustomEvent("jaagratha:bounds", { detail }))
        })
      } catch (error) {
        console.error("Failed to initialize map:", error)
        toast({
          title: "Map Error",
          description: "Failed to load map. Please refresh the page.",
          variant: "destructive",
        })
      }
    }

    initializeMap()

    return () => {
      console.log(`[MapboxMap] Component unmounting, cleaning up container: ${containerId}`)

      // Use the container manager for proper cleanup
      manager.cleanupContainer(containerId)

      // Clear local state
      map.current = null
      setIsLoaded(false)
      setMarkers([])
    }
  }, [containerId, initial.lat, initial.lng, onMapReady, toast, manager])

  // Handle precipitation layer toggle
  useEffect(() => {
    if (!map.current || !isLoaded) return

    map.current.setLayoutProperty("precipitation-layer", "visibility", precipOn ? "visible" : "none")
  }, [precipOn, isLoaded])

  // Handle FIRMS layer toggle
  useEffect(() => {
    if (!map.current || !isLoaded) return

    map.current.setLayoutProperty("firms-layer", "visibility", firmsOn ? "visible" : "none")
  }, [firmsOn, isLoaded])

  // Add markers for alerts and relief centers
  useEffect(() => {
    if (!map.current || !isLoaded) return

    const mapboxgl = mapboxRef.current
    if (!mapboxgl) return

    // Clear existing markers
    markers.forEach((marker) => marker.remove())
    const newMarkers: any[] = []

    // Add NASA EONET event markers
    transformedEvents.forEach((event: any) => {
      if (!event.location?.coordinates?.length) return
      
      const coords = event.location.coordinates
      const lat = coords.length === 2 ? coords[1] : coords[0]
      const lng = coords.length === 2 ? coords[0] : coords[1]
      
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return
      
      const el = document.createElement("div")
      el.className = "alert-marker"
      el.style.cssText = `
        background-color: #ef4444;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<strong>${event.title}</strong><br/>${event.type} - ${event.severity}<br/>Source: NASA EONET`,
          ),
        )
        .addTo(map.current)

      newMarkers.push(marker)
    })

    // Add highlight marker
    if (highlight) {
      const el = document.createElement("div")
      el.className = "highlight-marker"
      el.style.cssText = `
        background-color: #3b82f6;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        border: 3px solid white;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        animation: pulse 2s infinite;
      `

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([highlight.lng, highlight.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>${highlight.title || "Location"}</strong>`))
        .addTo(map.current)

      newMarkers.push(marker)
    }

    // Add pinned marker
    if (pinned) {
      const el = document.createElement("div")
      el.className = "pinned-marker"
      el.style.cssText = `
        background-color: #f59e0b;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([pinned.lng, pinned.lat])
        .setPopup(new mapboxgl.Popup().setHTML("Pinned incident location"))
        .addTo(map.current)

      newMarkers.push(marker)
    }

    setMarkers(newMarkers)
  }, [transformedEvents, highlight, pinned, isLoaded])

  // Global event handlers
  useEffect(() => {
    const handlePanTo = (e: any) => {
      const detail = e.detail as { lat: number; lng: number; title?: string; zoom?: number }
      if (!detail || !map.current) return

      setHighlight({ lat: detail.lat, lng: detail.lng, title: detail.title })
      map.current.flyTo({
        center: [detail.lng, detail.lat],
        zoom: detail.zoom || Math.max(map.current.getZoom(), 12),
        duration: 1000,
      })
    }

    const handleEnablePin = () => {
      ;(window as any).pinModeActive = true
      setPinned(null)
    }

    window.addEventListener("jaagratha:panTo", handlePanTo)
    window.addEventListener("jaagratha:enablePin", handleEnablePin)

    return () => {
      window.removeEventListener("jaagratha:panTo", handlePanTo)
      window.removeEventListener("jaagratha:enablePin", handleEnablePin)
    }
  }, [])

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        variant: "destructive",
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude

        if (map.current) {
          map.current.flyTo({
            center: [lng, lat],
            zoom: 15,
            duration: 1000,
          })
        }

        toast({
          title: "Location found",
          description: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        })
      },
      (error) => {
        toast({
          title: "Location error",
          description: "Could not get your location",
          variant: "destructive",
        })
      },
    )
  }, [toast])

  // Prevent hydration mismatch - don't render until mounted
  if (!mounted || !containerId) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className || ""}`} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Initializing map...</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className || ""}`} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className || ""}`} style={{ height }}>
      <div ref={mapContainer} className="w-full h-full" data-mapbox-active="true" data-container-id={containerId} />

      <div className="absolute right-3 bottom-3 flex gap-2 z-[1000]">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleLocateMe}
          className="shadow-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
        >
          <LocateFixed className="mr-1 h-4 w-4" />
          Locate Me
        </Button>
        <Toggle
          pressed={precipOn}
          onPressedChange={setPrecipOn}
          aria-label="Toggle Live Precipitation"
          className="border bg-white hover:bg-gray-50 shadow-lg data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900"
        >
          <CloudRain className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={firmsOn}
          onPressedChange={setFirmsOn}
          aria-label="Toggle Fire Hotspots"
          className="border bg-white hover:bg-gray-50 shadow-lg data-[state=on]:bg-orange-100 data-[state=on]:text-orange-900"
        >
          <Flame className="h-4 w-4 text-orange-600" />
        </Toggle>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
