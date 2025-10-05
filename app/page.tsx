import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Shield, MapPin, Users } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jaagratha</h1>
          </div>
          <div className="space-x-4">
            <Button variant="outline" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Disaster Vigilance for
            <span className="text-orange-600"> Safer Communities</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Advanced disaster prediction and emergency response system. Get real-time alerts, 
            coordinate rescue operations, and protect your community with cutting-edge technology.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link href="/signin">Access Dashboard</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/signup">Join as Citizen</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Real-time Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Live maps with disaster tracking, weather monitoring, and risk assessment for your area.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Smart Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Instant notifications for potential disasters with AI-powered prediction and early warning systems.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Rescue Coordination</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Efficient coordination between rescue teams, relief centers, and emergency services.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-orange-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Protect Your Community?</h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users already using Jaagratha for disaster preparedness.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signin">Start Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-6 w-6" />
            <span className="text-lg font-semibold">Jaagratha — Disaster Vigilance</span>
          </div>
          <p className="text-gray-400">
            Protecting communities through technology and preparedness.
          </p>
        </div>
      </footer>
    </main>
  )
}
