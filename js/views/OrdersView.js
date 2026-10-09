function OrderBoardView({ user, role }) {
      const [sales, setSales] = useState([]);
      const [loading, setLoading] = useState(false);

      const loadOrders = useCallback(async () => {
        setLoading(true);
        const res = await fbGetSales();
        if (res.success) setSales(res.data);
        setLoading(false);
      }, []);

      useEffect(() => { loadOrders(); }, [loadOrders]);

      const advanceOrder = async (sale, nextStatus) => {
        await fbUpdateSaleStatus(sale.id, nextStatus, user);
        loadOrders();
        Swal.fire({ icon: 'success', title: 'Order ' + nextStatus.toUpperCase(), timer: 1200, showConfirmButton: false });
      };

      const columns = [
        { id: 'pending', title: 'Received', color: '#0284c7', icon: 'fa-clock' },
        { id: 'preparing', title: 'Preparing', color: '#ea580c', icon: 'fa-blender' },
        { id: 'ready', title: 'Ready for Pickup', color: '#16a34a', icon: 'fa-bell' },
        { id: 'completed', title: 'Delivered / Completed', color: '#9333ea', icon: 'fa-circle-check' }
      ];

      return (
        <div className="data-section">
          {loading && <TopLoadingBar />}
          <div className="section-header">
            <div>
              <h2><i className="fas fa-blender"></i> Order Board (Live Kitchen Queue)</h2>
              <div style={{ color: '#64748b', fontSize: '13px', marginTop: 4 }}>
                Real-time fulfillment and dispatch queue for packing and warehouse staff.
              </div>
            </div>
            <button className="btn btn-secondary" onClick={loadOrders}><i className="fas fa-rotate"></i> Refresh Queue</button>
          </div>

          <div className="kanban-grid">
            {columns.map(col => {
              const colOrders = sales.filter(s => (s.status || 'pending') === col.id);
              return (
                <div key={col.id} className="kanban-col">
                  <div className="kanban-col-header" style={{ borderColor: col.color }}>
                    <h4 style={{ color: col.color }}><i className={'fas ' + col.icon}></i> {col.title}</h4>
                    <span className="badge" style={{ background: col.color, color: '#fff' }}>{colOrders.length}</span>
                  </div>

                  <div className="kanban-col-list">
                    {colOrders.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '13px' }}>
                        No orders in this stage
                      </div>
                    ) : (
                      colOrders.map(sale => (
                        <div key={sale.id} className="kanban-card">
                          <div className="kanban-card-top">
                            <span style={{ color: 'var(--navy-primary)' }}>#{sale.invoiceNo}</span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: 4 }}>
                            {sale.customerName || 'Walk-in Customer'}
                          </div>
                          <div className="kanban-card-items">
                            {(sale.items || []).map((it, idx) => (
                              <div key={idx} style={{ marginBottom: 4 }}>
                                <strong>{it.qty}x</strong> {it.name}
                                {it.size && <span style={{ fontSize: 11, color: '#0284c7' }}> ({it.size})</span>}
                                {it.customization && <div style={{ fontSize: 10.5, color: '#64748b', paddingLeft: 12 }}>{it.customization}</div>}
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 12 }}>
                            <span className="tb-pill role">{sale.paymentMethod || 'Cash'}</span>
                            <strong style={{ color: 'var(--navy-primary)' }}>${Number(sale.grandTotal || 0).toFixed(2)}</strong>
                          </div>
                          <div className="kanban-card-actions">
                            {col.id === 'pending' && (
                              <button className="btn btn-primary" style={{ flex: 1, padding: '5px 8px', fontSize: 12 }} onClick={() => advanceOrder(sale, 'preparing')}>
                                <i className="fas fa-blender"></i> Start
                              </button>
                            )}
                            {col.id === 'preparing' && (
                              <button className="btn btn-success" style={{ flex: 1, padding: '5px 8px', fontSize: 12 }} onClick={() => advanceOrder(sale, 'ready')}>
                                <i className="fas fa-bell"></i> Ready
                              </button>
                            )}
                            {col.id === 'ready' && (
                              <button className="btn btn-primary" style={{ flex: 1, padding: '5px 8px', fontSize: 12, background: '#9333ea' }} onClick={() => advanceOrder(sale, 'completed')}>
                                <i className="fas fa-check"></i> Complete
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // --- Payment Review View (Slip Verification) ---
