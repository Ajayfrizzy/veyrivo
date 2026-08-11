"use client";

import { Headphones, Search } from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Row = {
  ticket: {
    id: string;
    reference: string;
    subject: string;
    category: string;
    status: string;
    priority: string;
    assignedTo?: string;
    lastMessageAt: string;
  };
  customerName?: string;
  customerEmail: string;
};
export function SupportAdminQueue() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    const response = await fetch(`/api/admin/support/tickets?${params}`);
    const body = await response.json();
    if (response.ok) setRows(body.data);
    setLoading(false);
  }, [priority, query, status]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  function search(event: FormEvent) {
    event.preventDefault();
    void load();
  }
  const open = rows.filter((row) => !["RESOLVED", "CLOSED"].includes(row.ticket.status)).length;
  return (
    <>
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Support queue</h1>
          <p>Review, assign, and resolve customer support cases.</p>
        </div>
        <span>
          <Headphones size={18} /> {open} active
        </span>
      </header>
      <section className="admin-stats">
        <article>
          <span>Active cases</span>
          <strong>{open}</strong>
        </article>
        <article>
          <span>Urgent priority</span>
          <strong>{rows.filter((row) => row.ticket.priority === "URGENT").length}</strong>
        </article>
        <article>
          <span>Waiting for user</span>
          <strong>{rows.filter((row) => row.ticket.status === "WAITING_FOR_USER").length}</strong>
        </article>
      </section>
      <form className="admin-filters" onSubmit={search}>
        <label>
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search reference, subject, or customer"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="WAITING_FOR_USER">Waiting for user</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <button className="secondary-button">Apply</button>
      </form>
      <section className="panel admin-ticket-table">
        <div className="admin-ticket-head">
          <span>Case</span>
          <span>Customer</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Last activity</span>
        </div>
        {loading && <p className="support-empty">Loading queue...</p>}
        {!loading && rows.length === 0 && (
          <p className="support-empty">No cases match these filters.</p>
        )}
        {rows.map((row) => (
          <Link
            className="admin-ticket-row"
            href={`/admin/support/${row.ticket.id}`}
            key={row.ticket.id}
          >
            <div>
              <strong>{row.ticket.subject}</strong>
              <small>
                {row.ticket.reference} · {row.ticket.category.toLowerCase()}
              </small>
            </div>
            <div>
              <strong>{row.customerName || "Customer"}</strong>
              <small>{row.customerEmail}</small>
            </div>
            <span className={`ticket-state state-${row.ticket.status.toLowerCase()}`}>
              {row.ticket.status.toLowerCase().replaceAll("_", " ")}
            </span>
            <span className={`priority priority-${row.ticket.priority.toLowerCase()}`}>
              {row.ticket.priority.toLowerCase()}
            </span>
            <time>{new Date(row.ticket.lastMessageAt).toLocaleString()}</time>
          </Link>
        ))}
      </section>
    </>
  );
}
