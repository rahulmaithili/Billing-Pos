function LogsView() {
      const { loading, data } = useFetch(() => fbGetLogs(), []);
      const logs = useMemo(() => (data && data.success ? data.data : []), [data]);
      return (
        <div className="data-section">
          <div className="section-header"><h2><i className="fas fa-history"></i> Activity Logs</h2></div>
          {loading ? <TableSkeleton rows={6} columns={4} /> : (
            <div className="about-table-wrapper">
              <table className="about-roles-table">
                <thead><tr><th>Action</th><th>Detail</th><th>User</th><th>When</th></tr></thead>
                <tbody>
                  {logs.length === 0 ? <tr><td colSpan="4" style={{ textAlign: 'center', color: '#999' }}>No activity yet.</td></tr>
                    : logs.map(l => <tr key={l.id}><td>{l.action}</td><td>{l.detail}</td><td>{l.user}</td><td>{formatDateForDisplay(l.ts)}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    // --- Supplier Modal ---
    function SupplierModal({ editItem, onClose, onSave }) {
      const [f, setF] = useState({ name: editItem?.name || '', contact: editItem?.contact || '', phone: editItem?.phone || '', email: editItem?.email || '', address: editItem?.address || '', terms: editItem?.terms || '', openingBalance: editItem?.openingBalance ?? '', notes: editItem?.notes || '' });
      const [saving, setSaving] = useState(false);
      const upd = (k, v) => setF(p => ({ ...p, [k]: v }));
      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fas fa-truck-field"></i> {editItem ? 'Edit' : 'Add'} Supplier</h3><button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button></div>
            <div className="modal-body">
              <form onSubmit={(e) => { e.preventDefault(); setSaving(true); onSave({ ...f, openingBalance: Number(f.openingBalance) || 0 }); }}>
                <div className="form-grid">
                  <div className="form-group"><label>Supplier Name *</label><input type="text" value={f.name} onChange={(e) => upd('name', e.target.value)} required /></div>
                  <div className="form-group"><label>Contact Person</label><input type="text" value={f.contact} onChange={(e) => upd('contact', e.target.value)} /></div>
                  <div className="form-group"><label>Phone</label><input type="text" value={f.phone} onChange={(e) => upd('phone', e.target.value)} /></div>
                  <div className="form-group"><label>Email</label><input type="email" value={f.email} onChange={(e) => upd('email', e.target.value)} /></div>
                  <div className="form-group"><label>Payment Terms</label><input type="text" placeholder="Net 30, COD..." value={f.terms} onChange={(e) => upd('terms', e.target.value)} /></div>
                  <div className="form-group"><label>Opening Balance (payable)</label><input type="number" step="0.01" value={f.openingBalance} onChange={(e) => upd('openingBalance', e.target.value)} /></div>
                </div>
                <div className="form-group"><label>Address</label><textarea rows="2" value={f.address} onChange={(e) => upd('address', e.target.value)}></textarea></div>
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

    // --- Suppliers View (vendor directory) ---
