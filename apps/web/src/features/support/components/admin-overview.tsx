"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Headphones, Inbox } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Row = {
  ticket: {
    id: string;
    reference: string;
    subject: string;
    category: string;
    status: string;
    priority: string;
    assignedTo?: string;
    createdAt: string;
    lastMessageAt: string;
  };
  customerName?: string;
  customerEmail: string;
};

export function AdminOverview() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const response = await fetch("/api/admin/support/tickets");
      const body = await response.json();
      if (response.ok) setRows(body.data);
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const active = rows.filter((row) => !["RESOLVED", "CLOSED"].includes(row.ticket.status));
  const urgent = active.filter((row) => ["HIGH", "URGENT"].includes(row.ticket.priority));
  const unassigned = active.filter((row) => !row.ticket.assignedTo);
  const resolved = rows.filter((row) => row.ticket.status === "RESOLVED");
  return (
    <>
      <header className="admin-home-header">
        <div>
          <p className="eyebrow">Command center</p>
          <h1>Operations overview</h1>
          <p>Monitor support demand and move urgent customer issues forward.</p>
        </div>
        <Link className="primary-button" href="/admin/support">
          <Headphones size={17} /> Open support queue
        </Link>
      </header>
      <section className="admin-kpis">
        <article>
          <span className="admin-kpi-icon blue">
            <Inbox size={19} />
          </span>
          <div>
            <p>Active cases</p>
            <strong>{active.length}</strong>
            <small>Open across the support team</small>
          </div>
        </article>
        <article>
          <span className="admin-kpi-icon red">
            <AlertTriangle size={19} />
          </span>
          <div>
            <p>High priority</p>
            <strong>{urgent.length}</strong>
            <small>Requires prompt attention</small>
          </div>
        </article>
        <article>
          <span className="admin-kpi-icon amber">
            <Clock3 size={19} />
          </span>
          <div>
            <p>Unassigned</p>
            <strong>{unassigned.length}</strong>
            <small>Waiting for an owner</small>
          </div>
        </article>
        <article>
          <span className="admin-kpi-icon green">
            <CheckCircle2 size={19} />
          </span>
          <div>
            <p>Resolved</p>
            <strong>{resolved.length}</strong>
            <small>Cases completed</small>
          </div>
        </article>
      </section>
      <div className="admin-overview-grid">
        <section className="admin-surface">
          <div className="admin-section-head">
            <div>
              <h2>Cases needing attention</h2>
              <p>Prioritized by urgency and recent activity</p>
            </div>
            <Link href="/admin/support">
              View queue <ArrowRight size={15} />
            </Link>
          </div>
          <div className="admin-attention-list">
            {loading && <p className="support-empty">Loading operations...</p>}
            {!loading && active.length === 0 && <p className="support-empty">No active cases.</p>}
            {active.slice(0, 5).map((row) => (
              <Link href={`/admin/support/${row.ticket.id}`} key={row.ticket.id}>
                <span className={`attention-mark priority-${row.ticket.priority.toLowerCase()}`} />
                <div>
                  <strong>{row.ticket.subject}</strong>
                  <small>
                    {row.ticket.reference} · {row.customerName || row.customerEmail}
                  </small>
                </div>
                <span className={`ticket-state state-${row.ticket.status.toLowerCase()}`}>
                  {row.ticket.status.toLowerCase().replaceAll("_", " ")}
                </span>
                <time>{new Date(row.ticket.lastMessageAt).toLocaleDateString()}</time>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </section>
        <aside className="admin-surface admin-workload">
          <div className="admin-section-head">
            <div>
              <h2>Queue health</h2>
              <p>Current case distribution</p>
            </div>
          </div>
          <dl>
            <div>
              <dt>Open</dt>
              <dd>{rows.filter((row) => row.ticket.status === "OPEN").length}</dd>
            </div>
            <div>
              <dt>In progress</dt>
              <dd>{rows.filter((row) => row.ticket.status === "IN_PROGRESS").length}</dd>
            </div>
            <div>
              <dt>Waiting for user</dt>
              <dd>{rows.filter((row) => row.ticket.status === "WAITING_FOR_USER").length}</dd>
            </div>
            <div>
              <dt>Unassigned</dt>
              <dd>{unassigned.length}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </>
  );
}
