function AddonsView({ user, role }) {
      const [addons, setAddons] = useState([]);
      const [loading, setLoading] = useState(false);
      const [editingAddon, setEditingAddon] = useState(null);
      const [showModal, setShowModal] = useState(false);

      const loadAddons = useCallback(async () => {
        setLoading(true);
        const res = await fbGetAddons();
        if (res.success) setAddons(res.data);
        setLoading(false);
      }, []);

      useEffect(() => { loadAddons(); }, [loadAddons]);

      const handleSave = async (data) => {
        const res = await fbSaveAddon(data, user);
        if (res.success) {
          setShowModal(false);
          setEditingAddon(null);
          loadAddons();
          Swal.fire({ icon: 'success', title: 'Add-on Saved', timer: 1400, showConfirmButton: false });
        }
      };

      const handleDelete = async (a) => {
        const confirm = await Swal.fire({
          icon: 'warning',
          title: 'Delete ' + a.name + '?',
          showCancelButton: true,
          confirmButtonColor: '#ea4335',
          confirmButtonText: 'Delete'
        });
        if (!confirm.isConfirmed) return;
        await fbDeleteAddon(a.id, a.name, user);
        loadAddons();
      };

      const handleToggle = async (a) => {
        await fbSaveAddon(Object.assign({}, a, { is_available: !a.is_available }), user);
        loadAddons();
      };

      return (
        <div className="data-section">
          {loading && <TopLoadingBar />}
          <div className="section-header">
            <div>
              <h2><i className="fas fa-circle-plus"></i> Drink Add-ons &amp; Customizations</h2>
              <div style={{ color: '#64748b', fontSize: '13px', marginTop: 4 }}>
                Boba pearls, popping pearls, jellies, pudding, and foam toppings.
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => { setEditingAddon(null); setShowModal(true); }}>
              <i className="fas fa-plus"></i> Add New Add-on
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Add-on Name</th>
                  <th>Category</th>
                  <th>Extra Price</th>
                  <th>In Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {addons.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.name}</strong></td>
                    <td><span className="tb-pill role">{a.category || 'Topping'}</span></td>
                    <td><strong style={{ color: 'var(--navy-primary)' }}>+${Number(a.price || 0).toFixed(2)}</strong></td>
                    <td>
                      <button type="button" className="act-tgl" onClick={() => handleToggle(a)}>
                        <span className="tgl"><input type="checkbox" checked={a.is_available !== false} readOnly /><span className="tgl-track"></span></span>
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="action-icon edit-icon" onClick={() => { setEditingAddon(a); setShowModal(true); }}><i className="fas fa-edit"></i></button>
                        <button className="action-icon delete-icon" onClick={() => handleDelete(a)}><i className="fas fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showModal && (
            <AddonModal
              addon={editingAddon}
              onClose={() => { setShowModal(false); setEditingAddon(null); }}
              onSave={handleSave}
            />
          )}
        </div>
      );
    }

    function AddonModal({ addon, onClose, onSave }) {
      const [form, setForm] = useState({
        name: addon ? addon.name : '',
        price: addon ? addon.price : 0.75,
        category: addon ? addon.category : 'Topping',
        is_available: addon ? addon.is_available !== false : true
      });

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-circle-plus"></i> {addon ? 'Edit Add-on' : 'Add New Topping'}</h3>
              <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <form onSubmit={e => { e.preventDefault(); onSave(Object.assign({}, addon || {}, form)); }}>
                <div className="form-group">
                  <label>Topping / Add-on Name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Brown Sugar Pearls" />
                </div>
                <div className="form-group">
                  <label>Extra Price ($)</label>
                  <input type="number" step="0.01" min="0" required value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    <option value="Topping">Topping (Pearls, Popping)</option>
                    <option value="Jelly">Jelly (Coconut, Grass, Aloe)</option>
                    <option value="Foam">Cheese Foam / Cream</option>
                    <option value="Shot">Extra Espresso / Syrup</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>In Stock</label>
                  <div><input type="checkbox" className="toggle" checked={form.is_available} onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))} /></div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary"><i className="fas fa-save"></i> Save</button>
                  <button type="button" className="btn btn-secondary" onClick={onClose}><i className="fas fa-times"></i> Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // --- Reports View ---
