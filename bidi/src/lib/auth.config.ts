import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { loginSchema } from "./validations"
import { locales, defaultLocale } from "@/i18n"

function getLocalePrefix(pathname: string): string {
  const firstSegment = pathname.split("/")[1]
  if (locales.includes(firstSegment as any) && firstSegment !== defaultLocale) {
    return `/${firstSegment}`
  }
  return ""
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const userRole = (auth?.user as any)?.role
      const pathname = nextUrl.pathname
      const localePrefix = getLocalePrefix(pathname)

      // API routes handle their own auth
      if (pathname.startsWith("/api")) return true

      // Static files and _next
      if (pathname.startsWith("/_next") || pathname.includes(".")) return true

      // Auth pages
      if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
        if (isLoggedIn) return Response.redirect(new URL(`${localePrefix}/dashboard`, nextUrl))
        return true
      }

      // Already logged in users shouldn't see auth pages
      if (pathname.startsWith("/(auth)") && isLoggedIn) {
        return Response.redirect(new URL(`${localePrefix}/dashboard`, nextUrl))
      }

      // Protected routes
      if (!isLoggedIn) return false

      // Admin route - only SUPER_ADMIN and ADMIN
      if (pathname.startsWith("/admin") && !["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
        return Response.redirect(new URL(`${localePrefix}/dashboard`, nextUrl))
      }

      // Team Leader routes
      if (pathname.startsWith("/team-leader") && !["SUPER_ADMIN", "ADMIN", "TEAM_LEADER"].includes(userRole)) {
        return Response.redirect(new URL(`${localePrefix}/dashboard`, nextUrl))
      }

      // Reviewer routes
      if (pathname.startsWith("/reviewer") && !["SUPER_ADMIN", "ADMIN", "TEAM_LEADER", "REVIEWER"].includes(userRole)) {
        return Response.redirect(new URL(`${localePrefix}/dashboard`, nextUrl))
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || "EMPLOYEE"
        token.organizationId = (user as any).organizationId
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) || "EMPLOYEE"
        ;(session.user as any).organizationId = token.organizationId as string
      }
      return session
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null
        const { email, password } = parsed.data
        return { email, password, id: email } as any
      },
    }),
  ],
}
