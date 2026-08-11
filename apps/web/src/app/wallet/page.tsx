import {
  Check,
  Clock3,
  Copy,
  KeyRound,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";

export default function WalletPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Account protection"
        title="Wallet & security"
        description="Manage verified payment destinations and account security."
        icon={WalletCards}
        action={
          <button className="primary-button">
            <Plus size={16} /> Connect wallet
          </button>
        }
      />
      <div className="security-layout">
        <div>
          <section className="panel wallet-card">
            <div className="wallet-card-head">
              <span>
                <WalletCards size={21} />
              </span>
              <div>
                <h2>CKB wallet</h2>
                <p>ckb1qyq2z...w7m2k9</p>
              </div>
              <span className="verified-chip">
                <Check size={13} /> Verified
              </span>
            </div>
            <div className="wallet-purposes">
              <div>
                <span>Funding wallet</span>
                <strong>Default</strong>
              </div>
              <div>
                <span>Payout wallet</span>
                <strong>Default</strong>
              </div>
              <div>
                <span>Connected</span>
                <strong>12 Jul 2026</strong>
              </div>
            </div>
            <div className="wallet-actions">
              <button>
                <Copy size={15} /> Copy address
              </button>
              <button>View on explorer</button>
              <button className="danger-text">Change payout wallet</button>
            </div>
          </section>
          <section className="panel security-history">
            <div className="section-heading">
              <div>
                <h2>Security activity</h2>
                <p>Recent account protection events</p>
              </div>
            </div>
            <div>
              <span>
                <ShieldCheck size={17} />
              </span>
              <p>
                <strong>Wallet ownership verified</strong>
                <small>CKB signed-message challenge · 22 Jul 2026</small>
              </p>
            </div>
            <div>
              <span>
                <KeyRound size={17} />
              </span>
              <p>
                <strong>Password changed</strong>
                <small>Chrome on macOS · 03 Jul 2026</small>
              </p>
            </div>
            <div>
              <span>
                <Smartphone size={17} />
              </span>
              <p>
                <strong>New session approved</strong>
                <small>Lagos, Nigeria · 28 Jun 2026</small>
              </p>
            </div>
          </section>
        </div>
        <aside>
          <section className="panel security-score">
            <ShieldCheck size={27} />
            <h2>Security checks complete</h2>
            <p>Your account meets all requirements for protected payments.</p>
            <ul>
              <li>
                <Check size={14} /> Email verified
              </li>
              <li>
                <Check size={14} /> Identity verified
              </li>
              <li>
                <Check size={14} /> Wallet verified
              </li>
              <li>
                <Check size={14} /> Login alerts enabled
              </li>
            </ul>
          </section>
          <section className="panel security-settings">
            <h2>Account security</h2>
            <a href="#sessions">
              <LockKeyhole size={16} />
              <span>
                <strong>Password</strong>
                <small>Changed 20 days ago</small>
              </span>
            </a>
            <a href="#sessions">
              <Smartphone size={16} />
              <span>
                <strong>Two-factor authentication</strong>
                <small>Not enabled</small>
              </span>
            </a>
            <a href="#sessions" id="sessions">
              <Clock3 size={16} />
              <span>
                <strong>Active sessions</strong>
                <small>2 devices</small>
              </span>
            </a>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
