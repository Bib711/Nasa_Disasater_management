"use client"

// Centralized Map Service for managing Leaflet map instances
export class MapService {
  private static instance: MapService
  private mapInstances: Map<string, any> = new Map()
  private mapContainers: Map<string, HTMLDivElement> = new Map()
  private initialized = false

  private constructor() {}

  static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService()
    }
    return MapService.instance
  }

  // Initialize the service once
  async initialize() {
    if (this.initialized || typeof window === 'undefined') return

    try {
      // Fix Leaflet icons globally
      const L = await import("leaflet")
      const iconRetina = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png"
      const icon = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"
      const shadow = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"

      if (!(L.Icon.Default.prototype as any)._jaagrathaFixed) {
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: iconRetina,
          iconUrl: icon,
          shadowUrl: shadow,
        })
        ;(L.Icon.Default.prototype as any)._jaagrathaFixed = true
      }

      this.initialized = true
      console.log('[MapService] Initialized successfully')
    } catch (error) {
      console.error('[MapService] Initialization failed:', error)
    }
  }

  // Create a new map instance
  async createMap(
    containerId: string, 
    containerElement: HTMLDivElement, 
    config: {
      center: [number, number]
      zoom?: number
      scrollWheelZoom?: boolean
    }
  ): Promise<any> {
    await this.initialize()

    try {
      // Clean up any existing map with this ID
      this.destroyMap(containerId)

      const { MapContainer } = await import("react-leaflet")
      
      // Store the container reference
      this.mapContainers.set(containerId, containerElement)
      
      console.log(`[MapService] Creating map instance: ${containerId}`)
      
      return {
        containerId,
        config,
        containerElement,
        created: Date.now()
      }
    } catch (error) {
      console.error(`[MapService] Failed to create map ${containerId}:`, error)
      throw error
    }
  }

  // Register a map instance
  registerMap(containerId: string, mapInstance: any) {
    this.mapInstances.set(containerId, mapInstance)
    console.log(`[MapService] Registered map: ${containerId}`)
  }

  // Get a map instance
  getMap(containerId: string): any {
    return this.mapInstances.get(containerId)
  }

  // Destroy a specific map
  destroyMap(containerId: string) {
    try {
      const mapInstance = this.mapInstances.get(containerId)
      if (mapInstance) {
        if (typeof mapInstance.remove === 'function') {
          mapInstance.remove()
        }
        this.mapInstances.delete(containerId)
        console.log(`[MapService] Destroyed map: ${containerId}`)
      }

      const container = this.mapContainers.get(containerId)
      if (container) {
        // Clean up any leaflet-specific elements
        const leafletElements = container.querySelectorAll('[class*="leaflet"]')
        leafletElements.forEach(element => {
          try {
            element.remove()
          } catch (e) {
            console.warn('[MapService] Element cleanup warning:', e)
          }
        })
        this.mapContainers.delete(containerId)
      }
    } catch (error) {
      console.warn(`[MapService] Cleanup warning for ${containerId}:`, error)
    }
  }

  // Destroy all maps
  destroyAllMaps() {
    console.log('[MapService] Destroying all maps')
    const containerIds = Array.from(this.mapInstances.keys())
    containerIds.forEach(id => this.destroyMap(id))
    
    // Additional global cleanup
    if (typeof document !== 'undefined') {
      const orphanedMaps = document.querySelectorAll('.leaflet-container')
      orphanedMaps.forEach(element => {
        try {
          element.remove()
        } catch (e) {
          console.warn('[MapService] Orphaned cleanup warning:', e)
        }
      })
    }
  }

  // Get all active map IDs
  getActiveMapIds(): string[] {
    return Array.from(this.mapInstances.keys())
  }

  // Check if a map exists
  hasMap(containerId: string): boolean {
    return this.mapInstances.has(containerId)
  }
}

// Export singleton instance
export const mapService = MapService.getInstance()

// Generate unique map IDs
export const generateMapId = (prefix: string = 'map') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
