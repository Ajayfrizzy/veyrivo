export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return <div className="page-skeleton" aria-label="Loading page" role="status"><span className="sr-only">Loading</span><div className="skeleton-heading"><i /><i /><i /></div><div className="skeleton-toolbar"><i /><i /><i /></div><div className="skeleton-grid">{Array.from({ length: cards }, (_, index) => <article key={index}><i /><i /><i /><div><i /><i /></div></article>)}</div></div>;
}
