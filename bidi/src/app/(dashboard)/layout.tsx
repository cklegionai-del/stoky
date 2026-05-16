import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardNavbar } from "@/components/dashboard/navbar"
import { getLocale } from "next-intl/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      organization: true,
      team: true,
    },
  })

  if (!user || !user.isActive) {
    redirect("/login")
  }

  const org = user.organization
  const locale = await getLocale()

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar
        userRole={user.role}
        userName={user.name}
        userEmail={user.email}
        orgName={org.name}
        orgLogo={org.logo}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardNavbar
          userName={user.name}
          userRole={user.role}
          teamName={user.team?.name}
          currentLocale={locale}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
