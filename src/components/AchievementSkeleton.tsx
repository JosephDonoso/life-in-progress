export function AchievementSkeleton() {
  return (
    <div className="achievement-skeleton" aria-hidden="true">
      <div className="achievement-main">
        <div className="skeleton-icon skeleton-shimmer" />
        <div className="achievement-copy">
          <span className="skeleton-title skeleton-shimmer" />
          <span className="skeleton-line skeleton-shimmer" />
          <span className="skeleton-line skeleton-line-short skeleton-shimmer" />
          <div className="achievement-meta">
            <span className="skeleton-badge skeleton-shimmer" />
            <span className="skeleton-percentage skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
