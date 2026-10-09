function ExpensesView({ user, role }) {
      const [showModal, setShowModal] = useState(false);
      const [editingId, setEditingId] = useState(null);
      const [reloadKey, setReloadKey] = useState(0);
      const [load, setLoad] = useState('');
      const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', category: '' });
      const tableRef = useRef(null);
      const { loading, data, err } = useFetch(() => fbGetExpenses(), [reloadKey]);
      const expenses = useMemo(() => (data && data.success ? data.data : []), [data]);
      const byId = useMemo(() => expenses.reduce((m, e) => (m[e.id] = e, m), {}), [expenses]);
      const reload = () => setReloadKey(k => k + 1);

      const filtered = useMemo(() => expenses.filter(e => {
        const d = new Date(e.date || e.createdAt);
        if (filters.dateFrom && d < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && d > new Date(filters.dateTo + 'T23:59:59')) return false;
        if (filters.category && e.category !== filters.category) return false;
        return true;
      }), [expenses, filters]);
      const total = useMemo(() => filtered.reduce((s, e) => s + Number(e.amount || 0), 0), [filtered]);

      useEffect(() => { if (err || (data && !data.success)) Swal.fire({ icon: 'error', title: 'Error', text: (data && data.message) || 'Failed to load expenses' }); }, [err, data]);

      useEffect(() => {
        if (loading) return;
        let table = tableRef.current;
        if (table) { table.clear().rows.add(filtered).draw(false); }
        else {
          table = $('#expensesTable').DataTable({
            data: filtered,
            columnDefs: [{ targets: '_all', defaultContent: '' }], // tolerate rows missing newer fields - no "unknown parameter" warning
            columns: [
              { data: 'date', title: 'Date', render: (d, t, row) => t === 'display' ? esc(d || (row.createdAt || '').slice(0, 10)) : d },
              { data: 'category', title: 'Category', render: (d, t) => t === 'display' ? '<span class="type-chip">' + esc(d || '') + '</span>' : d },
              { data: 'payee', title: 'Payee', render: (d, t) => t === 'display' ? esc(d || '-') : d },
              { data: 'amount', title: 'Amount', render: (d, t) => t === 'display' ? money(d) : d },
              { data: 'paymentMethod', title: 'Paid Via', render: (d, t) => t === 'display' ? esc(d || '-') : d },
              { data: 'notes', title: 'Notes', render: (d, t) => t === 'display' ? esc(d || '-') : d },
              { data: null, title: 'Actions', orderable: false, render: () => `<button class="action-icon edit-icon" data-action="edit"><i class="fas fa-edit"></i></button>` + (role === 'Admin' ? `<button class="action-icon delete-icon" data-action="delete"><i class="fas fa-trash"></i></button>` : '') }
            ],
            pageLength: 10, lengthMenu: [[10, 25, 50, -1], [10, 25, 50, 'All']], responsive: true, dom: 'Blfrtip',
            buttons: [{ extend: 'csv', text: '<i class="fas fa-file-csv"></i> CSV', exportOptions: { columns: ':not(:last-child)' } }, { extend: 'pdf', text: '<i class="fas fa-file-pdf"></i> PDF', exportOptions: { columns: ':not(:last-child)' } }, { extend: 'print', text: '<i class="fas fa-print"></i> Print', exportOptions: { columns: ':not(:last-child)' } }],
            order: [[0, 'desc']]
          });
          tableRef.current = table;
        }
        $('#expensesTable').off('click', '.action-icon').on('click', '.action-icon', function () {
          const id = table.row($(this).parents('tr')).data().id;
          $(this).data('action') === 'edit' ? (setEditingId(id), setShowModal(true)) : handleDelete(byId[id]);
        });
      }, [loading, filtered, role]);

      useEffect(() => () => { if (tableRef.current) { try { tableRef.current.destroy(); tableRef.current = null; } catch (e) { } } }, []);

      const handleSave = async (fd) => {
        setLoad(editingId ? 'Updating expense...' : 'Saving expense...');
        const r = editingId ? await fbUpdateExpense(editingId, fd, user) : await fbAddExpense(fd, user);
        setLoad('');
        if (r.success) { setShowModal(false); setEditingId(null); Swal.fire({ icon: 'success', title: 'Success!', text: r.message, timer: 1600, showConfirmButton: false }); reload(); }
        else Swal.fire({ icon: 'error', title: 'Error', text: r.message });
      };
      const handleDelete = (ex) => Swal.fire({ icon: 'warning', title: 'Delete expense?', text: (ex.category || '') + ' ' + money(ex.amount), showCancelButton: true, confirmButtonColor: '#ea4335', confirmButtonText: 'Delete' }).then(async (res) => {
        if (!res.isConfirmed) return; setLoad('Deleting...'); const r = await fbDeleteExpense(ex.id, (ex.category || 'Expense') + ' ' + money(ex.amount), user); setLoad('');
        if (r.success) { Swal.fire({ icon: 'success', text: r.message, timer: 1500, showConfirmButton: false }); reload(); } else Swal.fire({ icon: 'error', title: 'Error', text: r.message });
      });

      return (
        <div className="data-section">
          {load && <TopLoadingBar />}
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2><i className="fas fa-money-bill-trend-up" style={{ color: 'var(--navy-accent)', marginRight: 8 }}></i> Expenses Management</h2>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                Track store bills, rent, vendor payments, supplies, transport and daily operating expenses
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <RefreshBtn onClick={reload} />
              <button className="btn btn-primary" onClick={() => { setEditingId(null); setShowModal(true); }} style={{ fontWeight: 700 }}>
                <i className="fas fa-plus"></i> + Add Expense
              </button>
            </div>
          </div>

          {/* KPI Stats Grid */}
          <div className="dash-stats-grid" style={{ marginBottom: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                <i className="fas fa-money-bill-trend-up"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{money(total)}</div>
                <div className="stat-label">Total Expenses</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <i className="fas fa-receipt"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{filtered.length}</div>
                <div className="stat-label">Total Entries</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{money(filtered.filter(e => String(e.paymentMethod || 'cash').toLowerCase().includes('cash')).reduce((s, e) => s + Number(e.amount || 0), 0))}</div>
                <div className="stat-label">Paid via Cash</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                <i className="fas fa-building-columns"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{money(filtered.filter(e => !String(e.paymentMethod || 'cash').toLowerCase().includes('cash')).reduce((s, e) => s + Number(e.amount || 0), 0))}</div>
                <div className="stat-label">Paid via Bank / UPI</div>
              </div>
            </div>
          </div>
          {!loading && (
            <div className="filters-section">
              <div className="filters-header"><h3><i className="fas fa-filter"></i> Filters</h3><button className="btn btn-secondary btn-sm" onClick={() => setFilters({ dateFrom: '', dateTo: '', category: '' })}><i className="fas fa-times-circle"></i> Clear All</button></div>
              <div className="filters-grid">
                <div className="filter-group"><label><i className="fas fa-calendar-alt"></i> Date From</label><input type="date" className="filter-input" value={filters.dateFrom} onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))} /></div>
                <div className="filter-group"><label><i className="fas fa-calendar-alt"></i> Date To</label><input type="date" className="filter-input" value={filters.dateTo} onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))} /></div>
                <SearchableDropdown label="Category" icon="fas fa-tag" options={EXPENSE_CATEGORY_OPTS} value={filters.category} onChange={(v) => setFilters(f => ({ ...f, category: v }))} placeholder="All Categories" />
                <div className="filter-group"><label>Total (filtered)</label><input type="text" className="filter-input" value={money(total)} disabled /></div>
              </div>
            </div>
          )}
          {loading && <TableSkeleton rows={8} columns={7} />}
          <div style={{ display: loading ? 'none' : 'block' }}><table id="expensesTable" className="display" style={{ width: '100%' }}></table>{filtered.length > 0 && <SummaryBar items={[{ label: 'Entries', value: filtered.length }, { label: 'Total Expenses', value: money(total) }]} />}</div>
          {showModal && <ExpenseModal editItem={byId[editingId]} onClose={() => { setShowModal(false); setEditingId(null); }} onSave={handleSave} />}
        </div>
      );
    }

    // --- Purchase Order create modal (supplier + line items) ---
    function PurchaseOrderModal({ suppliers, products, onClose, onSave }) {
      const [supplierId, setSupplierId] = useState('');
      const [expectedDate, setExpectedDate] = useState('');
      const [notes, setNotes] = useState('');
      const [lines, setLines] = useState([]);
      const [productId, setProductId] = useState('');
      const [qty, setQty] = useState('');
      const [unitCost, setUnitCost] = useState('');
      const [saving, setSaving] = useState(false);

      const supplierOpts = useMemo(() => (suppliers || []).map(s => ({ value: s.id, label: s.name })), [suppliers]);
      const productOpts = useMemo(() => (products || []).map(p => ({ value: p.id, label: `${p.name} (${p.sku})` })), [products]);
      const byId = useMemo(() => (products || []).reduce((m, p) => (m[p.id] = p, m), {}), [products]);
      const total = useMemo(() => lines.reduce((s, l) => s + l.qty * l.unitCost, 0), [lines]);

      const addLine = () => {
        const q = Number(qty), c = Number(unitCost);
        if (!productId) return Swal.fire({ icon: 'warning', title: 'Pick a product' });
        if (!Number.isInteger(q) || q < 1) return Swal.fire({ icon: 'warning', title: 'Invalid quantity' });
        const p = byId[productId];
        setLines(prev => {
          const ex = prev.find(l => l.productId === productId);
          if (ex) return prev.map(l => l.productId === productId ? { ...l, qty: l.qty + q, unitCost: c || l.unitCost } : l);
          return [...prev, { productId, name: p.name, sku: p.sku, qty: q, unitCost: c || Number(p.cost) || 0 }];
        });
        setProductId(''); setQty(''); setUnitCost('');
      };
      const removeLine = (id) => setLines(prev => prev.filter(l => l.productId !== id));

      const submit = async (status) => {
        if (!supplierId) return Swal.fire({ icon: 'warning', title: 'Pick a supplier' });
        if (!lines.length) return Swal.fire({ icon: 'warning', title: 'Add at least one line' });
        const sup = (suppliers || []).find(s => s.id === supplierId);
        setSaving(true);
        await onSave({ supplierId, supplierName: sup ? sup.name : '', items: lines.map(l => ({ ...l, lineTotal: round2(l.qty * l.unitCost) })), total: round2(total), notes: notes.trim() || null, expectedDate: expectedDate || null, status });
        setSaving(false);
      };

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fas fa-file-invoice-dollar"></i> New Purchase Order</h3><button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button></div>
            <div className="modal-body">
              <div className="form-grid">
                <SearchableDropdown label="Supplier" icon="fas fa-truck-field" options={supplierOpts} value={supplierId} onChange={setSupplierId} placeholder="Select supplier..." required={true} />
                <div className="form-group"><label><i className="fas fa-calendar-day"></i> Expected Date</label><input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} /></div>
              </div>
              <div className="pos-disc-row" style={{ gridTemplateColumns: '2fr 1fr 1fr auto', alignItems: 'end' }}>
                <SearchableDropdown label="Product" icon="fas fa-box" options={productOpts} value={productId} onChange={setProductId} placeholder="Add product..." />
                <div className="form-group"><label>Qty</label><input type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
                <div className="form-group"><label>Unit Cost</label><input type="number" min="0" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} /></div>
                <div className="form-group"><label>&nbsp;</label><button type="button" className="btn btn-secondary" onClick={addLine}><i className="fas fa-plus"></i> Add</button></div>
              </div>
              {lines.length > 0 && (
                <div className="about-table-wrapper" style={{ marginTop: 12 }}>
                  <table className="about-roles-table">
                    <thead><tr><th>Item</th><th>Qty</th><th>Unit Cost</th><th>Line Total</th><th></th></tr></thead>
                    <tbody>
                      {lines.map(l => (
                        <tr key={l.productId}>
                          <td>{l.name}<div className="cell-sub">{l.sku}</div></td><td>{l.qty}</td><td>{money(l.unitCost)}</td><td>{money(l.qty * l.unitCost)}</td>
                          <td><button className="action-icon delete-icon" onClick={() => removeLine(l.productId)}><i className="fas fa-times"></i></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="stock-onhand-hint" style={{ marginTop: 12 }}>PO Total: <strong>{money(total)}</strong></p>
              <div className="form-group"><label>Notes</label><textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea></div>
              <div className="form-actions">
                <button type="button" className="btn btn-primary" disabled={saving} onClick={() => submit('ordered')}><i className="fas fa-paper-plane"></i> Save &amp; Order</button>
                <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => submit('draft')}><i className="fas fa-floppy-disk"></i> Save Draft</button>
                <button type="button" className="btn btn-secondary" onClick={onClose}><i className="fas fa-times"></i> Cancel</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // --- PO detail + receive ---
    function PoDetailModal({ po, onClose, onReceive }) {
      if (!po) return null;
      const receivable = po.status !== 'received' && po.status !== 'cancelled';
      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fas fa-file-invoice-dollar"></i> {po.poNumber}</h3><button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button></div>
            <div className="modal-body">
              <div className="ts-meta" style={{ marginBottom: 12 }}>
                <div className="ts-meta-row"><span>Supplier:</span><span>{po.supplierName || '-'}</span></div>
                <div className="ts-meta-row"><span>Status:</span><span>{po.status}</span></div>
                <div className="ts-meta-row"><span>Expected:</span><span>{po.expectedDate || '-'}</span></div>
                <div className="ts-meta-row"><span>Created:</span><span>{formatDateForDisplay(po.createdAt)}</span></div>
              </div>
              <div className="about-table-wrapper">
                <table className="about-roles-table">
                  <thead><tr><th>Item</th><th>Qty</th><th>Unit Cost</th><th>Line Total</th></tr></thead>
                  <tbody>{(po.items || []).map((it, i) => <tr key={it.sku || i}><td>{it.name}<div className="cell-sub">{it.sku}</div></td><td>{it.qty}</td><td>{money(it.unitCost)}</td><td>{money(it.lineTotal != null ? it.lineTotal : it.qty * it.unitCost)}</td></tr>)}</tbody>
                </table>
              </div>
              <p className="stock-onhand-hint" style={{ marginTop: 12 }}>PO Total: <strong>{money(po.total)}</strong></p>
              {po.notes ? <p style={{ color: '#666', marginTop: 8 }}>{po.notes}</p> : null}
              <div className="form-actions">
                {receivable && <button className="btn btn-success" onClick={() => onReceive(po)}><i className="fas fa-dolly"></i> Receive into Stock</button>}
                <button className="btn btn-secondary" onClick={onClose}><i className="fas fa-times"></i> Close</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // --- Purchase Orders View ---
