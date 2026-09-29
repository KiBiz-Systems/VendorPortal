import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/adminSession"
import { getPOByNumberAdmin } from "@/services/filemakerService"
import { getOrderDocumentsForVendor } from "@/services/orderDocumentsService"

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

    const order = await getPOByNumberAdmin(poNumber)
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    const documents = await getOrderDocumentsForVendor(order.vendorId, poNumber)

    if (!documents) {
      return NextResponse.json(
        { error: "Order document data not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, ...documents }, { status: 200 })
  } catch (error: unknown) {
    console.error("Admin Order Documents API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch order documents" },
      { status: 500 }
    )
  }
}
