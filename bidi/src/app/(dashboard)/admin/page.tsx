import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { getTranslations } from "next-intl/server"

export const dynamic = 'force-dynamic'
export default async function AdminDashboard() {
  const session = await auth()

  if (!session?.user?.id) redirect("/login")

  const role = (session.user as any).role
  if (!["SUPER_ADMIN", "ADMIN"].includes(role)) redirect("/dashboard")

  const organizationId = (session.user as any).organizationId
  const t = await getTranslations()

  // Parallel queries for dashboard stats
  const [
    totalCalls,
    totalUsers,
    totalTeams,
    totalAlerts,
    recentCalls,
    avgScore,
    complianceRate,
    avgSentiment,
    callsByStatus,
    callsToday,
  ] = await Promise.all([
    prisma.call.count({ where: { organizationId } }),
    prisma.user.count({ where: { organizationId, isActive: true } }),
    prisma.team.count({ where: { organizationId } }),
    prisma.alert.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.call.findMany({
      where: { organizationId },
      include: {
        agent: { select: { id: true, name: true } },
        analysis: { select: { overallScore: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.analysis.aggregate({
      where: { call: { organizationId }, status: "COMPLETED" },
      _avg: { overallScore: true },
    }),
    prisma.scriptCheck.aggregate({
      where: { analysis: { call: { organizationId } } },
      _avg: { score: true },
    }),
    prisma.analysis.aggregate({
      where: { call: { organizationId }, status: "COMPLETED" },
      _avg: { sentimentScore: true },
    }),
    prisma.call.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: true,
    }),
    prisma.call.count({
      where: {
        organizationId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ])

  const avgScoreValue = Math.round(avgScore._avg.overallScore || 0)
  const complianceRateValue = Math.round((complianceRate._avg.score || 0) * 100)
  const sentimentValue = (avgSentiment._avg.sentimentScore || 0).toFixed(2)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("admin.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("admin.overview")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("dashboard.totalCalls")}
          value={totalCalls}
          change={`${callsToday} ${t("dashboard.today")}`}
          changeType="positive"
          icon="🎧"
        />
        <StatCard
          title={t("dashboard.averageScore")}
          value={`${avgScoreValue}%`}
          changeType={avgScoreValue >= 70 ? "positive" : "negative"}
          icon="⭐"
        />
        <StatCard
          title={t("dashboard.complianceRate")}
          value={`${complianceRateValue}%`}
          changeType={complianceRateValue >= 80 ? "positive" : "negative"}
          icon="✅"
        />
        <StatCard
          title={t("dashboard.alertsActive")}
          value={totalAlerts}
          changeType={totalAlerts > 0 ? "negative" : "positive"}
          icon="🔔"
        />
      </div>

      {/* Team Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.teamPerformance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="font-medium text-gray-900">{t("team.members")}</p>
                  <p className="text-sm text-gray-500">{t("team.title")}</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="font-medium text-gray-900">{t("team.title")}</p>
                  <p className="text-sm text-gray-500">{t("admin.overview")}</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalTeams}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="font-medium text-gray-900">{t("analysis.sentiment")}</p>
                  <p className="text-sm text-gray-500">{t("analysis.overallScore")}</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{sentimentValue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentCalls")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCalls.slice(0, 5).map((call) => (
                <div key={call.id} className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{call.fileName}</p>
                    <p className="text-xs text-gray-500">{call.agent?.name || t("common.noAgent")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {call.analysis?.overallScore != null && (
                      <span className="text-sm font-semibold text-gray-900">{call.analysis.overallScore}</span>
                    )}
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                      {call.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calls by Status */}
      <Card>
        <CardHeader>
          <CardTitle>{t("calls.status")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {callsByStatus.map((s) => (
              <div
                key={s.status}
                className="flex-1 rounded-lg bg-gray-50 p-4 text-center"
              >
                <p className="text-2xl font-bold text-gray-900">{s._count}</p>
                <p className="text-sm text-gray-500">{s.status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
