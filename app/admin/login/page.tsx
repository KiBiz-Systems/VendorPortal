"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PortalBrand } from "@/components/portal-brand"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.value = ""
    }

    if (passwordRef.current) {
      passwordRef.current.value = ""
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please fill in all required fields.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "An unexpected error occurred.")
        setIsLoading(false)
        return
      }

      router.replace("/admin")
    } catch {
      setError("Failed to connect to the authentication server.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary/20">
      <div className="w-full max-w-md space-y-8 p-10 bg-card rounded-2xl shadow-xl border-t-[3px] border-t-primary border-x border-b border-border/50 transition-all">
        <div className="flex flex-col items-center space-y-4 text-center">
          <PortalBrand
            className="flex-col"
            logoClassName="h-16 w-36 sm:h-18 sm:w-40"
          />
          <h2 className="text-[1.9rem] font-extrabold leading-none tracking-tight text-primary [font-family:var(--font-portal-brand),var(--font-sans),sans-serif] sm:text-[2.2rem]">
            Admin Login
          </h2>
          <p className="text-sm text-muted-foreground">Sign in to view all vendor orders</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6" autoComplete="off">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-500 dark:border-red-900/50 dark:bg-red-950/50">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                ref={emailRef}
                id="email"
                name="admin-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                disabled={isLoading}
                className="transition-all hover:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                ref={passwordRef}
                id="password"
                name="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isLoading}
                className="transition-all hover:border-primary/50"
              />
            </div>
          </div>

          <Button type="submit" className="group w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
            {!isLoading && (
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Are you a vendor?{" "}
          <Link
            href="/login"
            className="font-medium text-primary transition-colors hover:text-primary/90 hover:underline"
          >
            Sign in as Vendor
          </Link>
        </p>
      </div>

      <div className="mt-10 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        Â© 2023 U.S. SPICE MILLS INC. | INTERNAL ACCESS ONLY
      </div>
    </div>
  )
}
