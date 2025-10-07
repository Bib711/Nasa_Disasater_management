"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Building2, MapPin, Loader2 } from "lucide-react"

export function AddReliefCenterDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    details: "",
    lat: "",
    lng: ""
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/relief-centers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          details: formData.details,
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng)
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Relief Center Added",
          description: `${formData.name} has been successfully added to the map.`,
        })
        setFormData({ name: "", details: "", lat: "", lng: "" })
        setOpen(false)
        
        // Trigger a refresh of relief centers data
        window.dispatchEvent(new CustomEvent("reliefCenterAdded"))
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add relief center",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding relief center:", error)
      toast({
        title: "Error", 
        description: "Failed to add relief center. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Available",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6)
        }))
        toast({
          title: "Location Retrieved",
          description: "Current location has been set as relief center location.",
        })
      },
      (error) => {
        toast({
          title: "Location Error",
          description: "Unable to retrieve your current location.",
          variant: "destructive",
        })
      }
    )
  }

  return (
    <>
      {/* Loading Overlay - appears above everything */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4 min-w-[200px]">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <div className="text-sm font-medium text-center">
              Adding Relief Center...
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Please wait while we add the relief center to the map
            </div>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white w-full">
            <Building2 className="w-4 h-4 mr-2" />
            🏥 Add Relief Center
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] z-50">
          <DialogHeader>
            <DialogTitle>Add New Relief Center</DialogTitle>
            <DialogDescription>
              Add a new relief center that will be visible to all users on the map.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Relief Center Name *</Label>
              <Input
                id="name"
                placeholder="e.g., City General Hospital"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="details">Details (Optional)</Label>
              <Textarea
                id="details"
                placeholder="e.g., 24/7 emergency services, trauma center"
                value={formData.details}
                onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude *</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  placeholder="e.g., 40.7128"
                  value={formData.lat}
                  onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude *</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  placeholder="e.g., -74.0060"
                  value={formData.lng}
                  onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                  required
                />
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              onClick={getCurrentLocation}
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Use Current Location
            </Button>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.name || !formData.lat || !formData.lng}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? "Adding..." : "Add Relief Center"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}