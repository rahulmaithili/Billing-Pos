function PaymentMethodsView({ user, role }) {
      const [methods, setMethods] = useState([]);
      const [loading, setLoading] = useState(false);
      const [editingMethod, setEditingMethod] = useState(null);
      const [showModal, setShowModal] = useState(false);

      const loadMethods = useCallback(async () => {
        setLoading(true);
        const res = await fbGetPaymentMethods();
        if (res.success) {
          setMethods(res.data);
        }
        setLoading(false);
      }, []);

      useEffect(() => { loadMethods(); }, [loadMethods]);

      const handleSave = async (data) => {
        const res = await fbSavePaymentMethod(data, user);
        if (res.success) {
          setShowModal(false);
          setEditingMethod(null);
          loadMethods();
          Swal.fire({ icon: 'success', title: 'Payment Method Saved', timer: 1400, showConfirmButton: false });
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: res.message });
        }
      };

      const handleDelete = async (pm) => {
        const confirm = await Swal.fire({
          icon: 'warning',
          title: 'Delete ' + pm.name + '?',
          showCancelButton: true,
          confirmButtonColor: '#ea4335',
          confirmButtonText: 'Delete'
        });
        if (!confirm.isConfirmed) return;
        const res = await fbDeletePaymentMethod(pm.id, pm.name, user);
        if (res.success) {
          loadMethods();
          Swal.fire({ icon: 'success', title: 'Deleted', timer: 1400, showConfirmButton: false });
        }
      };

      const handleToggle = async (pm) => {
        const updated = Object.assign({}, pm, { active: pm.active === false });
        await fbSavePaymentMethod(updated, user);
        loadMethods();
      };

      const handleMove = async (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= methods.length) return;
        const list = [...methods];
        const temp = list[index];
        list[index] = list[targetIndex];
        list[targetIndex] = temp;
        for (let i = 0; i < list.length; i++) {
          list[i].displayOrder = i + 1;
          await fbSavePaymentMethod(list[i], user);
        }
        loadMethods();
      };

      return (
        <div className="data-section">
          {loading && <TopLoadingBar />}
          <div className="section-header" style={{ marginBottom: 12 }}>
            <div>
              <h2><i className="fas fa-building-columns"></i> Payment Methods</h2>
              <div style={{ color: '#64748b', fontSize: '13px', marginTop: 4 }}>
                <i className="fas fa-circle-info"></i> Customers pay to these accounts at checkout in this order. Add a QR image, or all three bank fields.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-primary" onClick={() => { setEditingMethod(null); setShowModal(true); }}>
                <i className="fas fa-plus"></i> Add Method
              </button>
            </div>
          </div>

          <div className="pm-cards-grid">
            {methods.map((pm, idx) => {
              const isQr = pm.type === 'qr' || (pm.code && pm.code.toLowerCase().includes('qr')) || pm.name.toLowerCase().includes('qr') || pm.name.toLowerCase().includes('upi');
              const isBank = pm.type === 'bank' || pm.code === 'BANK' || pm.name.toLowerCase().includes('bank');
              const last4 = pm.accountNumber ? pm.accountNumber.slice(-4) : (pm.code === 'BANK' ? '8901' : '5544');
              const bankTitle = pm.bankName || (idx === 1 ? 'Demo Bank' : 'Demo Bank 2');

              return (
                <div key={pm.id} className={`pm-card-box ${pm.active === false ? "inactive" : ""}`}>
                  {/* Status Indicator Bar */}
                  <div className="pm-box-status-row">
                    <span className={`status-pill ${pm.active !== false ? "status-pill-active" : "status-pill-inactive"}`}>
                      <i className={`fas ${pm.active !== false ? "fa-circle-check" : "fa-circle-xmark"}`}></i> {pm.active !== false ? "ACTIVE" : "DISABLED"}
                    </span>
                    <button
                      type="button"
                      className={`btn-toggle-enable ${pm.active !== false ? "btn-enabled" : "btn-disabled-state"}`}
                      title={pm.active !== false ? "Click to Disable Method" : "Click to Enable Method"}
                      onClick={() => handleToggle(pm)}
                    >
                      <span className="toggle-switch-track">
                        <span className="toggle-switch-thumb"></span>
                      </span>
                      <span className="toggle-label">{pm.active !== false ? "Enabled" : "Disabled"}</span>
                    </button>
                  </div>
                  <div className="pm-box-header">
                    <div className="pm-box-icon">
                      <i className={'fas ' + (pm.icon || (isQr ? 'fa-qrcode' : isBank ? 'fa-building-columns' : 'fa-money-bill-wave'))}></i>
                    </div>
                    <div>
                      <div className="pm-box-name">{pm.name}</div>
                      <span className="pm-box-code">{pm.code || ('PM-0' + (idx + 1))} · {isQr ? 'QR code' : isBank ? 'Bank details' : 'Cash'}</span>
                    </div>
                  </div>

                  <div className="pm-box-body">
                    {isQr ? (
                      <div className="pm-qr-thumb">
                        <img
                          src={pm.qrData && (pm.qrData.startsWith('data:') || pm.qrData.startsWith('http'))
                            ? pm.qrData
                            : ('https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=' + encodeURIComponent(pm.qrData || 'upi://pay?pa=shop@upi&pn=DemoDrinks'))}
                          alt="QR"
                          style={{ width: '82px', height: '82px', objectFit: 'contain' }}
                        />
                      </div>
                    ) : isBank ? (
                      <div className="pm-bank-info">
                        <div className="pm-bank-acc">•••• {last4}</div>
                        <div className="pm-bank-name">{bankTitle}</div>
                      </div>
                    ) : (
                      <div className="pm-bank-info">
                        <div className="pm-bank-acc" style={{ fontSize: 16 }}>Cash Payment</div>
                        <div className="pm-bank-name">Direct Counter POS</div>
                      </div>
                    )}
                  </div>

                  <div className="pm-box-stats">
                    <i className="fas fa-receipt"></i>
                    <span>{idx === 0 ? '48' : idx === 1 ? '67' : '0'} orders · {idx === 0 ? '₹7,739.00' : idx === 1 ? '₹7,607.00' : '₹0.00'} approved (30 days)</span>
                  </div>

                  <div className="pm-box-footer">
                    <button type="button" className="pm-action-btn" title={pm.active !== false ? 'Disable Method' : 'Enable Method'} onClick={() => handleToggle(pm)}>
                      <i className={'fas ' + (pm.active !== false ? 'fa-toggle-on' : 'fa-toggle-off')} style={{ color: pm.active !== false ? '#10b981' : '#ef4444' }}></i>
                    </button>
                    <button type="button" className="pm-action-btn" title="Move Up" disabled={idx === 0} onClick={() => handleMove(idx, -1)}>
                      <i className="fas fa-arrow-up"></i>
                    </button>
                    <button type="button" className="pm-action-btn" title="Move Down" disabled={idx === methods.length - 1} onClick={() => handleMove(idx, 1)}>
                      <i className="fas fa-arrow-down"></i>
                    </button>
                    <button type="button" className="pm-action-btn" title="Edit" onClick={() => { setEditingMethod(pm); setShowModal(true); }}>
                      <i className="fas fa-pen-to-square"></i>
                    </button>
                    <button type="button" className="pm-action-btn" title="Delete" onClick={() => handleDelete(pm)}>
                      <i className="fas fa-trash" style={{ color: '#ea4335' }}></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {showModal && (
            <PaymentMethodModal
              method={editingMethod}
              onClose={() => { setShowModal(false); setEditingMethod(null); }}
              onSave={handleSave}
            />
          )}
        </div>
      );
    }

    // --- Settings (Admin) - Exact 2-Column Layout matching Screenshot 1 ---
