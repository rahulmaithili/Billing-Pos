// --- Split-Screen Payment Review Terminal (Screenshot 1 Match) ---
function PaymentReviewView({ user, role, setActiveMenu }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [currentFilter, setCurrentFilter] = useState('pending'); // 'pending' | 'all' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmArrivalChecked, setConfirmArrivalChecked] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDetail, setRejectDetail] = useState('');
  const [viewImageModal, setViewImageModal] = useState(null);

  const loadSales = useCallback(async () => {
    setLoading(true);
    const res = await fbGetSales();
    if (res.success) {
      const list = (res.data || []).filter(s =>
        s.paymentMethod === 'Online' ||
        s.paymentMethod === 'Bank Transfer' ||
        s.paymentMethod === 'UPI / QR' ||
        s.paymentMethod === 'Split' ||
        (Number(s.paidOnline) || 0) > 0 ||
        s.receiptImage
      );
      setSales(list);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadSales(); }, [loadSales]);

  // Filter groups
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

  // Initial selection
  useEffect(() => {
    if (window.selectedReviewSaleId) {
      const target = sales.find(s => s.id === window.selectedReviewSaleId);
      if (target) {
        setSelectedSaleId(target.id);
        window.selectedReviewSaleId = null;
        return;
      }
    }
    if (!selectedSaleId && filteredSales.length > 0) {
      setSelectedSaleId(filteredSales[0].id);
    } else if (selectedSaleId && !filteredSales.find(s => s.id === selectedSaleId) && filteredSales.length > 0) {
      setSelectedSaleId(filteredSales[0].id);
    }
  }, [sales, filteredSales, selectedSaleId]);

  // Reset confirmation state when changing selected sale
  useEffect(() => {
    setConfirmArrivalChecked(false);
    setRejectReason('');
    setRejectDetail('');
  }, [selectedSaleId]);

  const selectedSale = useMemo(() => {
    return sales.find(s => s.id === selectedSaleId) || filteredSales[0] || null;
  }, [sales, selectedSaleId, filteredSales]);

  const handleApprove = async (sale) => {
    if (!sale) return;
    const res = await fbApprovePayment(sale.id, true, user);
    if (res.success) {
      setConfirmArrivalChecked(false);
      await loadSales();
      Swal.fire({
        icon: 'success',
        title: 'Payment Approved!',
        text: `Order #${sale.invoiceNo || sale.id.slice(-6).toUpperCase()} marked verified and paid.`,
        timer: 1400,
        showConfirmButton: false
      });
    } else {
      Swal.fire({ icon: 'error', title: 'Action Failed', text: res.message || 'Could not approve payment.' });
    }
  };

  const handleReject = async (sale) => {
    if (!sale) return;
    if (!rejectReason && !rejectDetail) {
      Swal.fire({ icon: 'warning', title: 'Pick a Reason', text: 'Please select a rejection reason before rejecting.', timer: 1800, showConfirmButton: false });
      return;
    }
    const fullReason = [rejectReason, rejectDetail].filter(Boolean).join(' - ');
    const res = await fbApprovePayment(sale.id, false, user, fullReason);
    if (res.success) {
      setRejectReason('');
      setRejectDetail('');
      await loadSales();
      Swal.fire({ icon: 'info', title: 'Payment Rejected', text: `Order marked rejected: ${fullReason}`, timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire({ icon: 'error', title: 'Action Failed', text: res.message || 'Could not reject payment.' });
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '') || e.target.isContentEditable) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const curIdx = filteredSales.findIndex(s => s.id === selectedSaleId);
        if (curIdx < filteredSales.length - 1) {
          setSelectedSaleId(filteredSales[curIdx + 1].id);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const curIdx = filteredSales.findIndex(s => s.id === selectedSaleId);
        if (curIdx > 0) {
          setSelectedSaleId(filteredSales[curIdx - 1].id);
        }
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (!confirmArrivalChecked) {
          setConfirmArrivalChecked(true);
        } else if (selectedSale) {
          handleApprove(selectedSale);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        const rejSelect = document.getElementById('pr-reject-select');
        if (rejSelect) rejSelect.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredSales, selectedSaleId, confirmArrivalChecked, selectedSale]);

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Recent';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `about ${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const selAmt = selectedSale ? (Number(selectedSale.paidOnline) || Number(selectedSale.total) || Number(selectedSale.grandTotal) || 0) : 0;
  const selInv = selectedSale ? (selectedSale.invoiceNo || (selectedSale.id ? selectedSale.id.slice(-6).toUpperCase() : 'ORD')) : '000';
  const selCust = selectedSale ? (selectedSale.customerName || 'Walk-in Customer') : '-';
  const selPhone = selectedSale ? (selectedSale.customerPhone || selectedSale.phone || '+91 98765 43210') : '-';
  const selMethod = selectedSale ? (selectedSale.paymentMethod || 'Bank transfer') : '-';
  const selTxn = selectedSale ? (selectedSale.transactionId || selectedSale.utr || selectedSale.ref || ('TXN-' + (selectedSale.id || '').slice(-8).toUpperCase())) : '-';
  const selItems = selectedSale ? (selectedSale.items || []) : [];
  const selItemsSummary = `${selItems.length} item${selItems.length === 1 ? '' : 's'} · ` + selItems.map(i => `${i.name} x ${i.qty}`).join(', ');

  return (
    <div className="data-section" style={{ padding: 0, background: 'transparent' }}>
      {loading && <TopLoadingBar />}

      <div className="pr-terminal-wrap">
        {/* Header Bar */}
        <div className="pr-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {setActiveMenu && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveMenu('sales-history')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 12px' }}
              >
                <i className="fas fa-arrow-left"></i> All Orders
              </button>
            )}
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-magnifying-glass-dollar" style={{ color: 'var(--navy-accent)' }}></i>
              Payment Review
              <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde047', fontSize: 12, padding: '2px 8px' }}>
                WAITING {pendingList.length}
              </span>
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 8 }}>
              <button
                type="button"
                className={`btn btn-sm ${currentFilter === 'pending' ? 'btn-primary' : ''}`}
                onClick={() => setCurrentFilter('pending')}
                style={{ fontSize: 12, padding: '4px 10px', background: currentFilter === 'pending' ? 'var(--navy-primary)' : 'transparent', color: currentFilter === 'pending' ? '#fff' : '#475569', border: 'none' }}
              >
                Waiting ({pendingList.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${currentFilter === 'all' ? 'btn-primary' : ''}`}
                onClick={() => setCurrentFilter('all')}
                style={{ fontSize: 12, padding: '4px 10px', background: currentFilter === 'all' ? 'var(--navy-primary)' : 'transparent', color: currentFilter === 'all' ? '#fff' : '#475569', border: 'none' }}
              >
                All ({sales.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${currentFilter === 'approved' ? 'btn-primary' : ''}`}
                onClick={() => setCurrentFilter('approved')}
                style={{ fontSize: 12, padding: '4px 10px', background: currentFilter === 'approved' ? 'var(--navy-primary)' : 'transparent', color: currentFilter === 'approved' ? '#fff' : '#475569', border: 'none' }}
              >
                Approved ({approvedList.length})
              </button>
            </div>

            <button type="button" className="btn btn-secondary btn-sm" onClick={loadSales} title="Refresh Transactions">
              <i className="fas fa-rotate"></i>
            </button>
          </div>
        </div>

        {/* 3-Column Grid */}
        <div className="pr-grid">
          {/* Column 1: Order Queue List */}
          <div className="pr-queue-col">
            <div className="pr-queue-header">
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                WAITING {filteredSales.length}
              </span>
              <div style={{ position: 'relative', width: 140 }}>
                <i className="fas fa-search" style={{ position: 'absolute', left: 8, top: 8, color: '#94a3b8', fontSize: 11 }}></i>
                <input
                  type="text"
                  placeholder="Filter..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', paddingLeft: 24, paddingRight: 8, height: 26, fontSize: 11.5, borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div className="pr-queue-list">
              {filteredSales.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  <i className="fas fa-clipboard-check" style={{ fontSize: 28, color: '#cbd5e1', marginBottom: 10, display: 'block' }}></i>
                  No orders in this queue
                </div>
              ) : (
                filteredSales.map(sale => {
                  const amt = Number(sale.paidOnline) || Number(sale.total) || Number(sale.grandTotal) || 0;
                  const inv = sale.invoiceNo || (sale.id ? sale.id.slice(-6).toUpperCase() : 'ORD');
                  const fullId = sale.id ? (sale.id.startsWith('ORD-') ? sale.id : `ORD-${sale.id.slice(-8).toUpperCase()}`) : `#${inv}`;
                  const isAct = sale.id === selectedSale?.id;
                  const isApp = sale.paymentApproved === true;
                  const isRej = sale.paymentApproved === false;

                  return (
                    <div
                      key={sale.id}
                      className={`pr-order-card ${isAct ? 'is-active' : ''}`}
                      onClick={() => setSelectedSaleId(sale.id)}
                    >
                      <div className="pr-order-card-top">
                        <span className="pr-order-card-inv">#{inv} - {fullId}</span>
                        <span className="pr-order-card-amt">{money(amt)}</span>
                      </div>
                      <div className="pr-order-card-cust">
                        {sale.customerName || 'Walk-in Customer'}
                      </div>
                      <div className="pr-order-card-footer">
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                          {sale.paymentMethod || 'Online'}
                        </span>
                        <span>{timeAgo(sale.createdAt || sale.date)}</span>
                        {isApp && <span style={{ color: '#16a34a', fontWeight: 700 }}><i className="fas fa-check"></i></span>}
                        {isRej && <span style={{ color: '#ef4444', fontWeight: 700 }}><i className="fas fa-xmark"></i></span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Receipt Viewer Canvas */}
          <div className="pr-middle-col">
            <div className="pr-middle-header">
              <span>Receipt #1 {selectedSale ? `(#${selInv})` : ''}</span>
              {selectedSale?.receiptImage && (
                <button
                  type="button"
                  onClick={() => setViewImageModal(selectedSale.receiptImage)}
                  style={{ background: 'none', border: 'none', color: 'var(--navy-accent)', cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <i className="fas fa-arrow-up-right-from-square"></i> Open full
                </button>
              )}
            </div>

            <div className="pr-middle-canvas">
              {selectedSale ? (
                selectedSale.receiptImage ? (
                  <img
                    src={selectedSale.receiptImage}
                    alt="Customer Payment Receipt"
                    className="pr-receipt-image"
                  />
                ) : (
                  <div style={{ background: '#ffffff', borderRadius: 12, padding: 28, maxWidth: 360, width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>
                      <i className="fas fa-qrcode"></i>
                    </div>
                    <h4 style={{ margin: '0 0 6px', fontSize: 16, color: '#0f172a', fontWeight: 700 }}>Digital QR Transaction</h4>
                    <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#64748b' }}>
                      Customer paid via UPI Dynamic QR Code directly at checkout.
                    </p>
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 12, color: '#334155', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Reference:</span>
                        <strong>{selTxn}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Amount:</span>
                        <strong style={{ color: '#047857', fontSize: 13 }}>{money(selAmt)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Order #:</span>
                        <strong>#{selInv}</strong>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div style={{ color: '#94a3b8', fontSize: 14 }}>Select an order from the list to preview receipt</div>
              )}
            </div>
          </div>

          {/* Column 3: Verification & Action Panel */}
          <div className="pr-action-col">
            {selectedSale ? (
              <>
                {/* AMOUNT TO FIND */}
                <div className="pr-amount-box">
                  <div className="pr-amount-tag">AMOUNT TO FIND</div>
                  <div className="pr-amount-val">{money(selAmt)}</div>
                </div>

                {/* Key-Value Metadata */}
                <div className="pr-meta-list">
                  <div className="pr-meta-row">
                    <span>Method</span>
                    <strong>{selMethod}</strong>
                  </div>
                  <div className="pr-meta-row">
                    <span>Should reach</span>
                    <strong>store@upi / Bank A/C</strong>
                  </div>
                  <div className="pr-meta-row">
                    <span>Transaction ID</span>
                    <strong>{selTxn}</strong>
                  </div>
                  <div className="pr-meta-row">
                    <span>Customer</span>
                    <strong>{selCust} · {selPhone}</strong>
                  </div>
                  <div className="pr-meta-row">
                    <span>Placed</span>
                    <strong>{selectedSale.createdAt || selectedSale.date ? new Date(selectedSale.createdAt || selectedSale.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}</strong>
                  </div>
                  <div className="pr-meta-row">
                    <span>Attempt</span>
                    <strong>1 of 3</strong>
                  </div>
                  <div className="pr-meta-row" style={{ alignItems: 'flex-start' }}>
                    <span>Items summary</span>
                    <strong style={{ fontSize: 11.5, lineHeight: 1.3 }}>{selItemsSummary}</strong>
                  </div>
                </div>

                {/* Verification Checkbox */}
                <label className="pr-confirm-checkbox">
                  <input
                    type="checkbox"
                    checked={confirmArrivalChecked}
                    onChange={e => setConfirmArrivalChecked(e.target.checked)}
                  />
                  <span>I have checked my bank / wallet app and <strong>{money(selAmt)}</strong> has arrived</span>
                </label>

                {/* Approve Button */}
                <button
                  type="button"
                  className="pr-approve-btn"
                  disabled={!confirmArrivalChecked}
                  onClick={() => handleApprove(selectedSale)}
                >
                  <i className="fas fa-check"></i> Approve [A]
                </button>

                {/* Reject Section */}
                <div className="pr-reject-box">
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#9f1239', margin: 0 }}>
                    Reject because
                  </label>
                  <select
                    id="pr-reject-select"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #fecdd3', fontSize: 12.5, padding: '0 8px', background: '#fff' }}
                  >
                    <option value="">Pick a reason</option>
                    <option value="Payment not received in bank/wallet">Payment not received in bank/wallet</option>
                    <option value="Wrong / partial amount sent">Wrong / partial amount sent</option>
                    <option value="Fake or duplicate screenshot / UTR">Fake or duplicate screenshot / UTR</option>
                    <option value="Transaction ID not found / mismatched">Transaction ID not found / mismatched</option>
                    <option value="Customer cancelled payment">Customer cancelled payment</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Extra detail (optional)"
                    value={rejectDetail}
                    onChange={e => setRejectDetail(e.target.value)}
                    style={{ width: '100%', height: 32, borderRadius: 6, border: '1px solid #fecdd3', fontSize: 12, padding: '0 8px' }}
                  />

                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => handleReject(selectedSale)}
                    disabled={!rejectReason && !rejectDetail}
                    style={{ background: '#e11d48', color: '#fff', border: 'none', padding: '8px', fontWeight: 700, fontSize: 12.5, borderRadius: 6, cursor: (!rejectReason && !rejectDetail) ? 'not-allowed' : 'pointer', opacity: (!rejectReason && !rejectDetail) ? 0.6 : 1 }}
                  >
                    <i className="fas fa-xmark"></i> Reject [R]
                  </button>
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div className="pr-shortcuts-footer">
                  [↑][↓] move &nbsp;·&nbsp; [A] approve &nbsp;·&nbsp; [R] reject
                </div>
              </>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                No order selected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Image Zoom Modal */}
      {viewImageModal && (
        <div className="modal-backdrop" onClick={() => setViewImageModal(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-image" style={{ marginRight: 8, color: 'var(--navy-accent)' }}></i> Receipt Slip Zoom</h3>
              <button type="button" className="modal-close-btn" onClick={() => setViewImageModal(null)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body" style={{ padding: 16, textAlign: 'center' }}>
              <img src={viewImageModal} alt="Zoomed Receipt" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 8 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
