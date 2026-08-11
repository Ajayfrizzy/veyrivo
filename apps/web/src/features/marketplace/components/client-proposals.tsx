"use client";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
type Record = {
  proposal: {
    id: string;
    coverLetter: string;
    totalBid: string;
    estimatedDurationDays: number;
    status: string;
  };
  worker: {
    displayName: string;
    headline: string | null;
    bio: string | null;
    countryCode: string | null;
  };
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    amount: string;
    deliveryDays: number;
  }>;
};
export function ClientProposals({ records }: { records: Record[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const act = async (id: string, action: "reject" | "award") => {
    if (action === "award" && !confirm("Award this proposal and create an agreement draft?"))
      return;
    setBusy(id);
    setError("");
    const response = await fetch(`/api/marketplace/proposals/${id}/${action}`, {
      method: "POST",
      headers: action === "award" ? { "Idempotency-Key": crypto.randomUUID() } : undefined,
    });
    const body = await response.json();
    if (!response.ok) setError(body.error?.message ?? "Action could not be completed.");
    else if (action === "award") router.push(`/jobs/${body.data.jobId}`);
    else router.refresh();
    setBusy("");
  };
  if (!records.length) return <div className="market-empty">No proposals have arrived yet.</div>;
  return (
    <div className="client-proposals">
      {error && <p className="form-feedback error">{error}</p>}
      {records.map((record) => (
        <article key={record.proposal.id}>
          <div className="proposal-worker">
            <span>{record.worker.displayName.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{record.worker.displayName}</strong>
              <p>
                {record.worker.headline || "Veyrivo member"}
                {record.worker.countryCode ? ` · ${record.worker.countryCode}` : ""}
              </p>
            </div>
            <b className={`proposal-state state-${record.proposal.status.toLowerCase()}`}>
              {record.proposal.status.toLowerCase()}
            </b>
          </div>
          <p className="proposal-letter">{record.proposal.coverLetter}</p>
          <div className="proposal-commercial">
            <div>
              <span>Bid</span>
              <strong>
                {new Intl.NumberFormat().format(
                  Number(BigInt(record.proposal.totalBid)) / 100_000_000,
                )}{" "}
                CKB
              </strong>
            </div>
            <div>
              <span>Delivery</span>
              <strong>{record.proposal.estimatedDurationDays} days</strong>
            </div>
            <div>
              <span>Milestones</span>
              <strong>{record.milestones.length}</strong>
            </div>
          </div>
          <ol>
            {record.milestones.map((item) => (
              <li key={item.id}>
                <span>Day {item.deliveryDays}</span>
                <p>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </p>
                <b>
                  {new Intl.NumberFormat().format(Number(BigInt(item.amount)) / 100_000_000)} CKB
                </b>
              </li>
            ))}
          </ol>
          {record.proposal.status === "SUBMITTED" && (
            <div className="proposal-actions">
              <button
                className="secondary-button"
                disabled={busy === record.proposal.id}
                onClick={() => act(record.proposal.id, "reject")}
              >
                <X size={16} /> Reject
              </button>
              <button
                className="primary-button"
                disabled={busy === record.proposal.id}
                onClick={() => act(record.proposal.id, "award")}
              >
                <Check size={16} /> Award proposal
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
