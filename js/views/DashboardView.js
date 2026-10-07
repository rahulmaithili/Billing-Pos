function DashboardView({ user, role, setActiveMenu }) {
      const { loading, data } = useFetch(() => Promise.all([fbGetSales(), fbGetProducts(), fbGetStockMovements(), fbGetExpenses()]), []);
      const sales = useMemo(() => (data && data[0] && data[0].success ? data[0].data : []), [data]);
      const products = useMemo(() => (data && data[1] && data[1].success ? data[1].data : []), [data]);
      const movements = useMemo(() => (data && data[2] && data[2].success ? data[2].data : []), [data]);
      const expenses = useMemo(() => (data && data[3] && data[3].success ? data[3].data : []), [data]);

      const barRef = useRef(null), payRef = useRef(null);
      const barChart = useRef(null), payChart = useRef(null);
      const ymd = (d) => { try { return new Date(d).toISOString().slice(0, 10); } catch (e) { return ''; } };
      const today = new Date().toISOString().slice(0, 10);

      const s = useMemo(() => {
        const todaySales = sales.filter(x => ymd(x.createdAt) === today);
        const lowStock = products.filter(p => computeQtyOnHand(p.id, movements) <= Number(p.reorderLevel || 0));
        const month = today.slice(0, 7);
        const monthRevenue = sales.filter(x => ymd(x.createdAt).slice(0, 7) === month).reduce((a, x) => a + Number(x.total || 0), 0);
        const monthExpenses = expenses.filter(e => (e.date || ymd(e.createdAt)).slice(0, 7) === month).reduce((a, e) => a + Number(e.amount || 0), 0);
        return {
          todayRevenue: todaySales.reduce((a, x) => a + Number(x.total || 0), 0),
          todayOrders: todaySales.length,
          lowStock,
          creditOutstanding: sales.filter(x => x.status === 'credit').reduce((a, x) => a + Number(x.total || 0), 0),
          stockValue: products.reduce((a, p) => a + computeQtyOnHand(p.id, movements) * (Number(p.cost) || 0), 0),
          monthRevenue, monthExpenses
        };
      }, [sales, products, movements, expenses, today]);

      const recentSales = useMemo(() => [...sales].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6), [sales]);

      useEffect(() => {
        if (loading) return;
        const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
        const labels = days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' }));
        const revByDay = days.map(d => { const k = d.toISOString().slice(0, 10); return sales.filter(x => ymd(x.createdAt) === k).reduce((a, x) => a + Number(x.total || 0), 0); });
        const byPay = sales.reduce((m, x) => { const k = x.paymentMethod || 'Other'; m[k] = (m[k] || 0) + Number(x.total || 0); return m; }, {});

        if (barChart.current) barChart.current.destroy();
        if (barRef.current) barChart.current = new Chart(barRef.current, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Revenue', data: revByDay, backgroundColor: 'rgba(0,116,217,0.7)', borderColor: '#0074D9', borderWidth: 2, borderRadius: 6, borderSkipped: false }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
        if (payChart.current) payChart.current.destroy();
        if (payRef.current) payChart.current = new Chart(payRef.current, {
          type: 'doughnut',
          data: { labels: Object.keys(byPay), datasets: [{ data: Object.values(byPay), backgroundColor: ['#001f3f', '#0074D9', '#34a853', '#fbbc04', '#ea4335', '#8e44ad'], borderColor: '#fff', borderWidth: 2 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom' } } }
        });
        return () => { if (barChart.current) barChart.current.destroy(); if (payChart.current) payChart.current.destroy(); };
      }, [loading, sales]);

      if (loading) return <div className="lte-kpi-grid">{[...Array(4)].map((_, i) => <DashboardCardSkeleton key={i} />)}</div>;

      return (
        <div>
          <div className="quick-actions">
            <button className="btn btn-success" onClick={() => setActiveMenu('pos')}><i className="fas fa-cash-register"></i> New Sale</button>
            <button className="btn btn-primary" onClick={() => setActiveMenu('products')}><i className="fas fa-box"></i> Add Product</button>
            <button className="btn btn-primary" onClick={() => setActiveMenu('purchase-orders')}><i className="fas fa-file-invoice-dollar"></i> New PO</button>
            <button className="btn btn-secondary" onClick={() => setActiveMenu('expenses')}><i className="fas fa-money-bill-trend-up"></i> Add Expense</button>
          </div>
          <div className="lte-kpi-grid">
            <SmallBox value={money(s.todayRevenue)} label="Today's Sales" icon="fa-sack-dollar" color="bg-success" onMore={() => setActiveMenu('sales-history')} />
            <SmallBox value={s.todayOrders} label="Today's Orders" icon="fa-receipt" color="bg-navy" onMore={() => setActiveMenu('sales-history')} />
            <SmallBox value={s.lowStock.length} label="Low Stock Items" icon="fa-triangle-exclamation" color="bg-warning" onMore={() => setActiveMenu('products')} />
            <SmallBox value={money(s.creditOutstanding)} label="Credit Outstanding" icon="fa-hand-holding-dollar" color="bg-danger" onMore={() => setActiveMenu('sales-history')} />
          </div>
          <div className="lte-kpi-grid">
            <div className="info-box"><div className="info-box-icon bg-navy"><i className="fas fa-warehouse"></i></div><div className="info-box-content"><div className="info-box-text">Stock Value</div><div className="info-box-number">{money(s.stockValue)}</div></div></div>
            <div className="info-box"><div className="info-box-icon bg-success"><i className="fas fa-arrow-trend-up"></i></div><div className="info-box-content"><div className="info-box-text">Month Revenue</div><div className="info-box-number">{money(s.monthRevenue)}</div></div></div>
            <div className="info-box"><div className="info-box-icon bg-danger"><i className="fas fa-arrow-trend-down"></i></div><div className="info-box-content"><div className="info-box-text">Month Expenses</div><div className="info-box-number">{money(s.monthExpenses)}</div></div></div>
            <div className="info-box"><div className="info-box-icon bg-info"><i className="fas fa-scale-balanced"></i></div><div className="info-box-content"><div className="info-box-text">Month Net</div><div className="info-box-number">{money(s.monthRevenue - s.monthExpenses)}</div></div></div>
          </div>
          <div className="dashboard-grid-2">
            <LteCard title="Revenue — Last 7 Days" icon="fa-chart-column"><div className="chart-container"><canvas ref={barRef}></canvas></div></LteCard>
            <LteCard title="Sales by Payment Method" icon="fa-chart-pie"><div className="chart-container"><canvas ref={payRef}></canvas></div></LteCard>
          </div>
          <div className="dashboard-grid-2">
            <LteCard title="Recent Sales" icon="fa-receipt">
              {recentSales.length === 0 ? <p style={{ color: '#999' }}>No sales yet.</p> : (
                <div className="about-table-wrapper">
                  <table className="about-roles-table">
                    <thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>When</th></tr></thead>
                    <tbody>{recentSales.map(x => <tr key={x.id}><td>{x.invoiceNo || String(x.id).slice(-6).toUpperCase()}</td><td>{x.customerName || 'Walk-in'}</td><td>{money(x.total)}</td><td>{getTimeAgo(x.createdAt)}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </LteCard>
            <LteCard title="Low Stock Alerts" icon="fa-triangle-exclamation">
              {s.lowStock.length === 0 ? <p style={{ color: '#999' }}>All stock levels healthy.</p> : (
                <div className="about-table-wrapper">
                  <table className="about-roles-table">
                    <thead><tr><th>Product</th><th>SKU</th><th>On Hand</th><th>Reorder</th></tr></thead>
                    <tbody>{s.lowStock.slice(0, 8).map(p => <tr key={p.id}><td>{p.name}</td><td><code>{p.sku}</code></td><td><span className="status-badge status-inactive">{computeQtyOnHand(p.id, movements)}</span></td><td>{p.reorderLevel || 0}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </LteCard>
          </div>
        </div>
      );
    }

    // --- Logs View (Admin only) ---
