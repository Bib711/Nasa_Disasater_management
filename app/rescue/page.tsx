"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { MapClient } from "@/components/map/map-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RescueTabs } from "@/components/rescue/rescue-tabs"
import { Button } from "@/components/ui/button"
import { LocateFixed } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function RescueDashboard() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const defaultCenter = { lat: 10.068, lng: 76.628 }
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Cleanup any existing map instances when this page loads
  useEffect(() => {
    if (!mounted) return
    
    console.log('[Rescue] Page mounted - cleaning up orphaned maps')
    // Small delay to ensure previous page cleanup is complete
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        // Force cleanup of any orphaned map containers
        const orphanedMaps = document.querySelectorAll('.leaflet-container')
        orphanedMaps.forEach(mapElement => {
          const parent = mapElement.parentElement
          if (parent && !parent.closest('[data-map-active="true"]')) {
            try {
              mapElement.remove()
            } catch (e) {
              console.warn('Rescue map cleanup warning:', e)
            }
          }
        })
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])
  
  function getCurrentLocation() {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" })
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        window.dispatchEvent(new CustomEvent("jaagratha:panTo", { 
          detail: { lat, lng, title: "Your Location", zoom: 15 } 
        }))
        toast({ 
          title: "Location found", 
          description: `${lat.toFixed(4)}, ${lng.toFixed(4)}` 
        })
      },
      (error) => {
        toast({ 
          title: "Location error", 
          description: "Could not get your location",
          variant: "destructive" 
        })
      }
    )
  }
  
  // Prevent hydration mismatch by showing loading during SSR
  if (!mounted) {
    return (
      <main className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <section className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[520px] bg-muted rounded-lg flex items-center justify-center">
                <div className="text-muted-foreground">Loading map...</div>
              </div>
            </CardContent>
          </Card>
        </section>
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rescue Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    )
  }
  
  return (
    <main className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <section className="md:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Live Map</CardTitle>
          </CardHeader>
          <CardContent>
            <MapClient 
              initial={defaultCenter} 
              height={520}
            />
          </CardContent>
        </Card>
      </section>
      <aside className="space-y-4">
        <RescueTabs />
        <Button
          variant="outline"
          className="w-full"
          onClick={getCurrentLocation}
        >
          <LocateFixed className="w-4 h-4 mr-2" />
          Locate Me
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => signOut({ callbackUrl: "/logged-out" })}
        >
          Log Out
        </Button>
      </aside>
    </main>
  )
}
