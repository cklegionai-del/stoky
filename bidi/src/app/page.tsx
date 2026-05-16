import { getTranslations, getLocale } from "next-intl/server"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LocaleSwitcher } from "@/components/ui/locale-switcher"

export default async function HomePage() {
  const session = await auth()
  const t = await getTranslations()
  const locale = await getLocale()

  if (session?.user) {
    redirect("/dashboard")
  }

  const features = [
    {
      title: t("app.feature1Title"),
      description: t("app.feature1Desc"),
      icon: "🎙️",
    },
    {
      title: t("app.feature2Title"),
      description: t("app.feature2Desc"),
      icon: "🧠",
    },
    {
      title: t("app.feature3Title"),
      description: t("app.feature3Desc"),
      icon: "📊",
    },
    {
      title: t("app.feature4Title"),
      description: t("app.feature4Desc"),
      icon: "⭐",
    },
    {
      title: t("app.feature5Title"),
      description: t("app.feature5Desc"),
      icon: "✅",
    },
    {
      title: t("app.feature6Title"),
      description: t("app.feature6Desc"),
      icon: "🔒",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-sm font-bold text-white">
                O
              </div>
              <span className="text-lg font-semibold text-white">{t("app.name")}</span>
            </div>
            <div className="flex items-center gap-4">
              <LocaleSwitcher currentLocale={locale} variant="inline" />
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
              >
                {t("auth.login")}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                {t("auth.register")}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 pt-20 pb-16 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {t("app.heroTitle")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            {t("app.heroSubtitle")}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-blue-500"
            >
              {t("app.startTrial")}
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-white/20 px-8 py-3 text-base font-medium text-gray-300 transition-colors hover:border-white/40 hover:text-white"
            >
              {t("auth.login")}
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:border-white/20"
              >
                <div className="text-3xl">{feature.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-8 text-center sm:px-6 lg:px-8">
            <p className="text-sm text-gray-500">{t("app.footer")}</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
