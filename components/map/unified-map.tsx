"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { LocateFixed, Flame, CloudRain } from "lucide-react"
import { useMapSingleton } from "@/hooks/use-map-singleton"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface UnifiedMapProps {
  initial: { lat: number; lng: number }
  height?: string | number
  componentId: string
  className?: string
}

export function UnifiedMap({ initial, height = 420, componentId, className }: UnifiedMapProps) {
  const [precipOn, setPrecipOn] = useState(false)
  const [firmsOn, setFirmsOn] = useState(false)
  const [highlight, setHighlight] = useState<{ lat: number; lng: number; title?: string } | null>(null)
  const [pinned, setPinned] = useState<{ lat: number; lng: number } | null>(null)
  const [layers, setLayers] = useState<any[]>([])

  // Convert initial coordinates to array format
  const centerArray: [number, number] = [initial.lat, initial.lng]

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

  // Initialize map with singleton
  const { containerRef, mapInstance, isLoading, panTo } = useMapSingleton({
    center: centerArray,
    componentId,
    onMapReady: (map) => {
      setupMapLayers(map)
      setupMapEvents(map)
    }
  })

  const setupMapLayers = useCallback(async (map: any) => {
    if (typeof window === 'undefined') return

    try {
      const L = require('leaflet')

      // Clear existing layers except the base tile layer
      map.eachLayer((layer: any) => {
        if (layer._url && layer._url.includes('openstreetmap')) {
          // Keep the base tile layer
          return
        }
        map.removeLayer(layer)
      })

      // Add base tile layer if it doesn't exist
      let hasBaseTileLayer = false
      map.eachLayer((layer: any) => {
        if (layer._url && layer._url.includes('openstreetmap')) {
          hasBaseTileLayer = true
        }
      })

      if (!hasBaseTileLayer) {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map)
      }

      // Add NASA GIBS layers conditionally
      const currentLayers: any[] = []

      if (precipOn) {
        const precipLayer = L.tileLayer.wms(
          'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi',
          {
            layers: 'IMERG_Precipitation_Rate',
            format: 'image/png',
            transparent: true,
            opacity: 0.6
          }
        )
        precipLayer.addTo(map)
        currentLayers.push(precipLayer)
      }

      if (firmsOn) {
        const firmsLayer = L.tileLayer.wms(
          'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi',
          {
            layers: 'FIRMS',
            format: 'image/png',
            transparent: true,
            opacity: 0.7
          }
        )
        firmsLayer.addTo(map)
        currentLayers.push(firmsLayer)
      }

      // Add markers for NASA EONET events
      transformedEvents.forEach((event: any) => {
        if (!event.location?.coordinates?.length) return
        
        const coords = event.location.coordinates
        const lat = coords.length === 2 ? coords[1] : coords[0]
        const lng = coords.length === 2 ? coords[0] : coords[1]
        
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return
        
        const marker = L.marker([lat, lng])
          .bindPopup(`<strong>${event.title}</strong><br/>${event.type} - ${event.severity}<br/>Source: NASA EONET`)
        marker.addTo(map)
        currentLayers.push(marker)
      })

      // Add highlight marker
      if (highlight) {
        const highlightMarker = L.marker([highlight.lat, highlight.lng])
          .bindPopup(`<strong>${highlight.title || 'Location'}</strong>`)
        highlightMarker.addTo(map)
        currentLayers.push(highlightMarker)
      }

      // Add pinned marker
      if (pinned) {
        const pinnedMarker = L.marker([pinned.lat, pinned.lng])
          .bindPopup('Pinned incident location')
        pinnedMarker.addTo(map)
        currentLayers.push(pinnedMarker)
      }

      setLayers(currentLayers)

    } catch (error) {
      console.error('[UnifiedMap] Error setting up layers:', error)
    }
  }, [precipOn, firmsOn, transformedEvents, highlight, pinned])

  const setupMapEvents = useCallback((map: any) => {
    if (!map) return

    try {
      // Map click handler for pin mode
      let pinModeActive = false

      const handleMapClick = (e: any) => {
        if (pinModeActive) {
          const { lat, lng } = e.latlng
          setPinned({ lat, lng })
          pinModeActive = false
          window.dispatchEvent(new CustomEvent("jaagratha:pinned", { detail: { lat, lng } }))
        }
      }

      map.on('click', handleMapClick)

      // Map move handler
      const handleMapMove = () => {
        if (!map) return
        try {
          const bounds = map.getBounds()
          const detail = {
            bounds: {
              north: bounds.getNorth(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              west: bounds.getWest(),
            },
            center: map.getCenter(),
            zoom: map.getZoom(),
          }
          window.dispatchEvent(new CustomEvent("jaagratha:bounds", { detail }))
        } catch (error) {
          console.warn('[UnifiedMap] Error in move handler:', error)
        }
      }

      map.on('moveend', handleMapMove)

      // Global event listeners
      const handlePanTo = (e: any) => {
        const detail = e.detail as { lat: number; lng: number; title?: string; zoom?: number }
        if (!detail) return
        setHighlight({ lat: detail.lat, lng: detail.lng, title: detail.title })
        panTo(detail.lat, detail.lng, detail.zoom)
      }

      const handleEnablePin = () => {
        pinModeActive = true
        setPinned(null)
      }

      window.addEventListener("jaagratha:panTo", handlePanTo)
      window.addEventListener("jaagratha:enablePin", handleEnablePin)

      // Cleanup function
      return () => {
        map.off('click', handleMapClick)
        map.off('moveend', handleMapMove)
        window.removeEventListener("jaagratha:panTo", handlePanTo)
        window.removeEventListener("jaagratha:enablePin", handleEnablePin)
      }

    } catch (error) {
      console.error('[UnifiedMap] Error setting up events:', error)
    }
  }, [panTo])

  // Update layers when dependencies change
  useEffect(() => {
    if (mapInstance) {
      setupMapLayers(mapInstance)
    }
  }, [mapInstance, setupMapLayers])

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        panTo(lat, lng, 15)
      },
      (error) => {
        console.warn('Geolocation error:', error)
      }
    )
  }, [panTo])

  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted rounded-lg ${className || ''}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className || ''}`} style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />

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
    </div>
  )
}
