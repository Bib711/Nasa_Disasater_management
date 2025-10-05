import Link from "next/link"
import { LoginTabs } from "@/components/auth/login-tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle } from "lucide-react"

export default function SignInPage() {
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
          <h2 className="text-xl font-semibold text-balance">Sign in to your account</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Access your disaster monitoring dashboard
          </p>
        </div>

        {/* Login Form */}
        <LoginTabs />

        {/* Additional Links */}
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Sign up here
          </Link>
        </div>
      </div>
    </main>
  )
}
