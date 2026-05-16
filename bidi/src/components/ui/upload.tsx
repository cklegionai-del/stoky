"use c// src/components/ui/upload.tsx
'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'

interface UploadProps {
  onUpload: (file: File) => Promise<void>
  accept?: string
}

export function Upload({ onUpload, accept }: UploadProps) {
  const t = useTranslations('calls')
  const [isUploading, setIsUploading] = useState(false)

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      setIsUploading(true)
      try {
        await onUpload(file)
      } finally {
        setIsUploading(false)
      }
    }
  }, [onUpload])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      try {
        await onUpload(file)
      } finally {
        setIsUploading(false)
      }
    }
  }, [onUpload])

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed rounded-lg p-12 text-center hover:border-blue-500 transition-colors"
    >
      <div className="text-6xl mb-4">🎙️</div>
      <h3 className="text-xl font-semibold mb-2">
        {t('upload.dragDrop') || 'Drag and drop or click to browse'}
      </h3>
      <p className="text-gray-500 mb-4">
        {t('upload.formats') || 'MP3, WAV, TXT, PDF, XLSX (max 500MB)'}
      </p>
      <input
        type="file"
        accept={accept || '.mp3,.wav,.txt,.pdf,.xlsx,.xls,.csv'}
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
      >
        {t('upload.browse') || 'Browse Files'}
      </label>
      {isUploading && (
        <div className="mt-4 text-blue-600">
          {t('upload.processing') || 'Processing...'}
        </div>
      )}
    </div>
  )
}lient"

import { useState, useRef } from "react"
import { useTranslations } from "next-intl"

interface UploadZoneProps {
  onUpload: (file: File, language: string, teamId?: string, agentId?: string) => Promise<void>
  uploading: boolean  error: string | null
  teams: Array<{ id: string; name: string }>
  agents: Array<{ id: string; name: string }>
}

export function UploadZone({ onUpload, uploading, error, teams, agents }: UploadZoneProps) {
  const t = useTranslations()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState("EN")
  const [teamId, setTeamId] = useState("")
  const [agentId, setAgentId] = useState("")

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.type.includes("audio") || f.name.endsWith(".mp3") || f.name.endsWith(".wav"))) {
      setFile(f)
    }
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  async function handleUpload() {
    if (!file) return
    await onUpload(file, language, teamId || undefined, agentId || undefined)
    setFile(null)
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-8">
      {!file ? (
        <div
          className={`flex flex-col items-center justify-center py-8 ${dragOver ? "border-blue-500 bg-blue-50" : ""}`}
    ˚      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <p className="text-4xl mb-4">🎙️</p>
          <p className="text-lg font-medium text-gray-900">{t("calls.dragDrop")}</p>
          <p className="mt-1 text-sm text-gray-500">{t("calls.maxFileSize")}</p>
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Browse Files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.wav,audio/*"
            className="hidden"
            onChange={handleSelect}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
     ˚       <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-sm text-red-600 hover:text-red-500"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("calls.language")}</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="EN">English</option>
                <option value="AR">Arabic</option>
                <option value="FR">French</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("team.title") || "Team"}</label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">{t("calls.noTeam")}</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("calls.agent")}</label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">{t("calls.noAgent")}</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {uploading ? t("calls.processing") : t("calls.upload")}
          </button>
        </div>
      )}
    </div>
  )
}
