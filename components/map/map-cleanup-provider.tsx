"use client"

import { useEffect } from "react"
import { mapService } from "@/lib/map-service"

// Global map cleanup component
export function MapCleanupProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize map service
    mapService.initialize()
    
    // Cleanup function for page navigation
    const handleRouteChange = () => {
      console.log('[MapCleanup] Route change detected - cleaning up maps')
      // Small delay to allow new page to mount before cleanup
      setTimeout(() => {
        const activeMapIds = mapService.getActiveMapIds()
        console.log('[MapCleanup] Active maps:', activeMapIds)
      }, 500)
    }

    // Listen for navigation events
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        console.log('[MapCleanup] Page unload - destroying all maps')
        mapService.destroyAllMaps()
      })
      
      // Listen for popstate (back/forward navigation)
      window.addEventListener('popstate', handleRouteChange)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handleRouteChange)
      }
    }
  }, [])

  return <>{children}</>
}
