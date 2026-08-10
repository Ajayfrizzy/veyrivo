"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ admin = false, compact = false }: { admin?: boolean; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    if (busy) return;
    setBusy(true);
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) { setBusy(false); return; }
    router.replace(admin ? "/admin/login" : "/login");
    router.refresh();
  }
  return <button className={admin ? "admin-logout" : "user-logout"} onClick={logout} disabled={busy} aria-label="Log out" title="Log out"><LogOut size={compact ? 16 : 17} /><span>{busy ? "Signing out..." : "Log out"}</span></button>;
}
