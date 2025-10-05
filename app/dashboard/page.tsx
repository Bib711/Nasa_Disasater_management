"use client"

import { Suspense, useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { MapClient } from "@/components/map/map-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertList } from "@/components/dashboard/alert-list"
import { ReportIncidentDialog } from "@/components/citizen/report-incident-dialog"
import { NearbyEvents } from "@/components/dashboard/nearby-events"
import { MapPin, LocateFixed } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  
  // Default to Kothamangalam, Kerala if geolocation not yet allowed
  const defaultCenter = { lat: 10.068, lng: 76.628 }

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  // Cleanup any existing map instances when this page loads
  useEffect(() => {
    if (!mounted) return
    
    console.log('[Dashboard] Page mounted - cleaning up orphaned maps')
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
              console.warn('Dashboard map cleanup warning:', e)
            }
          }
        })
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [mounted])

  async function findNearest() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      const res = await fetch("/api/relief-centers/nearest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j?.center) {
        const c = j.center
        window.dispatchEvent(new CustomEvent("jaagratha:panTo", { detail: { lat: c.lat, lng: c.lng, title: c.name } }))
      } else {
        console.log("[v0] nearest center error:", j?.error)
      }
    })
  }



  return (
    <main className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <section className="md:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Live Map</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-[520px] bg-muted rounded-lg"></div>}>
              <MapClient 
                initial={defaultCenter} 
                height={520}
              />
            </Suspense>
          </CardContent>
        </Card>
      </section>
      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Local Alerts (150km radius)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Suspense fallback={<div></div>}>
              {/* SWR client component */}
              <AlertList />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nearby Global Events</CardTitle>
          </CardHeader>
          <CardContent>
            <NearbyEvents />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-2">
          <ReportIncidentDialog />
          <Button onClick={findNearest}>
            <MapPin className="w-4 h-4 mr-2" />
            Find Nearest Relief Center
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                const res = await fetch("/api/alerts/seed", { method: "POST" })
                const data = await res.json()
                if (res.ok) {
                  toast({ 
                    title: "Sample alerts created", 
                    description: `Added ${data.count} local alerts`
                  })
                  // Refresh the page to show new alerts
                  window.location.reload()
                } else {
                  toast({ 
                    title: "Failed to create alerts", 
                    description: data.error,
                    variant: "destructive" 
                  })
                }
              } catch (error) {
                toast({ 
                  title: "Error", 
                  description: "Failed to create sample alerts",
                  variant: "destructive" 
                })
              }
            }}
          >
            🌟 Add Sample Local Alerts
          </Button>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: "/logged-out" })}>
            Log Out
          </Button>
        </div>
      </aside>
    </main>
  )
}
