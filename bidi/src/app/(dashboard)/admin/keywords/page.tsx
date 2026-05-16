export const dynamic = 'force-dynamic'
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getTranslations } from "next-intl/server"

export default async function AdminKeywordsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const role = (session.user as any).role
  if (!["SUPER_ADMIN", "ADMIN"].includes(role)) redirect("/dashboard")

  const organizationId = (session.user as any).organizationId
  const t = await getTranslations()

  const keywords = await prisma.keyword.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  })

  const categories = [...new Set(keywords.map((k) => k.category))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("analysis.keywords")}</h1>
          <p className="mt-1 text-sm text-gray-500">Manage keywords for call analysis detection</p>
        </div>
      </div>

      {/* Category Groups */}
      {categories.map((category) => {
        const catKeywords = keywords.filter((k) => k.category === category)
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category.replace(/_/g, " ")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {catKeywords.map((kw) => (
                  <span
                    key={kw.id}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
                      kw.isActive
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500 line-through"
                    }`}
                  >
                    {kw.word}
                    {kw.severity !== "info" && (
                      <span className={`text-xs ${
                        kw.severity === "critical" ? "text-red-500" :
                        kw.severity === "high" ? "text-orange-500" : "text-yellow-500"
                      }`}>
                        ●
                      </span>
                    )}
                  </span>
                ))}
                {catKeywords.length === 0 && (
                  <p className="text-sm text-gray-500">No keywords in this category</p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {keywords.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-4xl mb-3">🔑</p>
          <p className="text-gray-500">{t("admin.noKeywordsDesc")}</p>
        </div>
      )}
    </div>
  )
}
