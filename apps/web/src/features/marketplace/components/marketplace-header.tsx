import { BriefcaseBusiness, House, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session";

export async function MarketplaceHeader() {
  const current = await getCurrentUser();
  return <header className="market-header"><Link className="brand" href="/" aria-label="ProofPay dashboard"><span className="brand-mark"><ShieldCheck size={20} /></span><span>ProofPay</span></Link><nav>{current && <Link className="market-dashboard-link" href="/"><House size={16} /> Dashboard</Link>}<Link className="market-discover-link" href="/discover"><BriefcaseBusiness size={16} /> Discover jobs</Link>{current ? <><Link className="market-jobs-link" href="/jobs">My jobs</Link><Link className="primary-button" href="/jobs/new/public">Post a job</Link></> : <><Link className="market-signin-link" href="/login?returnTo=/discover">Sign in</Link><Link className="primary-button" href="/register">Create account</Link></>}</nav></header>;
}
