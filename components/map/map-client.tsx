'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import 'leaflet/dist/leaflet.css'

// Fix for Leaflet marker icons in Next.js
import L from 'leaflet'

delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

// Simplified Dynamic Map Component
const DynamicMap = dynamic(
  () => {
    return import('react-leaflet').then(({ MapContainer, TileLayer, Marker, Popup }) => {
      function SimpleMap({ center, events, height }: any) {
        return (
          <div style={{ height: `${height}px`, width: '100%' }}>
            <MapContainer
              center={center}
              zoom={11}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              
              {/* User location marker */}
              <Marker position={center}>
                <Popup>You are here</Popup>
              </Marker>

              {/* NASA EONET Event markers */}
              {events.map((event: any) => {
                if (!event.geometries || !event.geometries.length) return null
                
                const geometry = event.geometries[event.geometries.length - 1]
                if (!geometry.coordinates || geometry.coordinates.length < 2) return null
                
                const [lng, lat] = geometry.coordinates
                
                if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null
                
                return (
                  <Marker
                    key={event.id}
                    position={[lat, lng]}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <div className="font-semibold text-sm">{event.title}</div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {event.categories?.[0]?.title || 'Unknown Event'}
                        </div>
                        <div className="text-xs mb-2">
                          Source: NASA EONET
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
  },
  { 
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-muted">Loading map...</div>
  }
)

type Props = {
  initial: { lat: number; lng: number }
  height?: number
}

export function MapClient({ initial, height = 420 }: Props) {
  const defaultLat = 28.6139
  const defaultLng = 77.2090
  
  const center = useMemo(() => {
    const lat = typeof initial.lat === 'number' && !isNaN(initial.lat) ? initial.lat : defaultLat
    const lng = typeof initial.lng === 'number' && !isNaN(initial.lng) ? initial.lng : defaultLng
    return [lat, lng] as [number, number]
  }, [initial.lat, initial.lng])

  const { data: nasaData, error: nasaError, isLoading } = useSWR(
    "https://eonet.gsfc.nasa.gov/api/v2.1/events?status=open&limit=20", 
    fetcher, 
    { 
      refreshInterval: 300000,
      revalidateOnFocus: false
    }
  )

  const events = nasaData?.events || []

  if (isLoading) {
    return (
      <div className="w-full" style={{ height: `${height}px` }}>
        <div className="h-full w-full flex items-center justify-center bg-muted rounded-md">
          <div className="text-center">
            <div className="text-lg font-medium">Loading Map...</div>
            <div className="text-sm text-muted-foreground">Fetching disaster data</div>
          </div>
        </div>
      </div>
    )
  }

  if (nasaError) {
    return (
      <div className="w-full" style={{ height: `${height}px` }}>
        <div className="h-full w-full flex items-center justify-center bg-muted rounded-md">
          <div className="text-center">
            <div className="text-lg font-medium text-red-600">Map Error</div>
            <div className="text-sm text-muted-foreground">Failed to load disaster data</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <DynamicMap center={center} events={events} height={height} />
    </div>
  )
}