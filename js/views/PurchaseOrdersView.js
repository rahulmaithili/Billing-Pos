function PurchaseOrdersView({ user, role }) {
      const [showModal, setShowModal] = useState(false);
      const [viewPo, setViewPo] = useState(null);
      const [reloadKey, setReloadKey] = useState(0);
      const [load, setLoad] = useState('');
      const tableRef = useRef(null);
      const { loading, data, err } = useFetch(() => Promise.all([fbGetPurchaseOrders(), fbGetSuppliers(), fbGetProducts()]), [reloadKey]);
      const pos = useMemo(() => (data && data[0] && data[0].success ? data[0].data : []), [data]);
      const suppliers = useMemo(() => (data && data[1] && data[1].success ? data[1].data : []), [data]);
      const products = useMemo(() => (data && data[2] && data[2].success ? data[2].data : []), [data]);
      const byId = useMemo(() => pos.reduce((m, p) => (m[p.id] = p, m), {}), [pos]);
      const tableData = useMemo(() => pos.map(p => Object.assign({}, p, { itemCount: (p.items || []).length })), [pos]);
      const reload = () => setReloadKey(k => k + 1);
      const poSummary = useMemo(() => ({
        count: pos.length,
        total: pos.reduce((s, p) => s + Number(p.total || 0), 0),
        open: pos.filter(p => p.status !== 'received' && p.status !== 'cancelled').reduce((s, p) => s + Number(p.total || 0), 0)
      }), [pos]);

      const statusBadge = (s) => {
        const map = { received: 'status-active', ordered: 'type-chip', draft: '', cancelled: 'status-inactive' };
        const cls = map[s] || 'type-chip';
        return `<span class="${cls === 'type-chip' ? 'type-chip' : 'status-badge ' + cls}">${esc(s || 'draft')}</span>`;
      };

      useEffect(() => { if (err || (data && data[0] && !data[0].success)) Swal.fire({ icon: 'error', title: 'Error', text: (data && data[0] && data[0].message) || 'Failed to load POs' }); }, [err, data]);

      useEffect(() => {
        if (loading) return;
        let table = tableRef.current;
        if (table) { table.clear().rows.add(tableData).draw(false); }
        else {
          table = $('#poTable').DataTable({
            data: tableData,
            columnDefs: [{ targets: '_all', defaultContent: '' }], // tolerate rows missing newer fields - no "unknown parameter" warning
            createdRow: (row, d) => { if (d.status === 'received') $(row).addClass('row-ok'); else if (d.status === 'cancelled') $(row).addClass('row-muted'); else $(row).addClass('row-warn'); }, // received=green, cancelled=grey, open=amber
            columns: [
              { data: 'poNumber', title: 'PO #', render: (d, t) => t === 'display' ? '<code>' + esc(d || '') + '</code>' : d },
              { data: 'createdAt', title: 'Date', render: (d, t) => t === 'display' ? formatDateForDisplay(d) : d },
              { data: 'supplierName', title: 'Supplier', render: (d, t) => t === 'display' ? esc(d || '-') : d },
              { data: 'itemCount', title: 'Lines' },
              { data: 'total', title: 'Total', render: (d, t) => t === 'display' ? money(d) : d },
              { data: 'status', title: 'Status', render: (d, t) => t === 'display' ? statusBadge(d) : d },
              { data: 'expectedDate', title: 'Expected', render: (d, t) => t === 'display' ? esc(d || '-') : d },
              { data: null, title: 'Actions', orderable: false, render: (d, t, row) => `<button class="action-icon edit-icon" data-action="view"><i class="fas fa-eye"></i></button>` + (row.status !== 'received' && row.status !== 'cancelled' ? `<button class="action-icon qr-icon" data-action="receive"><i class="fas fa-dolly"></i></button>` : '') + (role === 'Admin' ? `<button class="action-icon delete-icon" data-action="delete"><i class="fas fa-trash"></i></button>` : '') }
            ],
            pageLength: 10, lengthMenu: [[10, 25, 50, -1], [10, 25, 50, 'All']], responsive: true, dom: 'Blfrtip',
            buttons: [{ extend: 'csv', text: '<i class="fas fa-file-csv"></i> CSV', exportOptions: { columns: ':not(:last-child)' } }, { extend: 'pdf', text: '<i class="fas fa-file-pdf"></i> PDF', exportOptions: { columns: ':not(:last-child)' } }, { extend: 'print', text: '<i class="fas fa-print"></i> Print', exportOptions: { columns: ':not(:last-child)' } }],
            order: [[1, 'desc']]
          });
          tableRef.current = table;
        }
        $('#poTable').off('click', '.action-icon').on('click', '.action-icon', function () {
          const id = table.row($(this).parents('tr')).data().id;
          const action = $(this).data('action');
          if (action === 'view') setViewPo(byId[id]);
          else if (action === 'receive') doReceive(byId[id]);
          else handleDelete(byId[id]);
        });
      }, [loading, tableData, role]);

      useEffect(() => () => { if (tableRef.current) { try { tableRef.current.destroy(); tableRef.current = null; } catch (e) { } } }, []);

      const handleSave = async (po) => {
        setLoad('Creating PO...');
        const r = await fbCreatePurchaseOrder(po, user);
        setLoad('');
        if (r.success) { setShowModal(false); Swal.fire({ icon: 'success', title: 'Success!', text: r.message, timer: 1800, showConfirmButton: false }); reload(); }
        else Swal.fire({ icon: 'error', title: 'Error', text: r.message });
      };

      const doReceive = async (po) => {
        if (!po) return;
        const res = await Swal.fire({ icon: 'question', title: 'Receive PO?', text: `Post ${(po.items || []).length} line(s) as Stock In and mark ${po.poNumber} received?`, showCancelButton: true, confirmButtonText: 'Receive', input: 'checkbox', inputValue: 1, inputPlaceholder: 'Also update product costs' });
        if (!res.isConfirmed) return;
        setViewPo(null); setLoad('Receiving stock...');
        const r = await fbReceivePurchaseOrder(po, user, !!res.value);
        setLoad('');
        if (r.success) { Swal.fire({ icon: 'success', title: 'Received', text: r.message, timer: 1800, showConfirmButton: false }); reload(); }
        else Swal.fire({ icon: 'error', title: 'Error', text: r.message });
      };

      const handleDelete = (po) => Swal.fire({ icon: 'warning', title: 'Delete PO?', text: po.poNumber, showCancelButton: true, confirmButtonColor: '#ea4335', confirmButtonText: 'Delete' }).then(async (res) => {
        if (!res.isConfirmed) return; setLoad('Deleting...'); const r = await fbDeletePurchaseOrder(po.id, po.poNumber, user); setLoad('');
        if (r.success) { Swal.fire({ icon: 'success', text: r.message, timer: 1500, showConfirmButton: false }); reload(); } else Swal.fire({ icon: 'error', title: 'Error', text: r.message });
      });

      return (
        <div className="data-section">
          {load && <TopLoadingBar />}
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2><i className="fas fa-file-invoice-dollar" style={{ color: 'var(--navy-accent)', marginRight: 8 }}></i> Purchase Orders (Procurement)</h2>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                Create purchase orders, track incoming stock deliveries and receive goods directly into inventory
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <RefreshBtn onClick={reload} />
              <button className="btn btn-primary" disabled={loading} onClick={() => setShowModal(true)} style={{ fontWeight: 700 }}>
                <i className="fas fa-plus"></i> + New PO
              </button>
            </div>
          </div>

          {/* KPI Stats Grid */}
          <div className="dash-stats-grid" style={{ marginBottom: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{poSummary.count}</div>
                <div className="stat-label">Total Orders (POs)</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <i className="fas fa-boxes-packing"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{money(poSummary.total)}</div>
                <div className="stat-label">Total Ordered Value</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{money(poSummary.open)}</div>
                <div className="stat-label">Pending / Unreceived</div>
              </div>
            </div>
          </div>
          {loading && <TableSkeleton rows={8} columns={8} />}
          <div style={{ display: loading ? 'none' : 'block' }}><table id="poTable" className="display" style={{ width: '100%' }}></table>{pos.length > 0 && <SummaryBar items={[{ label: 'POs', value: poSummary.count }, { label: 'Total Value', value: money(poSummary.total) }, { label: 'Open (unreceived)', value: money(poSummary.open) }]} />}</div>
          {showModal && <PurchaseOrderModal suppliers={suppliers} products={products} onClose={() => setShowModal(false)} onSave={handleSave} />}
          {viewPo && <PoDetailModal po={viewPo} onClose={() => setViewPo(null)} onReceive={doReceive} />}
        </div>
      );
    }

    // --- User Modal (Add/Edit) ---
    function UserModal({ editUser, onClose, onSave }) {
      const [formData, setFormData] = useState({
        name: editUser?.name || '', email: editUser?.email || '', password: '', role: editUser?.role || 'User'
      });
      const [saving, setSaving] = useState(false);

      const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const payload = { name: formData.name, email: formData.email, role: formData.role };
        if (!editUser || formData.password) payload.password = formData.password;
        await onSave(payload);
        setSaving(false); // re-enable on failed save (parent keeps modal open)
      };

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-user-gear"></i> {editUser ? 'Edit' : 'Add'} User</h3>
              <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <form onSubmit={submit}>
                <div className="form-grid">
                  <div className="form-group"><label>Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required /></div>
                  <div className="form-group"><label>Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} required /></div>
                  <div className="form-group"><label>Password {editUser ? '(leave blank to keep current)' : '*'}</label><input type="password" value={formData.password} onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))} required={!editUser} /></div>
                  <SearchableDropdown label="Role" icon="fas fa-user-shield" options={ROLE_OPTS} value={formData.role} onChange={(val) => setFormData(p => ({ ...p, role: val }))} placeholder="Select role..." required={true} />
                </div>
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

    // --- Users View (Admin only - manages the /users login collection) ---
