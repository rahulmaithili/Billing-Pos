    // --- Payment Review & Slip Verification View ---
    function PaymentReviewView({ user, role }) {
      const [sales, setSales] = useState([]);
      const [loading, setLoading] = useState(false);
      const [viewReceipt, setViewReceipt] = useState(null);
      const [currentFilter, setCurrentFilter] = useState('pending'); // 'pending' | 'all' | 'approved' | 'rejected'
      const [searchQuery, setSearchQuery] = useState('');

      const loadSales = useCallback(async () => {
        setLoading(true);
        const res = await fbGetSales();
        if (res.success) {
          const onlineSales = (res.data || []).filter(s =>
            s.paymentMethod === 'Online' ||
            s.paymentMethod === 'Bank Transfer' ||
            s.paymentMethod === 'UPI / QR' ||
            s.paymentMethod === 'Split' ||
            (Number(s.paidOnline) || 0) > 0 ||
            s.receiptImage
          );
          setSales(onlineSales);
        }
        setLoading(false);
      }, []);

      useEffect(() => { loadSales(); }, [loadSales]);

      const handleApprove = async (sale) => {
        const res = await fbApprovePayment(sale.id, true, user);
        if (res.success) {
          setViewReceipt(null);
          loadSales();
          Swal.fire({ icon: 'success', title: 'Payment Approved!', text: 'Order marked verified and authorized.', timer: 1400, showConfirmButton: false });
        } else {
          Swal.fire({ icon: 'error', title: 'Action Failed', text: res.message || 'Could not approve payment.' });
        }
      };

      const handleReject = async (sale) => {
        const confirm = await Swal.fire({
          icon: 'warning',
          title: 'Reject Payment?',
          input: 'text',
          inputPlaceholder: 'Reason for rejection (e.g. invalid UTR / txn not credited)',
          showCancelButton: true,
          confirmButtonColor: '#ea4335',
          confirmButtonText: 'Yes, Reject'
        });
        if (!confirm.isConfirmed) return;
        const res = await fbApprovePayment(sale.id, false, user);
        if (res.success) {
          setViewReceipt(null);
          loadSales();
          Swal.fire({ icon: 'info', title: 'Payment Rejected', timer: 1400, showConfirmButton: false });
        } else {
          Swal.fire({ icon: 'error', title: 'Action Failed', text: res.message || 'Could not reject payment.' });
        }
      };

      // Filter sales by status and search
      const pendingList = useMemo(() => sales.filter(s => s.paymentApproved !== true && s.paymentApproved !== false), [sales]);
      const approvedList = useMemo(() => sales.filter(s => s.paymentApproved === true), [sales]);
      const rejectedList = useMemo(() => sales.filter(s => s.paymentApproved === false), [sales]);

      const filteredSales = useMemo(() => {
        let base = sales;
        if (currentFilter === 'pending') base = pendingList;
        else if (currentFilter === 'approved') base = approvedList;
        else if (currentFilter === 'rejected') base = rejectedList;

        const q = searchQuery.trim().toLowerCase();
        if (!q) return base;
        return base.filter(s => {
          const inv = String(s.invoiceNo || s.id || '').toLowerCase();
          const cust = String(s.customerName || '').toLowerCase();
          const meth = String(s.paymentMethod || '').toLowerCase();
          const amt = String(s.total || s.grandTotal || '').toLowerCase();
          return inv.includes(q) || cust.includes(q) || meth.includes(q) || amt.includes(q);
        });
      }, [sales, currentFilter, pendingList, approvedList, rejectedList, searchQuery]);

      const totalPendingAmount = useMemo(() => {
        return pendingList.reduce((sum, s) => sum + (Number(s.paidOnline) || Number(s.total) || Number(s.grandTotal) || 0), 0);
      }, [pendingList]);

      return (
        <div className="data-section">
          {loading && <TopLoadingBar />}

          {/* Section Header */}
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2><i className="fas fa-magnifying-glass-dollar" style={{ color: 'var(--navy-accent)', marginRight: 10 }}></i> Payment Review &amp; Slip Verification</h2>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                Audit incoming customer digital payments, UPI QR transactions, and bank transfer receipts.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={loadSales} title="Refresh online transactions">
                <i className="fas fa-rotate"></i> Refresh
              </button>
            </div>
          </div>

          {/* KPI Stats Grid */}
          <div className="dash-stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}><i className="fas fa-hourglass-half"></i></div>
              <div className="stat-content">
                <div className="stat-value">{pendingList.length}</div>
                <div className="stat-label">Pending Verification</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><i className="fas fa-circle-check"></i></div>
              <div className="stat-content">
                <div className="stat-value">{approvedList.length}</div>
                <div className="stat-label">Verified &amp; Approved</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fee2e2', color: '#ea4335' }}><i className="fas fa-circle-xmark"></i></div>
              <div className="stat-content">
                <div className="stat-value">{rejectedList.length}</div>
                <div className="stat-label">Rejected Slips</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}><i className="fas fa-wallet"></i></div>
              <div className="stat-content">
                <div className="stat-value">{money(totalPendingAmount)}</div>
                <div className="stat-label">Pending Total Volume</div>
              </div>
            </div>
          </div>

          {/* Controls: Filter Tabs & Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              <button
                type="button"
                className={`pos-cat-pill ${currentFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setCurrentFilter('pending')}
                style={{ padding: '7px 14px' }}
              >
                <i className="fas fa-clock"></i>
                <span>Pending Review</span>
                <span className="cat-pill-count">{pendingList.length}</span>
              </button>

              <button
                type="button"
                className={`pos-cat-pill ${currentFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCurrentFilter('all')}
                style={{ padding: '7px 14px' }}
              >
                <i className="fas fa-list"></i>
                <span>All Online Orders</span>
                <span className="cat-pill-count">{sales.length}</span>
              </button>

              <button
                type="button"
                className={`pos-cat-pill ${currentFilter === 'approved' ? 'active' : ''}`}
                onClick={() => setCurrentFilter('approved')}
                style={{ padding: '7px 14px' }}
              >
                <i className="fas fa-check"></i>
                <span>Approved</span>
                <span className="cat-pill-count">{approvedList.length}</span>
              </button>

              <button
                type="button"
                className={`pos-cat-pill ${currentFilter === 'rejected' ? 'active' : ''}`}
                onClick={() => setCurrentFilter('rejected')}
                style={{ padding: '7px 14px' }}
              >
                <i className="fas fa-xmark"></i>
                <span>Rejected</span>
                <span className="cat-pill-count">{rejectedList.length}</span>
              </button>
            </div>

            <div style={{ position: 'relative', minWidth: 260 }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8', fontSize: 13 }}></i>
              <input
                type="text"
                placeholder="Search order #, customer, amount..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: 34, paddingRight: 12, height: 36, borderRadius: 'var(--r-sm, 8px)', border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>
          </div>

          {/* Premium Table or Empty State Card */}
          {filteredSales.length === 0 ? (
            <div style={{ background: '#ffffff', borderRadius: 'var(--r-md, 12px)', border: '1px solid #e2e8f0', padding: '48px 24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ width: 64, height: 64, borderRadius: 'var(--r-pill, 999px)', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>
                <i className="fas fa-clipboard-check"></i>
              </div>
              <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: 18, fontWeight: 700 }}>
                {currentFilter === 'pending' ? 'All Digital Payments Verified!' : 'No Transactions Found'}
              </h3>
              <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13.5, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
                {currentFilter === 'pending'
                  ? 'There are currently no customer online payments or bank slips waiting for review. New UPI transactions will appear here automatically.'
                  : `No orders match filter "${currentFilter}" and search query "${searchQuery}".`}
              </p>
              <button type="button" className="btn btn-secondary" onClick={loadSales}>
                <i className="fas fa-rotate"></i> Refresh Records
              </button>
            </div>
          ) : (
            <div className="premium-table-wrap">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 140, paddingLeft: 20 }}>Order #</th>
                    <th style={{ minWidth: 150 }}>Customer</th>
                    <th style={{ minWidth: 160 }}>Date &amp; Time</th>
                    <th style={{ minWidth: 130 }}>Method</th>
                    <th style={{ minWidth: 120 }}>Amount</th>
                    <th style={{ minWidth: 150 }}>Receipt Proof</th>
                    <th style={{ minWidth: 140 }}>Status</th>
                    <th style={{ minWidth: 140, textAlign: 'right', paddingRight: 20 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(s => {
                    const isApproved = s.paymentApproved === true;
                    const isRejected = s.paymentApproved === false;
                    const isPending = !isApproved && !isRejected;
                    const orderNum = s.invoiceNo ? `#${s.invoiceNo}` : (s.id ? `#${s.id.slice(-6).toUpperCase()}` : '#SALE');
                    const amt = Number(s.paidOnline) || Number(s.total) || Number(s.grandTotal) || 0;

                    return (
                      <tr key={s.id}>
                        <td style={{ paddingLeft: 20 }}>
                          <strong style={{ color: 'var(--navy-primary)', fontSize: 13.5 }}>{orderNum}</strong>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{s.customerName || 'Walk-in Customer'}</div>
                          {s.cashierName && <small style={{ color: '#94a3b8', fontSize: 11 }}>Cashier: {s.cashierName}</small>}
                        </td>
                        <td>
                          <div style={{ color: '#334155', fontSize: 12.5 }}>
                            {s.date ? new Date(s.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recent'}
                          </div>
                        </td>
                        <td>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: 11.5, padding: '3px 10px', borderRadius: 'var(--r-pill, 999px)' }}>
                            <i className="fas fa-qrcode" style={{ marginRight: 4 }}></i>
                            {s.paymentMethod || 'Online'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontSize: 14, color: '#0f172a' }}>{money(amt)}</strong>
                        </td>
                        <td>
                          {s.receiptImage ? (
                            <button
                              type="button"
                              className="table-btn-edit"
                              onClick={() => setViewReceipt(s)}
                              title="Click to view uploaded slip"
                            >
                              <i className="fas fa-image"></i> View Slip
                            </button>
                          ) : s.onlineVerified ? (
                            <span style={{ background: '#dcfce7', color: '#15803d', fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--r-pill, 999px)' }}>
                              <i className="fas fa-bolt"></i> Auto Verified
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: 12 }}>
                              <i className="fas fa-qrcode"></i> Digital QR
                            </span>
                          )}
                        </td>
                        <td>
                          {isApproved && (
                            <span className="table-toggle-btn is-active">
                              <i className="fas fa-circle-check"></i> Approved
                            </span>
                          )}
                          {isRejected && (
                            <span className="table-toggle-btn is-inactive">
                              <i className="fas fa-circle-xmark"></i> Rejected
                            </span>
                          )}
                          {isPending && (
                            <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde047', padding: '4px 10px', borderRadius: 'var(--r-pill, 999px)', fontSize: 11.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <i className="fas fa-clock"></i> Pending Review
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: 20 }}>
                          <div className="table-action-group" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              onClick={() => handleApprove(s)}
                              title="Approve & Authorize Payment"
                            >
                              <i className="fas fa-check"></i> Approve
                            </button>
                            <button
                              type="button"
                              className="table-btn-delete"
                              onClick={() => handleReject(s)}
                              title="Reject Payment"
                            >
                              <i className="fas fa-xmark"></i> Reject
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

          {/* Slip Preview Modal */}
          {viewReceipt && (
            <div className="modal-backdrop" onClick={() => setViewReceipt(null)}>
              <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3><i className="fas fa-receipt" style={{ marginRight: 8, color: 'var(--navy-accent)' }}></i> Customer Payment Slip Preview</h3>
                  <button type="button" className="modal-close-btn" onClick={() => setViewReceipt(null)}><i className="fas fa-times"></i></button>
                </div>
                <div className="modal-body" style={{ padding: 18, textAlign: 'center' }}>
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#334155', background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                    <span>Order: <strong>#{viewReceipt.invoiceNo || viewReceipt.id?.slice(-6).toUpperCase()}</strong></span>
                    <span>Amount: <strong>{money(viewReceipt.total || viewReceipt.grandTotal || 0)}</strong></span>
                  </div>
                  <img
                    src={viewReceipt.receiptImage}
                    alt="Payment Slip Proof"
                    style={{ maxWidth: '100%', maxHeight: 420, borderRadius: 8, border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #e2e8f0' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setViewReceipt(null)}>
                    Close
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="table-btn-delete" onClick={() => handleReject(viewReceipt)}>
                      <i className="fas fa-xmark"></i> Reject
                    </button>
                    <button type="button" className="btn btn-success" onClick={() => handleApprove(viewReceipt)} style={{ fontWeight: 700 }}>
                      <i className="fas fa-check"></i> Approve Payment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
