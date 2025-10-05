"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export function LoginTabs() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"citizen" | "rescue_worker">("citizen")
  const [error, setError] = useState("") // 👈 added for invalid credentials label
  const router = useRouter()
  const { toast } = useToast()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("") // reset error each time

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      role,
    })

    if (res?.ok) {
      toast({ title: "Signed in", description: "Welcome back!" })
      router.replace(role === "citizen" ? "/dashboard" : "/rescue")
    } else {
      setError("Invalid credentials. Please try again.") // 👈 show label
    }
  }

  return (
    <Tabs value={role} onValueChange={(v: any) => setRole(v)}>
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="citizen">Citizen</TabsTrigger>
        <TabsTrigger value="rescue_worker">Rescue Worker</TabsTrigger>
      </TabsList>

      {/* Citizen Login */}
      <TabsContent value="citizen">
        <form onSubmit={onSubmit} className="space-y-3 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email-c">Email</Label>
            <Input id="email-c" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-c">Password</Label>
            <Input
              id="password-c"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* 👇 Invalid credentials label */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full">
            Sign In
          </Button>

          {/*<p className="text-sm text-muted-foreground text-center">
            No account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </p>*/}
        </form>
      </TabsContent>

      {/* Rescue Worker Login */}
      <TabsContent value="rescue_worker">
        <form onSubmit={onSubmit} className="space-y-3 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email-r">Email</Label>
            <Input id="email-r" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-r">Password</Label>
            <Input
              id="password-r"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* 👇 Invalid credentials label */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  )
}
