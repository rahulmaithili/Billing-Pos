// --- Rich Order Details Modal (Screenshot 2 Match) ---
function OrderDetailsModal({ order, onClose, onReviewPayment, onPrint, onCancelOrder, user, onOrderUpdated }) {
  if (!order) return null;

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'items' | 'payment' | 'timeline'
  const [adminNote, setAdminNote] = useState(order.adminNote || '');
  const [savingNote, setSavingNote] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(order);

  // Sync if prop changes
  useEffect(() => {
    setCurrentOrder(order);
    setAdminNote(order.adminNote || '');
  }, [order]);

  const invoiceNo = currentOrder.invoiceNo || (currentOrder.id ? currentOrder.id.slice(-6).toUpperCase() : 'ORD');
  const fullOrderId = currentOrder.id ? (currentOrder.id.startsWith('ORD-') ? currentOrder.id : `ORD-${currentOrder.id.slice(-8).toUpperCase()}`) : `#${invoiceNo}`;
  const customerName = currentOrder.customerName || 'Walk-in Customer';
  const customerPhone = currentOrder.customerPhone || currentOrder.phone || '+91 98765 43210';
  const customerEmail = currentOrder.customerEmail || currentOrder.email || 'customer@example.com';
  const initial = (customerName.charAt(0) || 'C').toUpperCase();

  const isPaymentPending = currentOrder.paymentApproved !== true && currentOrder.paymentApproved !== false && (
    currentOrder.paymentMethod === 'Online' ||
    currentOrder.paymentMethod === 'Bank Transfer' ||
    currentOrder.paymentMethod === 'UPI / QR' ||
    (Number(currentOrder.paidOnline) || 0) > 0 ||
    currentOrder.receiptImage
  );

  const isApproved = currentOrder.paymentApproved === true;
  const isCancelled = currentOrder.orderStatus === 'cancelled';
  const currentStatus = currentOrder.orderStatus || (isCancelled ? 'cancelled' : isApproved ? 'ready' : isPaymentPending ? 'payment_review' : 'completed');

  // Format date
  const placedDateStr = currentOrder.createdAt || currentOrder.date;
  const formattedPlaced = placedDateStr ? new Date(placedDateStr).toLocaleString([], {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : 'Just now';

  // Items count & math
  const items = currentOrder.items || [];
  const itemCount = items.reduce((sum, it) => sum + (Number(it.qty) || 1), 0);
  const subtotal = Number(currentOrder.subtotal != null ? currentOrder.subtotal : (currentOrder.total || currentOrder.grandTotal || 0));
  const tax = Number(currentOrder.tax || currentOrder.taxAmount || 0);
  const discount = Number(currentOrder.discount || 0);
  const total = Number(currentOrder.grandTotal || currentOrder.total || 0);

  // Pipeline stages
  const stages = [
    { key: 'placed', label: 'Placed', icon: 'fa-check' },
    { key: 'payment_verified', label: 'Payment verified', icon: 'fa-shield-halved' },
    { key: 'preparing', label: 'Being prepared', icon: 'fa-blender' },
    { key: 'ready', label: 'Ready', icon: 'fa-bell' },
    { key: 'completed', label: 'Completed', icon: 'fa-circle-check' }
  ];

  // Determine stage progress
  const getStageStatus = (stageKey) => {
    if (isCancelled) return 'cancelled';
    if (stageKey === 'placed') return 'done';
    if (stageKey === 'payment_verified') {
      if (isApproved || currentOrder.paymentMethod === 'Cash') return 'done';
      if (isPaymentPending) return 'pending';
      return 'done';
    }
    if (stageKey === 'preparing') {
      if (currentStatus === 'preparing') return 'active';
      if (currentStatus === 'ready' || currentStatus === 'completed') return 'done';
      return 'todo';
    }
    if (stageKey === 'ready') {
      if (currentStatus === 'ready') return 'active';
      if (currentStatus === 'completed') return 'done';
      return 'todo';
    }
    if (stageKey === 'completed') {
      if (currentStatus === 'completed') return 'done';
      return 'todo';
    }
    return 'todo';
  };

  const handleStageClick = async (stageKey) => {
    let nextStatus = 'pending';
    if (stageKey === 'placed') nextStatus = 'pending';
    else if (stageKey === 'payment_verified') {
      if (isPaymentPending && onReviewPayment) {
        onReviewPayment(currentOrder);
        return;
      }
      nextStatus = 'verified';
    } else if (stageKey === 'preparing') nextStatus = 'preparing';
    else if (stageKey === 'ready') nextStatus = 'ready';
    else if (stageKey === 'completed') nextStatus = 'completed';

    const res = await fbUpdateSaleStatus(currentOrder.id, nextStatus, user);
    if (res.success) {
      setCurrentOrder(prev => Object.assign({}, prev, { orderStatus: nextStatus }));
      if (onOrderUpdated) onOrderUpdated();
      Swal.fire({ icon: 'success', title: 'Order Stage Updated', text: `Status set to ${stageKey.replace('_', ' ').toUpperCase()}`, timer: 1200, showConfirmButton: false });
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    const res = await fbUpdateSaleNote(currentOrder.id, adminNote, user);
    setSavingNote(false);
    if (res.success) {
      setCurrentOrder(prev => Object.assign({}, prev, { adminNote }));
      if (onOrderUpdated) onOrderUpdated();
      Swal.fire({ icon: 'success', title: 'Note Saved', text: 'Internal admin note updated.', timer: 1200, showConfirmButton: false });
    } else {
      Swal.fire({ icon: 'error', title: 'Failed to Save', text: res.message || 'Error updating note.' });
    }
  };

  const handleCancelOrder = async () => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Cancel Order?',
      text: `Are you sure you want to cancel order #${invoiceNo}? This will mark it as cancelled.`,
      showCancelButton: true,
      confirmButtonColor: '#ea4335',
      confirmButtonText: 'Yes, Cancel Order'
    });
    if (!confirm.isConfirmed) return;

    const res = await fbUpdateSaleStatus(currentOrder.id, 'cancelled', user);
    if (res.success) {
      setCurrentOrder(prev => Object.assign({}, prev, { orderStatus: 'cancelled' }));
      if (onOrderUpdated) onOrderUpdated();
      Swal.fire({ icon: 'info', title: 'Order Cancelled', timer: 1400, showConfirmButton: false });
    }
  };

  const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${customerName}, regarding your Order #${invoiceNo}...`)}`;

  return (
    <div className="od-modal-backdrop" onClick={onClose}>
      <div className="od-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="od-modal-header">
          <div className="od-modal-title-wrap">
            <h3 className="od-modal-title">#{invoiceNo} - {fullOrderId}</h3>
            {isCancelled ? (
              <span className="od-status-pill danger"><i className="fas fa-circle-xmark"></i> Cancelled</span>
            ) : isPaymentPending ? (
              <span className="od-status-pill review"><i className="fas fa-clock"></i> Payment under review</span>
            ) : isApproved ? (
              <span className="od-status-pill success"><i className="fas fa-circle-check"></i> Payment Verified</span>
            ) : (
              <span className="od-status-pill info"><i className="fas fa-check"></i> Confirmed</span>
            )}
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} style={{ fontSize: 18, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 2-Column Body */}
        <div className="od-modal-body">
          {/* Left Sidebar */}
          <div className="od-sidebar">
            {/* Customer Details */}
            <div className="od-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div className="od-customer-avatar">{initial}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {customerName}
                  </div>
                  <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                    {currentOrder.customerType || 'Walk-in Customer'}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><i className="fas fa-phone" style={{ width: 16, color: '#94a3b8' }}></i> {customerPhone}</div>
                <div><i className="fas fa-envelope" style={{ width: 16, color: '#94a3b8' }}></i> {customerEmail}</div>
              </div>

              <div className="od-action-btn-row">
                <a href={waUrl} target="_blank" rel="noreferrer" className="od-btn-comm whatsapp">
                  <i className="fab fa-whatsapp"></i> WhatsApp
                </a>
                <a href={`tel:${customerPhone}`} className="od-btn-comm">
                  <i className="fas fa-phone"></i> Call
                </a>
              </div>
            </div>

            {/* Order Metadata */}
            <div className="od-card">
              <div className="od-meta-line">
                <span>Order placed</span>
                <strong>{formattedPlaced}</strong>
              </div>
              <div className="od-meta-line">
                <span>Fulfillment</span>
                <strong>{currentOrder.orderType || currentOrder.fulfillment || 'Pickup - ASAP'}</strong>
              </div>
              <div className="od-meta-line">
                <span>Channel</span>
                <strong>{currentOrder.channel || 'In-Store POS / Web'}</strong>
              </div>
              <div className="od-meta-line">
                <span>Cashier / Staff</span>
                <strong>{currentOrder.cashier || currentOrder.cashierName || 'Staff'}</strong>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="od-card" style={{ background: '#f8fafc' }}>
              <div className="od-meta-line">
                <span>Items ({itemCount})</span>
                <span>{money(subtotal)}</span>
              </div>
              {tax > 0 && (
                <div className="od-meta-line">
                  <span>Tax</span>
                  <span>{money(tax)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="od-meta-line" style={{ color: '#16a34a' }}>
                  <span>Discount</span>
                  <span>-{money(discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy-primary, #001f3f)' }}>{money(total)}</span>
              </div>
            </div>
          </div>

          {/* Right Main Panel */}
          <div className="od-main">
            {/* Tabs Header */}
            <div className="od-tabs-bar">
              <button
                type="button"
                className={`od-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <i className="fas fa-table-cells-large"></i> Overview
              </button>
              <button
                type="button"
                className={`od-tab-btn ${activeTab === 'items' ? 'active' : ''}`}
                onClick={() => setActiveTab('items')}
              >
                <i className="fas fa-list-check"></i> Items ({itemCount})
              </button>
              <button
                type="button"
                className={`od-tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
                onClick={() => setActiveTab('payment')}
              >
                <i className="fas fa-credit-card"></i> Payment
              </button>
              <button
                type="button"
                className={`od-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('timeline')}
              >
                <i className="fas fa-timeline"></i> Timeline
              </button>
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div>
                {/* Status action banner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                  <div>
                    {isCancelled ? (
                      <span className="od-status-pill danger" style={{ fontSize: 13, padding: '4px 12px' }}>
                        ● Cancelled
                      </span>
                    ) : isPaymentPending ? (
                      <span className="od-status-pill review" style={{ fontSize: 13, padding: '4px 12px' }}>
                        ● Payment Review
                      </span>
                    ) : isApproved ? (
                      <span className="od-status-pill success" style={{ fontSize: 13, padding: '4px 12px' }}>
                        ● Verified &amp; Active
                      </span>
                    ) : (
                      <span className="od-status-pill info" style={{ fontSize: 13, padding: '4px 12px' }}>
                        ● {currentStatus.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Review payment action button */}
                    {isPaymentPending && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => onReviewPayment && onReviewPayment(currentOrder)}
                        style={{ padding: '7px 14px', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <i className="fas fa-magnifying-glass-dollar"></i> Review payment <i className="fas fa-arrow-right" style={{ fontSize: 11 }}></i>
                      </button>
                    )}

                    {!isCancelled && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCancelOrder}
                        style={{ padding: '7px 12px', fontSize: 13 }}
                      >
                        <i className="fas fa-ban"></i> Cancel
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onPrint && onPrint(currentOrder)}
                      style={{ padding: '7px 12px', fontSize: 13 }}
                    >
                      <i className="fas fa-print"></i> Print
                    </button>
                  </div>
                </div>

                {/* Pipeline Stepper */}
                <div className="od-stepper">
                  {stages.map(st => {
                    const stStatus = getStageStatus(st.key);
                    return (
                      <div
                        key={st.key}
                        className={`od-step ${stStatus === 'done' ? 'is-done' : stStatus === 'active' ? 'is-active' : stStatus === 'pending' ? 'is-pending' : ''}`}
                        onClick={() => handleStageClick(st.key)}
                        title={`Click to set stage to ${st.label}`}
                      >
                        <div className="od-step-circle">
                          {stStatus === 'done' ? (
                            <i className="fas fa-check"></i>
                          ) : stStatus === 'pending' ? (
                            <i className="fas fa-clock"></i>
                          ) : (
                            <i className={`fas ${st.icon}`}></i>
                          )}
                        </div>
                        <span className="od-step-label">{st.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Items list preview */}
                <div style={{ background: '#f8fafc', borderRadius: 'var(--r-sm, 10px)', border: '1px solid #e2e8f0', padding: 14, marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 10 }}>Order Summary</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <div>
                          <strong>{it.qty}x</strong> {it.name}
                          {it.size && <span style={{ color: '#0284c7', fontSize: 12 }}> ({it.size})</span>}
                          {it.customization && <div style={{ fontSize: 11, color: '#64748b', paddingLeft: 16 }}>{it.customization}</div>}
                        </div>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{money((Number(it.price) || 0) * (Number(it.qty) || 1))}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Note Section */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--r-sm, 10px)', padding: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                    <i className="fas fa-note-sticky" style={{ color: '#f59e0b', marginRight: 6 }}></i> Admin note
                  </label>
                  <textarea
                    rows="3"
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    placeholder="Add internal note for staff..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--r-sm, 8px)', border: '1px solid #cbd5e1', fontSize: 13, resize: 'vertical' }}
                  ></textarea>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleSaveNote}
                      disabled={savingNote}
                      style={{ padding: '6px 14px', fontSize: 12.5, fontWeight: 600 }}
                    >
                      {savingNote ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : 'Save note'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Items */}
            {activeTab === 'items' && (
              <div className="premium-table-wrap">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 16 }}>Item</th>
                      <th>Customization</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th style={{ textAlign: 'right', paddingRight: 16 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ paddingLeft: 16 }}>
                          <strong>{it.name}</strong>
                          {it.size && <span style={{ color: '#0284c7', fontSize: 12, marginLeft: 6 }}>({it.size})</span>}
                        </td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>
                          {it.customization || it.notes || '-'}
                        </td>
                        <td>{money(it.price || 0)}</td>
                        <td><strong>{it.qty}</strong></td>
                        <td style={{ textAlign: 'right', paddingRight: 16, fontWeight: 700 }}>
                          {money((Number(it.price) || 0) * (Number(it.qty) || 1))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab: Payment */}
            {activeTab === 'payment' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div className="od-card">
                    <span style={{ fontSize: 12, color: '#64748b' }}>Method</span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                      <i className="fas fa-qrcode" style={{ color: 'var(--navy-accent)', marginRight: 6 }}></i>
                      {currentOrder.paymentMethod || 'Online'}
                    </div>
                  </div>
                  <div className="od-card">
                    <span style={{ fontSize: 12, color: '#64748b' }}>Status</span>
                    <div style={{ marginTop: 4 }}>
                      {isApproved ? (
                        <span className="od-status-pill success">Verified &amp; Received</span>
                      ) : isPaymentPending ? (
                        <span className="od-status-pill review">Waiting Bank Review</span>
                      ) : (
                        <span className="od-status-pill info">Paid</span>
                      )}
                    </div>
                  </div>
                  <div className="od-card">
                    <span style={{ fontSize: 12, color: '#64748b' }}>Transaction ID / Ref</span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 4 }}>
                      <code>{currentOrder.transactionId || currentOrder.utr || currentOrder.ref || 'TXN-' + (currentOrder.id || '').slice(-6).toUpperCase()}</code>
                    </div>
                  </div>
                </div>

                {currentOrder.receiptImage && (
                  <div className="od-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10, textAlign: 'left' }}>
                      <i className="fas fa-file-invoice" style={{ marginRight: 6 }}></i> Customer Uploaded Slip Proof
                    </div>
                    <img
                      src={currentOrder.receiptImage}
                      alt="Payment Slip Proof"
                      style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 8, border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    />
                  </div>
                )}

                {isPaymentPending && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onReviewPayment && onReviewPayment(currentOrder)}
                    style={{ padding: '12px', fontWeight: 700, fontSize: 14 }}
                  >
                    <i className="fas fa-magnifying-glass-dollar" style={{ marginRight: 8 }}></i>
                    Open in Split-Screen Review Terminal
                  </button>
                )}
              </div>
            )}

            {/* Tab: Timeline */}
            {activeTab === 'timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 4px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                    <i className="fas fa-cart-shopping"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Order Placed</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{formattedPlaced} · Staff: {currentOrder.cashier || 'System'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                    <i className="fas fa-credit-card"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Payment Submitted via {currentOrder.paymentMethod || 'Online'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Amount: {money(total)}</div>
                  </div>
                </div>

                {isApproved && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                      <i className="fas fa-shield-check"></i>
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Payment Verified &amp; Approved</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Verified by staff member</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
