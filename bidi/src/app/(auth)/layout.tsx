import { LocaleSwitcher } from "@/components/ui/locale-switcher"
import { getLocale } from "next-intl/server"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher currentLocale={locale} variant="dropdown" />
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
