import { ArrowDownLeft, ArrowUpRight, Download, ReceiptText, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { payments } from "@/features/payments/fixtures";

const icons = { Release: ArrowDownLeft, Funding: ArrowUpRight, Refund: RotateCcw };
export default function PaymentsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Financial history"
        title="Payments"
        description="Track secured funds, releases, fees, and refunds."
        icon={ReceiptText}
        action={
          <button className="secondary-button">
            <Download size={16} /> Export CSV
          </button>
        }
      />
      <section className="payment-stats">
        <article>
          <span>Secured in active jobs</span>
          <strong>260,500 CKB</strong>
          <small>Across 3 agreements</small>
        </article>
        <article>
          <span>Released this month</span>
          <strong>129,500 CKB</strong>
          <small>4 milestone settlements</small>
        </article>
        <article>
          <span>Platform fees</span>
          <strong>6,775 CKB</strong>
          <small>Client and worker fees</small>
        </article>
      </section>
      <section className="panel data-panel">
        <div className="section-heading">
          <div>
            <h2>Transaction history</h2>
            <p>Confirmed PactAgent and CKB records</p>
          </div>
          <select aria-label="Transaction period">
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
        </div>
        <div className="data-head payment-head">
          <span>Transaction</span>
          <span>Job</span>
          <span>Date</span>
          <span>Amount</span>
          <span>Status</span>
        </div>
        {payments.map((payment) => {
          const Icon = icons[payment.type as keyof typeof icons];
          return (
            <div className="data-row payment-row" key={payment.id}>
              <div className="transaction-cell">
                <span>
                  <Icon size={17} />
                </span>
                <p>
                  <strong>{payment.type}</strong>
                  <small>
                    {payment.id} · {payment.hash}
                  </small>
                </p>
              </div>
              <strong>{payment.job}</strong>
              <span>{payment.date}</span>
              <strong>{new Intl.NumberFormat().format(payment.amount)} CKB</strong>
              <span className="confirmed-badge">Confirmed</span>
            </div>
          );
        })}
      </section>
    </AppShell>
  );
}
