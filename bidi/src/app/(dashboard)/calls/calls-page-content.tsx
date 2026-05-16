"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card } from "@/components/ui/card"
import { RecentCalls } from "@/components/dashboard/recent-calls"
import { UploadZone } from "@/components/ui/upload"
import { uploadCall } from "@/lib/actions"
import type { CallWithRelations } from "@/types"

interface CallsPageContentProps {
  calls: CallWithRelations[]
  teams: Array<{ id: string; name: string }>
  agents: Array<{ id: string; name: string }>
  organizationId: string
}

export function CallsPageContent({ calls, teams, agents }: CallsPageContentProps) {
  const t = useTranslations()
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(file: File, language: string, teamId?: string, agentId?: string) {
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("language", language)
      if (teamId) formData.append("teamId", teamId)
      if (agentId) formData.append("agentId", agentId)

      const result = await uploadCall(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setShowUpload(false)
      }
    } catch (err) {
      setError(t("calls.uploadFailed"))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("calls.upload")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("calls.uploadDescription")}</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          {showUpload ? t("common.cancel") : t("calls.upload")}
        </button>
      </div>

      {showUpload && (
        <UploadZone
          onUpload={handleUpload}
          uploading={uploading}
          error={error}
          teams={teams}
          agents={agents}
        />
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("calls.title")}</h2>
        <RecentCalls calls={calls} />
      </div>
    </div>
  )
}
