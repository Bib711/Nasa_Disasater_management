"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, MapPin, X, LocateFixed } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
    // Enhanced validation
    if (!reportData.type) {
      toast({ title: "Missing incident type", description: "Please select an incident type", variant: "destructive" })
      return
    }
    
    if (!reportData.details || reportData.details.trim().length < 10) {
      toast({ title: "Missing description", description: "Please provide a detailed description (at least 10 characters)", variant: "destructive" })
      return
    }
    
    if (!reportData.lat || !reportData.lng) {
      toast({ title: "Missing location", description: "Please set the incident location using 'Use My Location' or 'Pin on Map'", variant: "destructive" })
      return
    }

    // Validate coordinates are reasonable (within Earth's bounds)
    if (Math.abs(reportData.lat) > 90 || Math.abs(reportData.lng) > 180) {
      toast({ title: "Invalid location", description: "Location coordinates are invalid. Please try again.", variant: "destructive" })
      return
    }

    try {
      // Format data to match API expectations
      const submissionData = {
        type: reportData.type,
        details: reportData.details.trim(),
        location: {
          type: "Point",
          coordinates: [reportData.lng, reportData.lat] // GeoJSON format: [longitude, latitude]
        }
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      })
      
      if (res.ok) {
        const result = await res.json()
        toast({ 
          title: "Report submitted successfully", 
          description: `Report ID: ${result.report._id.slice(-6)}. Rescue workers have been notified.` 
        })
        setReportData({ type: "", details: "", lat: null, lng: null })
        setIsOpen(false)
      } else {
        const error = await res.json().catch(() => ({ error: "Failed to submit report" }))
        console.error("Report submission error:", error)
        toast({ 
          title: "Submit failed", 
          description: error.error || "Unable to submit report. Please try again.", 
          variant: "destructive" 
        })
      }
    } catch (err) {
      console.error("Network error:", err)
      toast({ 
        title: "Network error", 
        description: "Unable to connect to server. Please check your internet connection.", 
        variant: "destructive" 
      })
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
      <DialogContent className="w-full max-w-md mx-auto my-8 p-0 border bg-background shadow-lg rounded-lg">
        <div className="flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
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
          
          {/* Form Content */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="text-sm font-medium mb-2 block">Incident Type</label>
              <Select value={reportData.type} onValueChange={(value) => setReportData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flood">🌊 Flood</SelectItem>
                  <SelectItem value="fire">🔥 Fire</SelectItem>
                  <SelectItem value="landslide">⛰️ Landslide</SelectItem>
                  <SelectItem value="accident">🚗 Road Accident</SelectItem>
                  <SelectItem value="medical">🏥 Medical Emergency</SelectItem>
                  <SelectItem value="earthquake">🌍 Earthquake</SelectItem>
                  <SelectItem value="storm">🌪️ Storm/Cyclone</SelectItem>
                  <SelectItem value="other">⚠️ Other Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="Describe the incident in detail..."
                value={reportData.details}
                onChange={(e) => setReportData(prev => ({ ...prev, details: e.target.value }))}
                className="min-h-[100px] resize-none"
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
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">📍</span>
                    <div>
                      <div className="font-medium">Location Selected</div>
                      <div className="text-xs">{reportData.lat.toFixed(4)}, {reportData.lng.toFixed(4)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={submitReport} 
                className="w-full"
                disabled={!reportData.type || !reportData.details || !reportData.lat || !reportData.lng}
              >
                📤 Submit Report
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
