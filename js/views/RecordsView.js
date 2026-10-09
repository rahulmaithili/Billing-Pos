// --- Collect Dues Modal (Cash vs Online UPI) ---
function CollectDuesModal({ customer, customers, onClose, onCollected, user }) {
  const [selectedCustId, setSelectedCustId] = useState(customer ? customer.id : '');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash' | 'Online'
  const [note, setNote] = useState('Udhar wasooli / Dues payment');
  const [saving, setSaving] = useState(false);

  const activeCustomer = useMemo(() => {
    if (customer && customer.id === selectedCustId) return customer;
    return (customers || []).find(c => c.id === selectedCustId) || customer;
  }, [customer, customers, selectedCustId]);

  const currentDues = Number(activeCustomer?.amount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payAmt = Number(amount);
    if (!selectedCustId) {
      Swal.fire({ icon: 'warning', title: 'Select Customer', text: 'Please choose a customer.' });
      return;
    }
    if (!payAmt || payAmt <= 0) {
      Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Please enter a valid payment amount.' });
      return;
    }
    if (payAmt > currentDues && currentDues > 0) {
      const confirmExceed = await Swal.fire({
        icon: 'question',
        title: 'Amount exceeds balance',
        text: `Entered ${CFG.currency}${payAmt} is greater than pending balance ${CFG.currency}${currentDues}. Continue?`,
        showCancelButton: true,
        confirmButtonText: 'Yes, proceed'
      });
      if (!confirmExceed.isConfirmed) return;
    }

    setSaving(true);
    const res = await fbCollectCustomerDues(selectedCustId, payAmt, paymentMode, note, user);
    setSaving(false);

    if (res.success) {
      Swal.fire({
        icon: 'success',
        title: 'Dues Payment Received!',
        html: `<div style="text-align:left; padding:8px 4px;">
          <p style="font-size:15px; margin-bottom:8px;"><strong>${esc(activeCustomer?.name || 'Customer')}</strong> paid <strong>${CFG.currency}${payAmt.toLocaleString()}</strong>.</p>
          <p style="color:#475569; font-size:13px; margin-bottom:4px;">Payment Mode: <strong>${paymentMode === 'Cash' ? '💵 Cash (Drawer)' : '📱 Online UPI / Bank'}</strong></p>
          <p style="color:#16a34a; font-weight:700; font-size:14px; margin-top:8px;">Updated Balance: ${CFG.currency}${Number(res.data.remainingBalance || 0).toLocaleString()}</p>
        </div>`,
        timer: 3500
      });
      if (onCollected) onCollected(res.data);
      onClose();
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Failed to collect dues.' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ background: '#16a34a', color: '#fff' }}>
          <h3 style={{ color: '#fff', margin: 0 }}><i className="fas fa-hand-holding-dollar"></i> Collect Dues (Wasooli)</h3>
          <button className="close-btn" onClick={onClose} style={{ color: '#fff' }}><i className="fas fa-times"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px' }}>
            {/* Customer selector if not preselected */}
            {!customer && (
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  <i className="fas fa-user"></i> Select Customer *
                </label>
                <select
                  value={selectedCustId}
                  onChange={e => setSelectedCustId(e.target.value)}
                  className="filter-input"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                >
                  <option value="">-- Choose Customer with Pending Dues --</option>
                  {(customers || []).filter(c => Number(c.amount || 0) > 0).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} — Dues: {CFG.currency}{Number(c.amount || 0).toLocaleString()}
                    </option>
                  ))}
                  {(customers || []).filter(c => !Number(c.amount || 0) > 0).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} — No Dues (₹0)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Customer Balance Banner */}
            {activeCustomer && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{activeCustomer.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}><i className="fas fa-phone"></i> {activeCustomer.phone || 'No phone'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Outstanding Dues</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: currentDues > 0 ? '#dc2626' : '#16a34a' }}>
                    {CFG.currency}{currentDues.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Amount Input & Quick Pills */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Amount to Collect *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '10px', fontWeight: 700, color: '#64748b', fontSize: '16px' }}>{CFG.currency}</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount to receive"
                  required
                  style={{ width: '100%', padding: '10px 12px 10px 32px', borderRadius: '8px', border: '2px solid #16a34a', fontSize: '16px', fontWeight: 700 }}
                />
              </div>
              {currentDues > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-xs" style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac', fontWeight: 600 }} onClick={() => setAmount(String(currentDues))}>
                    Full Dues ({CFG.currency}{currentDues})
                  </button>
                  {currentDues > 500 && (
                    <button type="button" className="btn btn-xs" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }} onClick={() => setAmount('500')}>
                      {CFG.currency}500
                    </button>
                  )}
                  {currentDues > 1000 && (
                    <button type="button" className="btn btn-xs" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }} onClick={() => setAmount('1000')}>
                      {CFG.currency}1,000
                    </button>
                  )}
                  {currentDues > 2000 && (
                    <button type="button" className="btn btn-xs" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }} onClick={() => setAmount('2000')}>
                      {CFG.currency}2,000
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Payment Mode Selection */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Payment Mode *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMode('Cash')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: paymentMode === 'Cash' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    background: paymentMode === 'Cash' ? '#dcfce7' : '#fff',
                    color: paymentMode === 'Cash' ? '#15803d' : '#475569',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '16px' }}><i className="fas fa-money-bill-wave"></i> Cash</span>
                  <span style={{ fontSize: '11px', fontWeight: 500 }}>Received in Cash Drawer (Galla)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('Online')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: paymentMode === 'Online' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: paymentMode === 'Online' ? '#e0f2fe' : '#fff',
                    color: paymentMode === 'Online' ? '#0369a1' : '#475569',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '16px' }}><i className="fas fa-qrcode"></i> Online UPI / Bank</span>
                  <span style={{ fontSize: '11px', fontWeight: 500 }}>Received in Bank Account</span>
                </button>
              </div>
            </div>

            {/* Note / Reference */}
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Note / Reference</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. UPI Ref # or Cash paid at counter"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}><i className="fas fa-times"></i> Cancel</button>
            <button type="submit" className="btn btn-success" style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }} disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin"></i> Processing...</> : <><i className="fas fa-check-circle"></i> Confirm Payment (Wasooli)</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Main Records / Customers View ---
