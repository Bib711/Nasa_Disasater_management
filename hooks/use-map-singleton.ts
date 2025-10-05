"use client"

import { useEffect, useRef, useState } from 'react'
import MapSingleton from '@/lib/map-singleton'
import { Map as LeafletMap } from 'leaflet'

interface UseMapSingletonOptions {
  center: [number, number]
  componentId: string
  onMapReady?: (map: LeafletMap) => void
}

export function useMapSingleton({ center, componentId, onMapReady }: UseMapSingletonOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mapSingleton = MapSingleton.getInstance()

  useEffect(() => {
    if (!containerRef.current) return

    const initializeMap = async () => {
      try {
        setIsLoading(true)
        
        // Small delay to ensure container is properly mounted
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!containerRef.current) return

        const map = mapSingleton.initializeMap(
          containerRef.current,
          center,
          componentId
        )

        if (map) {
          setMapInstance(map)
          onMapReady?.(map)
        }
      } catch (error) {
        console.error('[useMapSingleton] Failed to initialize map:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeMap()

    // Cleanup on unmount
    return () => {
      // Don't destroy the map, just mark it as available for other components
      console.log(`[useMapSingleton] Component ${componentId} unmounting`)
    }
  }, [center, componentId, onMapReady])

  const updateMapView = (newCenter: [number, number], zoom?: number) => {
    mapSingleton.updateMapView(newCenter, zoom)
  }

  const panTo = (lat: number, lng: number, zoom?: number) => {
    if (mapInstance) {
      try {
        mapInstance.setView([lat, lng], zoom || mapInstance.getZoom())
      } catch (error) {
        console.warn('[useMapSingleton] Failed to pan to location:', error)
      }
    }
  }

  return {
    containerRef,
    mapInstance,
    isLoading,
    updateMapView,
    panTo,
    isInitialized: mapSingleton.isMapInitialized()
  }
}

export default useMapSingleton
