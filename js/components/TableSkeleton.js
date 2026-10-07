function TableSkeleton({ rows = 5, columns = 6 }) {
      return (
        <div className="skeleton-table">
          <div className="skeleton-table-row">{[...Array(columns)].map((_, i) => <div key={i} className="skeleton skeleton-table-cell" style={{ flex: 1 }}></div>)}</div>
          {[...Array(rows)].map((_, r) => <div key={r} className="skeleton-table-row">{[...Array(columns)].map((_, c) => <div key={c} className="skeleton skeleton-table-cell" style={{ flex: 1 }}></div>)}</div>)}
        </div>
      );
    }
    function DashboardCardSkeleton() {
      return <div className="skeleton-card"><div className="skeleton skeleton-icon"></div><div className="skeleton skeleton-text-large" style={{ width: '60%' }}></div><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></div>;
    }

    // --- AdminLTE components ---
    function SmallBox({ value, label, icon, color, onMore }) {
      return (
        <div className={`small-box ${color || 'bg-navy'}`}>
          <div className="inner"><h3>{value}</h3><p>{label}</p></div>
          <div className="icon"><i className={`fas ${icon}`}></i></div>
          {onMore && <button className="small-box-footer" onClick={onMore}>More info <i className="fas fa-arrow-circle-right"></i></button>}
        </div>
      );
    }
    function LteCard({ title, icon, children }) {
      const [open, setOpen] = useState(true);
      return (
        <div className={`lte-card${open ? '' : ' collapsed'}`}>
