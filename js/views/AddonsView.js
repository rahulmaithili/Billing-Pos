    // --- Packaging & Extra Surcharges View (Retail & Wholesale) ---
    function AddonsView({ user, role }) {
      const [addons, setAddons] = useState([]);
      const [loading, setLoading] = useState(false);
      const [editingAddon, setEditingAddon] = useState(null);
      const [showModal, setShowModal] = useState(false);
      const [searchQuery, setSearchQuery] = useState('');
      const [selectedCat, setSelectedCat] = useState('ALL');

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
        } else {
          Swal.fire({ icon: 'error', title: 'Save Failed', text: res.message || 'Could not save add-on.' });
        }
      };

      const handleDelete = async (a) => {
        const confirm = await Swal.fire({
          icon: 'warning',
          title: `Delete "${a.name}"?`,
          text: 'This will remove the packaging or service surcharge from POS checkout options.',
          showCancelButton: true,
          confirmButtonColor: '#ea4335',
          confirmButtonText: 'Yes, delete it'
        });
        if (!confirm.isConfirmed) return;
        await fbDeleteAddon(a.id, a.name, user);
        loadAddons();
      };

      const handleToggle = async (a) => {
        const nextState = a.is_available === false ? true : false;
        await fbSaveAddon(Object.assign({}, a, { is_available: nextState }), user);
        loadAddons();
      };

      // Filter addons by search and category
      const filteredAddons = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return addons.filter(a => {
          const matchCat = selectedCat === 'ALL' || (a.category && a.category === selectedCat);
          if (!matchCat) return false;
          if (!q) return true;
          return (a.name && a.name.toLowerCase().includes(q)) || (a.category && a.category.toLowerCase().includes(q));
        });
      }, [addons, searchQuery, selectedCat]);

      const inStockCount = useMemo(() => addons.filter(a => a.is_available !== false).length, [addons]);
      const outOfStockCount = addons.length - inStockCount;

      const categoryPills = ['ALL', 'Packaging', 'Freight & Delivery', 'Labour & Handling', 'Extra Service'];

      const getCategoryBadgeColor = (cat) => {
        switch (cat) {
          case 'Packaging': return { bg: '#e0f2fe', color: '#0284c7' };
          case 'Freight & Delivery': return { bg: '#fef3c7', color: '#b45309' };
          case 'Labour & Handling': return { bg: '#ede9fe', color: '#6d28d9' };
          case 'Extra Service': return { bg: '#ecfdf5', color: '#059669' };
          default: return { bg: '#f1f5f9', color: '#475569' };
        }
      };

      return (
        <div className="data-section">
          {loading && <TopLoadingBar />}

          {/* Section Header */}
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2><i className="fas fa-box-archive" style={{ color: 'var(--navy-accent)', marginRight: 10 }}></i> Packaging &amp; Extra Charges</h2>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                Packaging cartons, carry bags, wooden crates, delivery/freight fees, and labour handling charges.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={loadAddons} title="Reload Add-ons">
                <i className="fas fa-rotate"></i> Refresh
              </button>
              <button type="button" className="btn btn-primary" onClick={() => { setEditingAddon(null); setShowModal(true); }} style={{ fontWeight: 700 }}>
                <i className="fas fa-plus"></i> + Add Packaging / Surcharge
              </button>
            </div>
          </div>

          {/* KPI Stats Bar */}
          <div className="dash-stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}><i className="fas fa-cubes"></i></div>
              <div className="stat-content">
                <div className="stat-value">{addons.length}</div>
                <div className="stat-label">Total Packaging / Surcharges</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><i className="fas fa-circle-check"></i></div>
              <div className="stat-content">
                <div className="stat-value">{inStockCount}</div>
                <div className="stat-label">Available In Stock</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fee2e2', color: '#ea4335' }}><i className="fas fa-circle-xmark"></i></div>
              <div className="stat-content">
                <div className="stat-value">{outOfStockCount}</div>
                <div className="stat-label">Out of Stock</div>
              </div>
            </div>
          </div>

          {/* Search Bar & Category Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {categoryPills.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`pos-cat-pill ${selectedCat === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCat(cat)}
                  style={{ padding: '6px 14px', fontSize: 12.5 }}
                >
                  <i className={cat === 'ALL' ? 'fas fa-th-large' : 'fas fa-tag'}></i>
                  <span>{cat === 'ALL' ? 'All Add-ons' : cat}</span>
                  <span className="cat-pill-count">
                    {cat === 'ALL' ? addons.length : addons.filter(a => a.category === cat).length}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', minWidth: 240 }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8', fontSize: 13 }}></i>
              <input
                type="text"
                placeholder="Search add-on name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: 34, paddingRight: 12, height: 36, borderRadius: 'var(--r-sm, 8px)', border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>
          </div>

          {/* Premium Styled Table */}
          {filteredAddons.length === 0 ? (
            <div style={{ background: '#ffffff', borderRadius: 'var(--r-md, 12px)', border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
              <i className="fas fa-circle-plus" style={{ fontSize: 44, color: '#cbd5e1', marginBottom: 12, display: 'block' }}></i>
              <h3 style={{ margin: '0 0 6px', color: '#334155', fontSize: 17 }}>No Add-ons Found</h3>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 13 }}>
                No customizers match "{searchQuery || selectedCat}".
              </p>
              <button type="button" className="btn btn-primary" onClick={() => { setEditingAddon(null); setShowModal(true); }}>
                <i className="fas fa-plus"></i> Add New Add-on
              </button>
            </div>
          ) : (
            <div className="premium-table-wrap">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Add-on Name</th>
                    <th>Category</th>
                    <th>Extra Price</th>
                    <th>Stock Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAddons.map(a => {
                    const isAvailable = a.is_available !== false;
                    const catBadge = getCategoryBadgeColor(a.category);
                    return (
                      <tr key={a.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 'var(--r-sm, 8px)', background: '#f1f5f9', color: 'var(--navy-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                              <i className="fas fa-box"></i>
                            </div>
                            <div>
                              <strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>{a.name}</strong>
                              <small style={{ color: '#64748b', fontSize: 11 }}>ID: {a.id}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ background: catBadge.bg, color: catBadge.color, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--r-pill, 999px)' }}>
                            {a.category || 'Topping'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontSize: 14, color: 'var(--navy-primary)' }}>
                            +{money(a.price || 0)}
                          </strong>
                        </td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: isAvailable ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isAvailable ? '#bbf7d0' : '#fecaca'}`, padding: '4px 10px', borderRadius: 'var(--r-pill, 999px)' }}>
                            <label className="switch-pill" style={{ margin: 0, width: 34, height: 18, flexShrink: 0 }} title={isAvailable ? "Click to mark Out of Stock" : "Click to mark In Stock"}>
                              <input
                                type="checkbox"
                                checked={isAvailable}
                                onChange={() => handleToggle(a)}
                              />
                              <span className="switch-slider" style={{ backgroundColor: isAvailable ? '#16a34a' : '#cbd5e1' }}></span>
                            </label>
                            <span style={{ fontSize: 12, fontWeight: 700, color: isAvailable ? '#15803d' : '#dc2626' }}>
                              {isAvailable ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="table-action-group" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="table-btn-edit"
                              onClick={() => { setEditingAddon(a); setShowModal(true); }}
                              title="Edit Add-on"
                            >
                              <i className="fas fa-pen-to-square"></i> Edit
                            </button>
                            <button
                              type="button"
                              className="table-btn-delete"
                              onClick={() => handleDelete(a)}
                              title="Delete Add-on"
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Add / Edit Addon Modal */}
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
        <div className="modal-backdrop" onClick={onClose}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-circle-plus" style={{ marginRight: 8, color: 'var(--navy-accent)' }}></i> {addon ? 'Edit Drink Add-on' : 'Create New Add-on'}</h3>
              <button type="button" className="modal-close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); onSave(Object.assign({}, addon || {}, form)); }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Add-on / Topping Name <span style={{ color: '#ea4335' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. 5-Ply Packing Box, Wooden Crate, Express Delivery"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--r-sm, 8px)', border: '1.5px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Extra Charge / Price ({CFG.currency || '₹'}) <span style={{ color: '#ea4335' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--r-sm, 8px)', border: '1.5px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Customizer Category
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--r-sm, 8px)', border: '1.5px solid #cbd5e1', fontSize: 14 }}
                  >
                    <option value="Topping">Topping (Pearls, Popping Boba, Pudding)</option>
                    <option value="Jelly">Jelly (Coconut Jelly, Grass Jelly, Aloe)</option>
                    <option value="Foam">Cheese Foam / Whipped Cream</option>
                    <option value="Shot">Extra Espresso Shot / Flavor Syrup</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Availability Status
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: form.is_available ? '#f0fdf4' : '#fff1f2', border: `1.5px solid ${form.is_available ? '#86efac' : '#fecdd3'}`, padding: '10px 14px', borderRadius: 'var(--r-sm, 8px)' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: form.is_available ? '#166534' : '#be123c' }}>
                      {form.is_available ? 'Available In Stock (Active in POS)' : 'Out of Stock (Disabled in POS)'}
                    </span>
                    <label className="switch-pill" style={{ margin: 0, flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={form.is_available}
                        onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))}
                      />
                      <span className="switch-slider" style={{ backgroundColor: form.is_available ? '#16a34a' : '#cbd5e1' }}></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  <i className="fas fa-check"></i> {addon ? 'Save Changes' : 'Create Add-on'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
