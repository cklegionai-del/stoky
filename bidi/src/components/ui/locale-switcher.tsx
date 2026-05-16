"use client"

import { useState, useTransition } from "react"
import { useRouter } from "@/navigation"

const locales = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
] as const

const localeCodes = ["en", "fr", "ar", "nl"] as const

interface LocaleSwitcherProps {
  currentLocale: string
  variant?: "dropdown" | "inline"
}

export function LocaleSwitcher({ currentLocale, variant = "dropdown" }: LocaleSwitcherProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const current = locales.find((l) => l.code === currentLocale) || locales[0]

  function switchLocale(code: string) {
    // Set the NEXT_LOCALE cookie for middleware
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Strict`

    startTransition(() => {
      // Navigate to the same path with the new locale prefix
      const currentPath = window.location.pathname
      const segments = currentPath.split("/").filter(Boolean)
      const firstSegment = segments[0]
      const isLocale = localeCodes.includes(firstSegment as (typeof localeCodes)[number])

      let newPath: string
      if (isLocale) {
        if (code === "en") {
          // Default locale has no prefix
          newPath = "/" + segments.slice(1).join("/")
        } else {
          segments[0] = code
          newPath = "/" + segments.join("/")
        }
      } else {
        if (code === "en") {
          newPath = currentPath
        } else {
          newPath = "/" + code + currentPath
        }
      }

      if (!newPath || newPath === "/") newPath = "/"
      router.push(newPath)
    })

    setOpen(false)
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-1">
        {locales.map((locale) => (
          <button
            key={locale.code}
            onClick={() => switchLocale(locale.code)}
            disabled={isPending}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              locale.code === currentLocale
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            <span>{locale.flag}</span>
            <span className="hidden sm:inline">{locale.label}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-20 py-1">
            {locales.map((locale) => (
              <button
                key={locale.code}
                onClick={() => switchLocale(locale.code)}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                  locale.code === currentLocale
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{locale.flag}</span>
                <span>{locale.label}</span>
                {locale.code === currentLocale && (
                  <span className="ml-auto text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
