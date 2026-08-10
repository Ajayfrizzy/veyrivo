"use client";

import {
  Activity,
  Bell,
  Compass,
  BriefcaseBusiness,
  CircleHelp,
  CreditCard,
  House,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/ui/logout-button";

const primary = [
  { label: "Overview", href: "/", icon: House },
  { label: "Discover jobs", href: "/discover", icon: Compass },
  { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Activity", href: "/activity", icon: Activity },
];

const secondary = [
  { label: "Wallet & security", href: "/wallet", icon: WalletCards },
  { label: "Profile", href: "/profile", icon: UserRound },
  { label: "Support", href: "/support", icon: CircleHelp },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = (items: typeof primary) => items.map(({ label, href, icon: Icon }) => {
    const active = pathname === href;
    return (
      <Link className={`nav-link ${active ? "active" : ""}`} href={href} key={href} onClick={() => setMenuOpen(false)}>
        <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
        <span>{label}</span>
      </Link>
    );
  });

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand-row">
          <Link className="brand" href="/" aria-label="ProofPay home">
            <span className="brand-mark"><ShieldCheck size={20} strokeWidth={2.2} /></span>
            <span>ProofPay</span>
          </Link>
          <button className="icon-button sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>
        <Link className="create-button" href="/jobs/new" onClick={() => setMenuOpen(false)}>
          <Plus size={18} /> Create job
        </Link>
        <p className="nav-group-label">Workspace</p>
        <nav className="sidebar-nav" aria-label="Main navigation">{nav(primary)}</nav>
        <p className="nav-group-label account-label">Account</p>
        <nav className="sidebar-nav secondary" aria-label="Account navigation">{nav(secondary)}</nav>
        <div className="network-card">
          <div><span className="status-dot" /> CKB Mainnet</div>
          <p>PactAgent services operational</p>
        </div>
        <div className="sidebar-user">
          <span className="avatar">AO</span>
          <span><strong>Alex Okafor</strong><small>alex@example.com</small></span>
          <span className="sidebar-user-actions"><Link href="/wallet" aria-label="Open account settings" title="Settings"><Settings size={17} /></Link><LogoutButton compact /></span>
        </div>
      </aside>
      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
          <Link className="mobile-brand" href="/"><span className="brand-mark"><ShieldCheck size={18} /></span>ProofPay</Link>
          {pathname !== "/" && <Link className="dashboard-return" href="/"><House size={16} /><span>Dashboard</span></Link>}
          <div className="topbar-actions">
            <span className="network-pill"><span className="status-dot" /> CKB</span>
            <Link className="icon-button" href="/notifications" aria-label="Notifications"><Bell size={19} /><span className="notification-dot" /></Link>
            <Link className="top-avatar" href="/profile" aria-label="Open profile">AO</Link>
          </div>
        </header>
        <main className="page-content">{children}</main>
        <nav className="bottom-nav" aria-label="Mobile navigation">
          {primary.slice(0, 4).map(({ label, href, icon: Icon }) => (
            <Link className={pathname === href ? "active" : ""} href={href} key={href}><Icon size={20} /><span>{label}</span></Link>
          ))}
          <Link className={pathname === "/profile" ? "active" : ""} href="/profile"><UserRound size={20} /><span>Profile</span></Link>
        </nav>
      </div>
    </div>
  );
}
