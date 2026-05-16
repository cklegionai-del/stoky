"use client"

import { useState } from "react"
import { useRouter } from "@/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { Input } from "@/components/ui/Input"

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to create account")
        return
      }

      // Auto sign in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Account created but sign in failed. Please try logging in.")
        return
      }

      router.push("/")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full Name"
        name="name"
        type="text"
        placeholder="Jane Doe"
        required
        autoComplete="name"
      />

      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="you@example.com"
        required
        autoComplete="email"
      />

      <Input
        label="Password"
        name="password"
        type="password"
        placeholder="Min. 8 characters"
        required
        autoComplete="new-password"
      />

      <Input
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        placeholder="Repeat your password"
        required
        autoComplete="new-password"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3" role="alert">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Create Account
      </Button>

      <p className="text-xs text-muted text-center">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-terra-600 hover:text-terra-700">Terms of Service</Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-terra-600 hover:text-terra-700">Privacy Policy</Link>
      </p>
    </form>
  )
}
