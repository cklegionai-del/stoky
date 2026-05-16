export const dynamic = 'force-dynamic'
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getTranslations } from "next-intl/server"

export default async function AdminRubricsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const role = (session.user as any).role
  if (!["SUPER_ADMIN", "ADMIN"].includes(role)) redirect("/dashboard")

  const organizationId = (session.user as any).organizationId
  const t = await getTranslations()

  const rubrics = await prisma.rubric.findMany({
    where: { organizationId },
    include: {
      _count: { select: { criteria: true, evaluations: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("admin.rubrics")}</h1>
          <p className="mt-1 text-sm text-gray-500">Manage evaluation rubrics and criteria</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rubrics.map((rubric) => (
          <Card key={rubric.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{rubric.name}</CardTitle>
                {rubric.isDefault && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Default
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">{rubric.description || t("admin.noDescription")}</p>
              <div className="flex gap-4">
                <div className="flex-1 rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{rubric._count.criteria}</p>
                  <p className="text-xs text-gray-500">Criteria</p>
                </div>
                <div className="flex-1 rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{rubric._count.evaluations}</p>
                  <p className="text-xs text-gray-500">Evaluations</p>
                </div>
                <div className="flex-1 rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{rubric.passingScore}%</p>
                  <p className="text-xs text-gray-500">Passing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {rubrics.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500">{t("admin.noRubrics")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
