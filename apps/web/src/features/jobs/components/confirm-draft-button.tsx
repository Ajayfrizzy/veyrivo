"use client";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function ConfirmDraftButton({ jobId }: { jobId: string }) { const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const confirmDraft = async () => { setBusy(true); const response = await fetch(`/api/jobs/${jobId}/confirm`, { method: "POST" }); const body = await response.json(); if (!response.ok) setError(body.error?.message ?? "Draft could not be confirmed."); else router.refresh(); setBusy(false); }; return <><button className="primary-button" disabled={busy} onClick={confirmDraft}><Check size={16} /> {busy ? "Confirming..." : "Confirm terms"}</button>{error && <p className="form-feedback error">{error}</p>}</>; }
