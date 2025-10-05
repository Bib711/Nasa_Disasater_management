"use client"

import { Map as LeafletMap } from 'leaflet'

class MapSingleton {
  private static instance: MapSingleton
  private mapInstance: LeafletMap | null = null
  private mapContainer: HTMLDivElement | null = null
  private isInitialized: boolean = false
  private currentComponent: string | null = null

  private constructor() {}

  public static getInstance(): MapSingleton {
    if (!MapSingleton.instance) {
      MapSingleton.instance = new MapSingleton()
    }
    return MapSingleton.instance
  }

  public initializeMap(
    container: HTMLDivElement, 
    center: [number, number], 
    componentId: string
  ): LeafletMap | null {
    if (typeof window === 'undefined') return null

    // If map is already initialized for a different component, transfer it
    if (this.isInitialized && this.mapInstance && this.currentComponent !== componentId) {
      this.transferMapToNewContainer(container, componentId)
      return this.mapInstance
    }

    // If map is already initialized for the same component, return existing
    if (this.isInitialized && this.mapInstance && this.currentComponent === componentId) {
      return this.mapInstance
    }

    // Initialize map for the first time
    try {
      const L = require('leaflet')
      
      // Fix default marker icons
      if (!L.Icon.Default.prototype._jaagrathaFixed) {
        const iconRetina = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png"
        const icon = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"
        const shadow = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
        
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: iconRetina,
          iconUrl: icon,
          shadowUrl: shadow,
        })
        L.Icon.Default.prototype._jaagrathaFixed = true
      }

      this.mapInstance = L.map(container, {
        center: center,
        zoom: 11,
        scrollWheelZoom: true,
        zoomControl: true,
        attributionControl: true
      })

      this.mapContainer = container
      this.isInitialized = true
      this.currentComponent = componentId

      console.log(`[MapSingleton] Map initialized for component: ${componentId}`)
      return this.mapInstance

    } catch (error) {
      console.error('[MapSingleton] Failed to initialize map:', error)
      return null
    }
  }

  private transferMapToNewContainer(newContainer: HTMLDivElement, componentId: string) {
    if (!this.mapInstance || !this.mapContainer) return

    try {
      // Remove the map from the old container
      const mapElement = this.mapContainer.querySelector('.leaflet-container')
      if (mapElement) {
        mapElement.remove()
      }

      // Create new map in the new container
      const L = require('leaflet')
      const currentCenter = this.mapInstance.getCenter()
      const currentZoom = this.mapInstance.getZoom()

      // Remove the old map instance
      this.mapInstance.remove()

      // Create new map instance
      this.mapInstance = L.map(newContainer, {
        center: [currentCenter.lat, currentCenter.lng],
        zoom: currentZoom,
        scrollWheelZoom: true,
        zoomControl: true,
        attributionControl: true
      })

      this.mapContainer = newContainer
      this.currentComponent = componentId

      console.log(`[MapSingleton] Map transferred to component: ${componentId}`)
    } catch (error) {
      console.error('[MapSingleton] Failed to transfer map:', error)
    }
  }

  public getMapInstance(): LeafletMap | null {
    return this.mapInstance
  }

  public isMapInitialized(): boolean {
    return this.isInitialized && this.mapInstance !== null
  }

  public getCurrentComponent(): string | null {
    return this.currentComponent
  }

  public updateMapView(center: [number, number], zoom?: number) {
    if (this.mapInstance) {
      try {
        this.mapInstance.setView(center, zoom || this.mapInstance.getZoom())
      } catch (error) {
        console.warn('[MapSingleton] Failed to update map view:', error)
      }
    }
  }

  public destroy() {
    if (this.mapInstance) {
      try {
        this.mapInstance.remove()
      } catch (error) {
        console.warn('[MapSingleton] Error destroying map:', error)
      }
    }
    this.mapInstance = null
    this.mapContainer = null
    this.isInitialized = false
    this.currentComponent = null
    console.log('[MapSingleton] Map destroyed')
  }
}

export default MapSingleton
