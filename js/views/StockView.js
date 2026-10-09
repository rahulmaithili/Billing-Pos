function StockView({ user, role }) {
      const [modalType, setModalType] = useState(null);
      const [showBulkIn, setShowBulkIn] = useState(false);
      const [showAdjust, setShowAdjust] = useState(false);
      const [reloadKey, setReloadKey] = useState(0);
      const [load, setLoad] = useState('');
      const tableInstanceRef = useRef(null);

      const { loading, data, err } = useFetch(() => Promise.all([fbGetStockMovements(), fbGetProducts()]), [reloadKey]);
      const movements = useMemo(() => (data && data[0] && data[0].success ? data[0].data : []), [data]);
      const products = useMemo(() => (data && data[1] && data[1].success ? data[1].data : []), [data]);
      const reload = () => setReloadKey(k => k + 1);

      const productMap = useMemo(() => products.reduce((m, p) => (m[p.id] = p, m), {}), [products]);
      const byId = useMemo(() => movements.reduce((m, mv) => (m[mv.id] = mv, m), {}), [movements]);
      // running per-product balance: cumulate oldest→newest, tag each row with the balance right after it
      const tableData = useMemo(() => {
        const sorted = [...movements].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const run = {};
        return sorted.map(m => {
          run[m.productId] = (run[m.productId] || 0) + (m.type === 'in' ? m.qty : -m.qty);
          return Object.assign({}, m, { productName: productMap[m.productId]?.name || 'Unknown Product', balance: run[m.productId] });
        });
      }, [movements, productMap]);

      useEffect(() => {
        if (err || (data && data[0] && !data[0].success)) Swal.fire({ icon: 'error', title: 'Error', text: (data && data[0] && data[0].message) || 'Failed to load stock movements' });
      }, [err, data]);

      useEffect(() => {
        if (loading) return;
        let table = tableInstanceRef.current;
        if (table) {
          table.clear().rows.add(tableData).draw(false);
        } else {
          table = $('#stockTable').DataTable({
            data: tableData,
            columnDefs: [{ targets: '_all', defaultContent: '' }], // tolerate rows missing newer fields - no "unknown parameter" warning
            columns: [
              { data: 'productName', title: 'Product', render: (d, t) => t === 'display' ? esc(d) : d },
              { data: 'type', title: 'Type', render: (d, t) => t === 'display' ? `<span class="status-badge ${d === 'in' ? 'status-active' : 'status-inactive'}">${d === 'in' ? 'IN' : 'OUT'}</span>` : d },
              { data: 'qty', title: 'Qty', render: (d, t) => t === 'display' ? Number(d).toLocaleString() : d },
              { data: 'unitCost', title: 'Unit Cost', defaultContent: '-', render: (d, t) => t === 'display' ? (d ? money(d) : '-') : (d || 0) },
              { data: 'reason', title: 'Reason', render: (d, t) => t === 'display' ? esc(d || '') : d },
              { data: 'reference', title: 'Reference', defaultContent: '-', render: (d, t) => t === 'display' ? esc(d || '-') : d },
              { data: 'balance', title: 'Balance', render: (d, t) => t === 'display' ? `<strong>${Number(d).toLocaleString()}</strong>` : d },
              { data: 'performedBy', title: 'Performed By', render: (d, t) => t === 'display' ? esc(d || '') : d },
              { data: 'createdAt', title: 'When', render: (d, t) => t === 'display' ? formatDateForDisplay(d) : d },
              { data: null, title: 'Actions', orderable: false, render: () => role === 'Admin' ? `<button class="action-icon delete-icon" data-action="delete"><i class="fas fa-trash"></i></button>` : '' }
            ],
            pageLength: 10,
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, 'All']],
            responsive: true,
            dom: 'Blfrtip',
            buttons: [
              { extend: 'csv', text: '<i class="fas fa-file-csv"></i> CSV', exportOptions: { columns: ':not(:last-child)' } },
              { extend: 'pdf', text: '<i class="fas fa-file-pdf"></i> PDF', exportOptions: { columns: ':not(:last-child)' } },
              { extend: 'print', text: '<i class="fas fa-print"></i> Print', exportOptions: { columns: ':not(:last-child)' } }
            ],
            order: [[8, 'desc']]
          });
          tableInstanceRef.current = table;
        }
        $('#stockTable').off('click', '.action-icon').on('click', '.action-icon', function () {
          const id = table.row($(this).parents('tr')).data().id;
          if ($(this).data('action') === 'delete') handleDelete(byId[id]);
        });
      }, [loading, tableData, role]);

      useEffect(() => () => {
        if (tableInstanceRef.current) { try { tableInstanceRef.current.destroy(); tableInstanceRef.current = null; } catch (e) { } }
      }, []);

      const handleSave = async (moveData, productName) => {
        const { updateCost, ...move } = moveData; // updateCost is a UI flag, not stored on the ledger row
        setLoad(move.type === 'in' ? 'Recording Stock In...' : 'Recording Stock Out...');
        const result = await fbAddStockMovement(move, productName, user);
        if (result.success && updateCost && move.unitCost) await fbUpdateProduct(move.productId, { cost: Number(move.unitCost) }, user);
        setLoad('');
        if (result.success) {
          setModalType(null); setShowAdjust(false);
          Swal.fire({ icon: 'success', title: 'Success!', text: result.message, timer: 2000, showConfirmButton: false });
          reload();
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: result.message });
        }
      };

      const handleDelete = (mv) => {
        const productName = productMap[mv.productId]?.name || mv.productId;
        Swal.fire({ icon: 'warning', title: 'Delete Stock Entry?', text: 'This retroactively changes historical Qty On Hand. This cannot be undone', showCancelButton: true, confirmButtonColor: '#ea4335', confirmButtonText: 'Delete' }).then(async (result) => {
          if (!result.isConfirmed) return;
          setLoad('Deleting stock entry...');
          const r = await fbDeleteStockMovement(mv.id, `${mv.qty} x ${productName}`, user);
          setLoad('');
          if (r.success) { Swal.fire({ icon: 'success', text: r.message, timer: 2000, showConfirmButton: false }); reload(); }
          else Swal.fire({ icon: 'error', title: 'Error', text: r.message });
        });
      };

      const handleBulkSave = async (lines) => {
        setLoad('Receiving stock...');
        const result = await fbBulkStockIn(lines, user);
        setLoad('');
        if (result.success) {
          setShowBulkIn(false);
          Swal.fire({ icon: 'success', title: 'Success!', text: result.message, timer: 2000, showConfirmButton: false });
          reload();
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: result.message });
        }
      };

      return (
        <div className="data-section">
          {load && <TopLoadingBar />}
          <div className="section-header">
            <h2><i className="fas fa-dolly"></i> Stock In / Out</h2>
            <div className="stock-btns">
              <RefreshBtn onClick={reload} />
              <button className="btn btn-success" disabled={loading} onClick={() => setModalType('in')}><i className="fas fa-arrow-down"></i> Stock In</button>
              <button className="btn btn-danger" disabled={loading} onClick={() => setModalType('out')}><i className="fas fa-arrow-up"></i> Stock Out</button>
              <button className="btn btn-secondary" disabled={loading} onClick={() => setShowBulkIn(true)}><i className="fas fa-truck-ramp-box"></i> Bulk Receive</button>
              <button className="btn btn-secondary" disabled={loading} onClick={() => setShowAdjust(true)}><i className="fas fa-scale-balanced"></i> Stocktake</button>
            </div>
          </div>
          {loading && <TableSkeleton rows={8} columns={10} />}
          <div style={{ display: loading ? 'none' : 'block' }}>
            <table id="stockTable" className="display" style={{ width: '100%' }}></table>
          </div>
          {modalType && <StockMovementModal type={modalType} products={products} movements={movements} onClose={() => setModalType(null)} onSave={handleSave} />}
          {showBulkIn && <BulkStockInModal products={products} onClose={() => setShowBulkIn(false)} onSave={handleBulkSave} />}
          {showAdjust && <StockAdjustModal products={products} movements={movements} onClose={() => setShowAdjust(false)} onSave={handleSave} />}
        </div>
      );
    }

    // --- Cart (POS line items) ---
    function Cart({ items, onInc, onDec, onRemove }) {
      if (items.length === 0) {
        return <div className="pos-empty"><i className="fas fa-cart-shopping"></i><p>Cart is empty — scan or type a product code to begin.</p></div>;
      }
      return (
        <div className="pos-cart-list">
          {items.map((it) => (
            <div className="pos-cart-row" key={it.productId}>
              <div className="pi-name"><strong>{it.name}</strong><small>SKU: {it.sku}</small></div>
              <div className="pos-qty-ctrl">
                <button type="button" onClick={() => onDec(it.productId)}><i className="fas fa-minus"></i></button>
                <span>{it.qty}</span>
                <button type="button" onClick={() => onInc(it.productId)}><i className="fas fa-plus"></i></button>
              </div>
              <div className="pos-line-total">{money(it.qty * it.price)}</div>
              <button type="button" className="pos-remove-btn" title="Remove line" onClick={() => onRemove(it.productId)}><i className="fas fa-trash"></i></button>
            </div>
          ))}
        </div>
      );
    }

    // --- Camera scan modal (secondary path, feeds the same resolve function as manual input) ---
    function CameraScanModal({ onDetected, onClose }) {
      // html5-qrcode's stop() throws SYNCHRONOUSLY (not a rejected promise) once the scanner
      // is already stopped - a .catch() after it doesn't help. runningRef gates every stop()
      // call so the decode callback and the unmount cleanup can never both call it.
      const scannerRef = useRef(null);
      const runningRef = useRef(false);

      useEffect(() => {
        let cancelled = false;
        const qr = new Html5Qrcode('pos-qr-reader');
        scannerRef.current = qr;

        const safeStop = () => {
          if (!runningRef.current) return;
          runningRef.current = false;
          try { qr.stop().then(() => qr.clear()).catch(() => { }); } catch (e) { /* already stopped */ }
        };

        qr.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, (decodedText) => {
          if (cancelled) return;
          cancelled = true;
          safeStop();
          onDetected(decodedText);
        }, () => { }).then(() => {
          runningRef.current = true;
          if (cancelled) safeStop(); // modal was closed while the camera was still starting up
        }).catch((err) => {
          Swal.fire({ icon: 'error', title: 'Camera Error', text: 'Could not start camera: ' + (err && err.message ? err.message : err) });
          onClose();
        });
        return () => {
          cancelled = true;
          safeStop();
        };
      }, []);

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-camera"></i> Scan with Camera</h3>
              <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div className="pos-camera-frame"><div id="pos-qr-reader"></div></div>
              <p style={{ textAlign: 'center', color: '#888', fontSize: 13, marginTop: 12 }}>Point the camera at the product's QR code or barcode</p>
            </div>
          </div>
        </div>
      );
    }

    // --- Thermal receipt slip (80mm POS printout) ---
        function ThermalSlip({ sale }) {
      if (!sale) return null;
      const items = sale.items || [];
      const shopLogo = (CFG.logoUrl && CFG.logoUrl.trim()) || ls.get('shop_logo_url') || LOGO_URL;
      const shopName = (CFG.business && CFG.business.name && CFG.business.name.trim()) || ls.get('shop_name') || 'Supermarket & Kirana Mart';
      const shopAddress = CFG.business?.address || ls.get('shop_address') || '';
      const shopPhone = CFG.business?.phone || ls.get('shop_phone') || '';
      const shopGstin = CFG.gstinNumber || ls.get('shop_gstin') || '';
      const shopFooter = CFG.receiptFooter || ls.get('shop_receipt_footer') || 'Thank you for shopping with us! Visit again.';

      return (
        <div className="thermal-slip-print">
          <div className="ts-header">
            {shopLogo ? <img src={shopLogo} alt="Shop Logo" className="ts-logo" /> : null}
            <div className="ts-app-name">{shopName}</div>
            {shopAddress ? <div className="ts-sub">{shopAddress}</div> : null}
            {shopPhone ? <div className="ts-sub">Ph: {shopPhone}</div> : null}
            {shopGstin ? <div className="ts-sub">GSTIN: {shopGstin}</div> : null}
            {CFG.receiptHeader ? <div className="ts-sub">{CFG.receiptHeader}</div> : null}
            <div className="ts-sub" style={{ fontWeight: 700, marginTop: 4, letterSpacing: '0.5px' }}>TAX INVOICE / RETAIL BILL</div>
          </div>
          <div className="ts-meta">
            <div className="ts-meta-row"><span>Date:</span><span>{formatDateForDisplay(sale.createdAt)}</span></div>
            {sale.invoiceNo ? <div className="ts-meta-row"><span>Invoice:</span><span>{sale.invoiceNo}</span></div> : null}
            <div className="ts-meta-row"><span>Sale #:</span><span>{String(sale.id).slice(-6).toUpperCase()}</span></div>
            {sale.customerName && sale.customerName !== 'Walk-in' ? <div className="ts-meta-row"><span>Customer:</span><span>{sale.customerName}</span></div> : null}
            <div className="ts-meta-row"><span>Cashier:</span><span>{sale.cashier}</span></div>
          </div>
          <div className="ts-divider"></div>
          <div className="ts-items">
            <div className="ts-item-row ts-item-head"><span>Item</span><span>Qty x Price = Total</span></div>
            {items.map((it, i) => (
              <div className="ts-item-row" key={it.sku || i}>
                <div className="ts-item-name-col">
                  <span className="ts-item-name">{it.name}</span>
                  {it.sku && <span className="ts-item-sku">SKU: {it.sku}</span>}
                </div>
                <span className="ts-item-calc">{it.qty} x {money(it.price)} = {money(it.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="ts-divider"></div>
          <div className="ts-totals">
            <div className="ts-row"><span>Subtotal</span><span>{money(sale.subtotal)}</span></div>
            {Number(sale.discount) > 0 ? <div className="ts-row"><span>Discount</span><span>- {money(sale.discount)}</span></div> : null}
            {Number(sale.tax) > 0 ? <div className="ts-row"><span>Tax{CFG.taxInclusive ? ' (incl)' : ''}</span><span>{money(sale.tax)}</span></div> : null}
            <div className="ts-row ts-total"><span>Total</span><span>{money(sale.total)}</span></div>
            {sale.paymentMethod === 'Split' || (sale.splitCash != null && sale.splitOnline != null) ? (
              <React.Fragment>
                <div className="ts-row"><span>Paid (Split - Cash)</span><span>{money(sale.splitCash || 0)}</span></div>
                <div className="ts-row"><span>Paid (Split - Online/UPI)</span><span>{money(sale.splitOnline || 0)}</span></div>
                {Number(sale.amountTendered) > Number(sale.splitCash) && Number(sale.changeDue) > 0 ? (
                  <div className="ts-row"><span>Cash Tendered</span><span>{money(sale.amountTendered)}</span></div>
                ) : null}
              </React.Fragment>
            ) : (
              sale.paymentMethod ? <div className="ts-row"><span>Paid ({sale.paymentMethod})</span><span>{money(sale.amountTendered != null ? sale.amountTendered : sale.total)}</span></div> : null
            )}
            {Number(sale.changeDue) > 0 ? <div className="ts-row"><span>Change</span><span>{money(sale.changeDue)}</span></div> : null}
            {sale.status === 'credit' ? <div className="ts-row" style={{ color: '#dc2626', fontWeight: 'bold' }}><span>Status</span><span>CREDIT / UNPAID</span></div> : null}
          </div>
          {/* Dynamic Payment / Verification QR on Thermal Receipt */}
          {(sale.paymentMethod === 'Online' || sale.paymentMethod === 'Split' || sale.status === 'credit') && (
            <div className="ts-qr-container">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&margin=2&data=${encodeURIComponent(
                  `upi://pay?pa=${(CFG.upiId || 'shop@upi').trim()}&pn=${encodeURIComponent((CFG.upiPayeeName || CFG.business?.name || 'Store').trim())}&am=${Number(sale.splitOnline != null ? sale.splitOnline : sale.total).toFixed(2)}&cu=INR&tn=${encodeURIComponent(sale.invoiceNo ? `Invoice ${sale.invoiceNo}` : 'Bill Payment')}`
                )}`}
                alt="UPI Payment QR"
              />
              <div className="ts-qr-label">Scan to Verify / Pay via UPI</div>
              <div className="ts-qr-sub">{CFG.upiId || 'shop@upi'} · {money(sale.splitOnline != null ? sale.splitOnline : sale.total)}</div>
            </div>
          )}
          <div className="ts-divider"></div>
          <div className="ts-footer">
            <div>{shopFooter}</div>
            <div className="ts-cashier">Served by: {sale.cashier}</div>
          </div>
        </div>
      );
    }

    // --- Thermal receipt print overlay (POS checkout only) ---
    function ThermalReceiptOverlay({ sale, onClose }) {
      if (!sale) return null;
      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal thermal-slip-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-receipt"></i> Receipt</h3>
              <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body thermal-slip-modal-body">
              <ThermalSlip sale={sale} />
              <div className="form-actions thermal-slip-actions">
                <button type="button" className="btn btn-primary" onClick={() => window.print()}><i className="fas fa-print"></i> Print</button>
                <button type="button" className="btn btn-secondary" onClick={onClose}><i className="fas fa-times"></i> Close</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // --- Dynamic Real-time UPI QR Component (Enhanced & Resilient) ---
    function DynamicUpiQr({ amount, upiId, payeeName, invoiceNote, onEditUpi, customMode = false }) {
      const canvasRef = useRef(null);
      const [copied, setCopied] = useState(false);
      const [useFallbackImg, setUseFallbackImg] = useState(false);
      const [customAmt, setCustomAmt] = useState('');
      
      const effectiveAmount = customAmt !== '' ? Math.max(0, Number(customAmt) || 0) : Math.max(0, Number(amount) || 0);
      const finalUpiId = (upiId || CFG.upiId || 'shop@upi').trim();
      const finalPayee = (payeeName || CFG.upiPayeeName || CFG.business?.name || 'Store').trim();
      const note = (invoiceNote || 'Bill Payment').trim();
      
      // Standard UPI specification URL (Keeping @ raw in pa ensures GooglePay & PhonePe compatibility)
      const upiUri = `upi://pay?pa=${finalUpiId}&pn=${encodeURIComponent(finalPayee)}&am=${effectiveAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
      const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=2&data=${encodeURIComponent(upiUri)}`;

      useEffect(() => {
        setUseFallbackImg(false);
        if (effectiveAmount > 0) {
          try {
            if (typeof QRCode !== 'undefined' && QRCode.toCanvas && canvasRef.current) {
              QRCode.toCanvas(canvasRef.current, upiUri, {
                width: 195,
                margin: 1,
                color: { dark: '#001529', light: '#ffffff' }
              }, (err) => {
                if (err) {
                  console.warn('Canvas QR render error, using fallback image:', err);
                  setUseFallbackImg(true);
                }
              });
            } else {
              setUseFallbackImg(true);
            }
          } catch (e) {
            setUseFallbackImg(true);
          }
        }
      }, [upiUri, effectiveAmount]);

      const handleCopy = () => {
        try {
          navigator.clipboard.writeText(upiUri);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (e) {
          Swal.fire({ icon: 'info', title: 'UPI String', text: upiUri });
        }
      };

      if (effectiveAmount <= 0) {
        return (
          <div className="dynamic-qr-card">
            <div className="dynamic-qr-badge">
              <i className="fas fa-bolt" style={{ color: '#f59e0b' }}></i> Dynamic Real-Time UPI QR
            </div>
            <div className="dynamic-qr-empty">
              <i className="fas fa-qrcode"></i>
              <p>Add items to cart or enter an amount below to generate a live Dynamic QR.</p>
              <div className="dynamic-qr-amount-edit">
                <span>Custom ₹:</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 150"
                  value={customAmt}
                  onChange={e => setCustomAmt(e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="dynamic-qr-card">
          <div className="dynamic-qr-badge">
            <i className="fas fa-bolt" style={{ color: '#f59e0b' }}></i> Dynamic Real-Time UPI QR
          </div>

          <div className="dynamic-qr-canvas-container">
            {useFallbackImg ? (
              <img
                src={fallbackQrUrl}
                alt="Dynamic UPI QR"
                style={{ width: 195, height: 195, display: 'block', margin: '0 auto', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            ) : (
              <canvas
                ref={canvasRef}
                style={{ width: 195, height: 195, display: 'block', margin: '0 auto', borderRadius: 8 }}
              />
            )}
          </div>

          <div className="dynamic-qr-amount-pill">
            Scan &amp; Pay Exact: <strong>{money(effectiveAmount)}</strong>
          </div>

          <div className="dynamic-qr-apps">
            <span className="upi-tag"><i className="fab fa-google-pay"></i> GPay</span>
            <span className="upi-tag"><i className="fas fa-mobile-screen"></i> PhonePe</span>
            <span className="upi-tag"><i className="fas fa-wallet"></i> Paytm</span>
            <span className="upi-tag"><i className="fas fa-building-columns"></i> BHIM</span>
          </div>

          <div className="dynamic-qr-info">
            <span>UPI ID: <strong>{finalUpiId}</strong></span>
            {onEditUpi && (
              <button type="button" className="btn-copy-upi" onClick={onEditUpi} title="Edit UPI ID for Store">
                <i className="fas fa-pencil"></i> Edit
              </button>
            )}
            <button type="button" className="btn-copy-upi" onClick={handleCopy} title="Copy UPI Link">
              <i className={copied ? "fas fa-check" : "fas fa-copy"}></i> {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>

          <a href={upiUri} className="btn-open-upi" target="_blank" rel="noreferrer">
            <i className="fas fa-arrow-up-right-from-square"></i> Open in UPI App
          </a>
        </div>
      );
    }

    // --- POS / QR Sales View ---
