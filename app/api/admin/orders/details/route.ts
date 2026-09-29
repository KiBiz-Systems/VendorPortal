import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/adminSession"
import { getPurchaseOrderDetailsAdmin } from "@/services/filemakerService"

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const poNumber = searchParams.get("poNumber")

    if (!poNumber) {
      return NextResponse.json(
        { error: "PO number is required" },
        { status: 400 }
      )
    }

    const order = await getPurchaseOrderDetailsAdmin(poNumber)

    if (!order) {
      return NextResponse.json(
        { error: "Order details not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, order }, { status: 200 })
  } catch (error: unknown) {
    console.error("Admin Order Details API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch order details" },
      { status: 500 }
    )
  }
}
