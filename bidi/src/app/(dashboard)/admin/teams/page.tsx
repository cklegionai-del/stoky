export const dynamic = 'force-dynamic'
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getTranslations } from "next-intl/server"

export default async function AdminTeamsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const role = (session.user as any).role
  if (!["SUPER_ADMIN", "ADMIN"].includes(role)) redirect("/dashboard")

  const organizationId = (session.user as any).organizationId
  const t = await getTranslations()

  const teams = await prisma.team.findMany({
    where: { organizationId },
    include: {
      _count: { select: { members: true, calls: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("team.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">Manage teams in your organization</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <CardTitle>{team.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">{team.description || t("admin.noDescription")}</p>
              <div className="flex gap-4">
                <div className="flex-1 rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{team._count.members}</p>
                  <p className="text-xs text-gray-500">Members</p>
                </div>
                <div className="flex-1 rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{team._count.calls}</p>
                  <p className="text-xs text-gray-500">Calls</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {teams.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-500">{t("admin.noTeams")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
