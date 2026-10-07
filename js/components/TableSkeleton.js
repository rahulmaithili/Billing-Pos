function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-row">
        {[...Array(columns)].map((_, i) => <div key={i} className="skeleton skeleton-table-cell" style={{ flex: 1 }}></div>)}
      </div>
      {[...Array(rows)].map((_, r) => (
        <div key={r} className="skeleton-table-row">
          {[...Array(columns)].map((_, c) => <div key={c} className="skeleton skeleton-table-cell" style={{ flex: 1 }}></div>)}
        </div>
      ))}
    </div>
  );
}

function DashboardCardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-icon"></div>
      <div className="skeleton skeleton-text-large" style={{ width: '60%' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
    </div>
  );
}
