"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { MapContainerManager, useMapCleanup } from '@/lib/map-container-manager'

interface MapContextType {
  isMapInitialized: boolean
  initializeMap: () => void
  cleanupAllMaps: () => void
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function useMapContext() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider')
  }
  return context
}

interface MapProviderProps {
  children: ReactNode
}

export function MapProvider({ children }: MapProviderProps) {
  const { data: session, status } = useSession()
  const [isMapInitialized, setIsMapInitialized] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Ensure client-side only execution
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const manager = mounted ? MapContainerManager.getInstance() : null
  
  // Set up global cleanup only on client
  if (mounted) {
    useMapCleanup()
  }

  useEffect(() => {
    if (!mounted) return
    
    // Initialize map when user first logs in
    if (status === 'authenticated' && session && !isMapInitialized) {
      console.log('[MapProvider] User authenticated, preparing map initialization')
      setIsMapInitialized(true)
    }

    // Cleanup when user logs out
    if (status === 'unauthenticated' && isMapInitialized) {
      console.log('[MapProvider] User logged out, cleaning up all maps')
      manager?.cleanupAllContainers()
      setIsMapInitialized(false)
    }
  }, [status, session, isMapInitialized, manager])

  // Cleanup on route changes
  useEffect(() => {
    const handleRouteChange = () => {
      console.log('[MapProvider] Route change detected, cleaning up orphaned maps')
      // Small delay to allow new components to mount before cleanup
      setTimeout(() => {
        manager?.cleanupAllContainers()
      }, 100)
    }

    // Listen for route changes (Next.js specific)
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleRouteChange)
      return () => {
        window.removeEventListener('beforeunload', handleRouteChange)
      }
    }
  }, [manager])

  const initializeMap = () => {
    if (!isMapInitialized) {
      setIsMapInitialized(true)
    }
  }

  const cleanupAllMaps = () => {
    manager?.cleanupAllContainers()
  }

  return (
    <MapContext.Provider value={{ isMapInitialized, initializeMap, cleanupAllMaps }}>
      {children}
    </MapContext.Provider>
  )
}
