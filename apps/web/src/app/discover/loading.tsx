import { PageSkeleton } from "@/components/ui/page-skeleton";
export default function DiscoverLoading() {
  return (
    <div className="market-page">
      <div className="skeleton-market-header">
        <i />
        <i />
      </div>
      <main>
        <PageSkeleton />
      </main>
    </div>
  );
}
