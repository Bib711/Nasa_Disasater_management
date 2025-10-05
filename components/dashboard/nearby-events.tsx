"use client"

import useSWR from "swr"

type BoundsInfo = {
  bounds: { north: number; south: number; east: number; west: number }
  center: { lat: number; lng: number }
  zoom: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function useMapView() {
  // keep last known bounds/center in state using window events
  const key = "jaagratha-view"
  return useSWR<BoundsInfo | null>(
    key,
    () =>
      new Promise((resolve) => {
        const handler = (e: Event) => {
          const d = (e as CustomEvent).detail as BoundsInfo
          resolve(d)
        }
        window.addEventListener("jaagratha:bounds" as any, handler as any, { once: true })
        // if none comes in time, resolve null
        setTimeout(() => resolve(null), 1000)
      }),
    { refreshInterval: 8000, revalidateOnFocus: false },
  )
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function NearbyEvents() {
  const { data: view } = useMapView()
  const { data, error, isLoading } = useSWR("https://eonet.gsfc.nasa.gov/api/v2.1/events", fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  })

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading NASA events...</div>
  if (error) return <div className="text-sm text-destructive">Failed to load events</div>
  const events = (data?.events || []) as any[]

  // Filter by proximity to current center (fallback if no bounds)
  const center = view?.center || { lat: 10.068, lng: 76.628 }
  const nearby = events
    .map((ev) => {
      // prefer latest geometry entry
      const g = ev.geometries?.[ev.geometries.length - 1]
      const coords = g?.coordinates
      const lat = Array.isArray(coords) ? coords[1] : undefined
      const lng = Array.isArray(coords) ? coords[0] : undefined
      if (typeof lat !== "number" || typeof lng !== "number") return null
      const dist = haversine(center.lat, center.lng, lat, lng)
      return { id: ev.id, title: ev.title, lat, lng, dist }
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a!.dist - b!.dist)
    .slice(0, 8)

  if (!nearby.length) return <div className="text-sm text-muted-foreground">No nearby global events</div>

  return (
    <ul className="text-sm space-y-2">
      {nearby.map((ev: any) => (
        <li
          key={ev.id}
          className="rounded-md border p-2 cursor-pointer hover:bg-muted"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("jaagratha:panTo", { detail: { lat: ev.lat, lng: ev.lng, title: ev.title } }),
            )
          }}
        >
          <div className="font-medium">{ev.title}</div>
          <div className="text-xs text-muted-foreground">{ev.dist.toFixed(0)} km away</div>
        </li>
      ))}
    </ul>
  )
}
