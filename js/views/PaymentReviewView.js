function PaymentReviewView({ user, role }) {
      const [sales, setSales] = useState([]);
      const [loading, setLoading] = useState(false);
      const [viewReceipt, setViewReceipt] = useState(null);

      const loadSales = useCallback(async () => {
        setLoading(true);
        const res = await fbGetSales();
        if (res.success) setSales(res.data.filter(s => s.paymentMethod === 'Online' || s.paymentMethod === 'Bank Transfer' || s.paymentMethod === 'UPI / QR' || s.receiptImage));
        setLoading(false);
      }, []);

      useEffect(() => { loadSales(); }, [loadSales]);

      const handleApprove = async (sale) => {
        await fbApprovePayment(sale.id, true, user);
        loadSales();
        Swal.fire({ icon: 'success', title: 'Payment Approved!', text: 'Order marked verified and routed to Kitchen queue.', timer: 1400, showConfirmButton: false });
      };

      const handleReject = async (sale) => {
        const confirm = await Swal.fire({
          icon: 'warning',
          title: 'Reject Payment?',
          input: 'text',
          inputPlaceholder: 'Reason for rejection (e.g. invalid transaction ID)',
          showCancelButton: true,
          confirmButtonColor: '#ea4335',
          confirmButtonText: 'Reject'
        });
        if (!confirm.isConfirmed) return;
        await fbApprovePayment(sale.id, false, user);
        loadSales();
        Swal.fire({ icon: 'info', title: 'Payment Rejected', timer: 1400, showConfirmButton: false });
      };

      return (
        <div className="data-section">
          {loading && <TopLoadingBar />}
          <div className="section-header">
            <div>
              <h2><i className="fas fa-magnifying-glass-dollar"></i> Payment Review (Online Slips)</h2>
              <div style={{ color: '#64748b', fontSize: '13px', marginTop: 4 }}>
                Verify incoming customer digital payments, bank slips and QR receipts.
              </div>
            </div>
            <button className="btn btn-secondary" onClick={loadSales}><i className="fas fa-rotate"></i> Refresh</button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date &amp; Time</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Receipt Slip</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>No payments pending review.</td></tr>
                ) : (
                  sales.map(s => (
                    <tr key={s.id}>
                      <td><strong>#{s.invoiceNo}</strong></td>
                      <td>{s.customerName || 'Customer'}</td>
                      <td>{new Date(s.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td><span className="tb-pill role">{s.paymentMethod}</span></td>
                      <td><strong>${Number(s.grandTotal || 0).toFixed(2)}</strong></td>
                      <td>
                        {s.receiptImage ? (
                          <button type="button" className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => setViewReceipt(s.receiptImage)}>
                            <i className="fas fa-image"></i> View Slip
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>No file attached</span>
                        )}
                      </td>
                      <td>
                        <span className={'tb-pill ' + (s.paymentApproved === true ? 'ok' : s.paymentApproved === false ? 'off' : 'warn')}>
                          {s.paymentApproved === true ? 'Approved' : s.paymentApproved === false ? 'Rejected' : 'Pending Review'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-success" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleApprove(s)} title="Approve">
                            <i className="fas fa-check"></i>
                          </button>
                          <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleReject(s)} title="Reject">
                            <i className="fas fa-xmark"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {viewReceipt && (
            <div className="modal-overlay" onClick={() => setViewReceipt(null)}>
              <div className="modal" style={{ maxWidth: '480px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3><i className="fas fa-receipt"></i> Payment Slip Preview</h3>
                  <button className="close-btn" onClick={() => setViewReceipt(null)}><i className="fas fa-times"></i></button>
                </div>
                <div className="modal-body" style={{ padding: 16 }}>
                  <img src={viewReceipt} alt="Slip" style={{ maxWidth: '100%', maxHeight: '450px', borderRadius: 8 }} />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // --- Drink Add-ons View ---
