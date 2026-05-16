export const dynamic = 'force-dynamic'

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getTranslations } from "next-intl/server"
import { acknowledgeAlert, resolveAlert } from "@/lib/actions"

export default async function AlertsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const organizationId = (session.user as any).organizationId
  const t = await getTranslations()

  const alerts = await prisma.alert.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const activeCount = alerts.filter(a => a.status === "ACTIVE").length
  const acknowledgedCount = alerts.filter(a => a.status === "ACKNOWLEDGED").length
  const resolvedCount = alerts.filter(a => a.status === "RESOLVED").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("alerts.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("nav.alerts")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="text-center py-4">
            <p className="text-2xl font-bold text-red-600">{activeCount}</p>
            <p className="text-sm text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <p className="text-2xl font-bold text-yellow-600">{acknowledgedCount}</p>
            <p className="text-sm text-gray-500">Acknowledged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
            <p className="text-sm text-gray-500">Resolved</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("alerts.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-4xl mb-3">🔔</p>
              <p className="text-gray-500">{t("alerts.noAlerts")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start justify-between rounded-lg border p-4 ${
                    alert.status === "ACTIVE"
                      ? "border-red-200 bg-red-50"
                      : alert.status === "ACKNOWLEDGED"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-green-200 bg-green-50"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{alert.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        alert.status === "ACTIVE"
                          ? "bg-red-100 text-red-700"
                          : alert.status === "ACKNOWLEDGED"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{alert.description}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {alert.status === "ACTIVE" && (
                      <form action={async () => { "use server"; await acknowledgeAlert(alert.id) }}>
                        <button className="rounded-lg bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200">
                          {t("alerts.acknowledge")}
                        </button>
                      </form>
                    )}
                    {alert.status !== "RESOLVED" && (
                      <form action={async () => { "use server"; await resolveAlert(alert.id) }}>
                        <button className="rounded-lg bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200">
                          {t("alerts.resolve")}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
