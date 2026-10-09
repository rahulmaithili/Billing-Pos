// --- Enhanced Categories Management View (Full Beverage & Cafe Catalog Support) ---
function CategoriesView({ user, role, setActiveMenu }) {
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey(k => k + 1);

  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [formData, setFormData] = useState({ name: '', icon: 'fa-mug-hot', description: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'has_products' | 'empty'
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'products' | 'newest'
  const [saving, setSaving] = useState(false);
  const [viewProductsCat, setViewProductsCat] = useState(null);

  const { loading: loadingCats, data: catsData } = useFetch(() => fbGetCategories(), [reloadKey]);
  const categories = useMemo(() => (catsData && catsData.success ? catsData.data : []), [catsData]);

  const { loading: loadingProds, data: prodsData } = useFetch(() => fbGetProducts(), [reloadKey]);
  const products = useMemo(() => (prodsData && prodsData.success ? prodsData.data : []), [prodsData]);

  // Map products per category
  const productsByCat = useMemo(() => {
    const map = {};
    products.forEach(p => {
      const c = p.category ? String(p.category).trim() : 'Uncategorized';
      if (!map[c]) map[c] = [];
      map[c].push(p);
    });
    return map;
  }, [products]);

  // Uncategorized products count
  const uncategorizedCount = useMemo(() => {
    return products.filter(p => !p.category || !String(p.category).trim()).length;
  }, [products]);

  // Filter & sort categories
  const filteredCategories = useMemo(() => {
    let list = categories.filter(c => {
      const count = (productsByCat[c.name] || []).length;
      if (filterType === 'has_products' && count === 0) return false;
      if (filterType === 'empty' && count > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const nm = String(c.name || '').toLowerCase();
        const desc = String(c.description || '').toLowerCase();
        return nm.includes(q) || desc.includes(q);
      }
      return true;
    });

    if (sortBy === 'name') {
      list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    } else if (sortBy === 'products') {
      list.sort((a, b) => ((productsByCat[b.name] || []).length) - ((productsByCat[a.name] || []).length));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [categories, filterType, searchQuery, sortBy, productsByCat]);

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
      Swal.fire({ icon: 'success', title: 'Category Updated', text: `"${nm}" has been updated.`, timer: 1400, showConfirmButton: false });
    } else {
      const res = await fbAddCategory({ name: nm, icon: formData.icon, description: formData.description }, user);
      setSaving(false);
      if (!res.success) {
        Swal.fire({ icon: 'error', title: 'Failed to Add', text: res.message || 'Could not add category.' });
        return;
      }
      Swal.fire({ icon: 'success', title: 'Category Created', text: `Category "${nm}" is ready for products & POS menu!`, timer: 1400, showConfirmButton: false });
    }

    setShowModal(false);
    reload();
  };

  const handleDelete = async (cat) => {
    const assigned = (productsByCat[cat.name] || []).length;
    let warningHtml = `Are you sure you want to delete category <strong>"${cat.name}"</strong>?`;
    if (assigned > 0) {
      warningHtml += `<br><br><span style="color: #ea4335; font-size: 13px;">⚠️ Warning: ${assigned} drink(s) are currently assigned to this category.</span>`;
    }

    const confirm = await Swal.fire({
      title: 'Delete Category?',
      html: warningHtml,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea4335',
      confirmButtonText: 'Yes, delete it'
    });

    if (!confirm.isConfirmed) return;

    const res = await fbDeleteCategory(cat.id, cat.name, user);
    if (res.success) {
      Swal.fire({ icon: 'success', title: 'Deleted', text: `Category "${cat.name}" removed.`, timer: 1400, showConfirmButton: false });
      reload();
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Could not delete category.' });
    }
  };

  const handleSeedBeverage = async () => {
    const confirm = await Swal.fire({
      title: 'Seed Beverage Categories?',
      text: 'This will automatically add standard Cafe & Drink categories (Boba Milk Tea, Coffee, Fruit Tea, Frappes, Bakery...) to your menu catalog.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      confirmButtonText: 'Yes, Add Categories'
    });

    if (!confirm.isConfirmed) return;

    if (typeof fbSeedBeverageCategories === 'function') {
      const res = await fbSeedBeverageCategories(user);
      if (res.success) {
        Swal.fire({ icon: 'success', title: 'Categories Seeded!', text: res.message, timer: 1800, showConfirmButton: false });
        reload();
      } else {
        Swal.fire({ icon: 'error', title: 'Seeding Error', text: res.message });
      }
    }
  };

  const iconOptions = [
    { label: 'Boba & Milk Tea', icon: 'fa-mug-hot' },
    { label: 'Hot Coffee / Espresso', icon: 'fa-coffee' },
    { label: 'Cold Brew / Frappe', icon: 'fa-blender' },
    { label: 'Fruit Tea / Citrus', icon: 'fa-lemon' },
    { label: 'Soft Drink / Soda', icon: 'fa-bottle-water' },
    { label: 'Dessert / Ice Cream', icon: 'fa-ice-cream' },
    { label: 'Bakery & Cookies', icon: 'fa-cookie' },
    { label: 'Cake & Pastries', icon: 'fa-cake-candles' },
    { label: 'Burgers & Fast Food', icon: 'fa-burger' },
    { label: 'Pizza & Snacks', icon: 'fa-pizza-slice' },
    { label: 'Combos & Groups', icon: 'fa-layer-group' },
    { label: 'General / Tag', icon: 'fa-tag' }
  ];

  const getCatColor = (icon = '') => {
    if (icon.includes('mug') || icon.includes('tea')) return { bg: '#e0f2fe', color: '#0284c7' };
    if (icon.includes('coffee')) return { bg: '#fef3c7', color: '#b45309' };
    if (icon.includes('blender') || icon.includes('ice')) return { bg: '#fce7f3', color: '#be185d' };
    if (icon.includes('lemon')) return { bg: '#ecfdf5', color: '#059669' };
    if (icon.includes('cookie') || icon.includes('cake')) return { bg: '#fff7ed', color: '#ea580c' };
    return { bg: '#f1f5f9', color: '#475569' };
  };

  const activeInPosCount = categories.filter(c => (productsByCat[c.name] || []).length > 0).length;

  return (
    <div className="data-section">
      {/* Header */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div className="dash-breadcrumb" style={{ margin: '0 0 6px' }}>
            <span><i className="fas fa-layer-group" style={{ color: 'var(--navy-accent)' }}></i> <strong>Categories</strong></span>
            <span>/</span>
            <span>Home</span>
            <span>/</span>
            <span>Menu Catalog</span>
            <span>/</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Categories</span>
          </div>
          <h2 style={{ margin: 0, fontSize: 20 }}>
            <i className="fas fa-layer-group" style={{ color: 'var(--navy-accent)', marginRight: 10 }}></i>
            Categories Management
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Organize store drinks &amp; menu items into clean categories for POS Billing Terminal and Storefront catalog
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSeedBeverage}
            title="Load standard cafe & drink categories"
            style={{ fontWeight: 600, padding: '7px 14px', fontSize: 13 }}
          >
            <i className="fas fa-magic" style={{ color: '#8b5cf6', marginRight: 6 }}></i>
            Seed Beverage Categories
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAddModal}
            style={{ fontWeight: 700, padding: '7px 16px', fontSize: 13 }}
          >
            <i className="fas fa-plus"></i> + Add Category
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={reload}
            title="Refresh Categories"
          >
            <i className="fas fa-rotate"></i>
          </button>
        </div>
      </div>

      {/* 4 KPI Stats Cards Bar */}
      <div className="dash-stats-grid" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {/* Total Categories */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <i className="fas fa-layer-group"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{categories.length}</div>
            <div className="stat-label">Total Categories</div>
          </div>
        </div>

        {/* Products Assigned */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <i className="fas fa-mug-hot"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Total Products Assigned</div>
          </div>
        </div>

        {/* Live in POS */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            <i className="fas fa-cash-register"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{activeInPosCount}</div>
            <div className="stat-label">Categories Live in POS</div>
          </div>
        </div>

        {/* Uncategorized Drinks */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: uncategorizedCount > 0 ? '#fee2e2' : '#f1f5f9', color: uncategorizedCount > 0 ? '#dc2626' : '#64748b' }}>
            <i className="fas fa-circle-question"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{uncategorizedCount}</div>
            <div className="stat-label">Uncategorized Drinks</div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filter Pills & Sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8', fontSize: 13 }}></i>
          <input
            type="text"
            placeholder="Search categories by name or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: 34, paddingRight: 12, height: 36, borderRadius: 'var(--r-sm, 8px)', border: '1px solid #cbd5e1', fontSize: 13 }}
          />
        </div>

        {/* Filter Pills & Sorting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: 3, borderRadius: 8 }}>
            <button
              type="button"
              className={`dash-filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
              style={{ border: 'none', padding: '5px 12px', fontSize: 12 }}
            >
              All ({categories.length})
            </button>
            <button
              type="button"
              className={`dash-filter-btn ${filterType === 'has_products' ? 'active' : ''}`}
              onClick={() => setFilterType('has_products')}
              style={{ border: 'none', padding: '5px 12px', fontSize: 12 }}
            >
              With Drinks ({activeInPosCount})
            </button>
            <button
              type="button"
              className={`dash-filter-btn ${filterType === 'empty' ? 'active' : ''}`}
              onClick={() => setFilterType('empty')}
              style={{ border: 'none', padding: '5px 12px', fontSize: 12 }}
            >
              Empty ({categories.length - activeInPosCount})
            </button>
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ height: 36, padding: '4px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5, background: '#fff', fontWeight: 600, color: '#334155' }}
          >
            <option value="name">Sort: Name (A-Z)</option>
            <option value="products">Sort: Most Products</option>
            <option value="newest">Sort: Recently Added</option>
          </select>
        </div>
      </div>

      {/* Categories Grid / Cards List */}
      {loadingCats ? (
        <TableSkeleton rows={4} columns={3} />
      ) : filteredCategories.length === 0 ? (
        <div style={{ background: '#ffffff', borderRadius: 'var(--r-md, 12px)', border: '1px solid #e2e8f0', padding: '48px 20px', textAlign: 'center' }}>
          <i className="fas fa-folder-open" style={{ fontSize: 44, color: '#cbd5e1', marginBottom: 12, display: 'block' }}></i>
          <h3 style={{ margin: '0 0 6px', color: '#334155', fontSize: 17 }}>No Categories Match Your Filter</h3>
          <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 13 }}>Create a new category or click below to seed standard beverage catalog sections.</p>
          <div style={{ display: 'inline-flex', gap: 10 }}>
            <button type="button" className="btn btn-primary" onClick={openAddModal}>
              <i className="fas fa-plus"></i> Create Category
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleSeedBeverage}>
              <i className="fas fa-magic"></i> Seed Cafe Categories
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
          {filteredCategories.map(cat => {
            const catProds = productsByCat[cat.name] || [];
            const count = catProds.length;
            const iconClass = cat.icon || 'fa-tag';
            const theme = getCatColor(iconClass);

            return (
              <div
                key={cat.id}
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--r-md, 12px)',
                  border: '1.5px solid #e2e8f0',
                  padding: 18,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all .2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 'var(--r-md, 12px)', background: theme.bg, color: theme.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      <i className={`fas ${iconClass}`}></i>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewProductsCat(cat)}
                      style={{
                        background: count > 0 ? '#dcfce7' : '#f1f5f9',
                        color: count > 0 ? '#15803d' : '#64748b',
                        border: `1px solid ${count > 0 ? '#86efac' : '#e2e8f0'}`,
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 'var(--r-pill, 999px)',
                        cursor: count > 0 ? 'pointer' : 'default',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      title={count > 0 ? 'Click to view all products in this category' : 'No products assigned yet'}
                    >
                      <i className="fas fa-mug-hot" style={{ fontSize: 11 }}></i>
                      <span>{count} {count === 1 ? 'Product' : 'Products'}</span>
                    </button>
                  </div>

                  <h3 style={{ margin: '0 0 4px', fontSize: 16.5, color: '#0f172a', fontWeight: 800 }}>{cat.name}</h3>

                  <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#64748b', lineHeight: 1.4, minHeight: 34 }}>
                    {cat.description || 'Standard menu section for beverage items & add-ons.'}
                  </p>

                  {/* Drink Sample Pills */}
                  {count > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                      {catProds.slice(0, 3).map(p => (
                        <span key={p.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                          {p.name}
                        </span>
                      ))}
                      {count > 3 && (
                        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, alignSelf: 'center' }}>
                          +{count - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Created: {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : 'Active'}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setViewProductsCat(cat)}
                    style={{ padding: '5px 12px', fontSize: 12, background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, fontWeight: 700 }}
                    title="View products assigned to this category"
                  >
                    <i className="fas fa-eye" style={{ marginRight: 4 }}></i> View ({count})
                  </button>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => openEditModal(cat)}
                      title="Edit Category"
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
              </div>
            );
          })}
        </div>
      )}

      {/* --- Category Products Modal (Click on View or Count) --- */}
      {viewProductsCat && (
        <CategoryProductsModal
          category={viewProductsCat}
          products={productsByCat[viewProductsCat.name] || []}
          onClose={() => setViewProductsCat(null)}
          onGoToProducts={() => {
            setViewProductsCat(null);
            if (setActiveMenu) setActiveMenu('products');
          }}
        />
      )}

      {/* --- Add / Edit Category Modal --- */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
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
                    placeholder="e.g. Milk Tea & Boba, Cold Brew, Fruit Teas"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--r-sm, 8px)', border: '1.5px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Category Icon
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxHeight: 180, overflowY: 'auto', padding: 2 }}>
                    {iconOptions.map(opt => (
                      <button
                        key={opt.icon + opt.label}
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
                        <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{opt.label}</span>
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
                    placeholder="Brief description shoppers read on the menu"
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

// --- Category Products Modal (List of items in this category) ---
function CategoryProductsModal({ category, products, onClose, onGoToProducts }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className={`fas ${category.icon || 'fa-tag'}`} style={{ marginRight: 8, color: 'var(--navy-accent)' }}></i>
            Products in "{category.name}" ({products.length})
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body" style={{ padding: 16 }}>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 16px', color: '#94a3b8' }}>
              <i className="fas fa-mug-saucer" style={{ fontSize: 32, color: '#cbd5e1', marginBottom: 8, display: 'block' }}></i>
              No products are currently assigned to this category.
            </div>
          ) : (
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table className="dash-attention-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Code / SKU</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const price = money(p.base_price != null ? p.base_price : p.price || 0);
                    const isAvail = p.is_available !== false && p.status !== 'sold_out';
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {p.imageUrl || p.image_url ? (
                              <img src={p.imageUrl || p.image_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                <i className="fas fa-mug-hot"></i>
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{p.name}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', color: '#0284c7', background: '#f0f9ff', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                            #{p.sku || p.code || 'DRK'}
                          </span>
                        </td>
                        <td>
                          <strong>{price}</strong>
                        </td>
                        <td>
                          <span style={{ background: isAvail ? '#dcfce7' : '#fee2e2', color: isAvail ? '#15803d' : '#dc2626', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                            {isAvail ? 'Available' : 'Sold Out'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onGoToProducts}
          >
            <i className="fas fa-arrow-up-right-from-square"></i> Open Products Catalog
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
