"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, LucideIcon, Package, Truck, Building2 } from "lucide-react"
import { AdminOrderSpecSheets } from "@/components/admin-order-spec-sheets"
import { AdminOrderDocumentsPanel } from "@/components/admin-order-documents-panel"
import { formatCurrency, formatQty } from "@/lib/format"

type OrderDetails = {
  header: {
    poNumberDisplay: string
    orderPlacedBy: string
    freightType: string
    freightOnBoard: string
    vendorContractNumber: string
    category: string
    dateScheduled: string
    deliveredVia: string
    paymentDate: string
    companyName: string
    personName: string
    address: string
    mainPhone: string
    totalAmount: string
    status: string
    notes: string
    vendorComments: string
  }
  lineItems: Array<{
    itemNo: string
    productName: string
    vendorItemNo: string
    vendorDescription: string
    unitType: string
    actualPurchQty: string
    qtyReceived: string
    invoicedAmount: string
    serialNo: string
  }>
}

type DetailField = {
  label: string
  value: string
}

const EMPTY_VALUE = "--"

function DetailRow({ label, value }: DetailField) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="max-w-[60%] text-right text-[16px] font-semibold leading-snug text-foreground">
        {value || EMPTY_VALUE}
      </p>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-8 w-1 rounded-full bg-primary" />
      <h3 className="text-[18px] font-semibold tracking-tight text-foreground">{title}</h3>
    </div>
  )
}

function SummaryCard({
  title,
  icon: Icon,
  fields,
}: {
  title: string
  icon: LucideIcon
  fields: DetailField[]
}) {
  return (
    <div className="rounded-[18px] border border-border/70 bg-card p-5 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <SectionTitle title={title} />
      </div>
      <div className="divide-y divide-border/70">
        {fields.map((field) => (
          <DetailRow key={field.label} label={field.label} value={field.value} />
        ))}
      </div>
    </div>
  )
}

