"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, MapPin, X, LocateFixed } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MapboxMap } from "@/components/map/mapbox-map"

export function ReportIncidentDialog() {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [reportData, setReportData] = useState({
    type: "",
    details: "",
    lat: null as number | null,
    lng: null as number | null,
  })
  const [pinMode, setPinMode] = useState(false)
  const [userLocation, setUserLocation] = useState({ lat: 10.068, lng: 76.628 }) // Default to Kothamangalam

  // Listen for map pin events
  useEffect(() => {
    const handler = (e: any) => {
      const { lat, lng } = e.detail
      setReportData(prev => ({ ...prev, lat, lng }))
      setPinMode(false)
      toast({ title: "Location pinned", description: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
    }
    window.addEventListener("jaagratha:pinned", handler)
    return () => window.removeEventListener("jaagratha:pinned", handler)
  }, [toast])

  function enablePinMode() {
    setPinMode(true)
    // Dispatch custom event to enable pin mode on the map
    window.dispatchEvent(new CustomEvent("jaagratha:enablePin"))
    toast({ title: "Pin mode enabled", description: "Click on the map to set location" })
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" })
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setUserLocation({ lat, lng })
        setReportData(prev => ({ ...prev, lat, lng }))
        toast({ title: "Location found", description: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
        // Pan the map to user location
        window.dispatchEvent(new CustomEvent("jaagratha:panTo", { 
          detail: { lat, lng, title: "Your Location" } 
        }))
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

  async function submitReport() {
    if (!reportData.type || !reportData.details || !reportData.lat || !reportData.lng) {
      toast({ title: "Missing fields", description: "Please fill all fields and set location", variant: "destructive" })
      return
    }

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportData),
    })
    
    if (res.ok) {
      toast({ title: "Report submitted", description: "Thank you for reporting this incident" })
      setReportData({ type: "", details: "", lat: null, lng: null })
      setIsOpen(false)
    } else {
      const error = await res.json().catch(() => ({ error: "Unknown error" }))
      toast({ title: "Submit failed", description: error.error, variant: "destructive" })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Report Incident
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed inset-0 z-50 max-w-none h-screen m-0 p-0 bg-background border-0">
        {/* Full-screen overlay with form and map */}
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
            <DialogTitle className="text-lg font-semibold">Report Emergency Incident</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Main content - Map background with floating form */}
          <div className="flex-1 relative">
            {/* Full-screen map */}
            <div className="absolute inset-0">
              <MapboxMap 
                initial={userLocation} 
                height="100%"
              />
            </div>
            
            {/* Floating form panel */}
            <div className="absolute top-4 left-4 w-80 max-h-[calc(100vh-120px)] bg-background/95 backdrop-blur rounded-lg border shadow-lg overflow-hidden">
              <div className="p-4 space-y-4 max-h-full overflow-y-auto">
                <div>
                  <label className="text-sm font-medium mb-2 block">Incident Type</label>
                  <Select value={reportData.type} onValueChange={(value) => setReportData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select incident type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flood">Flood</SelectItem>
                      <SelectItem value="fire">Fire</SelectItem>
                      <SelectItem value="landslide">Landslide</SelectItem>
                      <SelectItem value="accident">Road Accident</SelectItem>
                      <SelectItem value="medical">Medical Emergency</SelectItem>
                      <SelectItem value="earthquake">Earthquake</SelectItem>
                      <SelectItem value="storm">Storm/Cyclone</SelectItem>
                      <SelectItem value="other">Other Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    placeholder="Describe the incident in detail..."
                    value={reportData.details}
                    onChange={(e) => setReportData(prev => ({ ...prev, details: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium block">Location</label>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={getCurrentLocation}
                      className="w-full"
                    >
                      <LocateFixed className="w-4 h-4 mr-2" />
                      Use My Location
                    </Button>
                    <Button 
                      variant={pinMode ? "default" : "outline"} 
                      onClick={enablePinMode}
                      className="w-full"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Pin on Map
                    </Button>
                  </div>

                  {reportData.lat && reportData.lng && (
                    <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      <strong>Selected:</strong> {reportData.lat.toFixed(4)}, {reportData.lng.toFixed(4)}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={submitReport} 
                    className="w-full"
                    disabled={!reportData.type || !reportData.details || !reportData.lat || !reportData.lng}
                  >
                    Submit Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
