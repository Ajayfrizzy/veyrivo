import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { activity } from "@/features/activity/fixtures";
import { jobs } from "@/features/jobs/fixtures";

const format = (value: number) => new Intl.NumberFormat("en-US").format(value);

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Thursday, 23 July</p>
          <h1>Good afternoon, Alex</h1>
          <p>Here is what needs your attention across your jobs.</p>
        </div>
      </div>

      <section className="readiness-strip" aria-labelledby="readiness-title">
        <div className="readiness-icon">
          <ShieldCheck size={23} />
        </div>
        <div className="readiness-copy">
          <div>
            <h2 id="readiness-title">Ready for protected payments</h2>
            <span className="verified-label">
              <Check size={13} /> Verified
            </span>
          </div>
          <p>Your identity and funding wallet are verified.</p>
        </div>
        <div className="readiness-items">
          <span>
            <Check size={15} /> Email
          </span>
          <span>
            <Check size={15} /> Identity
          </span>
          <span>
            <Check size={15} /> Wallet
          </span>
        </div>
        <Link href="/wallet">
          Manage security <ArrowRight size={15} />
        </Link>
      </section>

      <section className="metrics-grid" aria-label="Account summary">
        <article>
          <span className="metric-icon teal">
            <BriefIcon />
          </span>
          <div>
            <p>Active jobs</p>
            <strong>3</strong>
            <small>Across client and worker roles</small>
          </div>
        </article>
        <article>
          <span className="metric-icon green">
            <CircleDollarSign size={20} />
          </span>
          <div>
            <p>Secured in jobs</p>
            <strong>
              260,500 <em>CKB</em>
            </strong>
            <small>Funds confirmed by PactAgent</small>
          </div>
        </article>
        <article>
          <span className="metric-icon amber">
            <Clock3 size={20} />
          </span>
          <div>
            <p>Pending actions</p>
            <strong>2</strong>
            <small>One review, one acceptance</small>
          </div>
        </article>
        <article>
          <span className="metric-icon blue">
            <WalletCards size={20} />
          </span>
          <div>
            <p>Released this month</p>
            <strong>
              129,500 <em>CKB</em>
            </strong>
            <small>4 milestone payments</small>
          </div>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="panel jobs-panel">
          <div className="section-heading">
            <div>
              <h2>Active jobs</h2>
              <p>Your current protected work</p>
            </div>
            <Link href="/jobs">
              View all <ArrowRight size={15} />
            </Link>
          </div>
          <div className="job-column-head" aria-hidden="true">
            <span>Job</span>
            <span>Status</span>
            <span>Value</span>
            <span>Next action</span>
            <span />
          </div>
          <div className="job-list">
            {jobs.map((job) => (
              <Link className="job-row" href={`/jobs/${job.id}`} key={job.id}>
                <div className="job-title">
                  <span className={`role-mark ${job.role.toLowerCase()}`}>
                    {job.role === "CLIENT" ? "C" : "W"}
                  </span>
                  <div>
                    <strong>{job.title}</strong>
                    <span>
                      {job.counterparty} · {job.id}
                    </span>
                  </div>
                </div>
                <StatusBadge status={job.displayStatus} />
                <div className="job-value">
                  <strong>
                    {format(job.total)} {job.asset}
                  </strong>
                  <span>{job.milestoneProgress} milestones</span>
                </div>
                <div className="job-next">
                  <strong>{job.nextAction}</strong>
                  <span>Updated {job.updatedAt}</span>
                </div>
                <ArrowRight className="row-arrow" size={18} />
              </Link>
            ))}
          </div>
        </section>

        <aside className="panel actions-panel">
          <div className="section-heading">
            <div>
              <h2>Pending actions</h2>
              <p>Items waiting on you</p>
            </div>
            <span className="count-badge">2</span>
          </div>
          <div className="action-item priority">
            <span className="action-icon">
              <Clock3 size={18} />
            </span>
            <div>
              <strong>Review milestone proof</strong>
              <p>Checkout experience redesign</p>
              <small>Review window closes in 2 days</small>
              <Link href="/jobs/VY-1048">
                Review proof <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="action-item">
            <span className="action-icon green">
              <ShieldCheck size={18} />
            </span>
            <div>
              <strong>Invitation funded</strong>
              <p>Brand launch photography</p>
              <small>Waiting for Mira to accept</small>
              <Link href="/jobs/VY-1046">
                View invitation <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <section className="activity-panel">
        <div className="section-heading">
          <div>
            <h2>Recent activity</h2>
            <p>Verified events across your workspace</p>
          </div>
          <Link href="/activity">
            Full activity <ArrowRight size={15} />
          </Link>
        </div>
        <div className="activity-list">
          {activity.map((item) => (
            <div className="activity-row" key={item.title + item.detail}>
              <span className={`activity-dot ${item.tone}`} />
              <div>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
              <time>{item.time}</time>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function BriefIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </svg>
  );
}
