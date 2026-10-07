function SuppliersView({ user, role }) {
      const [showModal, setShowModal] = useState(false);
      const [editingId, setEditingId] = useState(null);
      const [reloadKey, setReloadKey] = useState(0);
      const [load, setLoad] = useState('');
      const tableRef = useRef(null);
      const { loading, data, err } = useFetch(() => fbGetSuppliers(), [reloadKey]);
      const suppliers = useMemo(() => (data && data.success ? data.data : []), [data]);
      const byId = useMemo(() => suppliers.reduce((m, s) => (m[s.id] = s, m), {}), [suppliers]);
      const reload = () => setReloadKey(k => k + 1);
      const totalPayable = useMemo(() => suppliers.reduce((s, x) => s + Number(x.openingBalance || 0), 0), [suppliers]);
      const [viewSup, setViewSup] = useState(null);

      useEffect(() => { if (err || (data && !data.success)) Swal.fire({ icon: 'error', title: 'Error', text: (data && data.message) || 'Failed to load suppliers' }); }, [err, data]);

      useEffect(() => {
        if (loading) return;
        let table = tableRef.current;
        if (table) { table.clear().rows.add(suppliers).draw(false); }
        else {
          table = $('#suppliersTable').DataTable({
            data: suppliers,
            columnDefs: [{ targets: '_all', defaultContent: '' }], // tolerate rows missing newer fields - no "unknown parameter" warning
            createdRow: (row, d) => { if (Number(d.openingBalance) > 0) $(row).addClass('row-warn'); }, // outstanding payable
            columns: [
              { data: 'name', title: 'Name', render: (d, t) => t === 'display' ? esc(d) : d },
              { data: 'contact', title: 'Contact', render: (d, t) => t === 'display' ? esc(d || '-') : d },
              { data: 'phone', title: 'Phone', render: (d, t) => t === 'display' ? esc(d || '-') : d },
              { data: 'email', title: 'Email', render: (d, t) => t === 'display' ? esc(d || '-') : d },
              { data: 'terms', title: 'Terms', render: (d, t) => t === 'display' ? esc(d || '-') : d },
              { data: 'openingBalance', title: 'Payable', render: (d, t) => t === 'display' ? money(d) : d },
              { data: null, title: 'Actions', orderable: false, render: () => `<button class="action-icon" data-action="view" title="View"><i class="fas fa-eye"></i></button><button class="action-icon edit-icon" data-action="edit" title="Edit"><i class="fas fa-edit"></i></button>` + (role === 'Admin' ? `<button class="action-icon delete-icon" data-action="delete" title="Delete"><i class="fas fa-trash"></i></button>` : '') }
            ],
            pageLength: 10, lengthMenu: [[10, 25, 50, -1], [10, 25, 50, 'All']], responsive: true, dom: 'Blfrtip',
            buttons: [{ extend: 'csv', text: '<i class="fas fa-file-csv"></i> CSV', exportOptions: { columns: ':not(:last-child)' } }, { extend: 'pdf', text: '<i class="fas fa-file-pdf"></i> PDF', exportOptions: { columns: ':not(:last-child)' } }, { extend: 'print', text: '<i class="fas fa-print"></i> Print', exportOptions: { columns: ':not(:last-child)' } }],
            order: [[0, 'asc']]
          });
          tableRef.current = table;
        }
        $('#suppliersTable').off('click', '.action-icon').on('click', '.action-icon', function () {
          const id = table.row($(this).parents('tr')).data().id;
          const act = $(this).data('action');
          if (act === 'view') setViewSup(byId[id]);
          else if (act === 'edit') { setEditingId(id); setShowModal(true); }
          else handleDelete(byId[id]);
        });
      }, [loading, suppliers, role]);

      useEffect(() => () => { if (tableRef.current) { try { tableRef.current.destroy(); tableRef.current = null; } catch (e) { } } }, []);

      const handleSave = async (fd) => {
        setLoad(editingId ? 'Updating supplier...' : 'Saving supplier...');
        const r = editingId ? await fbUpdateSupplier(editingId, fd, user) : await fbAddSupplier(fd, user);
        setLoad('');
        if (r.success) { setShowModal(false); setEditingId(null); Swal.fire({ icon: 'success', title: 'Success!', text: r.message, timer: 1800, showConfirmButton: false }); reload(); }
        else Swal.fire({ icon: 'error', title: 'Error', text: r.message });
      };
      const handleDelete = (s) => Swal.fire({ icon: 'warning', title: 'Delete supplier?', text: s.name, showCancelButton: true, confirmButtonColor: '#ea4335', confirmButtonText: 'Delete' }).then(async (res) => {
        if (!res.isConfirmed) return; setLoad('Deleting...'); const r = await fbDeleteSupplier(s.id, s.name, user); setLoad('');
        if (r.success) { Swal.fire({ icon: 'success', text: r.message, timer: 1600, showConfirmButton: false }); reload(); } else Swal.fire({ icon: 'error', title: 'Error', text: r.message });
      });

      return (
        <div className="data-section">
          {load && <TopLoadingBar />}
          <div className="section-header"><h2><i className="fas fa-truck-field"></i> Suppliers</h2><div style={{ display: 'flex', gap: '10px' }}><RefreshBtn onClick={reload} /><button className="btn btn-success" onClick={() => { setEditingId(null); setShowModal(true); }}><i className="fas fa-plus"></i> Add Supplier</button></div></div>
          {loading && <TableSkeleton rows={8} columns={7} />}
          <div style={{ display: loading ? 'none' : 'block' }}><table id="suppliersTable" className="display" style={{ width: '100%' }}></table>{suppliers.length > 0 && <SummaryBar items={[{ label: 'Suppliers', value: suppliers.length }, { label: 'Total Payable', value: money(totalPayable) }]} />}</div>
          {viewSup && <SupplierHubModal supplier={viewSup} onClose={() => setViewSup(null)} />}
          {showModal && <SupplierModal editItem={byId[editingId]} onClose={() => { setShowModal(false); setEditingId(null); }} onSave={handleSave} />}
        </div>
      );
    }

    // --- Expense Modal ---
    function ExpenseModal({ editItem, onClose, onSave }) {
      const today = new Date().toISOString().slice(0, 10);
      const [f, setF] = useState({ date: editItem?.date || today, category: editItem?.category || 'Other', payee: editItem?.payee || '', amount: editItem?.amount ?? '', paymentMethod: editItem?.paymentMethod || 'Cash', notes: editItem?.notes || '' });
      const [saving, setSaving] = useState(false);
      const upd = (k, v) => setF(p => ({ ...p, [k]: v }));
      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fas fa-receipt"></i> {editItem ? 'Edit' : 'Add'} Expense</h3><button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button></div>
            <div className="modal-body">
              <form onSubmit={(e) => { e.preventDefault(); if (!(Number(f.amount) > 0)) return Swal.fire({ icon: 'warning', title: 'Enter an amount' }); setSaving(true); onSave({ ...f, amount: Number(f.amount) || 0 }); }}>
                <div className="form-grid">
                  <div className="form-group"><label>Date *</label><input type="date" value={f.date} onChange={(e) => upd('date', e.target.value)} required /></div>
                  <SearchableDropdown label="Category" icon="fas fa-tag" options={EXPENSE_CATEGORY_OPTS} value={f.category} onChange={(v) => upd('category', v)} placeholder="Select..." required={true} />
                  <div className="form-group"><label>Payee / Paid To</label><input type="text" value={f.payee} onChange={(e) => upd('payee', e.target.value)} /></div>
                  <div className="form-group"><label>Amount *</label><input type="number" step="0.01" min="0" value={f.amount} onChange={(e) => upd('amount', e.target.value)} required /></div>
                  <SearchableDropdown label="Paid Via" icon="fas fa-money-bill-wave" options={PAYMENT_OPTS} value={f.paymentMethod} onChange={(v) => upd('paymentMethod', v)} placeholder="Cash" />
                </div>
                <div className="form-group"><label>Notes</label><textarea rows="2" value={f.notes} onChange={(e) => upd('notes', e.target.value)}></textarea></div>
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

    // --- Expenses View ---
