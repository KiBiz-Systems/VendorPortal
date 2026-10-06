"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Filter, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/format"

const statusTabs = ["All", "Open", "Closed", "AP Pending", "PendingDocs"]
const EMPTY_VALUE = "--"
const UNKNOWN_STATUS = "Unknown"

type AdminOrder = {
  poNumber: string
  poNumberDisplay: string
  vendorName: string
  dateEntered: string
  dateScheduled: string
  dateReceived: string
  paymentDate: string
  totalAmount: string
  status: string
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersHasNextPage, setOrdersHasNextPage] = useState(false)
  const [ordersTotalCount, setOrdersTotalCount] = useState(0)
  const pageSize = 10

  const hasSeededRef = useRef(false)
  const [activeStatus, setActiveStatus] = useState("Open")
  const [searchDraft, setSearchDraft] = useState("")
  const [committedSearch, setCommittedSearch] = useState("")
  const [pageWindowStart, setPageWindowStart] = useState(1)

  const currentPage = ordersPage || 1
  const totalPages =
    ordersTotalCount > 0
      ? Math.max(1, Math.ceil(ordersTotalCount / pageSize))
      : currentPage + (ordersHasNextPage ? 1 : 0)
  const startPage = totalPages <= 3 ? 1 : Math.min(Math.max(1, pageWindowStart), totalPages - 2)
  const visiblePages = Array.from({ length: Math.min(3, totalPages) }, (_, index) => startPage + index)

  const normalizeStatus = (status: string) => (status === "All" ? undefined : status)

  const loadOrders = async (
    page: number,
    status = activeStatus,
    search = committedSearch
  ) => {
    try {
      setIsLoading(true)
      setError(null)

      const trimmedSearch = search.trim()
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      const resolvedStatus = normalizeStatus(status)
      if (resolvedStatus) {
        params.set("status", resolvedStatus)
      }
      if (trimmedSearch) {
        params.set("poNumber", trimmedSearch)
      }

      const response = await fetch(`/api/admin/orders?${params.toString()}`)

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      const data = await response.json()

      if (response.ok && data.success) {
        setOrders(data.orders ?? [])
        setOrdersPage(data.page ?? page)
        setOrdersHasNextPage(Boolean(data.hasNextPage))
        setOrdersTotalCount(data.totalCount ?? 0)
        return
      }

      setError(data.error || "Failed to load purchase orders")
    } catch (loadError) {
      console.error(loadError)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const loadFilteredOrders = (page: number, status = activeStatus, search = committedSearch) => {
    void loadOrders(page, status, search)
  }

  useEffect(() => {
    if (!hasSeededRef.current) {
      hasSeededRef.current = true
      loadFilteredOrders(1, "Open", "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getStatusColor = (status?: string | null) => {
    switch ((status || "").trim().toLowerCase()) {
      case "open":
        return "border-2 border-blue-300 bg-blue-50 text-blue-700 dark:border-[#63a3ff]/60 dark:bg-transparent dark:text-[#63a3ff]"
      case "ap pending":
        return "border-2 border-amber-300 bg-amber-50 text-amber-700 dark:border-[#ffb020]/60 dark:bg-transparent dark:text-[#ffb020]"
      case "closed":
        return "border-2 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-[#34d399]/60 dark:bg-transparent dark:text-[#34d399]"
      case "voided":
        return "border-2 border-rose-300 bg-rose-50 text-rose-700 dark:border-[#ff7a7a]/60 dark:bg-transparent dark:text-[#ff7a7a]"
      default:
        return "border-2 border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-transparent dark:text-slate-400"
    }
  }

  return (
    <>
      <section className="rounded-[24px] border border-border/70 bg-card p-4 shadow-[0_18px_40px_rgba(0,0,0,0.16)] md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border/70 bg-muted px-4 py-3">
              <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by PO number or vendor..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    const nextSearch = searchDraft.trim()
                    setCommittedSearch(nextSearch)
                    setPageWindowStart(1)
                    loadFilteredOrders(1, activeStatus, nextSearch)
                  }
                }}
                onBlur={() => {
                  const nextSearch = searchDraft.trim()
                  if (nextSearch !== committedSearch) {
                    setCommittedSearch(nextSearch)
                    setPageWindowStart(1)
                    loadFilteredOrders(1, activeStatus, nextSearch)
                  }
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted p-1.5">
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveStatus(tab)
                    setPageWindowStart(1)
                    loadFilteredOrders(1, tab, committedSearch)
                  }}
                  className={
                    activeStatus === tab
                      ? "rounded-lg bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm"
                      : "rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full min-w-[900px] table-fixed text-left">
            <thead className="border-b border-border/70 bg-muted text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              <tr>
                <th className="w-[9%] px-5 py-4 md:px-7">PO NUMBER</th>
                <th className="w-[20%] px-5 py-4">VENDOR</th>
                <th className="w-[11%] px-5 py-4">DATE ENTERED</th>
                <th className="w-[11%] px-5 py-4">EST. SHIP DATE</th>
                <th className="w-[11%] px-5 py-4">DATE RECEIVED</th>
                <th className="w-[14%] px-5 py-4">TOTAL AMOUNT</th>
                <th className="w-[24%] px-5 py-4 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-muted-foreground">Loading purchase orders...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-20 text-center">
                    <p className="font-medium text-destructive">{error}</p>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="mt-4 text-sm text-primary underline hover:text-[#d36a6a]"
                    >
                      Try Again
                    </button>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-20 text-center">
                    <p className="text-muted-foreground">No purchase orders found.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => {
                  const rowKey = order.poNumber || `${order.dateEntered}-${index}`

                  return (
                    <tr
                      key={rowKey}
                      className="cursor-pointer transition-colors hover:bg-muted/70"
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(`/admin/orders/${encodeURIComponent(order.poNumber)}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          router.push(`/admin/orders/${encodeURIComponent(order.poNumber)}`)
                        }
                      }}
                    >
                      <td className="truncate px-5 py-5 text-[15px] font-bold text-primary md:px-7">
                        {order.poNumberDisplay || EMPTY_VALUE}
                      </td>
                      <td className="truncate px-5 py-5 text-[14px] text-foreground">
                        {order.vendorName || EMPTY_VALUE}
                      </td>
                      <td className="whitespace-nowrap px-5 py-5 text-[14px] text-foreground">
                        {order.dateEntered || EMPTY_VALUE}
                      </td>
                      <td className="whitespace-nowrap px-5 py-5 text-[14px] text-muted-foreground">
                        {order.dateScheduled || EMPTY_VALUE}
                      </td>
                      <td className="whitespace-nowrap px-5 py-5 text-[14px] text-muted-foreground">
                        {order.dateReceived || EMPTY_VALUE}
                      </td>
                      <td className="whitespace-nowrap px-5 py-5 text-[15px] font-bold text-foreground">
                        {formatCurrency(order.totalAmount, EMPTY_VALUE)}
                      </td>
                      <td className="px-5 py-5 text-center">
                        <span
                          className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-semibold ${getStatusColor(order.status)}`}
                        >
                          {order.status || UNKNOWN_STATUS}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && !error && orders.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-border/70 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {(currentPage - 1) * pageSize + orders.length} of{" "}
              {ordersTotalCount || (currentPage - 1) * pageSize + orders.length} entries
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isLoading || pageWindowStart <= 1}
                onClick={() => {
                  if (pageWindowStart > 1) {
                    const previousWindowStart = Math.max(1, pageWindowStart - 3)
                    setPageWindowStart(previousWindowStart)
                    loadFilteredOrders(previousWindowStart, activeStatus, committedSearch)
                  }
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-muted text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page group"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2">
                {visiblePages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      if (pageNumber !== currentPage) {
                        loadFilteredOrders(pageNumber, activeStatus, committedSearch)
                      }
                    }}
                    className={
                      pageNumber === currentPage
                        ? "inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-primary px-3 text-sm font-semibold text-white"
                        : "inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-border/70 bg-muted px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-40"
                    }
                    aria-label={`Page ${pageNumber}`}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={isLoading || !ordersHasNextPage}
                onClick={() => {
                  if (ordersHasNextPage) {
                    const nextWindowStart = pageWindowStart <= 1 ? 4 : pageWindowStart + 3
                    setPageWindowStart(nextWindowStart)
                    loadFilteredOrders(nextWindowStart, activeStatus, committedSearch)
                  }
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-muted text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page group"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
