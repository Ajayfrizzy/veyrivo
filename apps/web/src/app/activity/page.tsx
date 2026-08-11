import {
  Activity,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";

const events = [
  {
    day: "Today",
    items: [
      {
        icon: FileCheck2,
        title: "Proof submitted",
        detail: "Checkout experience redesign · Milestone 2",
        time: "18 min ago",
        source: "Worker action",
      },
      {
        icon: ShieldCheck,
        title: "Funding confirmed",
        detail: "Brand launch photography · 76,000 CKB secured",
        time: "3 hours ago",
        source: "PactAgent event",
      },
    ],
  },
  {
    day: "22 July",
    items: [
      {
        icon: UserCheck,
        title: "Wallet ownership verified",
        detail: "Payout wallet ending w7m2k9",
        time: "16:42",
        source: "Security event",
      },
    ],
  },
  {
    day: "18 July",
    items: [
      {
        icon: CircleDollarSign,
        title: "Payment released",
        detail: "July content production · Milestone 1 · 37,500 CKB",
        time: "10:18",
        source: "CKB confirmed",
      },
      {
        icon: CheckCircle2,
        title: "Proof approved",
        detail: "July content production · Content plan",
        time: "10:11",
        source: "Client action",
      },
    ],
  },
];
export default function ActivityPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Audit trail"
        title="Activity"
        description="A chronological record of actions and verified lifecycle events."
        icon={Activity}
      />
      <div className="activity-filters">
        <button className="active">All events</button>
        <button>Jobs</button>
        <button>Payments</button>
        <button>Security</button>
      </div>
      <section className="panel full-activity">
        {events.map((group) => (
          <div className="activity-group" key={group.day}>
            <h2>{group.day}</h2>
            {group.items.map(({ icon: Icon, ...event }) => (
              <article key={event.title + event.time}>
                <span className="event-icon">
                  <Icon size={17} />
                </span>
                <div>
                  <strong>{event.title}</strong>
                  <p>{event.detail}</p>
                  <small>{event.source}</small>
                </div>
                <time>{event.time}</time>
              </article>
            ))}
          </div>
        ))}
      </section>
    </AppShell>
  );
}
