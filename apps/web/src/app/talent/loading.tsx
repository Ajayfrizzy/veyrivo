import { MarketplaceHeader } from "@/features/marketplace/components/marketplace-header";

export default function TalentLoading() {
  return (
    <div className="market-page">
      <MarketplaceHeader />
      <main>
        <div className="page-skeleton skeleton-market-title">
          <i />
          <i />
        </div>
        <div className="page-skeleton skeleton-toolbar" />
        <div className="page-skeleton skeleton-listings">
          {[1, 2, 3].map((item) => (
            <i key={item} />
          ))}
        </div>
      </main>
    </div>
  );
}
