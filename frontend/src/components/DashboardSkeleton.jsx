function DashboardSkeleton() {
  return (
    <div className="page">

      <section className="hero-card skeleton-card">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-subtitle" />

        <div className="skeleton-grid">
          {[1,2,3,4].map((i) => (
            <div key={i} className="metric-skeleton">
              <div className="skeleton skeleton-small" />
              <div className="skeleton skeleton-number" />
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        {[1,2,3,4,5,6].map((i) => (
          <div key={i} className="card skeleton-card">
            <div className="skeleton skeleton-heading" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
        ))}
      </section>

    </div>
  );
}

export default DashboardSkeleton;