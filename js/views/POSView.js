function POSView({ user, role }) {
      const [cart, setCart] = useState([]);
      const [scanValue, setScanValue] = useState('');
      const [showCamera, setShowCamera] = useState(false);
      const [completedSale, setCompletedSale] = useState(null);
      const [load, setLoad] = useState('');
      const [reloadKey, setReloadKey] = useState(0);
      const [customerId, setCustomerId] = useState('');
      const [customerMode, setCustomerMode] = useState('walkin'); // 'walkin' | 'registered'
      const [walkinName, setWalkinName] = useState('');
      const [walkinPhone, setWalkinPhone] = useState('');
      const [discountType, setDiscountType] = useState('flat');
      const [discountValue, setDiscountValue] = useState('');
      const [paymentMethod, setPaymentMethod] = useState('Cash');
      const [tendered, setTendered] = useState('');
      const [splitCash, setSplitCash] = useState('');
      const [splitOnline, setSplitOnline] = useState('');
      const [customUpiId, setCustomUpiId] = useState(() => localStorage.getItem('pos_custom_upi') || '');
      const [onlineVerified, setOnlineVerified] = useState(false);
      const [held, setHeld] = useState(() => { try { return JSON.parse(localStorage.getItem('pos_held') || '[]'); } catch (e) { return []; } });
      const [selectedCategory, setSelectedCategory] = useState('ALL');
      const [billingMode, setBillingMode] = useState('retail'); // 'retail' | 'wholesale'
      const [searchQuery, setSearchQuery] = useState('');
      const scanRef = useRef(null);

      const { loading: loadingProducts, data: productsData } = useFetch(() => fbGetProducts(), []);
      const products = useMemo(() => (productsData && productsData.success ? productsData.data : []), [productsData]);
      const prodById = useMemo(() => products.reduce((m, p) => (m[p.id] = p, m), {}), [products]);
      const codeIndex = useMemo(() => buildCodeIndex(products), [products]);
      const { data: custData } = useFetch(() => fbGetCustomers(), []);
      const customers = useMemo(() => (custData && custData.success ? custData.data : []), [custData]);
      const customerOpts = useMemo(() => customers.map(c => ({
        value: c.id,
        label: c.name + (c.phone ? ' · ' + c.phone : '') + (Number(c.amount || 0) > 0 ? ' [उधार: ' + CFG.currency + Number(c.amount).toLocaleString() + ']' : '')
      })), [customers]);
      const { loading: loadingMovements, data: movementsData } = useFetch(() => fbGetStockMovements(), [reloadKey]);
      const movements = useMemo(() => (movementsData && movementsData.success ? movementsData.data : []), [movementsData]);
      const { data: catData } = useFetch(() => fbGetCategories(), [reloadKey]);
      const rawCategories = useMemo(() => (catData && catData.success ? catData.data : []), [catData]);
      const catalogReady = !loadingProducts && !loadingMovements;

      // Map category name to icon
      const catIconMap = useMemo(() => {
        const map = {};
        rawCategories.forEach(c => {
          if (c && c.name) map[String(c.name).trim().toLowerCase()] = c.icon || 'fas fa-tag';
        });
        return map;
      }, [rawCategories]);

      // Extract unique categories merged from DB and products
      const categories = useMemo(() => {
        const set = new Set();
        rawCategories.forEach(c => {
          if (c && c.name && String(c.name).trim()) set.add(String(c.name).trim());
        });
        products.forEach(p => {
          if (p.category && String(p.category).trim()) set.add(String(p.category).trim());
        });
        return ['ALL', ...Array.from(set).sort()];
      }, [products, rawCategories]);

      // Stock on-hand map
      const qtyOnHandMap = useMemo(() => {
        const map = {};
        products.forEach(p => {
          map[p.id] = computeQtyOnHand(p.id, movements);
        });
        return map;
      }, [products, movements]);

      // In-cart quantity map
      const cartQtyMap = useMemo(() => {
        const map = {};
        cart.forEach(item => {
          map[item.productId] = (map[item.productId] || 0) + item.qty;
        });
        return map;
      }, [cart]);

      // Filter products by category and search
      const filteredProducts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return products.filter(p => {
          if (p.active === false) return false;
          const matchCat = selectedCategory === 'ALL' || (p.category && String(p.category).trim() === selectedCategory);
          if (!matchCat) return false;
          if (!q) return true;
          return (
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.sku && p.sku.toLowerCase().includes(q)) ||
            (p.barcode && String(p.barcode).toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q))
          );
        });
      }, [products, selectedCategory, searchQuery]);

      useEffect(() => {
        if (catalogReady && !completedSale && !showCamera && scanRef.current) {
          scanRef.current.focus();
        }
      }, [catalogReady, completedSale, showCamera]);

      const totals = useMemo(() => computeSaleTotals(cart, prodById, { type: discountType, value: discountValue }), [cart, prodById, discountType, discountValue]);

      // Kirana & Supermarket Total Customer Savings (MRP vs Selling Price + Discount)
      const customerSavings = useMemo(() => {
        let totalMrp = 0;
        let totalSell = 0;
        cart.forEach(item => {
          const prod = prodById[item.productId];
          const mrp = Number(prod && (prod.mrp || prod.retailPrice || prod.price)) || item.price;
          const sellPrice = item.price;
          totalMrp += mrp * item.qty;
          totalSell += sellPrice * item.qty;
        });
        const savings = Math.max(0, round2((totalMrp - totalSell) + (totals.discount || 0)));
        return savings;
      }, [cart, prodById, totals.discount]);
      const itemCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);

      // Initialize split values when switching to Split or when cart grand total changes
      useEffect(() => {
        if (paymentMethod === 'Split') {
          if (!splitCash && !splitOnline && totals.grand > 0) {
            const half = round2(totals.grand / 2);
            setSplitCash(String(half));
            setSplitOnline(String(round2(totals.grand - half)));
          }
        }
      }, [paymentMethod, totals.grand]);

      const handleSplitCashChange = (val) => {
        setSplitCash(val);
        const c = Number(val) || 0;
        const rem = Math.max(0, totals.grand - c);
        setSplitOnline(rem > 0 ? String(round2(rem)) : '0');
      };

      const handleSplitOnlineChange = (val) => {
        setSplitOnline(val);
        const o = Number(val) || 0;
        const rem = Math.max(0, totals.grand - o);
        setSplitCash(rem > 0 ? String(round2(rem)) : '0');
      };

      const setSplitPreset = (percentCash) => {
        const c = round2((totals.grand * percentCash) / 100);
        const o = round2(totals.grand - c);
        setSplitCash(String(c));
        setSplitOnline(String(o));
      };

      const promptEditUpi = async () => {
        const { value } = await Swal.fire({
          title: 'Store UPI ID for Dynamic QR',
          input: 'text',
          inputLabel: 'Enter your shop UPI VPA (e.g. 9876543210@paytm, merchant@okaxis)',
          inputValue: customUpiId || CFG.upiId || 'shop@upi',
          showCancelButton: true
        });
        if (value && value.trim()) {
          const clean = value.trim();
          setCustomUpiId(clean);
          localStorage.setItem('pos_custom_upi', clean);
          CFG.upiId = clean;
        }
      };

      const changeDue = useMemo(() => {
        if (paymentMethod === 'Cash') {
          return Math.max(0, (Number(tendered) || 0) - totals.grand);
        }
        if (paymentMethod === 'Split') {
          return Math.max(0, (Number(tendered) || 0) - (Number(splitCash) || 0));
        }
        return 0;
      }, [paymentMethod, tendered, totals.grand, splitCash]);

      const capacityCheck = useCallback((productId, name, nextQty) => {
        const onHand = computeQtyOnHand(productId, movements);
        if (nextQty > onHand) {
          Swal.fire({ icon: 'warning', title: 'Not enough stock', text: `Only ${onHand} unit(s) of ${name} in stock.` });
          return false;
        }
        return true;
      }, [movements]);

      const addToCart = useCallback((product, qtyToAdd = 1) => {
        setCart(prev => {
          const existing = prev.find(l => l.productId === product.id);
          const nextQty = (existing ? existing.qty : 0) + qtyToAdd;
          if (!capacityCheck(product.id, product.name, nextQty)) return prev;
          if (existing) return prev.map(l => l.productId === product.id ? { ...l, qty: nextQty } : l);
          const priceVal = Number(product.base_price != null ? product.base_price : product.price) || 0;
          return [...prev, { productId: product.id, name: product.name, sku: product.sku || product.code || '', price: priceVal, qty: qtyToAdd }];
        });
      }, [capacityCheck]);

      const resolveAndAddToCart = useCallback(async (rawCode) => {
        const code = String(rawCode || '').trim();
        if (!code) return;
        if (!catalogReady) { Swal.fire({ icon: 'warning', title: 'Still Loading', text: 'Catalog is still loading, try again in a moment.' }); return; }
        const local = codeIndex.get(code.toLowerCase());
        if (local) {
          addToCart(local, 1);
          Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1200 }).fire({ icon: 'success', title: `Added: ${local.name}` });
          return;
        }
        const res = await fbFindProductByCode(code);
        if (!res.success) { Swal.fire({ icon: 'error', title: 'Not Found', text: res.message || `No product matches "${code}"` }); return; }
        addToCart(res.data, 1);
        Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1200 }).fire({ icon: 'success', title: `Added: ${res.data.name}` });
      }, [addToCart, catalogReady, codeIndex]);

      const handleScanSubmit = (e) => {
        e.preventDefault();
        const code = scanValue;
        setScanValue('');
        resolveAndAddToCart(code);
      };

      const handleDetected = (decodedText) => { setShowCamera(false); resolveAndAddToCart(decodedText); };

      const changeQty = (productId, delta) => {
        setCart(prev => {
          const line = prev.find(l => l.productId === productId);
          if (!line) return prev;
          const nextQty = line.qty + delta;
          if (nextQty <= 0) return prev.filter(l => l.productId !== productId);
          if (!capacityCheck(productId, line.name, nextQty)) return prev;
          return prev.map(l => l.productId === productId ? { ...l, qty: nextQty } : l);
        });
      };

      const removeLine = (productId) => setCart(prev => prev.filter(l => l.productId !== productId));

      const persistHeld = (list) => { setHeld(list); localStorage.setItem('pos_held', JSON.stringify(list)); };
      const resetSale = () => {
        setCart([]);
        setCustomerId('');
        setDiscountValue('');
        setDiscountType('flat');
        setPaymentMethod('Cash');
        setTendered('');
        setSplitCash('');
        setSplitOnline('');
        setOnlineVerified(false);
      };

      const holdSale = () => {
        if (!cart.length) return;
        const cust = customers.find(c => c.id === customerId);
        const label = (cust ? cust.name : 'Walk-in') + ' · ' + cart.reduce((n, l) => n + l.qty, 0) + ' item(s) · ' + money(totals.grand);
        persistHeld([...held, { id: Date.now(), label, cart, customerId, discountType, discountValue, ts: nowIso() }]);
        resetSale();
        Swal.fire({ icon: 'success', title: 'Held', text: 'Sale parked — recall it anytime.', timer: 1400, showConfirmButton: false });
      };

      const recallHeld = async () => {
        if (!held.length) { Swal.fire({ icon: 'info', title: 'No held sales' }); return; }
        const opts = {}; held.forEach((h, i) => opts[i] = h.label);
        const { value } = await Swal.fire({ title: 'Recall a held sale', input: 'select', inputOptions: opts, inputPlaceholder: 'Pick one', showCancelButton: true, confirmButtonText: 'Recall' });
        if (value == null) return;
        const h = held[Number(value)]; if (!h) return;
        setCart(h.cart || []); setCustomerId(h.customerId || ''); setDiscountType(h.discountType || 'flat'); setDiscountValue(h.discountValue || '');
        persistHeld(held.filter((_, i) => i !== Number(value)));
      };

      const handleCheckout = async () => {
        if (cart.length === 0) return;

        if (paymentMethod === 'Cash' && (Number(tendered) || 0) < totals.grand && Number(tendered) > 0) {
          const go = await Swal.fire({ icon: 'warning', title: 'Short payment', text: `Tendered is less than ${money(totals.grand)}. Continue anyway?`, showCancelButton: true, confirmButtonText: 'Yes, continue' });
          if (!go.isConfirmed) return;
        }

        if (paymentMethod === 'Split') {
          const sC = Number(splitCash) || 0;
          const sO = Number(splitOnline) || 0;
          const totalSplit = round2(sC + sO);
          if (totalSplit < round2(totals.grand)) {
            const go = await Swal.fire({
              icon: 'warning',
              title: 'Split Amount Incomplete',
              text: `Total split payments (${money(totalSplit)}) is less than Grand Total (${money(totals.grand)}). Continue anyway?`,
              showCancelButton: true,
              confirmButtonText: 'Yes, proceed'
            });
            if (!go.isConfirmed) return;
          }
          if (Number(tendered) > 0 && Number(tendered) < sC) {
            const go = await Swal.fire({
              icon: 'warning',
              title: 'Cash Tendered Short',
              text: `Cash tendered (${money(tendered)}) is less than cash share (${money(sC)}). Continue?`,
              showCancelButton: true,
              confirmButtonText: 'Continue'
            });
            if (!go.isConfirmed) return;
          }
        }

        if (paymentMethod === 'Credit' && !customerId) {
          Swal.fire({ icon: 'warning', title: 'Pick a customer', text: 'Credit sales must be tied to a customer.' });
          return;
        }

        setLoad('Processing sale...');
        const cust = customers.find(c => c.id === customerId);

        const sC = paymentMethod === 'Split' ? (Number(splitCash) || 0) : null;
        const sO = paymentMethod === 'Split' ? (Number(splitOnline) || 0) : null;

        const sale = {
          items: cart.map(it => ({
            productId: it.productId,
            name: it.name,
            sku: it.sku,
            unitPrice: it.price,
            qty: it.qty,
            cost: (prodById[it.productId] && Number(prodById[it.productId].cost)) || 0
          })),
          customerId: customerId || null,
          customerName: cust ? cust.name : 'Walk-in',
          subtotal: totals.subtotal,
          discountType,
          discountValue: Number(discountValue) || 0,
          discountAmount: totals.discount,
          taxAmount: totals.tax,
          total: totals.grand,
          paymentMethod,
          tendered: paymentMethod === 'Cash' ? (Number(tendered) || totals.grand) : (paymentMethod === 'Split' ? (Number(tendered) || sC) : totals.grand),
          change: changeDue,
          splitCash: sC,
          splitOnline: sO,
          onlineVerified: (paymentMethod === 'Online' || (paymentMethod === 'Split' && sO > 0)) ? !!onlineVerified : null,
          paidOnline: (paymentMethod === 'Online' ? totals.grand : (paymentMethod === 'Split' ? sO : 0)),
          paidCash: (paymentMethod === 'Cash' ? totals.grand : (paymentMethod === 'Split' ? sC : 0)),
          cashierId: user.id,
          cashierName: user.name,
          source: 'counter_pos'
        };

        const res = await fbCreateSale(sale, user);
        setLoad('');

        if (!res.success) {
          Swal.fire({ icon: 'error', title: 'Sale Failed', text: res.message || 'Could not record sale.' });
          return;
        }

        for (const item of cart) {
          await fbCreateStockMovement({
            productId: item.productId,
            type: 'OUT',
            qty: item.qty,
            reason: `Sale #${res.id}`,
            refId: res.id
          }, user);
        }

        const completed = { ...sale, id: res.id, date: nowIso() };
        resetSale();
        setReloadKey(k => k + 1);
        setCompletedSale(completed);
      };

      const splitSum = round2((Number(splitCash) || 0) + (Number(splitOnline) || 0));
      const splitDiff = round2(totals.grand - splitSum);
      const isSplitMatched = Math.abs(splitDiff) < 0.01;

      return (
        <div className="data-section pos-premium-view">
          {load && <TopLoadingBar />}
          
          <div className="section-header pos-main-header">
            <div>
              <h2><i className="fas fa-cash-register"></i> Fast POS &amp; QR Terminal</h2>
              <p className="section-subtitle">Real-time Visual Billing, Live Stock &amp; Instant Dynamic UPI Payment</p>
            </div>
            <div className="pos-scan-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCamera(true)} disabled={!catalogReady}>
                <i className="fas fa-camera"></i> Camera Scan
              </button>
              <button type="button" className="btn btn-secondary pos-held-btn" onClick={recallHeld}>
                <i className="fas fa-clock-rotate-left"></i> Held Orders
                {held.length > 0 && <span className="pos-badge-count">{held.length}</span>}
              </button>
            </div>
          </div>

          <div className="pos-terminal-layout">
            {/* LEFT COLUMN: Visual Product Catalog & Categories */}
            <div className="pos-catalog-panel">
              {/* Top Controls: Search Bar & Barcode Scanner */}
              <div className="pos-catalog-topbar">
                <div className="pos-search-box">
                  <i className="fas fa-search pos-search-icon"></i>
                  <input
                    type="text"
                    className="pos-search-input"
                    placeholder="Search items, products, SKU, barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button type="button" className="pos-search-clear-btn" onClick={() => setSearchQuery('')}>
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>

                <form className="pos-quick-scan-form" onSubmit={handleScanSubmit}>
                  <div className="pos-scan-input-wrap">
                    <i className="fas fa-barcode"></i>
                    <input
                      ref={scanRef}
                      type="text"
                      className="pos-barcode-input"
                      value={scanValue}
                      onChange={(e) => setScanValue(e.target.value)}
                      placeholder="Scan Barcode / SKU + Enter"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary pos-scan-add-btn" title="Add item by barcode">
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </form>
              </div>

              {/* Category Ribbon */}
              <div className="pos-category-ribbon">
                {categories.map((cat) => {
                  const count = cat === 'ALL' ? products.length : products.filter(p => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`pos-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      <i className={cat === 'ALL' ? 'fas fa-border-all' : (catIconMap[cat.toLowerCase()] || 'fas fa-tag')}></i>
                      <span>{cat === 'ALL' ? 'All Items' : cat}</span>
                      <span className="cat-pill-count">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Visual Products Grid */}
              <div className="pos-products-grid">
                {loadingProducts ? (
                  <div className="pos-loading-state">
                    <i className="fas fa-circle-notch fa-spin"></i>
                    <p>Loading Product Catalog...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="pos-empty-catalog">
                    <i className="fas fa-box-open"></i>
                    <h4>No items found</h4>
                    <p>No products match "{searchQuery || selectedCategory}"</p>
                  </div>
                ) : (
                  filteredProducts.map((p) => {
                    const onHand = qtyOnHandMap[p.id] ?? 0;
                    const inCart = cartQtyMap[p.id] || 0;
                    const isOut = onHand <= 0;
                    return (
                      <div
                        key={p.id}
                        className={`pos-product-card ${isOut ? 'is-out' : ''} ${inCart > 0 ? 'is-in-cart' : ''}`}
                        onClick={() => !isOut && addToCart(p, 1)}
                        title={isOut ? 'Out of stock' : `Add ${p.name}`}
                      >
                        {inCart > 0 && (
                          <div className="pos-card-incart-badge">
                            <i className="fas fa-check"></i> {inCart}
                          </div>
                        )}
                        <div className="pos-card-thumb">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="pos-card-fallback-icon"
                            style={{ display: p.imageUrl ? 'none' : 'flex' }}
                          >
                            <i className="fas fa-box"></i>
                          </div>
                        </div>
                        <div className="pos-card-info">
                          <div className="pos-card-name" title={p.name}>{p.name}</div>
                          <div className="pos-card-meta">
                            <span className="pos-card-sku">{p.sku || p.category || 'SKU'}</span>
                            <span className={`pos-card-stock-pill ${isOut ? 'stock-out' : onHand <= 5 ? 'stock-low' : 'stock-ok'}`}>
                              {isOut ? '0 stock' : `${onHand} in stock`}
                            </span>
                          </div>
                          <div className="pos-card-bottom">
                            <span className="pos-card-price">{money(p.price)}</span>
                            <button
                              type="button"
                              className="pos-card-add-btn"
                              disabled={isOut}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isOut) addToCart(p, 1);
                              }}
                            >
                              <i className="fas fa-plus"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Cart & Payment Terminal */}
            <div className="pos-terminal-cart-panel">
              {/* Cart Top Header */}
              <div className="pos-cart-header">
                <div className="pos-cart-title">
                  <i className="fas fa-receipt"></i> Current Bill
                  <span className="pos-cart-count-pill">{itemCount} items</span>
                </div>
                {cart.length > 0 && (
                  <button type="button" className="pos-cart-clear-btn" onClick={resetSale} title="Clear all cart items">
                    <i className="fas fa-trash-can"></i> Clear
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="pos-cart-items-container">
                {cart.length === 0 ? (
                  <div className="pos-cart-empty">
                    <i className="fas fa-basket-shopping"></i>
                    <h4>Cart is Empty</h4>
                    <p>Select items from menu or scan barcode to add</p>
                  </div>
                ) : (
                  <div className="pos-cart-list">
                    {cart.map((it) => (
                      <div className="pos-cart-row" key={it.productId}>
                        <div className="pi-name">
                          <strong>{it.name}</strong>
                          <small>SKU: {it.sku || "—"} · {money(it.price)} / {it.unit || "unit"}</small>
                        </div>
                        <div className="pos-qty-ctrl">
                          <button type="button" onClick={() => changeQty(it.productId, -1)} title="Decrease">
                            <i className="fas fa-minus"></i>
                          </button>
                          <span>{it.qty}</span>
                          <button type="button" onClick={() => changeQty(it.productId, 1)} title="Increase">
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                        <div className="pos-line-total">{money(it.qty * it.price)}</div>
                        <button type="button" className="pos-remove-btn" title="Remove line" onClick={() => removeLine(it.productId)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

                            {/* Customer Selection: Walk-in (0 registration) vs Registered / Khata */}
              <div className="pos-customer-wrap" style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>
                    <i className="fas fa-user-tag" style={{ color: 'var(--navy-accent)', marginRight: 4 }}></i> Grahak / Customer
                  </label>
                  <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
                    <button
                      type="button"
                      onClick={() => { setCustomerMode('walkin'); setCustomerId(''); }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: customerMode === 'walkin' ? '#16a34a' : 'transparent',
                        color: customerMode === 'walkin' ? '#fff' : '#475569'
                      }}
                    >
                      <i className="fas fa-person-walking"></i> Walk-in (सीधा बिल)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerMode('registered')}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: customerMode === 'registered' ? 'var(--navy-primary)' : 'transparent',
                        color: customerMode === 'registered' ? '#fff' : '#475569'
                      }}
                    >
                      <i className="fas fa-book-bookmark"></i> Khata / Regular
                    </button>
                  </div>
                </div>

                {customerMode === 'walkin' ? (
                  <div>
                    <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                      <i className="fas fa-bolt"></i> बिना रजिस्ट्रेशन सीधा बिलिंग (0 Mandatory Fields - Fast Checkout)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="Grahak Name (Optional)"
                        value={walkinName}
                        onChange={e => setWalkinName(e.target.value)}
                        style={{ padding: '6px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      <input
                        type="tel"
                        placeholder="Mobile No (Optional)"
                        value={walkinPhone}
                        onChange={e => setWalkinPhone(e.target.value)}
                        style={{ padding: '6px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <SearchableDropdown
                      label="Select Khata Customer"
                      icon="fas fa-user"
                      options={customerOpts}
                      value={customerId}
                      onChange={setCustomerId}
                      placeholder="Select regular customer..."
                    />
                    {customerId && (
                      <div style={{ marginTop: '6px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', background: '#fff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <span>Customer Khata Dues:</span>
                        <strong style={{ color: Number(customers.find(c => c.id === customerId)?.amount || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                          {money(customers.find(c => c.id === customerId)?.amount || 0)}
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Discount Section */}
              <div className="pos-discount-box">
                <div className="pos-field-header">
                  <label><i className="fas fa-tags"></i> Discount Type &amp; Value</label>
                  <div className="radio-group-horizontal">
                    <label className={`radio-label-pill ${discountType === 'flat' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="discountType"
                        value="flat"
                        checked={discountType === 'flat'}
                        onChange={() => setDiscountType('flat')}
                      />
                      <span>Flat ({CFG.currency})</span>
                    </label>
                    <label className={`radio-label-pill ${discountType === 'percent' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="discountType"
                        value="percent"
                        checked={discountType === 'percent'}
                        onChange={() => setDiscountType('percent')}
                      />
                      <span>Percent (%)</span>
                    </label>
                  </div>
                </div>
                <div className="pos-discount-input-wrap">
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percent' ? 100 : undefined}
                    step="0.01"
                    className="pos-discount-input"
                    placeholder={discountType === 'percent' ? 'Discount in % (e.g. 10)' : `Discount in ${CFG.currency}`}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
              </div>

              {/* Order Totals Summary */}
              <div className="pos-totals-card">
                <div className="pos-summary-row"><span>Items Count:</span><span>{itemCount}</span></div>
                <div className="pos-summary-row"><span>Subtotal:</span><span>{money(totals.subtotal)}</span></div>
                {totals.discount > 0 && (
                  <div className="pos-summary-row pos-disc-highlight">
                    <span>Discount:</span>
                    <span>- {money(totals.discount)}</span>
                  </div>
                )}
                {totals.tax > 0 && (
                  <div className="pos-summary-row">
                    <span>Tax{CFG.taxInclusive ? ' (incl)' : ''}:</span>
                    <span>{money(totals.tax)}</span>
                  </div>
                )}
                <div className="pos-summary-row grand">
                  <span>Grand Total:</span>
                  <span className="grand-price">{money(totals.grand)}</span>
                </div>

                {changeDue > 0 && (
                  <div className="pos-change-alert">
                    <span><i className="fas fa-hand-holding-dollar"></i> Change to Return:</span>
                    <strong>{money(changeDue)}</strong>
                  </div>
                )}
              </div>

              {/* Payment Mode Selector: Modern Radio Cards */}
              <div className="pos-pay-modes-wrap">
                <label className="pos-pay-label">
                  <span><i className="fas fa-wallet"></i> Payment Method</span>
                  <span className="active-mode-badge">{paymentMethod}</span>
                </label>
                <div className="pos-pay-radio-grid">
                  <label className={`pos-pay-radio-card ${paymentMethod === 'Cash' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="posPayMethod"
                      value="Cash"
                      checked={paymentMethod === 'Cash'}
                      onChange={() => {
                        setPaymentMethod('Cash');
                        setTendered(String(totals.grand));
                      }}
                    />
                    <div className="radio-card-content">
                      <i className="fas fa-money-bill-wave icon-cash"></i>
                      <span>Cash</span>
                    </div>
                  </label>

                  <label className={`pos-pay-radio-card ${paymentMethod === 'Online' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="posPayMethod"
                      value="Online"
                      checked={paymentMethod === 'Online'}
                      onChange={() => {
                        setPaymentMethod('Online');
                        setOnlineVerified(false);
                      }}
                    />
                    <div className="radio-card-content">
                      <i className="fas fa-qrcode icon-online"></i>
                      <span>UPI QR</span>
                    </div>
                  </label>

                  <label className={`pos-pay-radio-card ${paymentMethod === 'Split' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="posPayMethod"
                      value="Split"
                      checked={paymentMethod === 'Split'}
                      onChange={() => setPaymentMethod('Split')}
                    />
                    <div className="radio-card-content">
                      <i className="fas fa-arrows-split-up-and-left icon-split"></i>
                      <span>Split Dual</span>
                    </div>
                  </label>

                  <label className={`pos-pay-radio-card ${paymentMethod === 'Card' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="posPayMethod"
                      value="Card"
                      checked={paymentMethod === 'Card'}
                      onChange={() => setPaymentMethod('Card')}
                    />
                    <div className="radio-card-content">
                      <i className="fas fa-credit-card icon-card"></i>
                      <span>Card</span>
                    </div>
                  </label>

                  <label className={`pos-pay-radio-card ${paymentMethod === 'Credit' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="posPayMethod"
                      value="Credit"
                      checked={paymentMethod === 'Credit'}
                      onChange={() => setPaymentMethod('Credit')}
                    />
                    <div className="radio-card-content">
                      <i className="fas fa-user-clock icon-credit"></i>
                      <span>Credit</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Mode-Specific Dynamic Panels */}
              {paymentMethod === 'Cash' && (
                <div className="pos-cash-panel">
                  <label className="pos-field-sublabel">Cash Tendered ({CFG.currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="pos-tendered-input"
                    value={tendered}
                    onChange={(e) => setTendered(e.target.value)}
                    placeholder={String(totals.grand)}
                  />
                  <div className="tender-chips">
                    <button type="button" className="tender-chip" onClick={() => setTendered(String(totals.grand))}>Exact ({money(totals.grand)})</button>
                    <button type="button" className="tender-chip" onClick={() => setTendered(String((Number(tendered) || 0) + 10))}>+10</button>
                    <button type="button" className="tender-chip" onClick={() => setTendered(String((Number(tendered) || 0) + 50))}>+50</button>
                    <button type="button" className="tender-chip" onClick={() => setTendered(String((Number(tendered) || 0) + 100))}>+100</button>
                    <button type="button" className="tender-chip" onClick={() => setTendered(String((Number(tendered) || 0) + 500))}>+500</button>
                    <button type="button" className="tender-chip" onClick={() => setTendered(String(Math.ceil(totals.grand / 50) * 50))}>Round 50</button>
                    <button type="button" className="tender-chip" onClick={() => setTendered(String(Math.ceil(totals.grand / 100) * 100))}>Round 100</button>
                    <button type="button" className="tender-chip chip-clear" onClick={() => setTendered('')}>Clear</button>
                  </div>
                </div>
              )}

              {paymentMethod === 'Online' && (
                <div className="pos-online-panel">
                  <DynamicUpiQr
                    amount={totals.grand}
                    upiId={customUpiId || CFG.upiId}
                    payeeName={CFG.upiPayeeName || CFG.business?.name}
                    invoiceNote={`Bill Payment (${cart.length} items)`}
                    onEditUpi={promptEditUpi}
                  />
                  <div className="pos-verify-toggle-wrap">
                    <label className="pos-verify-label">
                      <input
                        type="checkbox"
                        checked={onlineVerified}
                        onChange={(e) => setOnlineVerified(e.target.checked)}
                      />
                      <span>Payment received &amp; verified in store account</span>
                    </label>
                  </div>
                </div>
              )}

              {paymentMethod === 'Split' && (
                <div className="split-payment-box">
                  <div className="split-header">
                    <span><i className="fas fa-bolt" style={{ color: '#f59e0b' }}></i> Dual Split Payment</span>
                    <span>Bill: <strong>{money(totals.grand)}</strong></span>
                  </div>

                  <div className="split-presets">
                    <button type="button" className="split-preset-btn" onClick={() => setSplitPreset(50)}>50% Cash / 50% Online</button>
                    <button type="button" className="split-preset-btn" onClick={() => { setSplitCash('100'); setSplitOnline(String(Math.max(0, round2(totals.grand - 100)))); }}>₹100 Cash / Rest QR</button>
                    <button type="button" className="split-preset-btn" onClick={() => { setSplitCash('200'); setSplitOnline(String(Math.max(0, round2(totals.grand - 200)))); }}>₹200 Cash / Rest QR</button>
                  </div>

                  <div className="split-inputs-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 11, fontWeight: 700 }}><i className="fas fa-money-bill" style={{ color: '#16a34a' }}></i> Cash Share ({CFG.currency})</label>
                      <input type="number" min="0" step="0.01" value={splitCash} onChange={e => handleSplitCashChange(e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 11, fontWeight: 700 }}><i className="fas fa-qrcode" style={{ color: '#0284c7' }}></i> Online Share ({CFG.currency})</label>
                      <input type="number" min="0" step="0.01" value={splitOnline} onChange={e => handleSplitOnlineChange(e.target.value)} placeholder="0.00" />
                    </div>
                  </div>

                  <div style={{ margin: '8px 0' }}>
                    <div className={`split-balance-bar ${isSplitMatched ? 'match' : 'diff'}`}>
                      <span>{isSplitMatched ? '✓ Split Perfectly Balanced' : `Difference: ${splitDiff > 0 ? money(splitDiff) + ' remaining' : money(Math.abs(splitDiff)) + ' excess'}`}</span>
                      <span>Total: {money(splitSum)} / {money(totals.grand)}</span>
                    </div>
                  </div>

                  {(Number(splitCash) || 0) > 0 && (
                    <div className="form-group" style={{ marginTop: 6, marginBottom: 8 }}>
                      <label style={{ fontSize: 11 }}>Cash Tendered for Cash Portion (optional)</label>
                      <input type="number" min="0" step="0.01" value={tendered} onChange={e => setTendered(e.target.value)} placeholder={String(splitCash)} />
                    </div>
                  )}

                  {(Number(splitOnline) || 0) > 0 && (
                    <DynamicUpiQr
                      amount={Number(splitOnline) || 0}
                      upiId={customUpiId || CFG.upiId}
                      payeeName={CFG.upiPayeeName || CFG.business?.name}
                      invoiceNote={'Split Bill QR Share'}
                      onEditUpi={promptEditUpi}
                    />
                  )}
                </div>
              )}

              {/* Bottom Actions */}
              <div className="pos-checkout-btn-group">
                <button
                  type="button"
                  className="btn btn-secondary pos-hold-btn"
                  disabled={cart.length === 0}
                  onClick={holdSale}
                  title="Hold sale for later"
                >
                  <i className="fas fa-pause"></i> Hold
                </button>
                <button
                  type="button"
                  className="btn-checkout-primary"
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                >
                  <div className="checkout-btn-inner">
                    <span><i className="fas fa-check-circle"></i> Complete Sale &amp; Print</span>
                    <span className="checkout-total-pill">{money(totals.grand)}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {showCamera && <CameraScanModal onDetected={handleDetected} onClose={() => setShowCamera(false)} />}
          {completedSale && <ThermalReceiptOverlay sale={completedSale} onClose={() => setCompletedSale(null)} />}
        </div>
      );
    }

    // --- Process Return (against a past sale) ---
    function ReturnModal({ sale, returns, user, onClose, onDone }) {
      const already = useMemo(() => (sale.items || []).map(it => computeReturnedQty(sale.id, it.productId, returns)), [sale, returns]);
      const [qtys, setQtys] = useState(() => (sale.items || []).map(() => 0));
      const [saving, setSaving] = useState(false);

      const remaining = (idx) => sale.items[idx].qty - already[idx];
      const setQty = (idx, val) => {
        const max = remaining(idx);
        const v = Math.max(0, Math.min(max, Number(val) || 0));
        setQtys(prev => prev.map((q, i) => i === idx ? v : q));
      };

      const totalRefund = useMemo(() => qtys.reduce((s, q, i) => s + q * sale.items[i].price, 0), [qtys, sale.items]);

      const handleSubmit = async (e) => {
        e.preventDefault();
        const items = sale.items
          .map((it, i) => ({ productId: it.productId, name: it.name, sku: it.sku, qty: qtys[i], price: it.price, lineTotal: qtys[i] * it.price }))
          .filter(it => it.qty > 0);
        if (!items.length) return Swal.fire({ icon: 'warning', title: 'Nothing Selected', text: 'Enter a return quantity for at least one item' });
        setSaving(true);
        const result = await fbCreateReturn(sale.id, items, user);
        setSaving(false);
        if (result.success) {
          Swal.fire({ icon: 'success', title: 'Return Processed', text: 'Refund: ' + money(totalRefund), timer: 2000, showConfirmButton: false });
          onDone();
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: result.message });
        }
      };

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-rotate-left"></i> Process Return - Sale {String(sale.id).slice(-6).toUpperCase()}</h3>
              <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="about-table-wrapper">
                  <table className="about-roles-table">
                    <thead><tr><th>Item</th><th>Sold</th><th>Already Returned</th><th>Return Qty</th><th>Refund</th></tr></thead>
                    <tbody>
                      {sale.items.map((it, i) => (
                        <tr key={it.sku || i}>
                          <td>{it.name}</td>
                          <td>{it.qty}</td>
                          <td>{already[i]}</td>
                          <td><input type="number" min="0" max={remaining(i)} value={qtys[i]} onChange={(e) => setQty(i, e.target.value)} style={{ width: '80px' }} /></td>
                          <td>{money(qtys[i] * it.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="stock-onhand-hint" style={{ marginTop: '16px' }}>Total Refund: <strong>{money(totalRefund)}</strong></p>
                <div className="form-actions">
                  <button type="submit" className="btn btn-danger" disabled={saving}>{saving ? <><i className="fas fa-spinner fa-spin"></i> Processing...</> : <><i className="fas fa-rotate-left"></i> Process Return</>}</button>
                  <button type="button" className="btn btn-secondary" onClick={onClose}><i className="fas fa-times"></i> Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // --- Sales History (view past sales, reprint receipts, process returns) ---
