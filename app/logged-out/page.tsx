"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function LoggedOutPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>You have been logged out</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">Thank you for using our service.</p>
          <Button asChild>
            <Link href="/">Return to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
