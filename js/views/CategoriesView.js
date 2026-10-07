    // --- Categories Management View ---
    function CategoriesView({ user, role }) {
      const [reloadKey, setReloadKey] = useState(0);
      const [showModal, setShowModal] = useState(false);
      const [editingCat, setEditingCat] = useState(null);
      const [formData, setFormData] = useState({ name: '', icon: 'fa-tag', description: '' });
      const [searchQuery, setSearchQuery] = useState('');
      const [saving, setSaving] = useState(false);

      const { loading: loadingCats, data: catsData } = useFetch(() => fbGetCategories(), [reloadKey]);
      const categories = useMemo(() => (catsData && catsData.success ? catsData.data : []), [catsData]);

      const { loading: loadingProds, data: prodsData } = useFetch(() => fbGetProducts(), [reloadKey]);
      const products = useMemo(() => (prodsData && prodsData.success ? prodsData.data : []), [prodsData]);

      // Count products per category
      const productCounts = useMemo(() => {
        const counts = {};
        products.forEach(p => {
          const c = p.category ? String(p.category).trim() : 'Uncategorized';
          counts[c] = (counts[c] || 0) + 1;
        });
        return counts;
      }, [products]);

      // Filter categories by search
      const filteredCategories = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter(c => (c.name && c.name.toLowerCase().includes(q)) || (c.description && c.description.toLowerCase().includes(q)));
      }, [categories, searchQuery]);

      const openAddModal = () => {
        setEditingCat(null);
        setFormData({ name: '', icon: 'fa-mug-hot', description: '' });
        setShowModal(true);
      };

      const openEditModal = (cat) => {
        setEditingCat(cat);
        setFormData({ name: cat.name || '', icon: cat.icon || 'fa-tag', description: cat.description || '' });
        setShowModal(true);
      };

      const handleSave = async (e) => {
        e.preventDefault();
        const nm = formData.name.trim();
        if (!nm) {
          Swal.fire({ icon: 'warning', title: 'Category Name Required', text: 'Please enter a name for the category.' });
          return;
        }

        setSaving(true);
        if (editingCat) {
          const res = await fbUpdateCategory(editingCat.id, { name: nm, icon: formData.icon, description: formData.description }, user);
          setSaving(false);
          if (!res.success) {
            Swal.fire({ icon: 'error', title: 'Update Failed', text: res.message || 'Could not update category.' });
            return;
          }
          Swal.fire({ icon: 'success', title: 'Category Updated', text: `"${nm}" has been updated.`, timer: 1500, showConfirmButton: false });
        } else {
          const res = await fbAddCategory(nm, user);
          setSaving(false);
          if (!res.success) {
            Swal.fire({ icon: 'error', title: 'Failed to Add', text: res.message || 'Could not add category.' });
            return;
          }
          Swal.fire({ icon: 'success', title: 'Category Created', text: `Category "${nm}" is ready for products & POS menu!`, timer: 1500, showConfirmButton: false });
        }

        setShowModal(false);
        setReloadKey(k => k + 1);
      };

      const handleDelete = async (cat) => {
        const count = productCounts[cat.name] || 0;
        let warningHtml = `Are you sure you want to delete category <strong>"${cat.name}"</strong>?`;
        if (count > 0) {
          warningHtml += `<br><br><span style="color: #ea4335; font-size: 13px;">⚠️ Note: ${count} product(s) are currently assigned to this category.</span>`;
        }

        const confirm = await Swal.fire({
          title: 'Delete Category?',
          html: warningHtml,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ea4335',
          confirmButtonText: 'Yes, delete it'
        });

        if (confirm.isConfirmed) {
          const res = await fbDeleteCategory(cat.id, cat.name, user);
          if (res.success) {
            Swal.fire({ icon: 'success', title: 'Deleted', text: `Category "${cat.name}" removed.`, timer: 1400, showConfirmButton: false });
            setReloadKey(k => k + 1);
          } else {
            Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Could not delete category.' });
          }
        }
      };

      const iconOptions = [
        { label: 'Hot Coffee', icon: 'fa-mug-hot' },
        { label: 'Cold Drink / Juice', icon: 'fa-blender' },
        { label: 'Burger & Snacks', icon: 'fa-burger' },
        { label: 'Pizza & Meals', icon: 'fa-pizza-slice' },
        { label: 'Bakery & Cake', icon: 'fa-cake-candles' },
        { label: 'Ice Cream & Dessert', icon: 'fa-ice-cream' },
        { label: 'Beverage / Water', icon: 'fa-bottle-water' },
        { label: 'General / Tag', icon: 'fa-tag' },
        { label: 'Box / Package', icon: 'fa-box' }
      ];

      return (
        <div className="data-section">
          {/* Header */}
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2><i className="fas fa-layer-group" style={{ color: 'var(--navy-accent)', marginRight: 10 }}></i> Categories Management</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Create and organize store product categories for the POS Billing Terminal and Catalog</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setReloadKey(k => k + 1)} title="Refresh Categories">
                <i className="fas fa-rotate"></i> Refresh
              </button>
              <button type="button" className="btn btn-primary" onClick={openAddModal} style={{ fontWeight: 700 }}>
                <i className="fas fa-plus"></i> + Add Category
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="dash-stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}><i className="fas fa-layer-group"></i></div>
              <div className="stat-content">
                <div className="stat-value">{categories.length}</div>
                <div className="stat-label">Total Categories</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><i className="fas fa-box-open"></i></div>
              <div className="stat-content">
                <div className="stat-value">{products.length}</div>
                <div className="stat-label">Products Assigned</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}><i className="fas fa-cash-register"></i></div>
              <div className="stat-content">
                <div className="stat-value">{categories.length > 0 ? 'Live in POS' : 'No Categories'}</div>
                <div className="stat-label">POS Menu Status</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8', fontSize: 14 }}></i>
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: 36, paddingRight: 12, height: 38, borderRadius: 'var(--r-sm, 8px)', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Showing <strong>{filteredCategories.length}</strong> of <strong>{categories.length}</strong> categories
            </div>
          </div>

          {/* Categories Grid / List */}
          {loadingCats ? (
            <TableSkeleton rows={4} columns={4} />
          ) : filteredCategories.length === 0 ? (
            <div style={{ background: '#ffffff', borderRadius: 'var(--r-md, 12px)', border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
              <i className="fas fa-folder-open" style={{ fontSize: 44, color: '#cbd5e1', marginBottom: 12, display: 'block' }}></i>
              <h3 style={{ margin: '0 0 6px', color: '#334155', fontSize: 17 }}>No Categories Found</h3>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 13 }}>Create your first category to group drinks, food items, and retail products.</p>
              <button type="button" className="btn btn-primary" onClick={openAddModal}>
                <i className="fas fa-plus"></i> Create Category
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filteredCategories.map(cat => {
                const count = productCounts[cat.name] || 0;
                const iconClass = cat.icon || 'fa-tag';
                return (
                  <div
                    key={cat.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: 'var(--r-md, 12px)',
                      border: '1.5px solid #e2e8f0',
                      padding: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all .2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md, 12px)', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                          <i className={`fas ${iconClass}`}></i>
                        </div>
                        <span style={{ background: count > 0 ? '#dcfce7' : '#f1f5f9', color: count > 0 ? '#15803d' : '#64748b', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r-pill, 999px)' }}>
                          {count} {count === 1 ? 'Product' : 'Products'}
                        </span>
                      </div>
                      <h3 style={{ margin: '0 0 4px', fontSize: 16, color: '#0f172a', fontWeight: 700 }}>{cat.name}</h3>
                      {cat.description && (
                        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#64748b', lineHeight: 1.4 }}>{cat.description}</p>
                      )}
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                        Created: {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : 'Active'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => openEditModal(cat)}
                        title="Edit Category Name & Icon"
                        style={{ padding: '5px 12px', fontSize: 12, background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: 6, fontWeight: 600 }}
                      >
                        <i className="fas fa-edit" style={{ marginRight: 4, color: '#0284c7' }}></i> Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => handleDelete(cat)}
                        title="Delete Category"
                        style={{ padding: '5px 12px', fontSize: 12, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontWeight: 600 }}
                      >
                        <i className="fas fa-trash" style={{ marginRight: 4 }}></i> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add / Edit Category Modal */}
          {showModal && (
            <div className="modal-backdrop" onClick={() => setShowModal(false)}>
              <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>
                    <i className="fas fa-layer-group" style={{ marginRight: 8, color: 'var(--navy-accent)' }}></i>
                    {editingCat ? 'Edit Category' : 'Create New Category'}
                  </h3>
                  <button type="button" className="modal-close-btn" onClick={() => setShowModal(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <form onSubmit={handleSave}>
                  <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                        Category Name <span style={{ color: '#ea4335' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="e.g. Hot Coffee, Cold Brew, Bakery, Snacks"
                        value={formData.name}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--r-sm, 8px)', border: '1.5px solid #cbd5e1', fontSize: 14 }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                        Category Icon
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {iconOptions.map(opt => (
                          <button
                            key={opt.icon}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, icon: opt.icon }))}
                            style={{
                              padding: '8px 6px',
                              borderRadius: 'var(--r-sm, 8px)',
                              border: formData.icon === opt.icon ? '2px solid var(--navy-accent)' : '1px solid #e2e8f0',
                              background: formData.icon === opt.icon ? '#e0f2fe' : '#ffffff',
                              color: formData.icon === opt.icon ? 'var(--navy-primary)' : '#475569',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 600
                            }}
                          >
                            <i className={`fas ${opt.icon}`} style={{ fontSize: 16 }}></i>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Brief note about this menu section"
                        value={formData.description}
                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--r-sm, 8px)', border: '1px solid #cbd5e1', fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid #e2e8f0' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-check"></i> {editingCat ? 'Save Changes' : 'Create Category'}</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    }
