function ProductsView({ user, role }) {
      const catOpts = useCategoryOpts();
      const [showModal, setShowModal] = useState(false);
      const [editingId, setEditingId] = useState(null);
      const [qrProductId, setQrProductId] = useState(null);
      const [viewProd, setViewProd] = useState(null);
      const [printAll, setPrintAll] = useState(false);
      const [printRows, setPrintRows] = useState([]);
      const [showReorderReport, setShowReorderReport] = useState(false);
      const [reloadKey, setReloadKey] = useState(0);
      const [filters, setFilters] = useState({ category: '', lowStock: '', status: '' });
      const [pipeStage, setPipeStage] = useState('all');
      const [showImport, setShowImport] = useState(false);
      const [load, setLoad] = useState('');
      const tableInstanceRef = useRef(null);
      const searchFnRef = useRef(null); // our own global-search predicate - removed by identity, never blind-pop another view's

      const { loading, data, err } = useFetch(() => Promise.all([fbGetProducts(), fbGetStockMovements()]), [reloadKey]);
      const products = useMemo(() => (data && data[0] && data[0].success ? data[0].data : []), [data]);
      const movements = useMemo(() => (data && data[1] && data[1].success ? data[1].data : []), [data]);
      const reload = () => setReloadKey(k => k + 1);

      const tableData = useMemo(() => products.map(p => Object.assign({}, p, { qtyOnHand: computeQtyOnHand(p.id, movements) })), [products, movements]);
      const byId = useMemo(() => products.reduce((m, p) => (m[p.id] = p, m), {}), [products]);
      const openEdit = useCallback((id) => { setEditingId(id); setShowModal(true); }, []);

      useEffect(() => {
        if (err || (data && data[0] && !data[0].success)) Swal.fire({ icon: 'error', title: 'Error', text: (data && data[0] && data[0].message) || 'Failed to load products' });
      }, [err, data]);

      useEffect(() => {
        if (loading) return;
        let table = tableInstanceRef.current;
        if (table) {
          table.clear().rows.add(tableData).draw(false);
        } else {
          table = $('#productsTable').DataTable({
            data: tableData,
            columnDefs: [{ targets: '_all', defaultContent: '' }], // tolerate rows missing newer fields - no "unknown parameter" warning
            createdRow: (row, d) => { if (Number(d.qtyOnHand) <= Number(d.reorderLevel || 0)) $(row).addClass('row-warn'); }, // low stock
            columns: [
              { data: 'imageUrl', title: '', orderable: false, render: (d, t) => t === 'display' ? (d ? `<img class="prod-thumb" src="${esc(d)}" onerror="this.style.visibility='hidden'">` : `<span class="prod-thumb empty"><i class="fas fa-box"></i></span>`) : '' },
              { data: 'name', title: 'Name', render: (d, t, row) => t === 'display' ? esc(d) + (row.brand ? `<div class="cell-sub">${esc(row.brand)}</div>` : '') : d },
              { data: 'sku', title: 'SKU', render: (d, t) => t === 'display' ? '<code>' + esc(d) + '</code>' : d },
              { data: 'barcode', title: 'Barcode', render: (d, t) => t === 'display' ? (d ? '<code>' + esc(d) + '</code>' : '<span style="color:#bbb">—</span>') : (d || '') },
              { data: 'category', title: 'Category', render: (d, t) => t === 'display' ? esc(d) : d },
              { data: 'price', title: 'Price', render: (d, t) => t === 'display' ? money(d) : d },
              { data: 'qtyOnHand', title: 'Qty On Hand', render: (d, t, row) => t === 'display' ? (Number(d) <= Number(row.reorderLevel || 0) ? '<span class="status-badge status-inactive">' + d + '</span>' : d) : d },
              { data: 'reorderLevel', title: 'Reorder Level' },
              { data: 'status', title: 'Status', render: (d, t) => t === 'display' ? (d === 'discontinued' ? '<span class="status-badge status-inactive">Discontinued</span>' : '<span class="status-badge status-active">Active</span>') : (d || 'active') },
              { data: null, title: 'Actions', orderable: false, render: () => `<button class="action-icon" data-action="view" title="View"><i class="fas fa-eye"></i></button><button class="action-icon edit-icon" data-action="edit" title="Edit"><i class="fas fa-edit"></i></button><button class="action-icon qr-icon" data-action="qr" title="QR"><i class="fas fa-qrcode"></i></button>` + (role === 'Admin' ? `<button class="action-icon delete-icon" data-action="delete" title="Delete"><i class="fas fa-trash"></i></button>` : '') }
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
            order: [[1, 'asc']]
          });
          tableInstanceRef.current = table;
        }
        $('#productsTable').off('click', '.action-icon').on('click', '.action-icon', function () {
          const id = table.row($(this).parents('tr')).data().id;
          const action = $(this).data('action');
          if (action === 'view') setViewProd(byId[id]);
          else if (action === 'edit') openEdit(id);
          else if (action === 'qr') setQrProductId(id);
          else handleDelete(byId[id]);
        });
      }, [loading, tableData, role]);

      useEffect(() => () => {
        const ext = $.fn.dataTable.ext.search;
        const i = ext.indexOf(searchFnRef.current); if (i !== -1) ext.splice(i, 1); // stop the filter leaking into other views' tables
        if (tableInstanceRef.current) { try { tableInstanceRef.current.destroy(); tableInstanceRef.current = null; } catch (e) { } }
      }, []);

      const applyFilters = () => {
        if (!tableInstanceRef.current) return;
        const dt = tableInstanceRef.current;
        const ext = $.fn.dataTable.ext.search;
        const prev = ext.indexOf(searchFnRef.current); if (prev !== -1) ext.splice(prev, 1); // replace our own predicate only
        const fn = (settings, dataRow, dataIndex) => {
          const p = tableData[dataIndex];
          if (!p) return true;
          if (filters.category && p.category !== filters.category) return false;
          if (filters.lowStock === '1' && !(Number(p.qtyOnHand) <= Number(p.reorderLevel || 0))) return false;
          if (filters.status && (p.status || 'active') !== filters.status) return false;
          return true;
        };
        searchFnRef.current = fn; ext.push(fn);
        dt.draw();
      };

      const clearFilters = () => {
        setFilters({ category: '', lowStock: '', status: '' });
        setPipeStage('all');
        const ext = $.fn.dataTable.ext.search;
        const i = ext.indexOf(searchFnRef.current); if (i !== -1) ext.splice(i, 1);
        searchFnRef.current = null;
        if (tableInstanceRef.current) tableInstanceRef.current.draw();
      };

      useEffect(() => { if (tableInstanceRef.current && tableData.length > 0) applyFilters(); }, [filters, tableData]);

      const isFiltered = !!(filters.category || filters.lowStock || filters.status);
      const reorderRows = useMemo(() => tableData.filter(p => Number(p.qtyOnHand) <= Number(p.reorderLevel || 0)), [tableData]);
      const stockValue = useMemo(() => tableData.reduce((s, p) => s + Number(p.qtyOnHand || 0) * (Number(p.cost) || 0), 0), [tableData]);

      const pipelineStages = useMemo(() => [
        { k: 'all', label: 'All Products', n: tableData.length, tone: 'var(--navy-primary)' },
        { k: 'active', label: 'Active', n: tableData.filter(p => (p.status || 'active') === 'active').length, tone: 'var(--success)' },
        { k: 'low', label: 'Low Stock Alert', n: reorderRows.length, tone: 'var(--warning)' },
        { k: 'discontinued', label: 'Discontinued', n: tableData.filter(p => p.status === 'discontinued').length, tone: 'var(--danger)' }
      ], [tableData, reorderRows.length]);

      const onPickStage = (k) => {
        setPipeStage(k);
        if (k === 'all') setFilters(f => ({ ...f, lowStock: '', status: '' }));
        else if (k === 'active') setFilters(f => ({ ...f, lowStock: '', status: 'active' }));
        else if (k === 'low') setFilters(f => ({ ...f, lowStock: '1', status: '' }));
        else if (k === 'discontinued') setFilters(f => ({ ...f, lowStock: '', status: 'discontinued' }));
      };

      const handlePrintLabels = () => {
        const dt = tableInstanceRef.current;
        setPrintRows(dt ? dt.rows({ search: 'applied' }).data().toArray() : tableData);
        setPrintAll(true);
      };

      const handleSave = async (formData) => {
        setLoad(editingId ? 'Updating product...' : 'Saving product...');
        const result = editingId ? await fbUpdateProduct(editingId, formData, user) : await fbAddProduct(formData, user);
        setLoad('');
        if (result.success) {
          setShowModal(false); setEditingId(null);
          Swal.fire({ icon: 'success', title: 'Success!', text: result.message, timer: 2000, showConfirmButton: false });
          reload();
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: result.message });
        }
      };

      const handleDelete = (product) => {
        Swal.fire({ icon: 'warning', title: 'Delete?', text: 'This cannot be undone', showCancelButton: true, confirmButtonColor: '#ea4335', confirmButtonText: 'Delete' }).then(async (result) => {
          if (!result.isConfirmed) return;
          setLoad('Deleting product...');
          const r = await fbDeleteProduct(product.id, product.name, user);
          setLoad('');
          if (r.success) { Swal.fire({ icon: 'success', text: r.message, timer: 2000, showConfirmButton: false }); reload(); }
          else Swal.fire({ icon: 'error', title: 'Error', text: r.message });
        });
      };

      return (
        <div className="data-section">
          {load && <TopLoadingBar />}
          <div className="section-header">
            <h2><i className="fas fa-boxes-stacked"></i> Products</h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <RefreshBtn onClick={reload} />
              <button className="btn btn-secondary" onClick={() => setShowImport(true)}><i className="fas fa-file-import"></i> Import CSV</button>
              <button className="btn btn-secondary" onClick={() => setShowReorderReport(true)} disabled={reorderRows.length === 0}><i className="fas fa-triangle-exclamation"></i> Print Reorder Report</button>
              <button className="btn btn-secondary" onClick={handlePrintLabels} disabled={products.length === 0}><i className="fas fa-print"></i> {isFiltered ? 'Print Filtered Labels' : 'Print All QR Labels'}</button>
              <button className="btn btn-success" onClick={() => { setEditingId(null); setShowModal(true); }}><i className="fas fa-plus"></i> Add Product</button>
            </div>
          </div>
          {!loading && (
            <Pipeline stages={pipelineStages} value={pipeStage} onPick={onPickStage} />
          )}
          {!loading && (
            <div className="filters-section">
              <div className="filters-header">
                <h3><i className="fas fa-filter"></i> Filters</h3>
                <button className="btn btn-secondary btn-sm" onClick={clearFilters}><i className="fas fa-times-circle"></i> Clear All</button>
              </div>
              <div className="filters-grid">
                <SearchableDropdown label="Category" icon="fas fa-tag" options={catOpts} value={filters.category} onChange={(val) => setFilters(f => ({ ...f, category: val }))} placeholder="All Categories" />
                <SearchableDropdown label="Stock Status" icon="fas fa-triangle-exclamation" options={LOW_STOCK_OPTS} value={filters.lowStock} onChange={(val) => setFilters(f => ({ ...f, lowStock: val }))} placeholder="All Stock Levels" />
                <SearchableDropdown label="Status" icon="fas fa-toggle-on" options={PRODUCT_STATUS_FILTER} value={filters.status} onChange={(val) => setFilters(f => ({ ...f, status: val }))} placeholder="All Statuses" />
              </div>
            </div>
          )}
          {loading && <TableSkeleton rows={8} columns={7} />}
          <div style={{ display: loading ? 'none' : 'block' }}>
            <table id="productsTable" className="display" style={{ width: '100%' }}></table>
            {products.length > 0 && <SummaryBar items={[{ label: 'Products', value: products.length }, { label: 'Stock Value', value: money(stockValue) }, { label: 'Low Stock', value: reorderRows.length }]} />}
          </div>
          {showModal && <ProductModal product={byId[editingId]} onClose={() => { setShowModal(false); setEditingId(null); }} onSave={handleSave} />}
          {viewProd && <ProductHubModal product={viewProd} onClose={() => setViewProd(null)} />}
          {qrProductId && <QRModal product={byId[qrProductId]} onClose={() => setQrProductId(null)} />}
          {printAll && <PrintAllLabels products={printRows} onDone={() => setPrintAll(false)} />}
          {showReorderReport && <ReorderReportPrint rows={reorderRows} onDone={() => setShowReorderReport(false)} />}
          {showImport && <ProductImportModal user={user} onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); reload(); }} />}
        </div>
      );
    }

    // --- Stock Movement Modal (Stock In / Stock Out - same modal, fixed type prop) ---
    function StockMovementModal({ type, products, movements, onClose, onSave }) {
      const [productId, setProductId] = useState('');
      const [qty, setQty] = useState('');
      const [reason, setReason] = useState(type === 'out' ? 'Damage' : 'Purchase');
      const [reference, setReference] = useState('');
      const [unitCost, setUnitCost] = useState('');
      const [updateCost, setUpdateCost] = useState(true);
      const [supplier, setSupplier] = useState('');
      const [batchNo, setBatchNo] = useState('');
      const [expiryDate, setExpiryDate] = useState('');
      const [location, setLocation] = useState('');
      const [notes, setNotes] = useState('');
      const [saving, setSaving] = useState(false);

      const isOut = type === 'out';
      const productOpts = useMemo(() => (products || []).map(p => ({ value: p.id, label: `${p.name} (${p.sku})` })), [products]);
      const selectedProduct = (products || []).find(p => p.id === productId);
      const onHand = useMemo(() => productId ? computeQtyOnHand(productId, movements) : 0, [productId, movements]);

      // prefill cost + location from the product when picked (for IN)
      useEffect(() => { if (selectedProduct && !isOut) { setUnitCost(c => c || (selectedProduct.cost ?? '')); setLocation(l => l || (selectedProduct.location || '')); } }, [productId]);

      const handleSubmit = async (e) => {
        e.preventDefault();
        const q = Number(qty);
        if (!productId) return Swal.fire({ icon: 'warning', title: 'Pick a Product', text: 'Select a product first' });
        if (!Number.isInteger(q) || q < 1) return Swal.fire({ icon: 'warning', title: 'Invalid Quantity', text: 'Quantity must be a whole number, at least 1' });
        if (isOut && q > onHand) {
          const confirm = await Swal.fire({
            icon: 'warning', title: 'Qty On Hand Warning',
            text: `Only ${onHand} unit(s) on hand for this product. This Stock Out will push Qty On Hand to ${onHand - q}. Continue anyway?`,
            showCancelButton: true, confirmButtonColor: '#ea4335', confirmButtonText: 'Continue', cancelButtonText: 'Cancel'
          });
          if (!confirm.isConfirmed) return;
        }
        setSaving(true);
        const move = { productId, type, qty: q, reason, reference: reference.trim() || null, location: location.trim() || null, notes: notes.trim() || null };
        if (!isOut) { move.unitCost = Number(unitCost) || 0; move.supplier = supplier.trim() || null; move.batchNo = batchNo.trim() || null; move.expiryDate = expiryDate || null; move.updateCost = updateCost && Number(unitCost) > 0; }
        await onSave(move, selectedProduct?.name || 'Unknown Product');
        setSaving(false);
      };

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className={`fas ${isOut ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i> Stock {isOut ? 'Out' : 'In'}</h3>
              <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <SearchableDropdown label="Product" icon="fas fa-box" options={productOpts} value={productId} onChange={setProductId} placeholder="Search product by name or SKU..." required={true} />
                  <div className="form-group"><label>Quantity *</label><input type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} required /></div>
                </div>
                {productId && <p className="stock-onhand-hint">Qty on hand: <strong>{onHand}</strong>{!isOut && Number(qty) > 0 ? ` → ${onHand + Number(qty)}` : ''}</p>}
                <div className="form-grid">
                  <SearchableDropdown label="Reason" icon="fas fa-clipboard-list" options={isOut ? REASON_OUT_OPTS : REASON_IN_OPTS} value={reason} onChange={setReason} placeholder="Select reason..." required={true} />
                  <div className="form-group"><label>Reference</label><input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="PO / invoice / sale ID" /></div>
                  {!isOut && <div className="form-group"><label>Unit Cost</label><input type="number" min="0" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} /></div>}
                  {!isOut && <div className="form-group"><label>Supplier</label><input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} /></div>}
                  {!isOut && <div className="form-group"><label>Batch / Lot No</label><input type="text" value={batchNo} onChange={(e) => setBatchNo(e.target.value)} /></div>}
                  {!isOut && <div className="form-group"><label><i className="fas fa-calendar-xmark"></i> Expiry Date</label><input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></div>}
                  <div className="form-group"><label><i className="fas fa-location-dot"></i> Location / Bin</label><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
                </div>
                {!isOut && <div className="form-group"><label className="stock-cost-check"><input type="checkbox" checked={updateCost} onChange={(e) => setUpdateCost(e.target.checked)} /> Update product cost to this unit cost</label></div>}
                <div className="form-group"><label>Notes</label><textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea></div>
                <div className="form-actions">
                  <button type="submit" className={`btn ${isOut ? 'btn-danger' : 'btn-success'}`} disabled={saving}>{saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Record Stock {isOut ? 'Out' : 'In'}</>}</button>
                  <button type="button" className="btn btn-secondary" onClick={onClose}><i className="fas fa-times"></i> Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // --- Stock View (ledger DataTable + Stock In / Stock Out buttons) ---
    // --- Bulk Stock In (receiving a supplier delivery in one go) ---
    function BulkStockInModal({ products, onClose, onSave }) {
      const [lines, setLines] = useState([]);
      const [productId, setProductId] = useState('');
      const [qty, setQty] = useState('');
      const [reason, setReason] = useState('');
      const [reference, setReference] = useState('');
      const [saving, setSaving] = useState(false);

      const productOpts = useMemo(() => (products || []).map(p => ({ value: p.id, label: `${p.name} (${p.sku})` })), [products]);
      const byId = useMemo(() => (products || []).reduce((m, p) => (m[p.id] = p, m), {}), [products]);
      const totalQty = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);

      const addLine = () => {
        const q = Number(qty);
        if (!productId) return Swal.fire({ icon: 'warning', title: 'Pick a Product', text: 'Select a product first' });
        if (!Number.isInteger(q) || q < 1) return Swal.fire({ icon: 'warning', title: 'Invalid Quantity', text: 'Quantity must be a whole number, at least 1' });
        const product = byId[productId];
        setLines(prev => {
          const existing = prev.find(l => l.productId === productId);
          if (existing) return prev.map(l => l.productId === productId ? { ...l, qty: l.qty + q } : l);
          return [...prev, { productId, name: product.name, sku: product.sku, qty: q }];
        });
        setProductId(''); setQty('');
      };

      const removeLine = (pid) => setLines(prev => prev.filter(l => l.productId !== pid));

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!lines.length) return Swal.fire({ icon: 'warning', title: 'No Items', text: 'Add at least one product line' });
        if (!reason.trim()) return Swal.fire({ icon: 'warning', title: 'Reason Required', text: 'Enter a reason, e.g. Purchase / Supplier Delivery' });
        setSaving(true);
        const batchLines = lines.map(l => ({ productId: l.productId, name: l.name, qty: l.qty, reason: reason.trim(), reference: reference.trim() || null }));
        await onSave(batchLines);
        setSaving(false);
      };

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-truck-ramp-box"></i> Bulk Receive Stock</h3>
              <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <SearchableDropdown label="Product" icon="fas fa-box" options={productOpts} value={productId} onChange={setProductId} placeholder="Search product by name or SKU..." />
                <div className="form-group"><label>Quantity</label><input type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
              </div>
              <div className="form-actions" style={{ marginTop: 0, marginBottom: '20px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}><i className="fas fa-plus"></i> Add Line</button>
              </div>
              {lines.length > 0 && (
                <div className="pos-cart-list" style={{ marginBottom: '20px' }}>
                  {lines.map(l => (
                    <div className="pos-cart-row" key={l.productId}>
                      <div className="pi-name"><strong>{l.name}</strong><small>SKU: {l.sku}</small></div>
                      <div className="pos-line-total">Qty: {l.qty}</div>
                      <button type="button" className="pos-remove-btn" title="Remove line" onClick={() => removeLine(l.productId)}><i className="fas fa-trash"></i></button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group"><label>Reason *</label><input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Supplier Delivery, Purchase" required /></div>
                  <div className="form-group"><label>Reference</label><input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional - e.g. PO number" /></div>
                </div>
                {lines.length > 0 && <p className="stock-onhand-hint">Total units to receive: <strong>{totalQty}</strong></p>}
                <div className="form-actions">
                  <button type="submit" className="btn btn-success" disabled={saving || lines.length === 0}>{saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Receive Stock</>}</button>
                  <button type="button" className="btn btn-secondary" onClick={onClose}><i className="fas fa-times"></i> Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // --- Stocktake / Adjustment - enter the counted qty, we post the correcting in/out movement ---
    function StockAdjustModal({ products, movements, onClose, onSave }) {
      const [productId, setProductId] = useState('');
      const [counted, setCounted] = useState('');
      const [notes, setNotes] = useState('');
      const [saving, setSaving] = useState(false);
      const productOpts = useMemo(() => (products || []).map(p => ({ value: p.id, label: `${p.name} (${p.sku})` })), [products]);
      const selected = (products || []).find(p => p.id === productId);
      const onHand = useMemo(() => productId ? computeQtyOnHand(productId, movements) : 0, [productId, movements]);
      const diff = counted === '' ? 0 : (Number(counted) - onHand);

      const submit = async (e) => {
        e.preventDefault();
        if (!productId) return Swal.fire({ icon: 'warning', title: 'Pick a Product' });
        if (counted === '' || Number(counted) < 0) return Swal.fire({ icon: 'warning', title: 'Enter counted qty' });
        if (diff === 0) return Swal.fire({ icon: 'info', title: 'No change', text: 'Counted quantity matches on-hand.' });
        setSaving(true);
        await onSave({ productId, type: diff > 0 ? 'in' : 'out', qty: Math.abs(diff), reason: 'Adjustment', reference: 'Stocktake', notes: notes.trim() || `Counted ${counted}, was ${onHand}` }, selected?.name || 'Unknown Product');
        setSaving(false);
      };

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fas fa-scale-balanced"></i> Stocktake / Adjustment</h3><button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button></div>
            <div className="modal-body">
              <form onSubmit={submit}>
                <SearchableDropdown label="Product" icon="fas fa-box" options={productOpts} value={productId} onChange={setProductId} placeholder="Search product..." required={true} />
                {productId && <p className="stock-onhand-hint">System on hand: <strong>{onHand}</strong></p>}
                <div className="form-grid">
                  <div className="form-group"><label>Counted Quantity *</label><input type="number" min="0" step="1" value={counted} onChange={(e) => setCounted(e.target.value)} required /></div>
                  <div className="form-group"><label>Adjustment</label><input type="text" value={productId && counted !== '' ? (diff > 0 ? '+' + diff + ' (Stock In)' : diff < 0 ? diff + ' (Stock Out)' : 'No change') : '-'} disabled /></div>
                </div>
                <div className="form-group"><label>Notes</label><textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for the variance (damage, miscount...)"></textarea></div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <><i className="fas fa-spinner fa-spin"></i> Posting...</> : <><i className="fas fa-save"></i> Post Adjustment</>}</button>
                  <button type="button" className="btn btn-secondary" onClick={onClose}><i className="fas fa-times"></i> Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    }
