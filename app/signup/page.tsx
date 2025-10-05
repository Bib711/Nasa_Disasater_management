"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, AlertTriangle } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [coords, setCoords] = useState<[number, number] | null>(null) // [lng, lat]
  const [loadingLoc, setLoadingLoc] = useState(false)

  useEffect(() => {
    setLoadingLoc(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords([pos.coords.longitude, pos.coords.latitude])
          setLoadingLoc(false)
        },
        () => setLoadingLoc(false),
        { enableHighAccuracy: true, timeout: 8000 },
      )
    } else {
      setLoadingLoc(false)
    }
  }, [])

  async function onSubmit(formData: FormData) {
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      password: String(formData.get("password") || ""),
      role: "citizen",
      location: coords ? { type: "Point", coordinates: coords } : undefined,
    }
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      toast({ title: "Account created", description: "You can sign in now." })
      router.replace("/")
    } else {
      const j = await res.json().catch(() => ({}))
      toast({ title: "Sign up failed", description: j?.error || "Please try again", variant: "destructive" })
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6">
        {/* Back to Landing Page */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <h1 className="text-2xl font-bold">Jaagratha</h1>
          </div>
          <h2 className="text-xl font-semibold">Create your account</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Join our disaster response network
          </p>
        </div>

        {/* Signup Form */}
        <form action={onSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div className="text-sm text-muted-foreground">
            Location:{" "}
            {loadingLoc
              ? "Locating..."
              : coords
                ? `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`
                : "Not set (optional)"}
          </div>
          <Button type="submit" className="w-full">
            Sign Up
          </Button>
        </form>

        {/* Additional Links */}
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/signin" className="text-primary hover:underline font-medium">
            Sign in here
          </Link>
        </div>
      </div>
    </main>
  )
}
