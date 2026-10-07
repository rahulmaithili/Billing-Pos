// --- Products View V2 (Exact Match to Screenshots 2, 3 & 4) ---
function ProductsView({ user, role }) {
  const catOpts = useCategoryOpts();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pipeFilter, setPipeFilter] = useState('all'); // 'all' | 'sale' | 'sold_out' | 'popular' | 'archived'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allAddons, setAllAddons] = useState([]);
  const [qrProduct, setQrProduct] = useState(null);
  const [showBulkQr, setShowBulkQr] = useState(false);

  const { loading, data, err } = useFetch(() => Promise.all([
    fbGetProducts(),
    fbGetCategories(),
    fbGetAddons(),
    fbGetSales()
  ]), [reloadKey]);

  const rawProducts = useMemo(() => (data && data[0] && data[0].success ? data[0].data : []), [data]);
  const categories = useMemo(() => (data && data[1] && data[1].success ? data[1].data : []), [data]);
  const addons = useMemo(() => (data && data[2] && data[2].success ? data[2].data : []), [data]);
  const sales = useMemo(() => (data && data[3] && data[3].success ? data[3].data : []), [data]);

  const reload = () => setReloadKey(k => k + 1);

  // Sales per product in last 30 days
  const salesMap = useMemo(() => {
    const map = {};
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    sales.forEach(s => {
      const sTime = new Date(s.createdAt || s.date || 0).getTime();
      const in30 = sTime >= thirtyDaysAgo;
      (s.items || []).forEach(it => {
        const pId = it.productId || it.id;
        if (!map[pId]) map[pId] = { sold30: 0, lastDate: null };
        if (in30) map[pId].sold30 += (Number(it.qty) || 1);
        if (!map[pId].lastDate || sTime > new Date(map[pId].lastDate).getTime()) {
          map[pId].lastDate = s.createdAt || s.date;
        }
      });
    });
    return map;
  }, [sales]);

  // Derived products list
  const products = useMemo(() => {
    return rawProducts.map(p => {
      const isArchived = p.status === 'archived' || p.status === 'discontinued';
      const isAvailable = p.is_available !== false && p.status !== 'sold_out';
      const isPopular = p.is_popular === true || p.popular === true;
      const stats = salesMap[p.id] || { sold30: 0, lastDate: null };

      return {
        ...p,
        isArchived,
        isAvailable,
        isPopular,
        sold30: stats.sold30,
        lastDate: stats.lastDate,
        code: p.sku || p.code || ('DRK-' + (p.id ? p.id.slice(-3).toUpperCase() : '001')),
        basePrice: Number(p.base_price != null ? p.base_price : p.price || 0),
        sizes: p.sizes || [],
        offerSugar: p.has_sugar !== false && p.offerSugar !== false,
        offerIce: p.has_ice !== false && p.offerIce !== false,
        addonIds: p.addon_ids || p.addons || []
      };
    });
  }, [rawProducts, salesMap]);

  // Chevron counts
  const countAll = products.length;
  const countOnSale = products.filter(p => !p.isArchived && p.isAvailable).length;
  const countSoldOut = products.filter(p => !p.isArchived && !p.isAvailable).length;
  const countPopular = products.filter(p => !p.isArchived && p.isPopular).length;
  const countArchived = products.filter(p => p.isArchived).length;

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Pipe Filter
      if (pipeFilter === 'sale' && (p.isArchived || !p.isAvailable)) return false;
      if (pipeFilter === 'sold_out' && (p.isArchived || p.isAvailable)) return false;
      if (pipeFilter === 'popular' && (p.isArchived || !p.isPopular)) return false;
      if (pipeFilter === 'archived' && !p.isArchived) return false;

      // Category Filter
      if (selectedCategory && p.category !== selectedCategory) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const nm = String(p.name || '').toLowerCase();
        const cd = String(p.code || '').toLowerCase();
        const ct = String(p.category || '').toLowerCase();
        return nm.includes(q) || cd.includes(q) || ct.includes(q);
      }

      return true;
    });
  }, [products, pipeFilter, selectedCategory, searchQuery]);

  // Bulk selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Toggle handlers for switches in table
  const handleToggleAvailable = async (p) => {
    const next = !p.isAvailable;
    await fbUpdateProduct(p.id, { is_available: next, status: next ? 'active' : 'sold_out' }, user);
    reload();
  };

  const handleTogglePopular = async (p) => {
    const next = !p.isPopular;
    await fbUpdateProduct(p.id, { is_popular: next, popular: next }, user);
    reload();
  };

  const handleToggleActive = async (p) => {
    const nextStatus = p.isArchived ? 'active' : 'archived';
    await fbUpdateProduct(p.id, { status: nextStatus }, user);
    reload();
  };

  // Bulk action operations
  const handleBulkAvailable = async (val) => {
    if (!selectedIds.length) return;
    for (const id of selectedIds) {
      await fbUpdateProduct(id, { is_available: val, status: val ? 'active' : 'sold_out' }, user);
    }
    setSelectedIds([]);
    reload();
    Swal.fire({ icon: 'success', title: val ? 'Marked Available' : 'Marked Sold Out', timer: 1200, showConfirmButton: false });
  };

  const handleBulkPopular = async (val) => {
    if (!selectedIds.length) return;
    for (const id of selectedIds) {
      await fbUpdateProduct(id, { is_popular: val, popular: val }, user);
    }
    setSelectedIds([]);
    reload();
    Swal.fire({ icon: 'success', title: val ? 'Marked Popular' : 'Removed from Popular', timer: 1200, showConfirmButton: false });
  };

  const handleBulkArchive = async (val) => {
    if (!selectedIds.length) return;
    for (const id of selectedIds) {
      await fbUpdateProduct(id, { status: val ? 'archived' : 'active' }, user);
    }
    setSelectedIds([]);
    reload();
    Swal.fire({ icon: 'success', title: val ? 'Archived' : 'Restored', timer: 1200, showConfirmButton: false });
  };

  const handleExportSelected = () => {
    const exportList = filteredProducts.filter(p => selectedIds.includes(p.id));
    if (!exportList.length) return;
    const csvContent = "data:text/csv;charset=utf-8," +
      ["Name,Code,Category,Price,Available,Popular,Status"].concat(
        exportList.map(p => `"${p.name}","${p.code}","${p.category || ''}",${p.basePrice},${p.isAvailable},${p.isPopular},${p.status || 'active'}`)
      ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `products_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteProduct = async (p) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Delete Drink?',
      text: `Are you sure you want to permanently delete "${p.name}"?`,
      showCancelButton: true,
      confirmButtonColor: '#ea4335',
      confirmButtonText: 'Yes, Delete'
    });
    if (!confirm.isConfirmed) return;
    const res = await fbDeleteProduct(p.id, p.name, user);
    if (res.success) {
      reload();
      Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false });
    }
  };

  return (
    <div className="data-section" style={{ padding: '0 0 24px' }}>
      {loading && <TopLoadingBar />}

      {/* Breadcrumb & Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <div>
          <div className="dash-breadcrumb">
            <span><i className="fas fa-mug-hot" style={{ color: 'var(--navy-accent)' }}></i> <strong>Products</strong></span>
            <span>/</span>
            <span>Home</span>
            <span>/</span>
            <span>Menu</span>
            <span>/</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Products</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { setEditingProduct(null); setShowModal(true); }}
            style={{ fontWeight: 700, padding: '7px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <i className="fas fa-plus"></i> Add Drink
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowBulkQr(true)}
            style={{ fontWeight: 600, padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Print QR Labels for all products"
          >
            <i className="fas fa-qrcode"></i> Print All Labels
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={reload} title="Refresh catalog">
            <i className="fas fa-rotate"></i>
          </button>
        </div>
      </div>

      {/* Chevron Pipeline Tabs (Screenshot 2 Match) */}
      <div className="prod-pipeline-chevrons">
        <button
          type="button"
          className={`prod-chevron c-all ${pipeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setPipeFilter('all')}
        >
          ALL ({countAll})
        </button>
        <button
          type="button"
          className={`prod-chevron c-sale ${pipeFilter === 'sale' ? 'active' : ''}`}
          onClick={() => setPipeFilter('sale')}
        >
          ON SALE ({countOnSale})
        </button>
        <button
          type="button"
          className={`prod-chevron c-out ${pipeFilter === 'sold_out' ? 'active' : ''}`}
          onClick={() => setPipeFilter('sold_out')}
        >
          SOLD OUT ({countSoldOut})
        </button>
        <button
          type="button"
          className={`prod-chevron c-pop ${pipeFilter === 'popular' ? 'active' : ''}`}
          onClick={() => setPipeFilter('popular')}
        >
          POPULAR ({countPopular})
        </button>
        <button
          type="button"
          className={`prod-chevron c-arch ${pipeFilter === 'archived' ? 'active' : ''}`}
          onClick={() => setPipeFilter('archived')}
        >
          ARCHIVED ({countArchived})
        </button>
      </div>

      {/* Toolbar: Search, Category Picker, More Filters, Columns, Reset */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: 240, maxWidth: 360, flex: 1 }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8', fontSize: 12 }}></i>
            <input
              type="text"
              placeholder="Search drink, category, add-on..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: 30, paddingRight: 10, height: 34, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', color: '#334155' }}
          >
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <button type="button" className="btn btn-secondary btn-sm" style={{ height: 34, padding: '0 12px' }}>
            <i className="fas fa-sliders" style={{ marginRight: 4 }}></i> More Filters
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary btn-sm" style={{ height: 34 }}>
            <i className="fas fa-table-columns" style={{ marginRight: 4 }}></i> Columns
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ height: 34 }}
            onClick={() => { setSearchQuery(''); setSelectedCategory(''); setPipeFilter('all'); }}
          >
            <i className="fas fa-rotate-right" style={{ marginRight: 4 }}></i> Reset
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (Screenshot 2 Match) */}
      <div className="prod-bulk-bar">
        <div className="prod-bulk-actions">
          <input
            type="checkbox"
            checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
            onChange={handleSelectAll}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 600, color: '#475569', fontSize: 12 }}>{selectedIds.length} selected</span>

          <button type="button" className="prod-bulk-btn" onClick={() => handleBulkAvailable(false)} disabled={!selectedIds.length}>
            <i className="fas fa-ban" style={{ color: '#ef4444', marginRight: 4 }}></i> Sold out
          </button>
          <button type="button" className="prod-bulk-btn" onClick={() => handleBulkAvailable(true)} disabled={!selectedIds.length}>
            <i className="fas fa-circle-check" style={{ color: '#16a34a', marginRight: 4 }}></i> Available
          </button>
          <button type="button" className="prod-bulk-btn" onClick={() => handleBulkPopular(true)} disabled={!selectedIds.length}>
            <i className="fas fa-fire" style={{ color: '#f59e0b', marginRight: 4 }}></i> Popular
          </button>
          <button type="button" className="prod-bulk-btn" onClick={() => handleBulkPopular(false)} disabled={!selectedIds.length}>
            <i className="fas fa-star-half-stroke" style={{ marginRight: 4 }}></i> Unfeature
          </button>
          <button type="button" className="prod-bulk-btn" onClick={() => handleBulkArchive(true)} disabled={!selectedIds.length}>
            <i className="fas fa-box-archive" style={{ marginRight: 4 }}></i> Archive
          </button>
          <button type="button" className="prod-bulk-btn" onClick={() => handleBulkArchive(false)} disabled={!selectedIds.length}>
            <i className="fas fa-rotate-left" style={{ marginRight: 4 }}></i> Restore
          </button>
          <button type="button" className="prod-bulk-btn" onClick={() => setShowBulkQr(true)} disabled={!selectedIds.length} title="Print QR Labels for selected drinks">
            <i className="fas fa-qrcode" style={{ color: '#0284c7', marginRight: 4 }}></i> Print QR ({selectedIds.length})
          </button>
          <button type="button" className="prod-bulk-btn" onClick={handleExportSelected} disabled={!selectedIds.length}>
            <i className="fas fa-file-export" style={{ color: 'var(--navy-accent)', marginRight: 4 }}></i> Export Selected
          </button>
        </div>

        <div style={{ color: '#64748b', fontSize: 12 }}>
          Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> drinks
        </div>
      </div>

      {/* Main Table (Screenshot 2 Match) */}
      <div className="premium-table-wrap">
        <table className="premium-table">
          <thead>
            <tr>
              <th style={{ width: 36, paddingLeft: 16 }}>
                <input
                  type="checkbox"
                  checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th style={{ minWidth: 200 }}>Drink</th>
              <th style={{ minWidth: 140 }}>Price</th>
              <th style={{ minWidth: 180 }}>Options</th>
              <th style={{ minWidth: 140 }}>Sales</th>
              <th style={{ minWidth: 90, textAlign: 'center' }}>Available</th>
              <th style={{ minWidth: 90, textAlign: 'center' }}>Popular</th>
              <th style={{ minWidth: 90, textAlign: 'center' }}>Active</th>
              <th style={{ minWidth: 120, textAlign: 'right', paddingRight: 16 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
                  <i className="fas fa-mug-hot" style={{ fontSize: 32, color: '#cbd5e1', marginBottom: 10, display: 'block' }}></i>
                  No drinks match your filters
                </td>
              </tr>
            ) : (
              filteredProducts.map(p => {
                const isSelected = selectedIds.includes(p.id);
                const formatLastDate = p.lastDate ? new Date(p.lastDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                const offeredAddons = addons.filter(a => p.addonIds.includes(a.id) || p.addonIds.includes(a.name));
                const addonsSummary = offeredAddons.map(a => a.name).join(', ') || 'No add-ons';

                return (
                  <tr key={p.id} style={{ background: isSelected ? '#f0fdf4' : undefined }}>
                    <td style={{ paddingLeft: 16 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(p.id)}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.imageUrl || p.image_url ? (
                          <img src={p.imageUrl || p.image_url} alt={p.name} className="prod-v2-thumb" />
                        ) : (
                          <div className="prod-v2-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 18 }}>
                            <i className="fas fa-mug-hot"></i>
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{p.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <span className="prod-v2-meta-code"># {p.code}</span>
                            {p.category && <span className="prod-v2-cat-pill">{p.category}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12 }}>
                        <div>
                          <span style={{ background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: 10.5, marginRight: 4 }}>Base</span>
                          <strong>{money(p.basePrice)}</strong>
                        </div>
                        {p.sizes.length > 0 && (
                          <div style={{ color: '#64748b', fontSize: 11 }}>
                            <span style={{ color: '#0284c7', fontWeight: 600 }}>Sizes:</span> {p.sizes.map(s => `${s.name} ${s.price_delta ? '+' + money(s.price_delta) : ''}`).join(', ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11.5 }}>
                        <div>
                          <span style={{ color: '#8b5cf6', fontWeight: 700 }}>Sugar / Ice:</span> {p.offerSugar ? 'Yes' : 'No'} / {p.offerIce ? 'Yes' : 'No'}
                        </div>
                        <div style={{ color: '#64748b' }}>
                          <span style={{ color: '#0284c7', fontWeight: 700 }}>Add-ons:</span> {addonsSummary.slice(0, 30)}{addonsSummary.length > 30 ? '...' : ''}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11.5 }}>
                        <div>
                          <span style={{ background: '#ecfdf5', color: '#047857', padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: 10 }}>Sold 30 days</span>
                          <strong style={{ marginLeft: 4 }}>{p.sold30}</strong>
                        </div>
                        <div style={{ color: '#64748b', fontSize: 11 }}>
                          Last: {formatLastDate}
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <label className="switch-pill">
                        <input
                          type="checkbox"
                          checked={p.isAvailable}
                          onChange={() => handleToggleAvailable(p)}
                        />
                        <span className="switch-slider"></span>
                      </label>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <label className="switch-pill">
                        <input
                          type="checkbox"
                          checked={p.isPopular}
                          onChange={() => handleTogglePopular(p)}
                        />
                        <span className="switch-slider"></span>
                      </label>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <label className="switch-pill">
                        <input
                          type="checkbox"
                          checked={!p.isArchived}
                          onChange={() => handleToggleActive(p)}
                        />
                        <span className="switch-slider"></span>
                      </label>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          type="button"
                          className="action-icon qr-icon"
                          onClick={() => setQrProduct(p)}
                          title="Product QR Code / Print Label"
                        >
                          <i className="fas fa-qrcode"></i>
                        </button>
                        <button
                          type="button"
                          className="action-icon edit-icon"
                          onClick={() => { setEditingProduct(p); setShowModal(true); }}
                          title="Edit drink"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          type="button"
                          className="action-icon delete-icon"
                          onClick={() => handleDeleteProduct(p)}
                          title="Delete drink"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Drink Modal (Screenshots 3 & 4 Match) */}
      {showModal && (
        <AddDrinkModal
          product={editingProduct}
          categories={categories}
          addons={addons}
          onClose={() => { setShowModal(false); setEditingProduct(null); }}
          onSaved={() => { setShowModal(false); setEditingProduct(null); reload(); }}
          user={user}
        />
      )}

      {/* Product QR Code Modal */}
      {qrProduct && (
        <ProductQRModal
          product={qrProduct}
          onClose={() => setQrProduct(null)}
        />
      )}

      {/* Bulk QR Code Print Modal */}
      {showBulkQr && (
        <BulkQRModal
          products={selectedIds.length > 0 ? products.filter(p => selectedIds.includes(p.id)) : filteredProducts}
          onClose={() => setShowBulkQr(false)}
        />
      )}
    </div>
  );
}

// --- Rich Add / Edit Drink Modal Component (Screenshots 3 & 4) ---
function AddDrinkModal({ product, categories, addons, onClose, onSaved, user }) {
  const [name, setName] = useState(product ? product.name || '' : '');
  const [category, setCategory] = useState(product ? product.category || '' : (categories[0]?.name || ''));
  const [description, setDescription] = useState(product ? product.description || '' : '');
  const [imageUrl, setImageUrl] = useState(product ? (product.imageUrl || product.image_url || '') : '');
  const [basePrice, setBasePrice] = useState(product ? String(product.basePrice || product.base_price || product.price || '') : '');
  const [sizes, setSizes] = useState(product && product.sizes ? [...product.sizes] : []);
  const [offerSugar, setOfferSugar] = useState(product ? product.offerSugar !== false : true);
  const [offerIce, setOfferIce] = useState(product ? product.offerIce !== false : true);
  const [selectedAddons, setSelectedAddons] = useState(product ? (product.addonIds || product.addon_ids || []) : []);
  const [maxAddons, setMaxAddons] = useState(product ? Number(product.max_addons || 3) : 3);
  const [isPopular, setIsPopular] = useState(product ? product.isPopular === true : false);
  const [isAvailable, setIsAvailable] = useState(product ? product.isAvailable !== false : true);
  const [isActive, setIsActive] = useState(product ? !product.isArchived : true);
  const [saving, setSaving] = useState(false);

  const handleAddSize = () => {
    setSizes(prev => [...prev, { name: 'Large', price_delta: 1.00 }]);
  };

  const handleUpdateSize = (index, field, val) => {
    setSizes(prev => prev.map((s, i) => i === index ? { ...s, [field]: field === 'price_delta' ? Number(val) : val } : s));
  };

  const handleRemoveSize = (index) => {
    setSizes(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAddon = (addonId) => {
    setSelectedAddons(prev => prev.includes(addonId) ? prev.filter(x => x !== addonId) : [...prev, addonId]);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageUrl(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      Swal.fire({ icon: 'warning', title: 'Name Required', text: 'Please enter a drink name.' });
      return;
    }
    if (!basePrice || isNaN(Number(basePrice))) {
      Swal.fire({ icon: 'warning', title: 'Price Required', text: 'Please enter a valid base price.' });
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      category,
      description: description.trim(),
      imageUrl,
      image_url: imageUrl,
      price: Number(basePrice),
      base_price: Number(basePrice),
      sizes,
      has_sugar: offerSugar,
      offerSugar,
      has_ice: offerIce,
      offerIce,
      addon_ids: selectedAddons,
      max_addons: maxAddons,
      is_popular: isPopular,
      popular: isPopular,
      is_available: isAvailable,
      status: isActive ? (isAvailable ? 'active' : 'sold_out') : 'archived'
    };

    let res;
    if (product && product.id) {
      res = await fbUpdateProduct(product.id, payload, user);
    } else {
      res = await fbAddProduct(payload, user);
    }
    setSaving(false);

    if (res.success) {
      Swal.fire({ icon: 'success', title: 'Drink Saved!', timer: 1200, showConfirmButton: false });
      onSaved();
    } else {
      Swal.fire({ icon: 'error', title: 'Failed to Save', text: res.message || 'Error occurred.' });
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="add-drink-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-mug-hot" style={{ color: 'var(--navy-accent)' }}></i>
            {product ? 'Edit Drink' : 'Add Drink'}
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose} style={{ fontSize: 18, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="add-drink-body">
          {/* Section 1: DRINK */}
          <div>
            <div className="add-drink-sec-title">
              <i className="fas fa-droplet"></i> Drink
              <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'lowercase', marginLeft: 'auto', fontWeight: 500 }}>code is given on save</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Classic Milk Tea"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Description</label>
              <textarea
                rows="2"
                placeholder="One line shoppers read on the menu card"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, resize: 'vertical' }}
              ></textarea>
            </div>

            {/* Photo Upload Dropzone */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Photo</label>
              <div className="add-drink-dropzone">
                {imageUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                    <img src={imageUrl} alt="Preview" style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid #fca5a5' }} />
                    <div>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setImageUrl('')}>Remove photo</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 24, color: '#f43f5e', marginBottom: 6 }}><i className="fas fa-image"></i></div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>Drag &amp; drop a drink photo</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>or choose one below · square photos look best</div>
                    <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', padding: '5px 14px', background: '#e11d48', borderColor: '#e11d48' }}>
                      Choose File
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: PRICE & SIZES */}
          <div>
            <div className="add-drink-sec-title">
              <i className="fas fa-tag"></i> Price &amp; Sizes
            </div>

            <div style={{ maxWidth: 200, marginBottom: 12 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Base price *</label>
              <input
                type="number"
                step="0.01"
                placeholder="3.50"
                value={basePrice}
                onChange={e => setBasePrice(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>

            {/* Sizes Rows */}
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Sizes optional — leave empty for one price</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddSize} style={{ fontSize: 11.5, padding: '3px 8px' }}>
                  <i className="fas fa-plus"></i> Add size
                </button>
              </div>

              {sizes.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <input
                    type="text"
                    placeholder="Size name (e.g. Large)"
                    value={s.name}
                    onChange={e => handleUpdateSize(idx, 'name', e.target.value)}
                    style={{ flex: 1, padding: '6px 10px', fontSize: 12.5, borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="+$ Price Delta"
                    value={s.price_delta}
                    onChange={e => handleUpdateSize(idx, 'price_delta', e.target.value)}
                    style={{ width: 100, padding: '6px 10px', fontSize: 12.5, borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                  <button type="button" onClick={() => handleRemoveSize(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: OPTIONS (Sugar, Ice, Add-ons) */}
          <div>
            <div className="add-drink-sec-title">
              <i className="fas fa-sliders"></i> Options
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}><i className="fas fa-cubes-stacked" style={{ marginRight: 6, color: '#d97706' }}></i> Offer sugar levels</span>
                <label className="switch-pill">
                  <input type="checkbox" checked={offerSugar} onChange={e => setOfferSugar(e.target.checked)} />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}><i className="fas fa-snowflake" style={{ marginRight: 6, color: '#0284c7' }}></i> Offer ice levels</span>
                <label className="switch-pill">
                  <input type="checkbox" checked={offerIce} onChange={e => setOfferIce(e.target.checked)} />
                  <span className="switch-slider"></span>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Add-ons this drink offers</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                {addons.map(a => {
                  const on = selectedAddons.includes(a.id) || selectedAddons.includes(a.name);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAddon(a.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11.5,
                        fontWeight: 600,
                        border: '1px solid',
                        cursor: 'pointer',
                        borderColor: on ? '#e11d48' : '#cbd5e1',
                        background: on ? '#fff1f2' : '#ffffff',
                        color: on ? '#e11d48' : '#475569'
                      }}
                    >
                      {on ? '✓ ' : '+ '}{a.name} (+${Number(a.price || 0).toFixed(2)})
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Customer may choose up to</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2, 3].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaxAddons(n)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: maxAddons === n ? '#0f172a' : '#cbd5e1',
                      background: maxAddons === n ? '#0f172a' : '#ffffff',
                      color: maxAddons === n ? '#ffffff' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: VISIBILITY */}
          <div>
            <div className="add-drink-sec-title">
              <i className="fas fa-eye"></i> Visibility
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Popular (shows first)</span>
                <label className="switch-pill">
                  <input type="checkbox" checked={isPopular} onChange={e => setIsPopular(e.target.checked)} />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Available (off = sold out)</span>
                <label className="switch-pill">
                  <input type="checkbox" checked={isAvailable} onChange={e => setIsAvailable(e.target.checked)} />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Active</span>
                <label className="switch-pill">
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                  <span className="switch-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 5: Storefront Preview */}
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>Storefront preview</div>
            <div className="add-drink-preview-card">
              <div className="add-drink-preview-img">
                {imageUrl ? (
                  <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <i className="fas fa-mug-hot"></i>
                )}
              </div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', textTransform: 'uppercase', marginBottom: 2 }}>
                {name || 'DRINK NAME'}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#e11d48' }}>
                ${Number(basePrice || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ background: '#0f172a', borderColor: '#0f172a', padding: '8px 20px', fontWeight: 700, fontSize: 13 }}
            >
              <i className="fas fa-save" style={{ marginRight: 6 }}></i>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
              style={{ padding: '8px 18px', fontSize: 13 }}
            >
              <i className="fas fa-times" style={{ marginRight: 6 }}></i>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// --- Product QR Label & Fast Billing Modal ---
function ProductQRModal({ product, onClose }) {
  const canvasRef = useRef(null);
  const [useFallback, setUseFallback] = useState(false);
  const scanCode = product.code || product.sku || product.id;
  const storeName = (CFG.business && CFG.business.name) ? CFG.business.name : 'BILLING POS';
  const priceDisplay = money(product.basePrice != null ? product.basePrice : product.price || 0);

  useEffect(() => {
    setUseFallback(false);
    if (!scanCode) return;
    try {
      if (typeof QRCode !== 'undefined' && QRCode.toCanvas && canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, scanCode, {
          width: 170,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' }
        }, (err) => {
          if (err) {
            console.warn('QR Canvas error, using fallback:', err);
            setUseFallback(true);
          }
        });
      } else {
        setUseFallback(true);
      }
    } catch (e) {
      setUseFallback(true);
    }
  }, [scanCode]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      try {
        const link = document.createElement('a');
        link.download = `${(product.name || 'product').replace(/\s+/g, '_')}_QR.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
      } catch (e) {
        Swal.fire({ icon: 'info', title: 'Scan Code', text: scanCode });
      }
    }
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(scanCode);
      Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 }).fire({
        icon: 'success',
        title: `Copied: ${scanCode}`
      });
    } catch (e) {
      Swal.fire({ icon: 'info', title: 'Scan Code', text: scanCode });
    }
  };

  const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=170x170&margin=2&data=${encodeURIComponent(scanCode)}`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal qr-label-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="fas fa-qrcode" style={{ color: 'var(--navy-accent)' }}></i>
            Product QR Label
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="qr-label-preview-sheet print-qr-target">
            <div className="qr-sticker-box">
              <div className="qr-sticker-store">{storeName}</div>
              <div className="qr-sticker-title">{product.name}</div>

              <div className="qr-canvas-holder">
                {useFallback ? (
                  <img
                    src={fallbackUrl}
                    alt={scanCode}
                    style={{ width: 170, height: 170, display: 'block', margin: '0 auto', borderRadius: 6 }}
                  />
                ) : (
                  <canvas
                    ref={canvasRef}
                    style={{ width: 170, height: 170, display: 'block', margin: '0 auto', borderRadius: 6 }}
                  />
                )}
              </div>

              <div className="qr-sticker-code-badge">
                #{scanCode}
              </div>

              <div className="qr-sticker-price-tag">
                {priceDisplay}
              </div>

              <div className="qr-sticker-hint">
                <i className="fas fa-bolt" style={{ color: '#eab308', marginRight: 4 }}></i>
                Scan at POS for 1-Click Fast Billing
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopyCode}
              title="Copy scan string"
            >
              <i className="fas fa-copy"></i> Copy Code
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDownload}
              title="Download QR Image PNG"
            >
              <i className="fas fa-download"></i> Download PNG
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              style={{ fontWeight: 700 }}
              title="Print Sticker / Thermal Label"
            >
              <i className="fas fa-print"></i> Print Label
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Bulk Product QR Labels Print Modal ---
function BulkQRModal({ products, onClose }) {
  const storeName = (CFG.business && CFG.business.name) ? CFG.business.name : 'BILLING POS';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="fas fa-qrcode" style={{ color: 'var(--navy-accent)' }}></i>
            Bulk Product QR Labels ({products.length} Items)
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Printing <strong>{products.length}</strong> barcode/QR stickers for cups, packaging, and shelf tags.
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint} style={{ fontWeight: 700 }}>
              <i className="fas fa-print"></i> Print All Labels
            </button>
          </div>

          <div className="bulk-qr-sheet print-qr-target">
            {products.map(p => {
              const code = p.code || p.sku || p.id;
              const price = money(p.basePrice != null ? p.basePrice : p.price || 0);
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&margin=1&data=${encodeURIComponent(code)}`;

              return (
                <div key={p.id} className="bulk-qr-sticker">
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.8 }}>
                    {storeName}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: '3px 0 6px', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <img
                    src={qrUrl}
                    alt={code}
                    style={{ width: 120, height: 120, display: 'block', margin: '0 auto 6px', borderRadius: 4 }}
                  />
                  <div style={{ fontFamily: 'monospace', fontSize: 11.5, fontWeight: 700, color: '#0284c7', background: '#f0f9ff', padding: '1px 6px', borderRadius: 4, marginBottom: 4 }}>
                    #{code}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#16a34a' }}>
                    {price}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint} style={{ fontWeight: 700 }}>
            <i className="fas fa-print"></i> Print All Labels
          </button>
        </div>
      </div>
    </div>
  );
}
