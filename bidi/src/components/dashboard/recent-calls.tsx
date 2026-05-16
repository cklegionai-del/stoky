"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { formatDate, formatDuration, getStatusBadgeColor, getScoreColor } from "@/lib/utils"
import type { CallWithRelations } from "@/types"

interface RecentCallsProps {
  calls: CallWithRelations[]
}

export function RecentCalls({ calls }: RecentCallsProps) {
  const t = useTranslations()

  if (calls.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-4xl mb-3">🎧</p>
        <p className="text-gray-500">{t("calls.noCalls")}</p>
        <Link
          href="/calls"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          {t("calls.upload")}
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("calls.fileName")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("calls.agent")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("calls.duration")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("calls.date")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("calls.status")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("analysis.overallScore")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {calls.map((call) => (
              <tr key={call.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {call.fileName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {call.agent?.name || "—"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDuration(call.durationSeconds)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(call.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(call.status)}`}>
                    {call.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-semibold ${getScoreColor(call.analysis?.overallScore || null)}`}>
                    {call.analysis?.overallScore != null ? `${call.analysis.overallScore}` : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/calls/${call.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    {t("calls.view")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