function RecordsView({ user, role }) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', active: '', addedBy: '', customerType: '' });
  const [load, setLoad] = useState('');
  const tableInstanceRef = useRef(null);
  const searchFnRef = useRef(null);
  const [viewCust, setViewCust] = useState(null);

  // Dues Collection states
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectTargetCust, setCollectTargetCust] = useState(null);
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'dues_history'

  const { loading, data, err } = useFetch(() => fbGetRecords(), [reloadKey]);
  const records = useMemo(() => (data && data.success ? data.data : []), [data]);

  // Fetch dues history
  const { loading: loadingDues, data: duesData } = useFetch(() => fbGetDuesCollections(), [reloadKey]);
  const duesCollections = useMemo(() => (duesData && duesData.success ? duesData.data : []), [duesData]);

  const reload = () => setReloadKey(k => k + 1);
  window.refreshRecords = reload;

  const byId = useMemo(() => records.reduce((m, r) => (m[r.id] = r, m), {}), [records]);
  const uniqueUsers = useMemo(() => [...new Set(records.map(r => r.addedBy).filter(Boolean))], [records]);
  const openEdit = useCallback((id) => { setEditingId(id); setShowModal(true); }, []);

  const totalMarketDues = useMemo(() => {
    return records.reduce((s, r) => s + Number(r.amount || 0), 0);
  }, [records]);

  useEffect(() => {
    if (err || (data && !data.success)) Swal.fire({ icon: 'error', title: 'Error', text: (data && data.message) || 'Failed to load records' });
  }, [err, data]);

  useEffect(() => {
    if (loading || activeTab !== 'customers') return;
    let table = tableInstanceRef.current;
    if (table) {
      table.clear().rows.add(records).draw(false);
    } else {
      table = $('#recordsTable').DataTable({
        data: records,
        columnDefs: [{ targets: '_all', defaultContent: '' }],
        createdRow: (row, d) => { if (!d.active) $(row).addClass('row-muted'); },
        columns: [
          { data: 'id', title: 'ID', render: (d, t) => t === 'display' ? d.slice(-6).toUpperCase() : d },
          { data: 'name', title: 'Name', render: (d, t, row) => t === 'display' ? esc(d) + (row.company ? `<div class="cell-sub">${esc(row.company)}</div>` : '') : d },
          { data: 'phone', title: 'Phone', render: (d, t) => t === 'display' ? esc(d || '') : d },
          { data: 'customerType', title: 'Type', render: (d, t) => t === 'display' ? '<span class="type-chip">' + esc(d || 'Retail') + '</span>' : d },
          { data: 'category', title: 'Group', render: (d, t) => t === 'display' ? esc(d || '') : d },
          {
            data: 'loyaltyPoints',
            title: '🎁 Loyalty Points',
            render: (d, t) => {
              if (t !== 'display') return d || 0;
              const pts = Number(d || 0);
              return '<span style="background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; font-weight:700; padding:2px 8px; border-radius:6px; font-size:12px;">🎁 ' + pts + ' pts (' + money(pts) + ')</span>';
            }
          },
          {
            data: 'amount',
            title: 'Balance (Dues)',
            render: (d, t, row) => {
              if (t !== 'display') return d;
              const amt = Number(d || 0);
              if (amt > 0) {
                return `<div style="display:inline-flex; align-items:center; gap:6px;">
                  <span style="background:#fee2e2; color:#b91c1c; font-weight:700; padding:2px 7px; border-radius:6px; font-size:12px;">${money(amt)}</span>
                  <button class="action-icon dues-btn" data-action="collect" title="Collect Dues" style="color:#16a34a; background:#dcfce7; border:1px solid #86efac; border-radius:4px; font-size:11px; padding:2px 6px; cursor:pointer;"><i class="fas fa-hand-holding-dollar"></i> Wasooli</button>
                </div>`;
              }
              return `<span style="color:#16a34a; font-weight:600; font-size:12px;">₹0.00 (Chukta)</span>`;
            }
          },
          { data: 'active', title: 'Active', render: (d, t, row) => t === 'display' ? `<input type="checkbox" ${d ? 'checked' : ''} class="toggle" onchange="toggleActive('${row.id}', this.checked ? 1 : 0)">` : d },
          { data: 'createdAt', title: 'Created', render: (d, t) => t === 'display' ? formatDateForDisplay(d) : d },
          {
            data: null,
            title: 'Actions',
            orderable: false,
            render: (d, t, row) => {
              const collectBtn = Number(row.amount || 0) > 0 ? `<button class="action-icon dues-icon" data-action="collect" title="Collect Dues" style="color:#16a34a;"><i class="fas fa-hand-holding-dollar"></i></button>` : '';
              return `<button class="action-icon" data-action="view" title="View"><i class="fas fa-eye"></i></button><button class="action-icon edit-icon" data-action="edit" title="Edit"><i class="fas fa-edit"></i></button>${collectBtn}` + (role === 'Admin' ? `<button class="action-icon delete-icon" data-action="delete" title="Delete"><i class="fas fa-trash"></i></button>` : '');
            }
          }
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
    $('#recordsTable').off('click', '.action-icon, .dues-btn').on('click', '.action-icon, .dues-btn', function () {
      const id = table.row($(this).parents('tr')).data().id;
      const act = $(this).data('action');
      if (act === 'view') setViewCust(byId[id]);
      else if (act === 'edit') openEdit(id);
      else if (act === 'collect') {
        setCollectTargetCust(byId[id]);
        setShowCollectModal(true);
      }
      else handleDelete(byId[id]);
    });
  }, [loading, records, role, activeTab]);

  useEffect(() => () => {
    const ext = $.fn.dataTable.ext.search;
    const i = ext.indexOf(searchFnRef.current); if (i !== -1) ext.splice(i, 1);
    if (tableInstanceRef.current) { try { tableInstanceRef.current.destroy(); tableInstanceRef.current = null; } catch (e) { } }
  }, []);

  const applyFilters = () => {
    if (!tableInstanceRef.current) return;
    const dt = tableInstanceRef.current;
    const ext = $.fn.dataTable.ext.search;
    const prev = ext.indexOf(searchFnRef.current); if (prev !== -1) ext.splice(prev, 1);
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
        <div>
          <h2><i className="fas fa-address-book"></i> Customers &amp; Khata</h2>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Manage regular customers, track credit balances, and collect dues via Cash or Online UPI
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <RefreshBtn onClick={reload} />
          <button
            className="btn btn-success"
            style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }}
            onClick={() => { setCollectTargetCust(null); setShowCollectModal(true); }}
          >
            <i className="fas fa-hand-holding-dollar"></i> Collect Dues
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { setEditingId(null); setShowModal(true); }}
          >
            <i className="fas fa-plus"></i> Add Customer
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'customers' ? '3px solid #16a34a' : '3px solid transparent',
            background: 'none',
            fontWeight: activeTab === 'customers' ? 700 : 500,
            color: activeTab === 'customers' ? '#16a34a' : '#64748b',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <i className="fas fa-users"></i> All Customers ({records.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dues_history')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'dues_history' ? '3px solid #16a34a' : '3px solid transparent',
            background: 'none',
            fontWeight: activeTab === 'dues_history' ? 700 : 500,
            color: activeTab === 'dues_history' ? '#16a34a' : '#64748b',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <i className="fas fa-receipt"></i> Dues Collection Register ({duesCollections.length})
        </button>
      </div>

      {activeTab === 'customers' && (
        <>
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
            {records.length > 0 && (
              <SummaryBar
                items={[
                  { label: 'Customers', value: records.length },
                  { label: 'Active', value: records.filter(r => r.active).length },
                  {
                    label: 'Total Market Dues',
                    value: money(totalMarketDues),
                    style: { color: totalMarketDues > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }
                  }
                ]}
              />
            )}
          </div>
        </>
      )}

      {/* Dues Collection History Tab */}
      {activeTab === 'dues_history' && (
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
              <i className="fas fa-receipt" style={{ color: '#16a34a' }}></i> Recent Dues Collections
            </h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Total Recovered: <strong>{money(duesCollections.reduce((s, d) => s + (Number(d.amount) || 0), 0))}</strong>
            </span>
          </div>
          {duesCollections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <i className="fas fa-hand-holding-dollar" style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.5 }}></i>
              <div>No dues collections recorded yet. Click "Collect Dues" to accept customer payment.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="display" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Date</th>
                    <th style={{ padding: '10px' }}>Customer</th>
                    <th style={{ padding: '10px' }}>Phone</th>
                    <th style={{ padding: '10px' }}>Amount Received</th>
                    <th style={{ padding: '10px' }}>Mode</th>
                    <th style={{ padding: '10px' }}>Remaining Balance</th>
                    <th style={{ padding: '10px' }}>Note / Ref</th>
                    <th style={{ padding: '10px' }}>Collected By</th>
                  </tr>
                </thead>
                <tbody>
                  {duesCollections.map(dc => (
                    <tr key={dc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px' }}>{formatDateForDisplay(dc.createdAt || dc.date)}</td>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{dc.customerName}</td>
                      <td style={{ padding: '10px', color: '#64748b' }}>{dc.customerPhone || '-'}</td>
                      <td style={{ padding: '10px', fontWeight: 700, color: '#16a34a' }}>{money(dc.amount)}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: dc.paymentMode === 'Cash' ? '#dcfce7' : '#e0f2fe',
                          color: dc.paymentMode === 'Cash' ? '#15803d' : '#0369a1'
                        }}>
                          {dc.paymentMode === 'Cash' ? '💵 Cash (Drawer)' : '📱 Online UPI'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontWeight: 600, color: Number(dc.remainingBalance) > 0 ? '#dc2626' : '#16a34a' }}>
                        {money(dc.remainingBalance)}
                      </td>
                      <td style={{ padding: '10px', color: '#64748b' }}>{dc.note || '-'}</td>
                      <td style={{ padding: '10px', color: '#64748b' }}>{dc.collectedBy || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Collect Dues Modal */}
      {showCollectModal && (
        <CollectDuesModal
          customer={collectTargetCust}
          customers={records}
          user={user}
          onClose={() => { setShowCollectModal(false); setCollectTargetCust(null); }}
          onCollected={() => reload()}
        />
      )}

      {viewCust && <CustomerHubModal customer={viewCust} onClose={() => setViewCust(null)} />}
      {showModal && <RecordModal record={byId[editingId]} onClose={() => { setShowModal(false); setEditingId(null); }} onSave={handleSave} />}
    </div>
  );
}
