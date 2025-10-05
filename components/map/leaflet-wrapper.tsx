import { useEffect, useMemo, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, WMSTileLayer, useMapEvents } from "react-leaflet"

// Fix default marker icons
const iconRetina = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png"
const icon = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"
const shadow = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"

// Map events component
const MapEvents = ({ mapRef, pinModeRef, setPinned, setCenter }: any) => {
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
    }
  }, [map, mapRef])

  return null
}

type Props = {
  center: [number, number]
  alerts: any[]
  reliefCenters: any[]
  highlight: { lat: number; lng: number; title?: string } | null
  pinned: { lat: number; lng: number } | null
  precipOn: boolean
  firmsOn: boolean
  mapRef: any
  pinModeRef: any
  setPinned: (pinned: { lat: number; lng: number } | null) => void
  setCenter: (center: [number, number]) => void
}

const LeafletWrapper = ({
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
  setCenter
}: Props) => {
  const position = useMemo(() => ({ lat: center[0], lng: center[1] }), [center])
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  // Fix Leaflet icons
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const L = require("leaflet")
      if (!L.Icon.Default.prototype._jaagrathaFixed) {
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: iconRetina,
          iconUrl: icon,
          shadowUrl: shadow,
        })
        L.Icon.Default.prototype._jaagrathaFixed = true
      }
    }
  }, [])

  // Clean up map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          console.warn('Error removing map instance:', e)
        }
        mapInstanceRef.current = null
      }
    }
  }, [])

  const handleMapCreated = (mapInstance: any) => {
    mapInstanceRef.current = mapInstance
    if (mapRef) {
      mapRef.current = mapInstance
    }
  }

  return (
    <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        // @ts-ignore
        whenReady={(mapEvent: any) => handleMapCreated(mapEvent.target)}
      >
        <MapEvents 
          mapRef={mapRef} 
          pinModeRef={pinModeRef} 
          setPinned={setPinned}
          setCenter={setCenter}
        />
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          // @ts-ignore
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* NASA GIBS WMS overlays */}
        {precipOn && (
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
          <Popup>You are here</Popup>
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

export default LeafletWrapper
