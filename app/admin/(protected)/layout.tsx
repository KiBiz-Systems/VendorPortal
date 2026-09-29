import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/adminSession"
import { AdminShell } from "./admin-shell"

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login")
  }

  return <AdminShell>{children}</AdminShell>
}
