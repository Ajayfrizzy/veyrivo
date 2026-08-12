"use client";

import { JOB_CATEGORIES } from "@veyrivo/domain";
import { ArrowLeft, BriefcaseBusiness, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ListingMilestone = {
  id: string;
  title: string;
  deliverable: string;
  acceptanceCriteria: string;
  evidenceRequirements: string;
  deliveryDays: number;
};

const blankMilestone = (deliveryDays = 7): ListingMilestone => ({
  id: crypto.randomUUID(),
  title: "",
  deliverable: "",
  acceptanceCriteria: "",
  evidenceRequirements: "",
  deliveryDays,
});
const units = (value: string) => BigInt(Math.round(Number(value || 0) * 100_000_000)).toString();
const minimumDeadline = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

export function ListingWizard() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof JOB_CATEGORIES)[number]>("DESIGN");
  const [skills, setSkills] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [proposalDeadline, setProposalDeadline] = useState("");
  const [milestones, setMilestones] = useState<ListingMilestone[]>([blankMilestone()]);
  const [busy, setBusy] = useState(false);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [error, setError] = useState("");
  const [assistantNote, setAssistantNote] = useState("");

  const updateMilestone = (id: string, field: keyof ListingMilestone, value: string | number) =>
    setMilestones((items) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );

  const assist = async () => {
    if (description.trim().length < 20) {
      setError("Start with at least 20 characters describing the work you need.");
      return;
    }
    setAssistantBusy(true);
    setError("");
    setAssistantNote("");
    const response = await fetch("/api/ai/job-builder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    const body = await response.json();
    if (!response.ok) setError(body.error?.message ?? "Job assistance is unavailable.");
    else {
      setTitle(body.data.title);
      setDescription(body.data.scope);
      setCategory(body.data.category);
      setSkills(body.data.skills.join(", "));
      setMilestones(
        body.data.milestones.map((item: Omit<ListingMilestone, "id">) => ({
          ...item,
          id: crypto.randomUUID(),
        })),
      );
      setAssistantNote(
        `${body.data.estimatedStructure} Review and edit all generated details before publishing.`,
      );
    }
    setAssistantBusy(false);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          title,
          description,
          category,
          skills: skills
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          budgetMin: units(budgetMin),
          budgetMax: units(budgetMax),
          proposalDeadline: new Date(`${proposalDeadline}T23:59:59`).toISOString(),
          milestones: milestones.map((milestone) => ({
            title: milestone.title,
            deliverable: milestone.deliverable,
            acceptanceCriteria: milestone.acceptanceCriteria,
            evidenceRequirements: milestone.evidenceRequirements,
            deliveryDays: milestone.deliveryDays,
          })),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Listing could not be created.");
      const publish = await fetch(`/api/marketplace/listings/${body.data.id}/publish`, {
        method: "POST",
      });
      if (!publish.ok) {
        const publishBody = await publish.json();
        throw new Error(publishBody.error?.message ?? "Listing could not be published.");
      }
      router.push(`/discover/${body.data.id}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Listing could not be created.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wizard-page listing-create">
      <div className="wizard-heading">
        <Link className="back-link" href="/jobs/new">
          <ArrowLeft size={17} /> Creation options
        </Link>
        <div>
          <p className="eyebrow">Public marketplace</p>
          <h1>Post a public job</h1>
          <p>
            Define reviewable outcomes, required proof, budget, and timing before comparing
            proposals.
          </p>
        </div>
      </div>
      <form className="form-panel listing-form" onSubmit={submit}>
        <div className="form-title listing-form-title">
          <span>
            <BriefcaseBusiness size={19} />
          </span>
          <div>
            <h2>Listing details</h2>
            <p>This information will be visible publicly.</p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={assist}
            disabled={assistantBusy}
          >
            <Sparkles size={15} /> {assistantBusy ? "Preparing..." : "Build from description"}
          </button>
        </div>
        <div className="assistant-start">
          <label>
            Scope and expected outcome
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              minLength={40}
              maxLength={5000}
              rows={7}
              placeholder="Describe the work, expected outcome, important constraints, and what success should look like."
            />
          </label>
          <small>
            Use the assistant after adding a rough description, or complete every field manually.
          </small>
        </div>
        {assistantNote && (
          <div className="assistant-note">
            <Sparkles size={15} />
            <p>{assistantNote}</p>
          </div>
        )}
        <label>
          Job title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            minLength={5}
            maxLength={90}
          />
        </label>
        <div className="two-fields">
          <label>
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as typeof category)}
            >
              {JOB_CATEGORIES.map((item) => (
                <option value={item} key={item}>
                  {item.toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label>
            Skills
            <input
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              required
              placeholder="React, product design, research"
            />
          </label>
        </div>
        <div className="listing-milestones-heading">
          <div>
            <h2>Verifiable milestone expectations</h2>
            <p>
              Describe what is delivered, how it is accepted, and which proof must be submitted.
            </p>
          </div>
        </div>
        <div className="listing-milestone-editors">
          {milestones.map((milestone, index) => (
            <fieldset key={milestone.id}>
              <legend>Milestone {index + 1}</legend>
              {milestones.length > 1 && (
                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() =>
                    setMilestones((items) => items.filter((item) => item.id !== milestone.id))
                  }
                  aria-label={`Remove milestone ${index + 1}`}
                  title="Remove milestone"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <div className="two-fields">
                <label>
                  Title
                  <input
                    value={milestone.title}
                    onChange={(event) => updateMilestone(milestone.id, "title", event.target.value)}
                    required
                  />
                </label>
                <label>
                  Expected timing
                  <div className="duration-input">
                    <input
                      type="number"
                      min={index ? milestones[index - 1].deliveryDays + 1 : 1}
                      max={365}
                      value={milestone.deliveryDays}
                      onChange={(event) =>
                        updateMilestone(milestone.id, "deliveryDays", Number(event.target.value))
                      }
                      required
                    />
                    <span>days</span>
                  </div>
                </label>
              </div>
              <label>
                Deliverable
                <textarea
                  rows={3}
                  value={milestone.deliverable}
                  onChange={(event) =>
                    updateMilestone(milestone.id, "deliverable", event.target.value)
                  }
                  placeholder="What must be delivered?"
                  required
                />
              </label>
              <label>
                Acceptance criteria
                <textarea
                  rows={3}
                  value={milestone.acceptanceCriteria}
                  onChange={(event) =>
                    updateMilestone(milestone.id, "acceptanceCriteria", event.target.value)
                  }
                  placeholder="What objective conditions count as successful completion?"
                  required
                />
              </label>
              <label>
                Required proof
                <input
                  value={milestone.evidenceRequirements}
                  onChange={(event) =>
                    updateMilestone(milestone.id, "evidenceRequirements", event.target.value)
                  }
                  placeholder="Working URL, source commit, report, or completion recording"
                  required
                />
              </label>
            </fieldset>
          ))}
          <button
            type="button"
            className="secondary-button"
            disabled={milestones.length >= 10}
            onClick={() =>
              setMilestones((items) => [
                ...items,
                blankMilestone((items.at(-1)?.deliveryDays ?? 0) + 7),
              ])
            }
          >
            <Plus size={15} /> Add milestone <span>{milestones.length}/10</span>
          </button>
        </div>
        <div className="three-fields listing-commercial-fields">
          <label>
            Minimum budget (CKB)
            <input
              value={budgetMin}
              onChange={(event) => setBudgetMin(event.target.value)}
              required
              type="number"
              min="0.00000001"
              step="0.00000001"
            />
          </label>
          <label>
            Maximum budget (CKB)
            <input
              value={budgetMax}
              onChange={(event) => setBudgetMax(event.target.value)}
              required
              type="number"
              min="0.00000001"
              step="0.00000001"
            />
          </label>
          <label>
            Proposal deadline
            <input
              value={proposalDeadline}
              onChange={(event) => setProposalDeadline(event.target.value)}
              required
              type="date"
              min={minimumDeadline}
            />
          </label>
        </div>
        {error && <p className="form-feedback error">{error}</p>}
        <div className="wizard-actions">
          <Link className="secondary-button" href="/jobs/new">
            Cancel
          </Link>
          <button className="primary-button" disabled={busy}>
            <Send size={16} /> {busy ? "Publishing..." : "Review and publish"}
          </button>
        </div>
      </form>
    </div>
  );
}
