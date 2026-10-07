// --- Dashboard View V2 (Exact Match to Screenshot 1) ---
function DashboardView({ user, role, setActiveMenu }) {
  const { loading, data } = useFetch(() => Promise.all([
    fbGetSales(),
    fbGetProducts(),
    fbGetStockMovements(),
    fbGetLogs(),
    fbGetAddons()
  ]), []);

  const sales = useMemo(() => (data && data[0] && data[0].success ? data[0].data : []), [data]);
  const products = useMemo(() => (data && data[1] && data[1].success ? data[1].data : []), [data]);
  const movements = useMemo(() => (data && data[2] && data[2].success ? data[2].data : []), [data]);
  const logs = useMemo(() => (data && data[3] && data[3].success ? data[3].data : []), [data]);
  const addons = useMemo(() => (data && data[4] && data[4].success ? data[4].data : []), [data]);

  const [selectedOrderModal, setSelectedOrderModal] = useState(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Today's Sales
  const todaySales = useMemo(() => {
    return sales.filter(s => {
      const d = s.createdAt || s.date;
      return d && d.slice(0, 10) === todayStr;
    });
  }, [sales, todayStr]);

  const todayRevenue = useMemo(() => {
    return todaySales.reduce((sum, s) => sum + (Number(s.total) || Number(s.grandTotal) || 0), 0);
  }, [todaySales]);

  const todayAvg = useMemo(() => {
    return todaySales.length ? (todayRevenue / todaySales.length) : 0;
  }, [todayRevenue, todaySales]);

  // Drinks Sold Today
  const todayDrinksCount = useMemo(() => {
    return todaySales.reduce((sum, s) => {
      return sum + (s.items || []).reduce((n, it) => n + (Number(it.qty) || 1), 0);
    }, 0);
  }, [todaySales]);

  // Best seller product name
  const bestSeller = useMemo(() => {
    const counts = {};
    sales.forEach(s => {
      (s.items || []).forEach(it => {
        const nm = it.name || 'Drink';
        counts[nm] = (counts[nm] || 0) + (Number(it.qty) || 1);
      });
    });
    let top = null, max = 0;
    Object.entries(counts).forEach(([nm, n]) => {
      if (n > max) { max = n; top = nm; }
    });
    return top ? `${top} (${max})` : '—';
  }, [sales]);

  // Addon attach rate
  const addonAttachRate = useMemo(() => {
    if (!sales.length) return 0;
    const salesWithAddons = sales.filter(s => (s.items || []).some(it => it.customization || it.addons || (it.addon_ids && it.addon_ids.length)));
    return Math.round((salesWithAddons.length / sales.length) * 100);
  }, [sales]);

  // Rejected payments count
  const rejectedPayments = useMemo(() => {
    return sales.filter(s => s.paymentApproved === false);
  }, [sales]);

  // Sold out items count
  const soldOutDrinks = useMemo(() => {
    return products.filter(p => p.is_available === false || p.status === 'sold_out');
  }, [products]);
  const soldOutAddons = useMemo(() => {
    return addons.filter(a => a.available === false);
  }, [addons]);

  // Attention Required Orders (Pending Review, Late, Waiting)
  const attentionOrders = useMemo(() => {
    return sales.filter(s => {
      const isUnapproved = s.paymentApproved !== true && s.paymentApproved !== false && (
        s.paymentMethod === 'Online' || s.paymentMethod === 'Bank Transfer' || s.paymentMethod === 'UPI / QR' || s.receiptImage
      );
      const isLate = s.orderStatus === 'pending' || s.orderStatus === 'preparing';
      return isUnapproved || isLate;
    }).slice(0, 5);
  }, [sales]);

  const getTimeWait = (dateStr) => {
    if (!dateStr) return '10 min';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours} h ${mins} min`;
    return `${mins} min`;
  };

  const getLogIcon = (action = '') => {
    const act = action.toLowerCase();
    if (act.includes('login')) return { icon: 'fa-right-to-bracket', bg: '#dcfce7', color: '#15803d' };
    if (act.includes('image') || act.includes('profile')) return { icon: 'fa-image', bg: '#fee2e2', color: '#dc2626' };
    if (act.includes('settings')) return { icon: 'fa-sliders', bg: '#fef3c7', color: '#d97706' };
    if (act.includes('delete') || act.includes('reject')) return { icon: 'fa-trash', bg: '#fee2e2', color: '#dc2626' };
    if (act.includes('order') || act.includes('sale')) return { icon: 'fa-receipt', bg: '#e0f2fe', color: '#0284c7' };
    return { icon: 'fa-circle-info', bg: '#f1f5f9', color: '#475569' };
  };

  const formatLogTime = (t) => {
    if (!t) return 'Recent';
    const d = new Date(t);
    const isToday = d.toISOString().slice(0, 10) === todayStr;
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return 'Yesterday';
  };

  return (
    <div className="dash-v2-wrap">
      {loading && <TopLoadingBar />}

      {/* Breadcrumb */}
      <div className="dash-breadcrumb">
        <span><i className="fas fa-chart-line" style={{ color: 'var(--navy-accent)' }}></i> <strong>Dashboard</strong></span>
        <span>/</span>
        <span>Home</span>
        <span>/</span>
        <span>General</span>
        <span>/</span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>Dashboard</span>
      </div>

      {/* Top Section Grid: Maroon Sales Card + 4 KPI Subcards */}
      <div className="dash-top-grid">
        {/* Maroon Hero Card: Sales - Today */}
        <div className="dash-sales-hero-card">
          <div>
            <div className="dash-sales-hero-top">
              <span className="dash-sales-pill">
                <i className="fas fa-droplet"></i> Sales · Today
              </span>
              <button
                type="button"
                className="dash-sales-open-btn"
                onClick={() => setActiveMenu && setActiveMenu('sales-history')}
                title="View Sales History"
              >
                <i className="fas fa-arrow-up-right-from-square"></i>
              </button>
            </div>

            <div className="dash-sales-big-amt">{money(todayRevenue)}</div>
            <div className="dash-sales-subtext">
              <span>from {todaySales.length} paid orders</span>
              <span>·</span>
              <span style={{ color: todayRevenue > 0 ? '#86efac' : '#fca5a5' }}>
                <i className={`fas fa-arrow-${todayRevenue > 0 ? 'trend-up' : 'arrow-down-right'}`}></i> {todayRevenue > 0 ? '+100%' : '-100%'} vs last Wed
              </span>
            </div>
          </div>

          <div className="dash-sales-bottom-strip">
            <div className="dash-sales-stat-col">
              <span className="lbl">Average order</span>
              <span className="val">{money(todayAvg)}</span>
            </div>
            <div className="dash-sales-stat-col">
              <span className="lbl">Best seller</span>
              <span className="val" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bestSeller}</span>
            </div>
            <div className="dash-sales-stat-col">
              <span className="lbl">Add-on attach</span>
              <span className="val">{addonAttachRate}%</span>
            </div>
          </div>
        </div>

        {/* Today 4 KPI Card Grid */}
        <div className="dash-today-wrap">
          <div className="dash-today-h">
            <span><i className="fas fa-calendar-day" style={{ marginRight: 6, color: '#64748b' }}></i> Today</span>
            <button
              type="button"
              className="dash-sales-open-btn"
              onClick={() => setActiveMenu && setActiveMenu('reports')}
              title="Full Analytics Report"
              style={{ background: '#f1f5f9', color: '#475569' }}
            >
              <i className="fas fa-chart-column"></i>
            </button>
          </div>

          <div className="dash-today-grid">
            {/* Paid orders */}
            <div className="dash-kpi-subcard">
              <div className="dash-kpi-subcard-top">
                <span className="dash-kpi-subcard-title">Paid orders</span>
                <div className="dash-kpi-circle-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  <i className="fas fa-bag-shopping"></i>
                </div>
              </div>
              <div>
                <div className="dash-kpi-subcard-num">{todaySales.length}</div>
                <div className="dash-kpi-subcard-note">
                  <span style={{ color: '#ef4444' }}><i className="fas fa-arrow-down-right"></i> {todaySales.length > 0 ? '+100%' : '-100%'}</span>
                  <span>vs last Wed</span>
                </div>
              </div>
            </div>

            {/* Drinks sold */}
            <div className="dash-kpi-subcard">
              <div className="dash-kpi-subcard-top">
                <span className="dash-kpi-subcard-title">Drinks sold</span>
                <div className="dash-kpi-circle-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <i className="fas fa-mug-hot"></i>
                </div>
              </div>
              <div>
                <div className="dash-kpi-subcard-num">{todayDrinksCount}</div>
                <div className="dash-kpi-subcard-note">
                  <span style={{ color: '#ef4444' }}><i className="fas fa-arrow-down-right"></i> {todayDrinksCount > 0 ? '+100%' : '-100%'}</span>
                  <span>vs last Wed</span>
                </div>
              </div>
            </div>

            {/* Avg approval time */}
            <div className="dash-kpi-subcard">
              <div className="dash-kpi-subcard-top">
                <span className="dash-kpi-subcard-title">Avg. approval time</span>
                <div className="dash-kpi-circle-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                  <i className="fas fa-droplet"></i>
                </div>
              </div>
              <div>
                <div className="dash-kpi-subcard-num">—</div>
                <div className="dash-kpi-subcard-note">receipt → approved</div>
              </div>
            </div>

            {/* Rejected payments */}
            <div className="dash-kpi-subcard">
              <div className="dash-kpi-subcard-top">
                <span className="dash-kpi-subcard-title">Rejected payments</span>
                <div className="dash-kpi-circle-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  <i className="fas fa-ban"></i>
                </div>
              </div>
              <div>
                <div className="dash-kpi-subcard-num">{rejectedPayments.length}</div>
                <div className="dash-kpi-subcard-note">0% of cancelled</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Attention Required & Recent Activity */}
      <div className="dash-mid-grid">
        {/* Attention Required */}
        <div className="dash-card-box">
          <div className="dash-card-box-header">
            <div>
              <div className="dash-card-box-title">
                <i className="fas fa-triangle-exclamation" style={{ color: '#ea580c' }}></i>
                Attention required
              </div>
              <div className="dash-card-box-sub">Worst first, then the longest wait</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde047', fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                ● {attentionOrders.length} orders need action
              </span>
              <button
                type="button"
                className="dash-sales-open-btn"
                style={{ background: '#f1f5f9', color: '#475569' }}
                onClick={() => setActiveMenu && setActiveMenu('sales-history')}
              >
                <i className="fas fa-arrow-up-right-from-square"></i>
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="dash-attention-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Issue</th>
                  <th>Payment</th>
                  <th>Waiting</th>
                  <th>Pickup</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {attentionOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      <i className="fas fa-circle-check" style={{ color: '#16a34a', marginRight: 6 }}></i>
                      All queues clear — no orders need immediate action!
                    </td>
                  </tr>
                ) : (
                  attentionOrders.map(sale => {
                    const isReview = sale.paymentApproved !== true && sale.paymentApproved !== false && (
                      sale.paymentMethod === 'Online' || sale.paymentMethod === 'Bank Transfer' || sale.paymentMethod === 'UPI / QR' || sale.receiptImage
                    );
                    const inv = sale.invoiceNo || (sale.id ? sale.id.slice(-6).toUpperCase() : '001');
                    const itemsCount = (sale.items || []).reduce((n, it) => n + (Number(it.qty) || 1), 0);
                    const amt = Number(sale.total) || Number(sale.grandTotal) || 0;

                    return (
                      <tr key={sale.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{sale.customerName || 'Admin 1'}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>#{inv} · {itemsCount} drink{itemsCount === 1 ? '' : 's'} · {money(amt)}</div>
                        </td>
                        <td>
                          {isReview ? (
                            <span className="dash-issue-tag review">
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }}></span>
                              Payment to review
                            </span>
                          ) : (
                            <span className="dash-issue-tag late">
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c' }}></span>
                              Running late
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            <i className="fas fa-wallet" style={{ marginRight: 4, color: '#e11d48' }}></i>
                            {sale.paymentMethod || 'Wallet QR'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{getTimeWait(sale.createdAt || sale.date)}</span>
                          <span className="dash-wait-bars">IIIII</span>
                        </td>
                        <td style={{ color: '#64748b', fontSize: 12 }}>
                          {sale.orderType || 'Pickup · ASAP'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isReview ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                window.selectedReviewSaleId = sale.id;
                                if (setActiveMenu) setActiveMenu('review');
                              }}
                              style={{ padding: '4px 12px', fontSize: 11.5, fontWeight: 700 }}
                            >
                              Review
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => setSelectedOrderModal(sale)}
                              style={{ padding: '4px 12px', fontSize: 11.5, fontWeight: 700 }}
                            >
                              Open
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {(soldOutDrinks.length > 0 || soldOutAddons.length > 0) && (
            <div>
              <span className="dash-soldout-pill">
                <i className="fas fa-ban"></i> {soldOutDrinks.length} drink{soldOutDrinks.length === 1 ? '' : 's'} · {soldOutAddons.length} add-on sold out
              </span>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="dash-card-box">
          <div className="dash-card-box-header">
            <div className="dash-card-box-title">
              <i className="fas fa-clock-rotate-left" style={{ color: 'var(--navy-accent)' }}></i>
              Recent activity
            </div>
            <button
              type="button"
              className="dash-sales-open-btn"
              style={{ background: '#f1f5f9', color: '#475569' }}
              onClick={() => setActiveMenu && setActiveMenu('logs')}
              title="All Activity Logs"
            >
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>

          <div className="dash-act-list">
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                No recent activity logged
              </div>
            ) : (
              logs.slice(0, 7).map((log, i) => {
                const conf = getLogIcon(log.action);
                return (
                  <div key={log.id || i} className="dash-act-item">
                    <div className="dash-act-ic" style={{ background: conf.bg, color: conf.color }}>
                      <i className={`fas ${conf.icon}`}></i>
                    </div>
                    <div className="dash-act-content">
                      <div className="dash-act-title">{log.action || 'Activity'}</div>
                      <div className="dash-act-desc">{log.detail || log.details || (log.user?.name || log.user?.email || 'User')}</div>
                    </div>
                    <div className="dash-act-time">{formatLogTime(log.timestamp || log.createdAt)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Sales Trend & Top Drinks */}
      <div className="dash-bot-grid">
        {/* Sales Trend per hour */}
        <div className="dash-card-box">
          <div className="dash-card-box-header">
            <div className="dash-card-box-title">
              <i className="fas fa-chart-line" style={{ color: 'var(--navy-accent)' }}></i>
              Sales trend
            </div>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>per hour</span>
          </div>
          <div className="dash-chart-empty">
            <i className="fas fa-chart-column"></i>
            <span>No sales in this period</span>
          </div>
        </div>

        {/* Top drinks by quantity */}
        <div className="dash-card-box">
          <div className="dash-card-box-header">
            <div className="dash-card-box-title">
              <i className="fas fa-mug-hot" style={{ color: 'var(--navy-accent)' }}></i>
              Top drinks
            </div>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>by quantity</span>
          </div>
          <div className="dash-chart-empty">
            <i className="fas fa-mug-saucer"></i>
            <span>No sales in this period</span>
          </div>
        </div>
      </div>

      {/* Order Modal if opened from attention table */}
      {selectedOrderModal && (
        <OrderDetailsModal
          order={selectedOrderModal}
          onClose={() => setSelectedOrderModal(null)}
          onReviewPayment={(sale) => {
            setSelectedOrderModal(null);
            window.selectedReviewSaleId = sale.id;
            if (setActiveMenu) setActiveMenu('review');
          }}
          user={user}
        />
      )}
    </div>
  );
}
