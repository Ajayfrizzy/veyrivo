import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { SupportAdminQueue } from "@/features/support/components/admin-queue";
import { getCurrentUser } from "@/server/auth/session";

export default async function AdminSupportPage() { const current = await getCurrentUser(); if (!current) redirect("/admin/login"); if (!["SUPPORT", "SUPER_ADMIN"].includes(current.user.systemRole)) redirect("/admin/login?unauthorized=1"); return <AdminShell active="support"><SupportAdminQueue /></AdminShell>; }
