"use client"

// Utility functions for managing map containers and preventing initialization conflicts

export class MapContainerManager {
  private static instance: MapContainerManager
  private activeContainers: Set<string> = new Set()
  private mapInstances: Map<string, any> = new Map()

  private constructor() {}

  public static getInstance(): MapContainerManager {
    if (!MapContainerManager.instance) {
      MapContainerManager.instance = new MapContainerManager()
    }
    return MapContainerManager.instance
  }

  public registerContainer(containerId: string, mapInstance: any): void {
    console.log(`[MapContainerManager] Registering container: ${containerId}`)

    // Clean up any existing instance for this container
    if (this.mapInstances.has(containerId)) {
      this.cleanupContainer(containerId)
    }

    this.activeContainers.add(containerId)
    this.mapInstances.set(containerId, mapInstance)
  }

  public cleanupContainer(containerId: string): void {
    console.log(`[MapContainerManager] Cleaning up container: ${containerId}`)

    const mapInstance = this.mapInstances.get(containerId)
    if (mapInstance) {
      try {
        mapInstance.remove()
      } catch (e) {
        console.warn(`[MapContainerManager] Error removing map for ${containerId}:`, e)
      }
    }

    this.activeContainers.delete(containerId)
    this.mapInstances.delete(containerId)
  }

  public cleanupAllContainers(): void {
    console.log("[MapContainerManager] Cleaning up all containers")

    this.activeContainers.forEach((containerId) => {
      this.cleanupContainer(containerId)
    })

    // Also clean up any orphaned DOM elements
    this.cleanupOrphanedElements()
  }

  public isContainerActive(containerId: string): boolean {
    return this.activeContainers.has(containerId)
  }

  private cleanupOrphanedElements(): void {
    if (typeof window !== "undefined") {
      try {
        // Remove orphaned mapbox containers
        const orphanedMaps = document.querySelectorAll(".mapboxgl-map")
        orphanedMaps.forEach((mapEl) => {
          const parent = mapEl.parentElement
          if (parent && !parent.closest('[data-mapbox-active="true"]')) {
            console.log("[MapContainerManager] Removing orphaned map element")
            mapEl.remove()
          }
        })

        // Remove orphaned leaflet containers (if any remain)
        const orphanedLeaflet = document.querySelectorAll(".leaflet-container")
        orphanedLeaflet.forEach((mapEl) => {
          const parent = mapEl.parentElement
          if (parent && !parent.closest('[data-map-active="true"]')) {
            console.log("[MapContainerManager] Removing orphaned leaflet element")
            mapEl.remove()
          }
        })
      } catch (e) {
        console.warn("[MapContainerManager] Error cleaning orphaned elements:", e)
      }
    }
  }

  public getActiveContainers(): string[] {
    return Array.from(this.activeContainers)
  }
}

// Global cleanup function
export const cleanupAllMaps = () => {
  const manager = MapContainerManager.getInstance()
  manager.cleanupAllContainers()
}

// Function to safely initialize a map container
export const safeInitializeContainer = async (
  containerId: string,
  containerElement: HTMLElement,
  initCallback: () => any | Promise<any>,
): Promise<any> => {
  const manager = MapContainerManager.getInstance()

  // Clean up any existing instance
  if (manager.isContainerActive(containerId)) {
    manager.cleanupContainer(containerId)
  }

  // Clear the container element
  containerElement.innerHTML = ""

  // Initialize the new map
  try {
    const mapInstance = await initCallback() // await so we store the real instance, not a Promise
    manager.registerContainer(containerId, mapInstance)
    return mapInstance
  } catch (error) {
    console.error(`[MapContainerManager] Failed to initialize container ${containerId}:`, error)
    throw error
  }
}

// Hook for cleanup on page unload
export const useMapCleanup = () => {
  if (typeof window !== "undefined") {
    const handleBeforeUnload = () => {
      cleanupAllMaps()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }
}
