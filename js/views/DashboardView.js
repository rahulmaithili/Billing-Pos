// --- Enhanced Dashboard View with Date Filtering & Comprehensive Sales Intelligence ---
function DashboardView({ user, role, setActiveMenu }) {
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey(k => k + 1);

  const { loading, data } = useFetch(() => Promise.all([
    fbGetSales(),
    fbGetProducts(),
    fbGetStockMovements(),
    fbGetLogs(),
    fbGetAddons()
  ]), [reloadKey]);

  const sales = useMemo(() => (data && data[0] && data[0].success ? data[0].data : []), [data]);
  const products = useMemo(() => (data && data[1] && data[1].success ? data[1].data : []), [data]);
  const movements = useMemo(() => (data && data[2] && data[2].success ? data[2].data : []), [data]);
  const logs = useMemo(() => (data && data[3] && data[3].success ? data[3].data : []), [data]);
  const addons = useMemo(() => (data && data[4] && data[4].success ? data[4].data : []), [data]);

  const [selectedOrderModal, setSelectedOrderModal] = useState(null);
  const [thermalSlipSale, setThermalSlipSale] = useState(null);

  // Date Filtering States
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const [filterMode, setFilterMode] = useState('today'); // 'today' | 'yesterday' | 'last7' | 'this_month' | 'all' | 'custom_date'
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Date helper functions
  const getSaleDateStr = useCallback((s) => {
    const raw = s.createdAt || s.date || '';
    if (!raw) return '';
    return String(raw).slice(0, 10);
  }, []);

  const getSaleDateTime = useCallback((s) => {
    const raw = s.createdAt || s.date || '';
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }, []);

  const getSaleAmount = useCallback((s) => {
    return Number(s.total != null ? s.total : (s.grandTotal != null ? s.grandTotal : 0)) || 0;
  }, []);

  // Filter preset handlers
  const handleSetPreset = (mode) => {
    setFilterMode(mode);
    if (mode === 'today') setSelectedDate(todayStr);
    if (mode === 'yesterday') setSelectedDate(yesterdayStr);
  };

  const handlePrevDay = () => {
    const cur = new Date(selectedDate);
    if (isNaN(cur.getTime())) return;
    cur.setDate(cur.getDate() - 1);
    const prev = cur.toISOString().slice(0, 10);
    setSelectedDate(prev);
    setFilterMode(prev === todayStr ? 'today' : (prev === yesterdayStr ? 'yesterday' : 'custom_date'));
  };

  const handleNextDay = () => {
    const cur = new Date(selectedDate);
    if (isNaN(cur.getTime())) return;
    cur.setDate(cur.getDate() + 1);
    const next = cur.toISOString().slice(0, 10);
    setSelectedDate(next);
    setFilterMode(next === todayStr ? 'today' : (next === yesterdayStr ? 'yesterday' : 'custom_date'));
  };

  const handleCustomDateChange = (val) => {
    if (!val) return;
    setSelectedDate(val);
    setFilterMode(val === todayStr ? 'today' : (val === yesterdayStr ? 'yesterday' : 'custom_date'));
  };

  // Filtered Sales according to Date Filter
  const filteredSales = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysStr = sevenDaysAgo.toISOString().slice(0, 10);

    const currentYearMonth = todayStr.slice(0, 7);

    return sales.filter(s => {
      const dStr = getSaleDateStr(s);
      if (!dStr) return false;

      if (filterMode === 'today') return dStr === todayStr;
      if (filterMode === 'yesterday') return dStr === yesterdayStr;
      if (filterMode === 'custom_date') return dStr === selectedDate;
      if (filterMode === 'last7') return dStr >= sevenDaysStr && dStr <= todayStr;
      if (filterMode === 'this_month') return dStr.startsWith(currentYearMonth);
      if (filterMode === 'all') return true;
      return dStr === selectedDate;
    });
  }, [sales, filterMode, selectedDate, todayStr, yesterdayStr, getSaleDateStr]);

  // Selected Period Label
  const periodLabel = useMemo(() => {
    if (filterMode === 'today') return 'Today';
    if (filterMode === 'yesterday') return 'Yesterday';
    if (filterMode === 'last7') return 'Last 7 Days';
    if (filterMode === 'this_month') return 'This Month';
    if (filterMode === 'all') return 'All Time';
    try {
      const d = new Date(selectedDate + 'T00:00:00');
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return selectedDate;
    }
  }, [filterMode, selectedDate]);

  // Aggregate Key Metrics for Filtered Period
  const revenue = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + getSaleAmount(s), 0);
  }, [filteredSales, getSaleAmount]);

  const ordersCount = filteredSales.length;

  const avgOrderValue = useMemo(() => {
    return ordersCount > 0 ? (revenue / ordersCount) : 0;
  }, [revenue, ordersCount]);

  const drinksSoldCount = useMemo(() => {
    return filteredSales.reduce((sum, s) => {
      return sum + (s.items || []).reduce((n, it) => n + (Number(it.qty) || 1), 0);
    }, 0);
  }, [filteredSales]);

  // Best seller product on this date / period
  const bestSellerInfo = useMemo(() => {
    const counts = {};
    filteredSales.forEach(s => {
      (s.items || []).forEach(it => {
        const nm = it.name || 'Drink';
        counts[nm] = (counts[nm] || 0) + (Number(it.qty) || 1);
      });
    });
    let topName = '—', maxQty = 0;
    Object.entries(counts).forEach(([nm, n]) => {
      if (n > maxQty) { maxQty = n; topName = nm; }
    });
    return { name: topName, qty: maxQty };
  }, [filteredSales]);

  // Addon attach rate on this date / period
  const addonAttachRate = useMemo(() => {
    if (!filteredSales.length) return 0;
    const withAddons = filteredSales.filter(s => (s.items || []).some(it => it.customization || it.addons || (it.addon_ids && it.addon_ids.length)));
    return Math.round((withAddons.length / filteredSales.length) * 100);
  }, [filteredSales]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    let upi = 0, upiCount = 0;
    let cash = 0, cashCount = 0;
    let card = 0, cardCount = 0;
    let other = 0, otherCount = 0;

    filteredSales.forEach(s => {
      const amt = getSaleAmount(s);
      const m = String(s.paymentMethod || '').toLowerCase();
      if (m.includes('upi') || m.includes('online') || m.includes('qr') || m.includes('bank') || m.includes('gpay')) {
        upi += amt;
        upiCount++;
      } else if (m.includes('cash')) {
        cash += amt;
        cashCount++;
      } else if (m.includes('card')) {
        card += amt;
        cardCount++;
      } else {
        other += amt;
        otherCount++;
      }
    });

    const tot = revenue || 1;
    return {
      upi, upiCount, upiPct: Math.round((upi / tot) * 100),
      cash, cashCount, cashPct: Math.round((cash / tot) * 100),
      card, cardCount, cardPct: Math.round((card / tot) * 100),
      other, otherCount, otherPct: Math.round((other / tot) * 100)
    };
  }, [filteredSales, revenue, getSaleAmount]);

  // Top 5 Selling Drinks Ranking
  const topDrinksRanking = useMemo(() => {
    const map = {};
    filteredSales.forEach(s => {
      (s.items || []).forEach(it => {
        const id = it.productId || it.name || 'item';
        if (!map[id]) {
          map[id] = { name: it.name || 'Drink', qty: 0, revenue: 0, category: it.category || 'Beverage' };
        }
        const q = Number(it.qty) || 1;
        const p = Number(it.price) || 0;
        map[id].qty += q;
        map[id].revenue += q * p;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredSales]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = {};
    filteredSales.forEach(s => {
      (s.items || []).forEach(it => {
        const cat = it.category || 'General';
        if (!map[cat]) map[cat] = { name: cat, qty: 0, revenue: 0 };
        const q = Number(it.qty) || 1;
        const p = Number(it.price) || 0;
        map[cat].qty += q;
        map[cat].revenue += q * p;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  // Chart Rendering using Chart.js
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!chartCanvasRef.current || typeof Chart === 'undefined') return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (!filteredSales.length) return;

    // Check if single day or multiple days
    const isSingleDay = filterMode === 'today' || filterMode === 'yesterday' || filterMode === 'custom_date';

    let labels = [];
    let dataPoints = [];

    if (isSingleDay) {
      // 24 Hour Distribution (grouped in 2-hour slots from 08:00 to 22:00)
      const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      const hourRev = [0, 0, 0, 0, 0, 0, 0, 0];

      filteredSales.forEach(s => {
        const dt = getSaleDateTime(s);
        if (!dt) return;
        const h = dt.getHours();
        const amt = getSaleAmount(s);
        if (h < 9) hourRev[0] += amt;
        else if (h < 11) hourRev[1] += amt;
        else if (h < 13) hourRev[2] += amt;
        else if (h < 15) hourRev[3] += amt;
        else if (h < 17) hourRev[4] += amt;
        else if (h < 19) hourRev[5] += amt;
        else if (h < 21) hourRev[6] += amt;
        else hourRev[7] += amt;
      });

      labels = hours;
      dataPoints = hourRev;
    } else {
      // Multiple days trend (group by date)
      const dateMap = {};
      filteredSales.forEach(s => {
        const d = getSaleDateStr(s);
        dateMap[d] = (dateMap[d] || 0) + getSaleAmount(s);
      });
      const sortedDates = Object.keys(dateMap).sort();
      labels = sortedDates.map(d => {
        try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); }
        catch (e) { return d; }
      });
      dataPoints = sortedDates.map(d => dateMap[d]);
    }

    const ctx = chartCanvasRef.current.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(14, 165, 233, 0.35)');
    gradient.addColorStop(1, 'rgba(14, 165, 233, 0.01)');

    chartInstanceRef.current = new Chart(chartCanvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Sales Revenue',
          data: dataPoints,
          borderColor: '#0284c7',
          backgroundColor: gradient,
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#0284c7',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => 'Revenue: ' + money(ctx.parsed.y)
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: {
            beginAtZero: true,
            ticks: {
              font: { size: 11 },
              callback: (v) => money(v)
            },
            grid: { color: '#f1f5f9' }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [filteredSales, filterMode, selectedDate, getSaleDateTime, getSaleAmount, getSaleDateStr]);

  // Export CSV of selected date sales
  const handleExportCsv = () => {
    if (!filteredSales.length) {
      Swal.fire({ icon: 'info', title: 'No Sales', text: 'No sales recorded for this date/period.' });
      return;
    }
    const header = ['Invoice', 'Date Time', 'Customer', 'Cashier', 'Payment Method', 'Items Count', 'Total'];
    const rows = filteredSales.map(s => [
      s.invoiceNo || s.id,
      s.createdAt || s.date || '',
      s.customerName || 'Walk-in',
      s.cashier || '',
      s.paymentMethod || 'Cash',
      (s.items || []).reduce((n, it) => n + (Number(it.qty) || 1), 0),
      getSaleAmount(s)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map(r => r.map(x => `"${x}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${selectedDate || 'period'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Attention orders & logs
  const rejectedPayments = useMemo(() => sales.filter(s => s.paymentApproved === false), [sales]);
  const soldOutDrinks = useMemo(() => products.filter(p => p.is_available === false || p.status === 'sold_out'), [products]);
  const soldOutAddons = useMemo(() => addons.filter(a => a.available === false), [addons]);

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
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="dash-v2-wrap">
      {loading && <TopLoadingBar />}

      {/* Header Breadcrumb & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <div className="dash-breadcrumb" style={{ margin: 0 }}>
          <span><i className="fas fa-chart-line" style={{ color: 'var(--navy-accent)' }}></i> <strong>Dashboard</strong></span>
          <span>/</span>
          <span>Home</span>
          <span>/</span>
          <span>General</span>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Analytics &amp; Performance</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveMenu && setActiveMenu('pos')}
            style={{ fontWeight: 700, padding: '7px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <i className="fas fa-plus"></i> New POS Bill
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportCsv}
            title="Download CSV report for selected date"
          >
            <i className="fas fa-download"></i> Export CSV
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={reload}
            title="Refresh database"
          >
            <i className="fas fa-rotate"></i>
          </button>
        </div>
      </div>

      {/* --- DATE SELECTOR & PERIOD CONTROLS BAR (Requested Feature) --- */}
      <div className="dash-date-bar">
        {/* Quick Filter Pills */}
        <div className="dash-filter-pills">
          <button
            type="button"
            className={`dash-filter-btn ${filterMode === 'today' ? 'active' : ''}`}
            onClick={() => handleSetPreset('today')}
          >
            <i className="fas fa-calendar-day"></i> Today
          </button>
          <button
            type="button"
            className={`dash-filter-btn ${filterMode === 'yesterday' ? 'active' : ''}`}
            onClick={() => handleSetPreset('yesterday')}
          >
            <i className="fas fa-clock-rotate-left"></i> Yesterday
          </button>
          <button
            type="button"
            className={`dash-filter-btn ${filterMode === 'last7' ? 'active' : ''}`}
            onClick={() => handleSetPreset('last7')}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            className={`dash-filter-btn ${filterMode === 'this_month' ? 'active' : ''}`}
            onClick={() => handleSetPreset('this_month')}
          >
            This Month
          </button>
          <button
            type="button"
            className={`dash-filter-btn ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => handleSetPreset('all')}
          >
            All Time
          </button>
        </div>

        {/* Date Navigator (Previous Day < | Pick Date | Next Day >) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="dash-date-stepper-wrap">
            <button
              type="button"
              className="dash-stepper-btn"
              onClick={handlePrevDay}
              title="Previous Day"
            >
              <i className="fas fa-chevron-left"></i>
            </button>

            <input
              type="date"
              className="dash-date-input"
              value={selectedDate}
              onChange={(e) => handleCustomDateChange(e.target.value)}
              title="Pick a specific date to view sales"
            />

            <button
              type="button"
              className="dash-stepper-btn"
              onClick={handleNextDay}
              title="Next Day"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className="dash-date-active-tag">
            <i className="fas fa-calendar-check"></i>
            <span>Showing: <strong>{periodLabel}</strong></span>
          </div>
        </div>
      </div>

      {/* Top Section Grid: Hero Card + 4 KPI Subcards (Dynamically updated for Selected Date) */}
      <div className="dash-top-grid">
        {/* Maroon Hero Card: Sales for Selected Period */}
        <div className="dash-sales-hero-card">
          <div>
            <div className="dash-sales-hero-top">
              <span className="dash-sales-pill">
                <i className="fas fa-droplet"></i> Sales · {periodLabel}
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

            <div className="dash-sales-big-amt">{money(revenue)}</div>
            <div className="dash-sales-subtext">
              <span>from {ordersCount} paid order{ordersCount === 1 ? '' : 's'}</span>
              <span>·</span>
              <span style={{ color: revenue > 0 ? '#86efac' : '#fca5a5' }}>
                <i className={`fas fa-arrow-${revenue > 0 ? 'trend-up' : 'minus'}`}></i> {ordersCount} orders recorded
              </span>
            </div>
          </div>

          <div className="dash-sales-bottom-strip">
            <div className="dash-sales-stat-col">
              <span className="lbl">Average order</span>
              <span className="val">{money(avgOrderValue)}</span>
            </div>
            <div className="dash-sales-stat-col">
              <span className="lbl">Best seller</span>
              <span className="val" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {bestSellerInfo.qty > 0 ? `${bestSellerInfo.name} (${bestSellerInfo.qty})` : '—'}
              </span>
            </div>
            <div className="dash-sales-stat-col">
              <span className="lbl">Add-on attach</span>
              <span className="val">{addonAttachRate}%</span>
            </div>
          </div>
        </div>

        {/* 4 KPI Card Grid for Selected Period */}
        <div className="dash-today-wrap">
          <div className="dash-today-h">
            <span>
              <i className="fas fa-chart-pie" style={{ marginRight: 6, color: '#64748b' }}></i>
              Performance Summary ({periodLabel})
            </span>
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
                <div className="dash-kpi-subcard-num">{ordersCount}</div>
                <div className="dash-kpi-subcard-note">
                  <span style={{ color: ordersCount > 0 ? '#16a34a' : '#94a3b8' }}>
                    <i className="fas fa-receipt"></i> Completed bills
                  </span>
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
                <div className="dash-kpi-subcard-num">{drinksSoldCount}</div>
                <div className="dash-kpi-subcard-note">
                  <span style={{ color: drinksSoldCount > 0 ? '#16a34a' : '#94a3b8' }}>
                    <i className="fas fa-bottle-water"></i> Total cups/items
                  </span>
                </div>
              </div>
            </div>

            {/* UPI & Digital Share */}
            <div className="dash-kpi-subcard">
              <div className="dash-kpi-subcard-top">
                <span className="dash-kpi-subcard-title">UPI / Digital</span>
                <div className="dash-kpi-circle-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  <i className="fas fa-qrcode"></i>
                </div>
              </div>
              <div>
                <div className="dash-kpi-subcard-num">{money(paymentBreakdown.upi)}</div>
                <div className="dash-kpi-subcard-note">
                  <span style={{ color: '#0284c7' }}>{paymentBreakdown.upiPct}% of total</span>
                </div>
              </div>
            </div>

            {/* Cash Share */}
            <div className="dash-kpi-subcard">
              <div className="dash-kpi-subcard-top">
                <span className="dash-kpi-subcard-title">Cash in Drawer</span>
                <div className="dash-kpi-circle-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                  <i className="fas fa-money-bill-wave"></i>
                </div>
              </div>
              <div>
                <div className="dash-kpi-subcard-num">{money(paymentBreakdown.cash)}</div>
                <div className="dash-kpi-subcard-note">
                  <span style={{ color: '#16a34a' }}>{paymentBreakdown.cashPct}% of total</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- PAYMENT BREAKDOWN & REVENUE SPLIT WIDGET (New Feature) --- */}
      <div className="dash-card-box" style={{ marginBottom: 16 }}>
        <div className="dash-card-box-header">
          <div>
            <div className="dash-card-box-title">
              <i className="fas fa-wallet" style={{ color: '#059669' }}></i>
              Payment Methods Breakdown ({periodLabel})
            </div>
            <div className="dash-card-box-sub">Exact revenue received by payment method for this date</div>
          </div>
          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>
            Total: {money(revenue)}
          </span>
        </div>

        <div className="dash-pay-grid">
          {/* UPI / QR Scan */}
          <div className="dash-pay-item">
            <div className="dash-pay-item-top">
              <span><i className="fas fa-qrcode" style={{ color: '#0284c7', marginRight: 4 }}></i> UPI / QR Scan</span>
              <span>{paymentBreakdown.upiCount} bills</span>
            </div>
            <div className="dash-pay-item-amt">{money(paymentBreakdown.upi)}</div>
            <div className="dash-pay-bar-track">
              <div className="dash-pay-bar-fill" style={{ width: `${paymentBreakdown.upiPct}%`, background: '#0284c7' }}></div>
            </div>
            <span style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{paymentBreakdown.upiPct}% share</span>
          </div>

          {/* Cash */}
          <div className="dash-pay-item">
            <div className="dash-pay-item-top">
              <span><i className="fas fa-money-bill-wave" style={{ color: '#16a34a', marginRight: 4 }}></i> Cash</span>
              <span>{paymentBreakdown.cashCount} bills</span>
            </div>
            <div className="dash-pay-item-amt">{money(paymentBreakdown.cash)}</div>
            <div className="dash-pay-bar-track">
              <div className="dash-pay-bar-fill" style={{ width: `${paymentBreakdown.cashPct}%`, background: '#16a34a' }}></div>
            </div>
            <span style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{paymentBreakdown.cashPct}% share</span>
          </div>

          {/* Card */}
          <div className="dash-pay-item">
            <div className="dash-pay-item-top">
              <span><i className="fas fa-credit-card" style={{ color: '#8b5cf6', marginRight: 4 }}></i> Card / Terminal</span>
              <span>{paymentBreakdown.cardCount} bills</span>
            </div>
            <div className="dash-pay-item-amt">{money(paymentBreakdown.card)}</div>
            <div className="dash-pay-bar-track">
              <div className="dash-pay-bar-fill" style={{ width: `${paymentBreakdown.cardPct}%`, background: '#8b5cf6' }}></div>
            </div>
            <span style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{paymentBreakdown.cardPct}% share</span>
          </div>

          {/* Other / Split */}
          <div className="dash-pay-item">
            <div className="dash-pay-item-top">
              <span><i className="fas fa-arrows-split-up-and-left" style={{ color: '#f59e0b', marginRight: 4 }}></i> Split / Credit</span>
              <span>{paymentBreakdown.otherCount} bills</span>
            </div>
            <div className="dash-pay-item-amt">{money(paymentBreakdown.other)}</div>
            <div className="dash-pay-bar-track">
              <div className="dash-pay-bar-fill" style={{ width: `${paymentBreakdown.otherPct}%`, background: '#f59e0b' }}></div>
            </div>
            <span style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{paymentBreakdown.otherPct}% share</span>
          </div>
        </div>
      </div>

      {/* --- INTERACTIVE CHARTS & TOP DRINKS ROW --- */}
      <div className="dash-bot-grid" style={{ marginBottom: 16 }}>
        {/* Real Interactive Sales Trend Chart */}
        <div className="dash-card-box">
          <div className="dash-card-box-header">
            <div>
              <div className="dash-card-box-title">
                <i className="fas fa-chart-line" style={{ color: 'var(--navy-accent)' }}></i>
                Sales Trend ({periodLabel})
              </div>
              <div className="dash-card-box-sub">
                {filterMode === 'today' || filterMode === 'yesterday' || filterMode === 'custom_date'
                  ? 'Hourly revenue & rush hour distribution'
                  : 'Daily revenue trend over period'}
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0284c7' }}>
              {money(revenue)}
            </span>
          </div>

          {filteredSales.length === 0 ? (
            <div className="dash-chart-empty">
              <i className="fas fa-chart-column"></i>
              <span>No sales recorded on {periodLabel}</span>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => setActiveMenu && setActiveMenu('pos')}
                style={{ marginTop: 6 }}
              >
                <i className="fas fa-plus"></i> Create Sale in POS
              </button>
            </div>
          ) : (
            <div className="dash-chart-canvas-wrap">
              <canvas ref={chartCanvasRef}></canvas>
            </div>
          )}
        </div>

        {/* Top 5 Drinks Leaderboard for this date */}
        <div className="dash-card-box">
          <div className="dash-card-box-header">
            <div>
              <div className="dash-card-box-title">
                <i className="fas fa-mug-hot" style={{ color: '#d97706' }}></i>
                Top Drinks Sold ({periodLabel})
              </div>
              <div className="dash-card-box-sub">Most popular items by quantity sold</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
              {topDrinksRanking.length} items
            </span>
          </div>

          {topDrinksRanking.length === 0 ? (
            <div className="dash-chart-empty">
              <i className="fas fa-mug-saucer"></i>
              <span>No drinks sold in this period</span>
            </div>
          ) : (
            <div className="dash-top-drinks-list">
              {topDrinksRanking.map((item, idx) => (
                <div key={item.name + idx} className="dash-top-drink-row">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={`dash-top-rank-badge dash-top-rank-${idx === 0 ? '1' : (idx === 1 ? '2' : (idx === 2 ? '3' : 'other'))}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{item.category}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.qty} sold</div>
                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>{money(item.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- DETAILED INVOICES LIST FOR SELECTED DATE (New Feature) --- */}
      <div className="dash-card-box" style={{ marginBottom: 16 }}>
        <div className="dash-card-box-header">
          <div>
            <div className="dash-card-box-title">
              <i className="fas fa-receipt" style={{ color: 'var(--navy-accent)' }}></i>
              Bills &amp; Invoices for {periodLabel}
            </div>
            <div className="dash-card-box-sub">Click any order to view details or print thermal receipt</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
            {filteredSales.length} invoice{filteredSales.length === 1 ? '' : 's'}
          </span>
        </div>

        {filteredSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
            <i className="fas fa-receipt" style={{ fontSize: 32, color: '#cbd5e1', marginBottom: 8, display: 'block' }}></i>
            No orders found for {periodLabel}. Use the date picker above to browse another day!
          </div>
        ) : (
          <div className="dash-orders-table-wrap">
            <table className="dash-attention-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Items Summary</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(sale => {
                  const inv = sale.invoiceNo || (sale.id ? sale.id.slice(-6).toUpperCase() : '001');
                  const amt = getSaleAmount(sale);
                  const itemsCount = (sale.items || []).reduce((n, it) => n + (Number(it.qty) || 1), 0);
                  const itemsSummary = (sale.items || []).map(it => `${it.qty || 1}x ${it.name}`).join(', ');

                  let timeStr = '—';
                  const dt = getSaleDateTime(sale);
                  if (dt) timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={sale.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                          #{inv}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: 12 }}>
                        {timeStr}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{sale.customerName || 'Walk-in Customer'}</div>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>Cashier: {sale.cashier || 'Admin'}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, color: '#334155', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={itemsSummary}>
                          {itemsSummary || `${itemsCount} drinks`}
                        </div>
                      </td>
                      <td>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: 4, fontSize: 11.5, fontWeight: 600 }}>
                          {sale.paymentMethod || 'Cash'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: 13.5, color: '#0f172a' }}>{money(amt)}</strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => setSelectedOrderModal(sale)}
                            style={{ padding: '4px 10px', fontSize: 11.5, fontWeight: 600 }}
                            title="View Full Order Details"
                          >
                            <i className="fas fa-eye"></i> Details
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => setThermalSlipSale(sale)}
                            style={{ padding: '4px 10px', fontSize: 11.5, fontWeight: 600 }}
                            title="Print Thermal Receipt"
                          >
                            <i className="fas fa-print"></i> Slip
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
              <div className="dash-card-box-sub">Pending verification &amp; late kitchen orders</div>
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
                    const amt = getSaleAmount(sale);

                    return (
                      <tr key={sale.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{sale.customerName || 'Customer'}</div>
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
                            {sale.paymentMethod || 'UPI / QR'}
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

        {/* Recent Activity Feed */}
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

      {/* Order Details Modal if opened from table */}
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

      {/* Thermal Slip Receipt Overlay */}
      {thermalSlipSale && (
        <ThermalReceiptOverlay
          sale={thermalSlipSale}
          onClose={() => setThermalSlipSale(null)}
        />
      )}
    </div>
  );
}
