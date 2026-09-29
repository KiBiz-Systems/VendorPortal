"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Package, ShoppingCart } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatCurrency } from "@/lib/format"

const EMPTY_VALUE = "--"
const SUMMARY_CACHE_PREFIX = "admin-dashboard-summary:"
const SUMMARY_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

type SalesPoint = { label: string; total: number }

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

type AdminDashboardSummary = {
  counts: { activeOrders: number; pendingInvoices: number; closedOrders: number }
  recentOrders: AdminOrder[]
  sales: SalesPoint[]
  range: { from: string; to: string; granularity: "month" | "year" }
}

type RangePreset = "last6months" | "last12months" | "thisYear" | "last2years" | "custom"

const RANGE_PRESET_LABELS: Record<RangePreset, string> = {
  last6months: "Last 6 Months",
  last12months: "Last 12 Months",
  thisYear: "This Year",
  last2years: "Last 2 Years",
  custom: "Custom Range",
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function computeRange(
  preset: RangePreset,
  customFrom: string,
  customTo: string
): { from: string; to: string } | null {
  const now = new Date()

  switch (preset) {
    case "last6months":
      return { from: toIsoDate(new Date(now.getFullYear(), now.getMonth() - 5, 1)), to: toIsoDate(now) }
    case "last12months":
      return { from: toIsoDate(new Date(now.getFullYear(), now.getMonth() - 11, 1)), to: toIsoDate(now) }
    case "thisYear":
      return { from: toIsoDate(new Date(now.getFullYear(), 0, 1)), to: toIsoDate(now) }
    case "last2years":
      return { from: toIsoDate(new Date(now.getFullYear() - 1, 0, 1)), to: toIsoDate(now) }
    case "custom":
      return customFrom && customTo ? { from: customFrom, to: customTo } : null
  }
}

function compactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function getStatusClassName(status?: string | null) {
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

export default function AdminDashboardPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rangePreset, setRangePreset] = useState<RangePreset>("thisYear")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")

  const resolvedRange = computeRange(rangePreset, customFrom, customTo)

  useEffect(() => {
    if (!resolvedRange) {
      // Custom range selected but not both dates filled in yet.
      setSummary(null)
      setIsLoading(false)
      return
    }

    let isActive = true
    const { from, to } = resolvedRange
    const cacheKey = `${SUMMARY_CACHE_PREFIX}${from}:${to}`

    const load = async () => {
      try {
        setError(null)

        const cachedRaw = window.sessionStorage.getItem(cacheKey)
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as { summary: AdminDashboardSummary; cachedAt: number }
          if (Date.now() - cached.cachedAt < SUMMARY_CACHE_TTL_MS) {
            setSummary(cached.summary)
            setIsLoading(false)
            return
          }
        }

        setIsLoading(true)

        const params = new URLSearchParams({ from, to })
        const response = await fetch(`/api/admin/dashboard/summary?${params.toString()}`)

        if (response.status === 401) {
          router.replace("/admin/login")
          return
        }

        const data = await response.json()

        if (!isActive) {
          return
        }

        if (response.ok && data.success) {
          const nextSummary = data.summary as AdminDashboardSummary
          setSummary(nextSummary)
          window.sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ summary: nextSummary, cachedAt: Date.now() })
          )
          return
        }

        setError(data.error || "Failed to load dashboard summary")
      } catch (loadError) {
        if (!isActive) {
          return
        }
        console.error(loadError)
        setError("An unexpected error occurred")
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isActive = false
    }
    // resolvedRange is a freshly-computed object every render; depend on its
    // primitive from/to fields instead so this only reruns when they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedRange?.from, resolvedRange?.to, router])

  const metrics = [
    {
      label: "Active Orders",
      value: String(summary?.counts.activeOrders ?? 0),
      icon: ShoppingCart,
      iconClassName: "bg-primary/10 text-primary",
    },
    {
      label: "Pending Invoices",
      value: String(summary?.counts.pendingInvoices ?? 0),
      icon: FileText,
      iconClassName: "bg-amber-500/10 text-amber-600 dark:text-[#ffb020]",
    },
    {
      label: "Closed Orders",
      value: String(summary?.counts.closedOrders ?? 0),
      icon: Package,
      iconClassName: "bg-sky-500/10 text-sky-600 dark:text-[#4f8df7]",
    },
  ]

  const recentOrders = summary?.recentOrders ?? []
  const salesData = summary?.sales ?? []
  const totalSales = salesData.reduce((total, point) => total + point.total, 0)

  if (isLoading && !summary) {
    return (
      <section className="space-y-5">
        <div className="h-[120px] animate-pulse rounded-[24px] bg-muted" />
        <div className="h-[360px] animate-pulse rounded-[24px] bg-muted" />
        <div className="h-[300px] animate-pulse rounded-[24px] bg-muted" />
      </section>
    )
  }

  return (
    <>
      <section className="space-y-2">
        <h1 className="text-[30px] font-bold tracking-tight text-foreground md:text-[38px]">
          Admin Overview
        </h1>
        <p className="max-w-2xl text-[15px] text-muted-foreground md:text-base">
          Purchase orders and status across every vendor.
        </p>
      </section>

      {error ? (
        <section className="rounded-[24px] border border-border/70 bg-card p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
          <p className="font-medium text-[#ff7a7a]">{error}</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-3">
            {metrics.map(({ label, value, icon: Icon, iconClassName }) => (
              <article
                key={label}
                className="rounded-[24px] border border-border/70 bg-card p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
              >
                <div className="mb-7 flex items-start justify-between gap-6">
                  <p className="text-base font-medium text-muted-foreground">{label}</p>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-[18px] ${iconClassName}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <span className="text-[34px] font-bold tracking-tight text-foreground">{value}</span>
              </article>
            ))}
          </section>

          <section className="rounded-[24px] border border-border/70 bg-card p-5 shadow-[0_18px_40px_rgba(0,0,0,0.16)] md:p-7">
            <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  Sales Overview
                </p>
                <h2 className="text-[28px] font-bold tracking-tight text-foreground">
                  {formatCurrency(totalSales)}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Total PO value across all vendors, {RANGE_PRESET_LABELS[rangePreset].toLowerCase()}
                  {summary ? ` (${summary.range.from} to ${summary.range.to})` : ""}.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <select
                  value={rangePreset}
                  onChange={(event) => setRangePreset(event.target.value as RangePreset)}
                  className="rounded-full border border-border/70 bg-muted px-4 py-2 text-sm font-semibold text-foreground outline-none"
                >
                  {(Object.keys(RANGE_PRESET_LABELS) as RangePreset[]).map((preset) => (
                    <option key={preset} value={preset}>
                      {RANGE_PRESET_LABELS[preset]}
                    </option>
                  ))}
                </select>

                {rangePreset === "custom" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(event) => setCustomFrom(event.target.value)}
                      className="rounded-full border border-border/70 bg-muted px-3 py-2 text-sm text-foreground outline-none"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(event) => setCustomTo(event.target.value)}
                      className="rounded-full border border-border/70 bg-muted px-3 py-2 text-sm text-foreground outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="h-[320px] rounded-[22px] border border-border/70 bg-background/45 p-4">
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData} margin={{ top: 12, right: 18, left: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 600 }}
                      tickFormatter={(value) => compactCurrency(Number(value))}
                      width={72}
                    />
                    <Tooltip
                      cursor={{ stroke: "var(--primary)", strokeDasharray: "4 4" }}
                      formatter={(value) => [formatCurrency(Number(value)), "Sales"]}
                      labelClassName="font-bold text-foreground"
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                  {!resolvedRange ? "Select a start and end date to view sales." : "No sales data found yet."}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[19px] font-bold tracking-tight text-foreground">Recent Orders</h2>

            <div className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
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
                      <th className="w-[24%] px-5 py-4 text-center md:px-7">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {recentOrders.map((order, index) => {
                      const rowKey = order.poNumber || `${order.dateEntered}-${index}`
                      const orderHref = order.poNumber
                        ? `/admin/orders/${encodeURIComponent(order.poNumber)}`
                        : null

                      return (
                        <tr
                          key={rowKey}
                          className={`${orderHref ? "cursor-pointer" : ""} transition-colors hover:bg-muted/70`}
                          role={orderHref ? "link" : undefined}
                          tabIndex={orderHref ? 0 : undefined}
                          onClick={() => {
                            if (orderHref) {
                              router.push(orderHref)
                            }
                          }}
                        >
                          <td className="truncate px-5 py-5 text-[16px] font-bold text-primary md:px-7">
                            {order.poNumberDisplay || EMPTY_VALUE}
                          </td>
                          <td className="truncate px-5 py-5 text-[15px] text-foreground">
                            {order.vendorName || EMPTY_VALUE}
                          </td>
                          <td className="px-5 py-5 text-[15px] text-foreground">
                            {order.dateEntered || EMPTY_VALUE}
                          </td>
                          <td className="px-5 py-5 text-[15px] text-muted-foreground whitespace-nowrap">
                            {order.dateScheduled || EMPTY_VALUE}
                          </td>
                          <td className="px-5 py-5 text-[15px] text-muted-foreground whitespace-nowrap">
                            {order.dateReceived || EMPTY_VALUE}
                          </td>
                          <td className="px-5 py-5 text-[16px] font-bold text-foreground whitespace-nowrap">
                            {formatCurrency(order.totalAmount, EMPTY_VALUE)}
                          </td>
                          <td className="px-5 py-5 text-center md:px-7">
                            <span
                              className={`inline-flex items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${getStatusClassName(order.status)}`}
                            >
                              {order.status || EMPTY_VALUE}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td className="px-5 py-16 text-center text-muted-foreground" colSpan={7}>
                          No recent orders found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  )
}
