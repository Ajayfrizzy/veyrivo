import { AppShell } from "@/components/layout/app-shell";
import { PageSkeleton } from "@/components/ui/page-skeleton";
export default function JobsLoading() {
  return (
    <AppShell>
      <PageSkeleton />
    </AppShell>
  );
}
