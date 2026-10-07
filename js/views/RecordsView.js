function RecordsView({ user, role }) {
      const [showModal, setShowModal] = useState(false);
      const [editingId, setEditingId] = useState(null);
      const [reloadKey, setReloadKey] = useState(0);
      const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', active: '', addedBy: '', customerType: '' });
      const [load, setLoad] = useState('');
      const tableInstanceRef = useRef(null);
      const searchFnRef = useRef(null); // our own global-search predicate - removed by identity, never blind-pop another view's
      const [viewCust, setViewCust] = useState(null);

      const { loading, data, err } = useFetch(() => fbGetRecords(), [reloadKey]);
      const records = useMemo(() => (data && data.success ? data.data : []), [data]);
      const reload = () => setReloadKey(k => k + 1);
      window.refreshRecords = reload;

      const byId = useMemo(() => records.reduce((m, r) => (m[r.id] = r, m), {}), [records]);
      const uniqueUsers = useMemo(() => [...new Set(records.map(r => r.addedBy).filter(Boolean))], [records]);
      const openEdit = useCallback((id) => { setEditingId(id); setShowModal(true); }, []);

      useEffect(() => {
        if (err || (data && !data.success)) Swal.fire({ icon: 'error', title: 'Error', text: (data && data.message) || 'Failed to load records' });
      }, [err, data]);

      useEffect(() => {
        if (loading) return;
        let table = tableInstanceRef.current;
        if (table) {
          table.clear().rows.add(records).draw(false);
        } else {
          table = $('#recordsTable').DataTable({
            data: records,
            columnDefs: [{ targets: '_all', defaultContent: '' }], // tolerate rows missing newer fields - no "unknown parameter" warning
            createdRow: (row, d) => { if (!d.active) $(row).addClass('row-muted'); }, // inactive customers dimmed
            columns: [
              { data: 'id', title: 'ID', render: (d, t) => t === 'display' ? d.slice(-6).toUpperCase() : d },
              { data: 'name', title: 'Name', render: (d, t, row) => t === 'display' ? esc(d) + (row.company ? `<div class="cell-sub">${esc(row.company)}</div>` : '') : d },
              { data: 'phone', title: 'Phone', render: (d, t) => t === 'display' ? esc(d || '') : d },
              { data: 'customerType', title: 'Type', render: (d, t) => t === 'display' ? '<span class="type-chip">' + esc(d || 'Retail') + '</span>' : d },
              { data: 'category', title: 'Group', render: (d, t) => t === 'display' ? esc(d || '') : d },
              { data: 'amount', title: 'Balance', render: (d, t) => t === 'display' ? money(d) : d },
              { data: 'active', title: 'Active', render: (d, t, row) => t === 'display' ? `<input type="checkbox" ${d ? 'checked' : ''} class="toggle" onchange="toggleActive('${row.id}', this.checked ? 1 : 0)">` : d },
              { data: 'createdAt', title: 'Created', render: (d, t) => t === 'display' ? formatDateForDisplay(d) : d },
              { data: null, title: 'Actions', orderable: false, render: () => `<button class="action-icon" data-action="view" title="View"><i class="fas fa-eye"></i></button><button class="action-icon edit-icon" data-action="edit" title="Edit"><i class="fas fa-edit"></i></button>` + (role === 'Admin' ? `<button class="action-icon delete-icon" data-action="delete" title="Delete"><i class="fas fa-trash"></i></button>` : '') }
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
            order: [[7, 'desc']]
          });
          tableInstanceRef.current = table;
        }
        $('#recordsTable').off('click', '.action-icon').on('click', '.action-icon', function () {
          const id = table.row($(this).parents('tr')).data().id;
          const act = $(this).data('action');
          if (act === 'view') setViewCust(byId[id]);
          else if (act === 'edit') openEdit(id);
          else handleDelete(byId[id]);
        });
      }, [loading, records, role]);

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
          const rec = records[dataIndex];
          if (!rec) return true;
          const created = new Date(rec.createdAt);
          const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
          const to = filters.dateTo ? new Date(filters.dateTo + 'T23:59:59') : null;
          if (from && created < from) return false;
          if (to && created > to) return false;
          if (filters.active !== '' && Boolean(rec.active) !== (filters.active === '1')) return false;
          if (filters.addedBy && rec.addedBy !== filters.addedBy) return false;
          if (filters.customerType && (rec.customerType || 'Retail') !== filters.customerType) return false;
          return true;
        };
        searchFnRef.current = fn; ext.push(fn);
        dt.draw();
      };

      const clearFilters = () => {
        setFilters({ dateFrom: '', dateTo: '', active: '', addedBy: '', customerType: '' });
        const ext = $.fn.dataTable.ext.search;
        const i = ext.indexOf(searchFnRef.current); if (i !== -1) ext.splice(i, 1);
        searchFnRef.current = null;
        if (tableInstanceRef.current) tableInstanceRef.current.draw();
      };

      useEffect(() => { if (tableInstanceRef.current && records.length > 0) applyFilters(); }, [filters, records]);

      const handleSave = async (formData) => {
        setLoad(editingId ? 'Updating record...' : 'Saving record...');
        const result = editingId ? await fbUpdateRecord(editingId, formData, user) : await fbAddRecord(formData, user);
        setLoad('');
        if (result.success) {
          setShowModal(false); setEditingId(null);
          Swal.fire({ icon: 'success', title: 'Success!', text: result.message, timer: 2000, showConfirmButton: false });
          reload();
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: result.message });
        }
      };

      const handleDelete = (record) => {
        Swal.fire({ icon: 'warning', title: 'Delete?', text: 'This cannot be undone', showCancelButton: true, confirmButtonColor: '#ea4335', confirmButtonText: 'Delete' }).then(async (result) => {
          if (!result.isConfirmed) return;
          setLoad('Deleting record...');
          const r = await fbDeleteRecord(record.id, record.name, user);
          setLoad('');
          if (r.success) { Swal.fire({ icon: 'success', text: r.message, timer: 2000, showConfirmButton: false }); reload(); }
          else Swal.fire({ icon: 'error', title: 'Error', text: r.message });
        });
      };

      return (
        <div className="data-section">
          {load && <TopLoadingBar />}
          <div className="section-header">
            <h2><i className="fas fa-address-book"></i> Customers</h2>
            <div style={{ display: 'flex', gap: '10px' }}><RefreshBtn onClick={reload} /><button className="btn btn-success" onClick={() => { setEditingId(null); setShowModal(true); }}><i className="fas fa-plus"></i> Add Customer</button></div>
          </div>
          {!loading && (
            <div className="filters-section">
              <div className="filters-header">
                <h3><i className="fas fa-filter"></i> Filters</h3>
                <button className="btn btn-secondary btn-sm" onClick={clearFilters}><i className="fas fa-times-circle"></i> Clear All</button>
              </div>
              <div className="filters-grid">
                <div className="filter-group"><label><i className="fas fa-calendar-alt"></i> Date From</label><input type="date" className="filter-input" value={filters.dateFrom} onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))} /></div>
                <div className="filter-group"><label><i className="fas fa-calendar-alt"></i> Date To</label><input type="date" className="filter-input" value={filters.dateTo} onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))} /></div>
                <SearchableDropdown label="Active" icon="fas fa-check-circle" options={ACTIVE_OPTS} value={filters.active} onChange={(val) => setFilters(f => ({ ...f, active: val }))} placeholder="All Customers" />
                <SearchableDropdown label="Customer Type" icon="fas fa-user-group" options={CUSTOMER_TYPE_OPTS} value={filters.customerType} onChange={(val) => setFilters(f => ({ ...f, customerType: val }))} placeholder="All Types" />
                <SearchableDropdown label="Added By" icon="fas fa-user" options={uniqueUsers.map(u => ({ value: u, label: u }))} value={filters.addedBy} onChange={(val) => setFilters(f => ({ ...f, addedBy: val }))} placeholder="All Users" />
              </div>
            </div>
          )}
          {loading && <TableSkeleton rows={8} columns={8} />}
          <div style={{ display: loading ? 'none' : 'block' }}>
            <table id="recordsTable" className="display" style={{ width: '100%' }}></table>
            {records.length > 0 && <SummaryBar items={[{ label: 'Customers', value: records.length }, { label: 'Active', value: records.filter(r => r.active).length }, { label: 'Total Balance', value: money(records.reduce((s, r) => s + Number(r.amount || 0), 0)) }]} />}
          </div>
          {viewCust && <CustomerHubModal customer={viewCust} onClose={() => setViewCust(null)} />}
          {showModal && <RecordModal record={byId[editingId]} onClose={() => { setShowModal(false); setEditingId(null); }} onSave={handleSave} />}
        </div>
      );
    }

    // --- Product Modal (Add/Edit) ---
    function ProductModal({ product, onClose, onSave }) {
      const catOpts = useCategoryOpts();
      const { settings } = useConfig();
      const [formData, setFormData] = useState({
        name: product?.name || '', category: product?.category || '', price: product?.price ?? '',
        cost: product?.cost ?? '', reorderLevel: product?.reorderLevel ?? '', unit: product?.unit || '',
        barcode: product?.barcode || '', brand: product?.brand || '', supplier: product?.supplier || '',
        taxRate: product?.taxRate ?? '', status: product?.status || 'active',
        wholesalePrice: product?.wholesalePrice ?? '', mrp: product?.mrp ?? '',
        maxStock: product?.maxStock ?? '', reorderQty: product?.reorderQty ?? '',
        location: product?.location || '', batchNo: product?.batchNo || '', expiryDate: product?.expiryDate || '',
        imageUrl: product?.imageUrl || '', description: product?.description || ''
      });
      const [saving, setSaving] = useState(false);
      const num = (v) => Number(v) || 0;

      const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        // blank tax rate -> null so POS inherits the store default; explicit 0 stays 0 (tax-exempt)
        await onSave({
          ...formData,
          price: num(formData.price), cost: num(formData.cost), reorderLevel: num(formData.reorderLevel),
          taxRate: formData.taxRate === '' ? null : num(formData.taxRate), wholesalePrice: num(formData.wholesalePrice), mrp: num(formData.mrp),
          maxStock: num(formData.maxStock), reorderQty: num(formData.reorderQty),
          status: formData.status || 'active'
        });
        setSaving(false); // re-enable on failed save (parent keeps modal open)
      };

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-box"></i> {product ? 'Edit' : 'Add'} Product</h3>
              <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <form onSubmit={submit}>
                <div className="form-group">
                  <label><i className="fas fa-barcode"></i> SKU</label>
                  <input type="text" value={product ? product.sku : 'Auto-generated on save'} disabled />
                </div>
                {formData.imageUrl ? <div className="prod-img-preview"><img src={formData.imageUrl} alt="" onError={(e) => { e.target.style.display = 'none'; }} /></div> : null}
                <div className="form-grid">
                  <div className="form-group"><label>Product Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required /></div>
                  <SearchableDropdown label="Category" icon="fas fa-tag" options={catOpts} value={formData.category} onChange={(val) => setFormData(p => ({ ...p, category: val }))} placeholder="Select category..." required={true} />
                  <div className="form-group"><label>Brand</label><input type="text" value={formData.brand} onChange={(e) => setFormData(p => ({ ...p, brand: e.target.value }))} /></div>
                  <div className="form-group"><label><i className="fas fa-barcode"></i> Barcode (UPC/EAN)</label><input type="text" placeholder="Scan or type retail barcode" value={formData.barcode} onChange={(e) => setFormData(p => ({ ...p, barcode: e.target.value }))} /></div>
                  <div className="form-group"><label>Selling Price *</label><input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))} required /></div>
                  <div className="form-group"><label>Cost</label><input type="number" step="0.01" min="0" value={formData.cost} onChange={(e) => setFormData(p => ({ ...p, cost: e.target.value }))} /></div>
                  <div className="form-group"><label>Wholesale Price</label><input type="number" step="0.01" min="0" value={formData.wholesalePrice} onChange={(e) => setFormData(p => ({ ...p, wholesalePrice: e.target.value }))} /></div>
                  <div className="form-group"><label>MRP / List Price</label><input type="number" step="0.01" min="0" value={formData.mrp} onChange={(e) => setFormData(p => ({ ...p, mrp: e.target.value }))} /></div>
                  <div className="form-group"><label>Tax Rate % {settings?.taxRate ? `(default ${settings.taxRate}%)` : ''}</label><input type="number" step="0.01" min="0" placeholder="blank = use default" value={formData.taxRate} onChange={(e) => setFormData(p => ({ ...p, taxRate: e.target.value }))} /></div>
                  <div className="form-group"><label>Unit</label><input type="text" placeholder="pcs, box, kg..." value={formData.unit} onChange={(e) => setFormData(p => ({ ...p, unit: e.target.value }))} /></div>
                  <div className="form-group"><label>Reorder Level *</label><input type="number" step="1" min="0" value={formData.reorderLevel} onChange={(e) => setFormData(p => ({ ...p, reorderLevel: e.target.value }))} required /></div>
                  <div className="form-group"><label>Max Stock</label><input type="number" step="1" min="0" value={formData.maxStock} onChange={(e) => setFormData(p => ({ ...p, maxStock: e.target.value }))} /></div>
                  <div className="form-group"><label>Reorder Qty</label><input type="number" step="1" min="0" placeholder="fixed restock amount" value={formData.reorderQty} onChange={(e) => setFormData(p => ({ ...p, reorderQty: e.target.value }))} /></div>
                  <div className="form-group"><label>Supplier</label><input type="text" value={formData.supplier} onChange={(e) => setFormData(p => ({ ...p, supplier: e.target.value }))} /></div>
                  <div className="form-group"><label><i className="fas fa-location-dot"></i> Location / Bin</label><input type="text" placeholder="Aisle-Shelf-Bin" value={formData.location} onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))} /></div>
                  <div className="form-group"><label>Batch / Lot No</label><input type="text" value={formData.batchNo} onChange={(e) => setFormData(p => ({ ...p, batchNo: e.target.value }))} /></div>
                  <div className="form-group"><label><i className="fas fa-calendar-xmark"></i> Expiry Date</label><input type="date" value={formData.expiryDate} onChange={(e) => setFormData(p => ({ ...p, expiryDate: e.target.value }))} /></div>
                  <SearchableDropdown label="Status" icon="fas fa-toggle-on" options={STATUS_OPTS} value={formData.status} onChange={(val) => setFormData(p => ({ ...p, status: val }))} placeholder="Active" />
                </div>
                <div className="form-group"><label><i className="fas fa-image"></i> Image URL</label><input type="text" placeholder="https://..." value={formData.imageUrl} onChange={(e) => setFormData(p => ({ ...p, imageUrl: e.target.value }))} /></div>
                <div className="form-group"><label>Description</label><textarea rows="2" value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}></textarea></div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save</>}</button>
                  <button type="button" className="btn btn-secondary" onClick={onClose}><i className="fas fa-times"></i> Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // --- QR Modal (single product view) ---
    function QRModal({ product, onClose }) {
      const previewRef = useRef(null);
      const printRef = useRef(null);

      useEffect(() => {
        if (!product) return;
        QRCode.toCanvas(previewRef.current, product.id, { width: 220, margin: 1, color: { dark: '#001f3f', light: '#ffffff' } }, () => { });
        QRCode.toCanvas(printRef.current, product.id, { width: 300, margin: 0 }, () => { });
      }, [product]);

      if (!product) return null;

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-qrcode"></i> Product QR Code</h3>
              <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <canvas ref={previewRef}></canvas>
              <p style={{ marginTop: '14px', fontWeight: 700, color: 'var(--navy-primary)', fontSize: '16px', letterSpacing: '.5px' }}>{product.sku}</p>
              <p style={{ color: '#999', fontSize: '13px', marginTop: '4px' }}>{product.name}</p>
              <div className="form-actions" style={{ justifyContent: 'center', marginTop: '24px' }}>
                <button className="btn btn-primary" onClick={() => window.print()}><i className="fas fa-print"></i> Print Label</button>
                <button className="btn btn-secondary" onClick={onClose}><i className="fas fa-times"></i> Close</button>
              </div>
            </div>
            {/* print-only mirror, hidden on screen, shown via .qr-label-print in @media print */}
            <div className="qr-print-stage">
              <div className="qr-label-print">
                <canvas ref={printRef}></canvas>
                <div className="qr-label-sku">{product.sku}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // --- Bulk QR label printing ---
    function PrintAllLabels({ products, onDone }) {
      const canvasRefs = useRef({});

      useEffect(() => {
        let cancelled = false;
        Promise.all(products.map(p => QRCode.toCanvas(canvasRefs.current[p.id], p.id, { width: 300, margin: 0 })))
          .then(() => { if (!cancelled) window.print(); })
          .catch((e) => console.error('qr render failed', e));
        return () => { cancelled = true; };
      }, [products]);

      useEffect(() => {
        const afterPrint = () => onDone();
        window.addEventListener('afterprint', afterPrint);
        return () => window.removeEventListener('afterprint', afterPrint);
      }, [onDone]);

      return (
        <div className="qr-print-stage">
          {products.map(p => (
            <div className="qr-label-print" key={p.id}>
              <canvas ref={(el) => { canvasRefs.current[p.id] = el; }}></canvas>
              <div className="qr-label-sku">{p.sku}</div>
            </div>
          ))}
        </div>
      );
    }

    // --- Reorder report (print only - lists everything at/below reorder level) ---
    function ReorderReportPrint({ rows, onDone }) {
      useEffect(() => { window.print(); }, []);
      useEffect(() => {
        const afterPrint = () => onDone();
        window.addEventListener('afterprint', afterPrint);
        return () => window.removeEventListener('afterprint', afterPrint);
      }, [onDone]);

      return (
        <div className="reorder-report-print">
          <div className="rr-header">
            <img src={LOGO_URL} alt="" className="rr-logo" />
            <div>
              <div className="rr-title">Reorder Report</div>
              <div className="rr-sub">Generated {formatDateForDisplay(new Date().toISOString())}</div>
            </div>
          </div>
          <table className="rr-table">
            <thead><tr><th>Name</th><th>SKU</th><th>Category</th><th>Qty On Hand</th><th>Reorder Level</th><th>Suggested Reorder</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.name}</td><td>{r.sku}</td><td>{r.category}</td><td>{r.qtyOnHand}</td><td>{r.reorderLevel}</td>
                  <td>{suggestedReorder(r, r.qtyOnHand)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // --- Products View (DataTable CRUD + QR) ---
