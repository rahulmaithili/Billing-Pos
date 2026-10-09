// --- Products View V2 (Retail & Wholesale Catalog) ---
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
    fbGetSales(),
    fbGetStockMovements()
  ]), [reloadKey]);

  const rawProducts = useMemo(() => (data && data[0] && data[0].success ? data[0].data : []), [data]);
  const categories = useMemo(() => (data && data[1] && data[1].success ? data[1].data : []), [data]);
  const addons = useMemo(() => (data && data[2] && data[2].success ? data[2].data : []), [data]);
  const sales = useMemo(() => (data && data[3] && data[3].success ? data[3].data : []), [data]);
  const movements = useMemo(() => (data && data[4] && data[4].success ? data[4].data : []), [data]);

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
      const stockQty = computeQtyOnHand(p.id, movements);

      return {
        ...p,
        stockQty,
        isArchived,
        isAvailable,
        isPopular,
        sold30: stats.sold30,
        lastDate: stats.lastDate,
        code: p.sku || p.code || ('SKU-' + (p.id ? p.id.slice(-4).toUpperCase() : '1001')),
        basePrice: Number(p.base_price != null ? p.base_price : p.price || 0),
        wholesalePrice: Number(p.wholesalePrice != null ? p.wholesalePrice : p.wholesale_price || (p.base_price || p.price || 0)),
        costPrice: Number(p.costPrice != null ? p.costPrice : p.cost || 0),
        unit: p.unit || 'Pcs',
        hsnCode: p.hsnCode || p.hsn || '',
        sizes: p.sizes || [],
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
      title: 'Delete Product?',
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
            <span><i className="fas fa-boxes-stacked" style={{ color: 'var(--navy-accent)' }}></i> <strong>Products</strong></span>
            <span>/</span>
            <span>Home</span>
            <span>/</span>
            <span>Catalog</span>
            <span>/</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Inventory Items</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { setEditingProduct(null); setShowModal(true); }}
            style={{ fontWeight: 700, padding: '7px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <i className="fas fa-plus"></i> Add Product
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
              placeholder="Search product, category, SKU, barcode..."
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
          <button type="button" className="prod-bulk-btn" onClick={() => setShowBulkQr(true)} disabled={!selectedIds.length} title="Print QR Labels for selected products">
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
              <th style={{ minWidth: 200 }}>Product / Item</th>
              <th style={{ minWidth: 150 }}>Pricing (Retail / W-Sale)</th>
              <th style={{ minWidth: 160 }}>Unit &amp; Specs</th>
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
                  <i className="fas fa-boxes-stacked" style={{ fontSize: 32, color: '#cbd5e1', marginBottom: 10, display: 'block' }}></i>
                  No products match your filters
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
                            <i className="fas fa-box"></i>
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
                          <span style={{ background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: 10, marginRight: 4 }}>Retail MRP</span>
                          <strong>{money(p.basePrice)}</strong>
                        </div>
                        {p.wholesalePrice > 0 && (
                          <div style={{ fontSize: 11 }}>
                            <span style={{ background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: 10, marginRight: 4 }}>Wholesale</span>
                            <strong>{money(p.wholesalePrice)}</strong>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11.5 }}>
                        <div>
                          <span style={{ color: '#0284c7', fontWeight: 700 }}>Unit:</span> <strong style={{ color: '#0f172a' }}>{p.unit}</strong>
                          {p.hsnCode && <span style={{ marginLeft: 6, color: '#64748b', fontSize: 10.5 }}>HSN: {p.hsnCode}</span>}
                        </div>
                        <div style={{ marginTop: 2 }}>
                          <span style={{
                            background: p.stockQty > (p.minStockAlert || 5) ? '#dcfce7' : (p.stockQty > 0 ? '#fef3c7' : '#fee2e2'),
                            color: p.stockQty > (p.minStockAlert || 5) ? '#15803d' : (p.stockQty > 0 ? '#b45309' : '#b91c1c'),
                            padding: '1px 6px',
                            borderRadius: 4,
                            fontWeight: 700,
                            fontSize: 10.5,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3
                          }}>
                            <i className="fas fa-boxes-stacked"></i> Stock: {p.stockQty} {p.unit}
                          </span>
                        </div>
                        {p.sizes.length > 0 && (
                          <div style={{ color: '#64748b', fontSize: 11 }}>
                            <span style={{ color: '#8b5cf6', fontWeight: 600 }}>Packs:</span> {p.sizes.map(s => s.name).join(', ')}
                          </div>
                        )}
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
                          title="Edit product"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          type="button"
                          className="action-icon delete-icon"
                          onClick={() => handleDeleteProduct(p)}
                          title="Delete product"
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

      {/* Add / Edit Product Modal (Screenshots 3 & 4 Match) */}
      {showModal && (
        <AddDrinkModal
          product={editingProduct}
          categories={categories}
          addons={addons}
          movements={movements}
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

// --- Rich Add / Edit Product Modal (Retail & Wholesale Edition) ---
function AddDrinkModal({ product, categories, addons, movements, onClose, onSaved, user }) {
  const categoryOptions = useMemo(() => {
    const names = new Set((categories || []).map(c => c && c.name).filter(Boolean));
    if (product && product.category && !names.has(product.category)) {
      names.add(product.category);
    }
    if (names.size === 0) {
      ['Groceries & Staples', 'Packaged Foods & Snacks', 'Beverages & Cold Drinks', 'Personal Care & Hygiene', 'Electronics & Accessories', 'Clothing & Apparel', 'Wholesale Bulk Cartons', 'General Merchandise'].forEach(n => names.add(n));
    }
    return Array.from(names);
  }, [categories, product]);

  const [name, setName] = useState(product ? product.name || '' : '');
  const [sku, setSku] = useState(product ? (product.sku || product.code || '') : '');
  const [category, setCategory] = useState(product ? product.category || '' : (categoryOptions[0] || 'Groceries & Staples'));
  const [unit, setUnit] = useState(product ? (product.unit || 'Pcs') : 'Pcs');
  const [hsnCode, setHsnCode] = useState(product ? (product.hsnCode || product.hsn || '') : '');
  const [description, setDescription] = useState(product ? product.description || '' : '');
  const [imageUrl, setImageUrl] = useState(product ? (product.imageUrl || product.image_url || '') : '');
  
  // Pricing Fields (Retail MRP, Wholesale Price, Cost/Purchase Price)
  const [basePrice, setBasePrice] = useState(product ? String(product.basePrice || product.base_price || product.price || '') : '');
  const [wholesalePrice, setWholesalePrice] = useState(product ? String(product.wholesalePrice || product.wholesale_price || '') : '');
  const [costPrice, setCostPrice] = useState(product ? String(product.costPrice || product.cost || '') : '');
  const [minWholesaleQty, setMinWholesaleQty] = useState(product ? Number(product.minWholesaleQty || 1) : 1);
  const currentStockQty = useMemo(() => product ? computeQtyOnHand(product.id, movements) : 0, [product, movements]);
  const [openingStock, setOpeningStock] = useState('');
  const [minStockAlert, setMinStockAlert] = useState(product ? (product.minStockAlert ?? 5) : 5);
  const [stockAdjustment, setStockAdjustment] = useState('');
  const [stockAdjReason, setStockAdjReason] = useState('Stock In / Purchase');
  
  // Variations / Pack sizes
  const [sizes, setSizes] = useState(product && product.sizes ? [...product.sizes] : []);
  const [selectedAddons, setSelectedAddons] = useState(product ? (product.addonIds || product.addon_ids || []) : []);
  const [isPopular, setIsPopular] = useState(product ? product.isPopular === true : false);
  const [isAvailable, setIsAvailable] = useState(product ? product.isAvailable !== false : true);
  const [isActive, setIsActive] = useState(product ? !product.isArchived : true);
  const [saving, setSaving] = useState(false);

  const handleAddSize = () => {
    setSizes(prev => [...prev, { name: 'Box of 10', price_delta: 0 }]);
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
      Swal.fire({ icon: 'warning', title: 'Product Name Required', text: 'Please enter a product name.' });
      return;
    }
    if (!basePrice || isNaN(Number(basePrice))) {
      Swal.fire({ icon: 'warning', title: 'Retail Price Required', text: 'Please enter a valid retail price (MRP).' });
      return;
    }

    setSaving(true);
    const rPrice = Number(basePrice);
    const wPrice = wholesalePrice && !isNaN(Number(wholesalePrice)) ? Number(wholesalePrice) : rPrice;
    const cPrice = costPrice && !isNaN(Number(costPrice)) ? Number(costPrice) : 0;

    const payload = {
      name: name.trim(),
      sku: sku.trim() || undefined,
      category,
      unit,
      hsnCode: hsnCode.trim(),
      description: description.trim(),
      imageUrl,
      image_url: imageUrl,
      price: rPrice,
      base_price: rPrice,
      retailPrice: rPrice,
      wholesalePrice: wPrice,
      wholesale_price: wPrice,
      costPrice: cPrice,
      cost: cPrice,
      openingStock: openingStock ? Number(openingStock) : undefined,
      minStockAlert: Number(minStockAlert) || 5,
      minWholesaleQty: Number(minWholesaleQty) || 1,
      sizes,
      addon_ids: selectedAddons,
      is_popular: isPopular,
      popular: isPopular,
      is_available: isAvailable,
      status: isActive ? (isAvailable ? 'active' : 'sold_out') : 'archived'
    };

        let res;
    if (product && product.id) {
      res = await fbUpdateProduct(product.id, payload, user);
      if (res.success && stockAdjustment && Number(stockAdjustment) !== 0) {
        const adjQty = Number(stockAdjustment);
        await fbAddStockMovement({
          productId: product.id,
          type: adjQty > 0 ? 'in' : 'out',
          qty: Math.abs(adjQty),
          unitCost: cPrice || 0,
          reason: stockAdjReason || 'Stock Adjustment',
          reference: 'ADJ-' + Date.now().toString().slice(-4)
        }, payload.name, user);
      }
    } else {
      res = await fbAddProduct(payload, user);
    }
    setSaving(false);

    if (res.success) {
      Swal.fire({ icon: 'success', title: 'Product Saved!', timer: 1200, showConfirmButton: false });
      onSaved();
    } else {
      Swal.fire({ icon: 'error', title: 'Failed to Save', text: res.message || 'Error occurred.' });
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="add-drink-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-boxes-stacked" style={{ color: 'var(--navy-accent)' }}></i>
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose} style={{ fontSize: 18, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="add-drink-body">
          {/* Section 1: GENERAL PRODUCT DETAILS */}
          <div>
            <div className="add-drink-sec-title">
              <i className="fas fa-box"></i> Product Information
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Basmati Rice 5kg / USB Cable 20W"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Barcode / SKU</label>
                <input
                  type="text"
                  placeholder="Auto if empty"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
                >
                  {categoryOptions.map(catName => (
                    <option key={catName} value={catName}>{catName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Unit</label>
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
                >
                  <option value="Pcs">Pcs (Pieces)</option>
                  <option value="Box">Box</option>
                  <option value="Carton">Carton</option>
                  <option value="Kg">Kg (Kilogram)</option>
                  <option value="Gram">Gram</option>
                  <option value="Pack">Pack</option>
                  <option value="Dozen">Dozen</option>
                  <option value="Ltr">Ltr (Litre)</option>
                  <option value="Meter">Meter</option>
                  <option value="Bundle">Bundle</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>HSN Code</label>
                <input
                  type="text"
                  placeholder="e.g. 1006"
                  value={hsnCode}
                  onChange={e => setHsnCode(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Description</label>
              <textarea
                rows="2"
                placeholder="Product specifications, brand, size or notes"
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
                    <img src={imageUrl} alt="Preview" style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                    <div>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setImageUrl('')}>Remove photo</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 24, color: '#64748b', marginBottom: 6 }}><i className="fas fa-image"></i></div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>Upload product image</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>clear product picture for fast visual identification</div>
                    <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', padding: '5px 14px' }}>
                      Choose File
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>

                    {/* Section: INVENTORY & OPENING STOCK */}
          <div>
            <div className="add-drink-sec-title">
              <i className="fas fa-boxes-stacked"></i> Inventory &amp; Stock Management
            </div>

            {!product ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14, background: '#f0fdf4', padding: 12, borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#166534', marginBottom: 4, display: 'block' }}>
                    Opening Stock (Initial Quantity) *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="e.g. 50"
                      value={openingStock}
                      onChange={e => setOpeningStock(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1.5px solid #16a34a', fontSize: 13, fontWeight: 700 }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '6px 10px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                      {unit}
                    </span>
                  </div>
                  <small style={{ fontSize: 11, color: '#15803d', display: 'block', marginTop: 3 }}>
                    Initial quantity currently in store
                  </small>
                </div>

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>
                    Low Stock Alert Limit
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="e.g. 5"
                    value={minStockAlert}
                    onChange={e => setMinStockAlert(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                  <small style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 3 }}>
                    Alert when stock drops below this
                  </small>
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Current In-Stock Quantity:</span>
                    <strong style={{ fontSize: 16, color: currentStockQty > (minStockAlert || 5) ? '#16a34a' : (currentStockQty > 0 ? '#d97706' : '#dc2626'), marginLeft: 8 }}>
                      {currentStockQty} {unit}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11.5, color: '#64748b' }}>Low Stock Alert: <strong>{minStockAlert} {unit}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Quick Stock Adjustment (+ / -)
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="e.g. +20 or -5"
                      value={stockAdjustment}
                      onChange={e => setStockAdjustment(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Adjustment Reason
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. New Purchase / Damaged"
                      value={stockAdjReason}
                      onChange={e => setStockAdjReason(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5 }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: RETAIL & WHOLESALE PRICING */}
          <div>
            <div className="add-drink-sec-title">
              <i className="fas fa-tags"></i> Retail &amp; Wholesale Pricing
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Retail Price (MRP) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 100.00"
                  value={basePrice}
                  onChange={e => setBasePrice(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Wholesale Rate</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Bulk rate (e.g. 85.00)"
                  value={wholesalePrice}
                  onChange={e => setWholesalePrice(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Cost / Purchase Price</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Purchase rate (e.g. 70.00)"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>
            </div>

            {/* Pack Variations */}
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Pack Variations (e.g. Pack of 6, Box of 24)</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddSize} style={{ fontSize: 11.5, padding: '3px 8px' }}>
                  <i className="fas fa-plus"></i> Add Pack Variant
                </button>
              </div>

              {sizes.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <input
                    type="text"
                    placeholder="Variant name (e.g. Master Carton)"
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
                    style={{ width: 110, padding: '6px 10px', fontSize: 12.5, borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                  <button type="button" onClick={() => handleRemoveSize(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: PACKAGING & STATUS */}
          <div>
            <div className="add-drink-sec-title">
              <i className="fas fa-box-archive"></i> Extra Packaging &amp; Status
            </div>

            {addons.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Extra Packaging &amp; Surcharges Offered</label>
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
                          borderColor: on ? '#0284c7' : '#cbd5e1',
                          background: on ? '#e0f2fe' : '#ffffff',
                          color: on ? '#0284c7' : '#475569'
                        }}
                      >
                        {on ? '✓ ' : '+ '}{a.name} (+${Number(a.price || 0).toFixed(2)})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>In Stock</span>
                <label className="switch-pill">
                  <input type="checkbox" checked={isAvailable} onChange={e => setIsAvailable(e.target.checked)} />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Featured / Top</span>
                <label className="switch-pill">
                  <input type="checkbox" checked={isPopular} onChange={e => setIsPopular(e.target.checked)} />
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

          {/* Modal Footer */}
          <div className="add-drink-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ fontWeight: 700, padding: '8px 24px' }}>
              {saving ? <><i className="fas fa-circle-notch fa-spin"></i> Saving...</> : (product ? 'Update Product' : 'Create Product')}
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
