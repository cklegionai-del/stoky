"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"

interface NavItemConfig {
  titleKey: string
  href: string
  icon: string
  roles: UserRole[]
}

const navItems: NavItemConfig[] = [
  { titleKey: "nav.dashboard", href: "/dashboard", icon: "📊", roles: ["SUPER_ADMIN", "ADMIN", "TEAM_LEADER", "REVIEWER", "EMPLOYEE"] },
  { titleKey: "nav.calls", href: "/calls", icon: "🎧", roles: ["SUPER_ADMIN", "ADMIN", "TEAM_LEADER", "REVIEWER", "EMPLOYEE"] },
  { titleKey: "nav.evaluations", href: "/reviewer", icon: "📝", roles: ["REVIEWER", "TEAM_LEADER", "ADMIN"] },
  { titleKey: "nav.team", href: "/team-leader", icon: "👥", roles: ["TEAM_LEADER", "ADMIN"] },
  { titleKey: "nav.coaching", href: "/employee/coaching", icon: "🎯", roles: ["EMPLOYEE"] },
  { titleKey: "nav.alerts", href: "/admin/alerts", icon: "🔔", roles: ["ADMIN", "SUPER_ADMIN", "TEAM_LEADER"] },
  { titleKey: "nav.admin", href: "/admin", icon: "⚙️", roles: ["ADMIN", "SUPER_ADMIN"] },
]

interface SidebarProps {
  userRole: string
  userName: string
  userEmail: string | null
  orgName: string
  orgLogo: string | null
}

export function DashboardSidebar({ userRole, userName, userEmail, orgName, orgLogo }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations()

  const filteredItems = navItems.filter(
    (item) => item.roles.includes(userRole as UserRole)
  )

  // Deduplicate by href
  const uniqueItems = filteredItems.filter(
    (item, index, self) => index === self.findIndex((i) => i.href === item.href)
  )

  return (
    <aside className="flex w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        {orgLogo ? (
          <img src={orgLogo} alt={orgName} className="h-8 w-8 rounded-lg" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            O
          </div>
        )}
        <span className="text-lg font-semibold text-gray-900">{orgName}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {uniqueItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href + item.titleKey}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{t(item.titleKey)}</span>
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