function getLineItemKey(item: OrderDetails["lineItems"][number], index: number) {
  return [
    item.itemNo || "no-item",
    item.productName || "no-product",
    item.unitType || "no-unit",
    item.serialNo || "no-serial",
    String(index),
  ].join("|")
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

export default function AdminOrderDetailsPage() {
  const params = useParams<{ poNumber: string }>()
  const router = useRouter()
  const poNumber = typeof params.poNumber === "string" ? decodeURIComponent(params.poNumber) : ""
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!poNumber) {
      return
    }

    let isActive = true

    const loadOrder = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(
          `/api/admin/orders/details?poNumber=${encodeURIComponent(poNumber)}`
        )

        if (response.status === 401) {
          router.replace("/admin/login")
          return
        }

        const data = await response.json()

        if (!isActive) {
          return
        }

        if (response.ok && data.success) {
          setOrder(data.order as OrderDetails)
          return
        }

        setOrder(null)
        setError(data.error || "Failed to load order details")
      } catch (fetchError) {
        if (!isActive) {
          return
        }

        setOrder(null)
        setError("An unexpected error occurred")
        console.error(fetchError)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadOrder()

    return () => {
      isActive = false
    }
  }, [poNumber, router])

  if (isLoading && !order) {
    return (
      <section className="rounded-[24px] border border-border/70 bg-card p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </section>
    )
  }

  if (error || !order) {
    return (
      <section className="rounded-[24px] border border-border/70 bg-card p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
        <p className="font-medium text-destructive">{error || "Order details not found."}</p>
        <Link
          href="/admin/orders"
          className="mt-4 inline-flex items-center gap-2 text-sm text-primary underline hover:text-[#d36a6a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
      </section>
    )
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-[34px] font-bold tracking-tight text-foreground md:text-[42px]">
              Order #{order.header.poNumberDisplay}
            </h1>
            <span
              className={`inline-flex items-center rounded-full border px-4 py-1 text-[13px] font-semibold ${getStatusClassName(
                order.header.status
              )}`}
            >
              {order.header.status || EMPTY_VALUE}
            </span>
          </div>

          <div className="text-right leading-none">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Order Amount
            </p>
            <p className="text-[28px] font-bold leading-none tracking-tight text-foreground md:text-[34px]">
              {formatCurrency(order.header.totalAmount, EMPTY_VALUE)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <SummaryCard
          title="Order Details"
          icon={Package}
          fields={[
            { label: "Order Placed By", value: order.header.orderPlacedBy },
            { label: "Freight Type", value: order.header.freightType },
            { label: "Freight On Board", value: order.header.freightOnBoard },
            { label: "Category", value: order.header.category },
          ]}
        />

        <SummaryCard
          title="Shipping & Delivery"
          icon={Truck}
          fields={[
            { label: "Est. Ship Date", value: order.header.dateScheduled },
            { label: "Delivered Via", value: order.header.deliveredVia },
            { label: "Vendor Contract #", value: order.header.vendorContractNumber },
            { label: "Payment Date", value: order.header.paymentDate },
          ]}
        />

        <SummaryCard
          title="Shipment Origin"
          icon={Building2}
          fields={[
            { label: "Company Name", value: order.header.companyName },
            { label: "Person Name", value: order.header.personName },
            { label: "Address", value: order.header.address },
            { label: "Main Phone", value: order.header.mainPhone },
          ]}
        />
      </section>

      <section className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
        <div className="border-b border-border/70 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="h-8 w-1 rounded-full bg-primary" />
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground">Notes & Vendor Comments</h2>
          </div>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Notes</p>
            <p className="whitespace-pre-line text-[15px] text-foreground">
              {order.header.notes || EMPTY_VALUE}
            </p>
          </div>
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Vendor Comments
            </p>
            <p className="whitespace-pre-line text-[15px] text-foreground">
              {order.header.vendorComments || EMPTY_VALUE}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
        <div className="border-b border-border/70 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="h-8 w-1 rounded-full bg-primary" />
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground">Line Items</h2>
          </div>
        </div>

        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full min-w-[980px] text-left">
            <thead className="border-y border-border/70 bg-muted text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              <tr>
                <th className="px-5 py-4 md:px-7">
                  <span className="block">ITEM NO</span>
                  <span className="block">USSM ITEM NO</span>
                </th>
                <th className="px-5 py-4">
                  <span className="block">ITEM DESC.</span>
                  <span className="block">USSM ITEM DESC.</span>
                </th>
                <th className="px-5 py-4">UNIT TYPE</th>
                <th className="px-5 py-4">ACTUAL PURCH QTY (lbs)</th>
                <th className="px-5 py-4">QTY RECEIVED (lbs)</th>
                <th className="px-5 py-4">INVOICED AMOUNT</th>
                <th className="px-5 py-4 md:px-7">SERIAL NO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {order.lineItems.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center text-muted-foreground" colSpan={7}>
                    No line items were found for this purchase order.
                  </td>
                </tr>
              ) : (
                order.lineItems.map((item, index) => (
                  <tr key={getLineItemKey(item, index)} className="transition-colors hover:bg-muted/70">
                    <td className="px-5 py-5 md:px-7">
                      <span className="block text-sm font-bold text-primary">
                        {item.vendorItemNo || EMPTY_VALUE}
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                        {item.itemNo || EMPTY_VALUE}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <span className="block text-sm font-semibold text-foreground">
                        {item.vendorDescription || EMPTY_VALUE}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {item.productName || EMPTY_VALUE}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-sm text-muted-foreground">
                      {item.unitType || EMPTY_VALUE}
                    </td>
                    <td className="px-5 py-5 text-sm text-foreground">
                      {formatQty(item.actualPurchQty, EMPTY_VALUE)}
                    </td>
                    <td className="px-5 py-5 text-sm text-foreground">
                      {formatQty(item.qtyReceived, EMPTY_VALUE)}
                    </td>
                    <td className="px-5 py-5 text-sm font-semibold text-foreground">
                      {formatCurrency(item.invoicedAmount, EMPTY_VALUE)}
                    </td>
                    <td className="px-5 py-5 text-sm text-muted-foreground md:px-7">
                      {item.serialNo || EMPTY_VALUE}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
        <div className="border-b border-border/70 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="h-8 w-1 rounded-full bg-primary" />
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground">Documents</h2>
          </div>
        </div>
        <div className="p-6">
          <AdminOrderDocumentsPanel poNumber={poNumber} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
        <div className="border-b border-border/70 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="h-8 w-1 rounded-full bg-primary" />
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground">Specification Sheets</h2>
          </div>
        </div>
        <div className="p-6">
          <AdminOrderSpecSheets poNumber={poNumber} />
        </div>
      </section>
    </div>
  )
}
