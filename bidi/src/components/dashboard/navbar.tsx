"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { logout } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { LocaleSwitcher } from "@/components/ui/locale-switcher"

interface NavbarProps {
  userName: string
  userRole: string
  teamName?: string | null
  currentLocale: string
}

export function DashboardNavbar({ userName, userRole, teamName, currentLocale }: NavbarProps) {
  const t = useTranslations()
  const router = useRouter()

  const roleLabel = t(`roles.${userRole.toLowerCase()}`) || userRole

  async function handleLogout() {
    await logout()
    router.push("/login")
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-900">{t("nav.dashboard")}</h1>
        <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
          {roleLabel}
        </span>
        {teamName && (
          <span className="text-sm text-gray-500">
            — {teamName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/calls"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          {t("nav.upload")}
        </Link>

        <Link
          href="/settings"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {t("nav.settings")}
        </Link>

        <LocaleSwitcher currentLocale={currentLocale} variant="dropdown" />

        <form action={handleLogout}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {t("nav.logout")}
          </button>
        </form>
      </div>
    </header>
  )
}
