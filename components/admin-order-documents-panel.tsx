"use client"

import { useEffect, useMemo, useState } from "react"
import { Circle, CircleCheck, FileText } from "lucide-react"
import { DEFAULT_DOCUMENT_TYPES } from "@/config/orderDocuments"

type DocumentStatus = "Not uploaded" | "Uploaded" | "Synced" | "Approved" | "Rejected"

type DocumentSlot = {
  type: string
  fileName: string | null
  fileType: string | null
  previewUrl: string | null
  status: DocumentStatus
  locked: boolean
  fileId: string | null
}

type RemoteDocumentSlot = DocumentSlot

type OrderDocumentsApiResponse = {
  success: boolean
  documents?: RemoteDocumentSlot[]
  error?: string
}

function createEmptySlot(type: string): DocumentSlot {
  return {
    type,
    fileName: null,
    fileType: null,
    previewUrl: null,
    status: "Not uploaded",
    locked: false,
    fileId: null,
  }
}

function createSlotsFromRemoteDocuments(documents: RemoteDocumentSlot[]) {
  const slotMap = new Map<string, DocumentSlot>()

  DEFAULT_DOCUMENT_TYPES.forEach((type) => {
    slotMap.set(type, createEmptySlot(type))
  })

  documents.forEach((document) => {
    slotMap.set(document.type, document)
  })

  return [...slotMap.values()]
}

function getRowClasses(slot: DocumentSlot, isActive: boolean) {
  if (isActive) {
    return "border-primary bg-primary/10 shadow-[0_10px_24px_rgba(181,74,74,0.12)]"
  }

  if (slot.fileName) {
    return "border-primary/15 bg-primary/5"
  }

  return "border-border/70 bg-card text-muted-foreground hover:bg-muted/40"
}

function getStatusBadgeClasses(status: DocumentStatus) {
  switch (status) {
    case "Approved":
      return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-transparent dark:text-emerald-300"
    case "Rejected":
      return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/60 dark:bg-transparent dark:text-rose-300"
    case "Synced":
      return "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/60 dark:bg-transparent dark:text-sky-300"
    default:
      return "border-border/70 bg-muted text-muted-foreground"
  }
}

/**
 * Read-only document viewer for the admin order-details page. Adapted from
 * components/order-documents-panel.tsx with the upload/delete UI removed —
 * fetches from the admin (server-resolved vendorId) endpoint instead.
 */
export function AdminOrderDocumentsPanel({ poNumber }: { poNumber: string }) {
  const [slots, setSlots] = useState<DocumentSlot[]>(
    DEFAULT_DOCUMENT_TYPES.map((type) => createEmptySlot(type))
  )
  const [selectedType, setSelectedType] = useState<string>(DEFAULT_DOCUMENT_TYPES[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!poNumber) {
      return
    }

    let isActive = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({ poNumber })
        const response = await fetch(`/api/admin/orders/documents?${params.toString()}`)
        const data = (await response.json()) as OrderDocumentsApiResponse

        if (!isActive) {
          return
        }

        if (response.ok && data.success) {
          setSlots(createSlotsFromRemoteDocuments(Array.isArray(data.documents) ? data.documents : []))
          return
        }

        setError(data.error || "Failed to load order documents")
      } catch (loadError) {
        if (!isActive) {
          return
        }
        setError("An unexpected error occurred while loading order documents")
        console.error(loadError)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [poNumber])

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.type === selectedType) ?? null,
    [selectedType, slots]
  )

  const uploadedCount = slots.filter((slot) => Boolean(slot.fileName)).length
  const approvedCount = slots.filter((slot) => slot.status === "Approved").length

  const selectedPreview = selectedSlot?.previewUrl
  const selectedLabel = selectedSlot?.fileName || "No document uploaded"
  const selectedStatus = selectedSlot?.status ?? "Not uploaded"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          {uploadedCount} Uploaded
        </span>
        <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/60 dark:bg-transparent dark:text-emerald-300">
          {approvedCount} Approved
        </span>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid items-stretch gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex flex-col overflow-hidden rounded-[20px] border border-border/70 bg-muted/40">
          <div className="border-b border-border/70 px-4 py-4">
            <p className="text-sm font-semibold text-foreground">Document Types</p>
            <p className="text-xs text-muted-foreground">Select a type to preview its file.</p>
          </div>

          <div className="max-h-[760px] overflow-y-auto p-3 pb-5 hide-scrollbar">
            <div className="space-y-2">
              {slots.map((slot) => {
                const isActive = slot.type === selectedType

                return (
                  <button
                    key={slot.type}
                    type="button"
                    onClick={() => setSelectedType(slot.type)}
                    className={`flex w-full items-center justify-between gap-3 rounded-[16px] border px-4 py-3 text-left transition-colors ${getRowClasses(
                      slot,
                      isActive
                    )}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <FileText
                          className={`h-4 w-4 shrink-0 ${slot.fileName ? "text-primary" : "text-muted-foreground/60"}`}
                        />
                        <p
                          className={`truncate text-sm font-semibold ${
                            slot.fileName ? "text-foreground" : "text-muted-foreground/70"
                          }`}
                        >
                          {slot.type}
                        </p>
                      </div>
                      <p
                        className={`mt-1 truncate text-xs ${
                          slot.fileName ? "text-muted-foreground" : "text-muted-foreground/60"
                        }`}
                      >
                        {slot.fileName || "No file uploaded"}
                      </p>
                    </div>

                    <div className="flex h-5 w-5 items-center justify-center">
                      {slot.status === "Approved" ? (
                        <CircleCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/60" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        <main className="flex h-full min-h-0 flex-col rounded-[20px] border border-border/70 bg-card p-4 md:p-5">
          <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="text-[22px] font-semibold tracking-tight text-foreground">
                  {selectedType}
                </h3>
                {selectedStatus !== "Not uploaded" ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getStatusBadgeClasses(
                      selectedStatus
                    )}`}
                  >
                    <CircleCheck className="h-3.5 w-3.5" />
                    {selectedStatus}
                  </span>
                ) : null}
              </div>
              {selectedPreview ? (
                <p className="text-sm text-muted-foreground">
                  Preview the uploaded file for {selectedType}.
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden rounded-[20px] border border-border/70 bg-muted/30">
            {selectedPreview ? (
              <iframe src={selectedPreview} title={selectedLabel} className="h-full w-full bg-white" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  {loading ? "Loading order documents..." : "No document uploaded"}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
