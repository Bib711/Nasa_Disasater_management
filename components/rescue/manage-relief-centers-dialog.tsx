"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Building2, Trash2, MapPin, Loader2, RefreshCw } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ReliefCenter {
  _id: string
  name: string
  details?: string
  location: {
    type: string
    coordinates: [number, number] // [lng, lat]
  }
  createdAt: string
}

export function ManageReliefCentersDialog() {
  const [open, setOpen] = useState(false)
  const [centers, setCenters] = useState<ReliefCenter[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchCenters = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/relief-centers")
      const data = await response.json()
      if (response.ok) {
        setCenters(data.centers || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch relief centers",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching centers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch relief centers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteCenter = async (id: string, name: string) => {
    setDeleting(id)
    try {
      const response = await fetch("/api/relief-centers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Relief Center Removed",
          description: `${name} has been successfully removed from the map.`,
        })
        // Remove from local state
        setCenters(prev => prev.filter(center => center._id !== id))
        
        // Trigger a refresh of relief centers data on maps
        window.dispatchEvent(new CustomEvent("reliefCenterAdded"))
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to remove relief center",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting center:", error)
      toast({
        title: "Error",
        description: "Failed to remove relief center. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  // Fetch centers when dialog opens
  useEffect(() => {
    if (open) {
      fetchCenters()
    }
  }, [open])

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Building2 className="w-4 h-4 mr-2" />
            🏥 Manage Relief Centers
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Manage Relief Centers
            </AlertDialogTitle>
            <AlertDialogDescription>
              View and remove relief centers from the map. Removed centers will no longer be visible to users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {centers.length} relief center{centers.length !== 1 ? 's' : ''} found
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchCenters}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                <span className="ml-2 text-sm text-muted-foreground">Loading relief centers...</span>
              </div>
            ) : centers.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No relief centers found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add some relief centers first to manage them here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {centers.map((center) => (
                  <Card key={center._id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-sm">{center.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              🏥 Health Center
                            </Badge>
                          </div>
                          
                          {center.details && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {center.details}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {center.location.coordinates[1].toFixed(4)}°, {center.location.coordinates[0].toFixed(4)}°
                            </div>
                            <div>
                              Added: {new Date(center.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={deleting === center._id}
                            >
                              {deleting === center._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Relief Center</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove <strong>{center.name}</strong>? 
                                This action cannot be undone and the relief center will no longer be visible on the map.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteCenter(center._id, center.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <AlertDialogFooter className="border-t pt-4 mt-4">
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}