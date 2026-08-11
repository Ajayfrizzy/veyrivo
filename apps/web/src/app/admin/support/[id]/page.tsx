import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminTicketWorkspace } from "@/features/support/components/admin-ticket-workspace";
import { getCurrentUser } from "@/server/auth/session";

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser();
  if (!current) redirect("/admin/login");
  if (!["SUPPORT", "SUPER_ADMIN"].includes(current.user.systemRole))
    redirect("/admin/login?unauthorized=1");
  const { id } = await params;
  return (
    <AdminShell active="support">
      <AdminTicketWorkspace ticketId={id} />
    </AdminShell>
  );
}
