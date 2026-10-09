const PRESET_LOGOS = [
  { name: 'Supermarket Cart', url: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png' },
  { name: 'Kirana Grocery', url: 'https://cdn-icons-png.flaticon.com/512/372/372627.png' },
  { name: 'Fresh Mart Green', url: 'https://cdn-icons-png.flaticon.com/512/2981/2981297.png' },
  { name: 'Shree Ganesh Mart', url: 'https://cdn-icons-png.flaticon.com/512/3759/3759041.png' },
  { name: 'Departmental Store', url: 'https://cdn-icons-png.flaticon.com/512/1170/1170678.png' },
  { name: 'Wholesale Trade', url: 'https://cdn-icons-png.flaticon.com/512/2897/2897818.png' }
];
function SettingsView({ user, role }) {
      const { settings, categories, refreshConfig } = useConfig();
      const [form, setForm] = useState(settings || {});
      const [activeTab, setActiveTab] = useState('shop');
      const [saving, setSaving] = useState(false);
      const [load, setLoad] = useState('');
      const logoInputRef = useRef(null);
      const backupInputRef = useRef(null);

      useEffect(() => { setForm(settings || {}); }, [settings]);
      const upd = (k, v) => setForm(f => Object.assign({}, f, { [k]: v }));

      const handleLogoFile = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => upd('logoUrl', e.target.result);
        reader.readAsDataURL(file);
      };

      const save = async () => {
        setSaving(true);
        const payload = {
          businessName: form.businessName || 'Retail & Wholesale Store',
          phone: form.phone || '',
          email: form.email || '',
          address: form.address || '',
          mapLink: form.mapLink || '',
          logoUrl: form.logoUrl || '',
          storeHeadline: form.storeHeadline || '',
          storeAbout: form.storeAbout || '',
          heroBannerUrl: form.heroBannerUrl || '',
          announcement: form.announcement || '',
          isStoreOpen: form.isStoreOpen !== false,
          openingTime: form.openingTime || '08:00',
          closingTime: form.closingTime || '22:00',
          lastOrderMinutes: Number(form.lastOrderMinutes) || 30,
          weeklySchedule: form.weeklySchedule || 'Mon-Sun: 8:00 AM - 10:00 PM',
          isPaused: !!form.isPaused,
          pauseReason: form.pauseReason || '',
          defaultPrepTime: Number(form.defaultPrepTime) || 10,
          deliveryEnabled: form.deliveryEnabled !== false,
          deliveryFee: Number(form.deliveryFee) || 0,
          minOrderAmount: Number(form.minOrderAmount) || 0,
          wholesaleDiscountPct: Number(form.wholesaleDiscountPct) || 15,
          defaultWholesaleMoq: Number(form.defaultWholesaleMoq) || 5,
          gstinNumber: form.gstinNumber || '',
          defaultHsn: form.defaultHsn || '',
          availableUnits: form.availableUnits || 'Pcs, Box, Carton, Kg, Gram, Pack, Dozen, Ltr, Meter, Bundle',
          currencySymbol: form.currencySymbol || '₹',
          currencyCode: form.currencyCode || 'INR',
          currencyDecimals: Number(form.currencyDecimals) || 2,
          taxRate: Number(form.taxRate) || 0,
          taxInclusive: !!form.taxInclusive,
          lowStockDefault: Number(form.lowStockDefault) || 5,
          paymentInstructions: form.paymentInstructions || '',
          requireReceiptUpload: !!form.requireReceiptUpload,
          invoicePrefix: form.invoicePrefix || 'INV-',
          receiptHeader: form.receiptHeader || '',
          receiptFooter: form.receiptFooter || '',
          receiptRollWidth: form.receiptRollWidth || '80mm',
          dateFormat: form.dateFormat || 'DD/MM/YYYY',
          notifyAdminEmail: form.notifyAdminEmail || '',
          orderEmailAlerts: form.orderEmailAlerts !== false,
          whatsappTemplate: form.whatsappTemplate || '',
          nightlyBackupEnabled: form.nightlyBackupEnabled !== false
        };
        const r = await fbSaveSettings(payload, user);
        setSaving(false);
        if (r.success) {
          applySettings(payload);
          refreshConfig();
          Swal.fire({ icon: 'success', title: 'Settings Saved', text: 'All changes saved to database', timer: 1500, showConfirmButton: false });
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: r.message });
        }
      };

      const handleExportBackup = async () => {
        setLoad('Exporting backup...');
        const res = await fbExportDatabase();
        setLoad('');
        if (res.success) {
          const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'pos_backup_' + new Date().toISOString().slice(0, 10) + '.json';
          a.click();
          URL.revokeObjectURL(url);
          Swal.fire({ icon: 'success', title: 'Backup Downloaded', timer: 1500, showConfirmButton: false });
        }
      };

      const handleRestoreBackup = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const data = JSON.parse(evt.target.result);
            setLoad('Restoring...');
            const res = await fbRestoreDatabase(data, user);
            setLoad('');
            if (res.success) {
              refreshConfig();
              Swal.fire({ icon: 'success', title: 'Restored Successfully', timer: 1600, showConfirmButton: false });
            }
          } catch (err) {
            Swal.fire({ icon: 'error', title: 'Invalid JSON file' });
          }
        };
        reader.readAsText(file);
      };

      const TAB_ITEMS = [
        { id: 'shop', title: 'Shop', sub: 'Name, contact and logo', icon: 'fa-store', heroDesc: 'Shown on the storefront and printed on every receipt.' },
        { id: 'storefront', title: 'Storefront', sub: 'Headline, about text, banner', icon: 'fa-shop', heroDesc: 'Header title, brand story and promotional banner for your customers.' },
        { id: 'hours', title: 'Opening hours', sub: 'Weekly hours, last order', icon: 'fa-clock', heroDesc: 'Set standard store operating hours and order cut-off times.' },
        { id: 'ordering', title: 'Ordering & pickup', sub: 'Pause, prep time, delivery', icon: 'fa-bag-shopping', heroDesc: 'Kitchen preparation lead time, pause status and delivery options.' },
        { id: 'wholesale', title: 'Wholesale & Tax', sub: 'Wholesale rules, GST & units', icon: 'fa-boxes-stacked', heroDesc: 'Wholesale pricing rules, minimum order quantity (MOQ) and default GST/tax rules.' },
        { id: 'currency', title: 'Currency', sub: 'Symbol and decimals', icon: 'fa-coins', heroDesc: 'Store currency, price formatting decimals and default sales tax.' },
        { id: 'receipts', title: 'Payments & receipts', sub: 'Receipt upload rules', icon: 'fa-receipt', heroDesc: 'Customer payment instructions and payment verification rules.' },
        { id: 'notifications', title: 'Notifications', sub: 'Shop + customer emails', icon: 'fa-bell', heroDesc: 'Alert emails and customer pickup WhatsApp alert templates.' },
        { id: 'printing', title: 'Printing & dates', sub: 'Receipt roll, letterhead, dates', icon: 'fa-print', heroDesc: 'Thermal printer paper roll width, date formats and letterhead.' },
        { id: 'backup', title: 'Backup & maintenance', sub: 'Nightly backup, safety tools', icon: 'fa-shield-halved', heroDesc: 'Automated cloud snapshot schedule and JSON export / restore tools.' }
      ];

      const currentMeta = TAB_ITEMS.find(t => t.id === activeTab) || TAB_ITEMS[0];

      return (
        <div className="data-section" style={{ background: 'transparent', padding: 0 }}>
          {load && <TopLoadingBar />}
          <div className="settings-two-col">
            
            {/* Left Subnav Column (Matching Screenshot 1) */}
            <div className="settings-left-nav">
              <div className="settings-nav-header">
                <div className="settings-nav-header-icon">
                  <i className="fas fa-gear"></i>
                </div>
                <div className="settings-nav-header-text">
                  <h3>Settings</h3>
                  <span>{form.businessName || 'Retail & Wholesale Store'}</span>
                </div>
              </div>

              <div>
                {TAB_ITEMS.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={'settings-subnav-btn' + (activeTab === t.id ? ' active' : '')}
                    onClick={() => setActiveTab(t.id)}
                  >
                    <div className="settings-subnav-icon">
                      <i className={'fas ' + t.icon}></i>
                    </div>
                    <div className="settings-subnav-text">
                      <h4>{t.title}</h4>
                      <p>{t.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Content Column (Matching Screenshot 1) */}
            <div className="settings-right-content">
              
              {/* Hero Banner Card */}
              <div className="settings-hero-card">
                <div className="settings-hero-icon">
                  <i className={'fas ' + currentMeta.icon}></i>
                </div>
                <div>
                  <h2>{currentMeta.title}</h2>
                  <p>{currentMeta.heroDesc}</p>
                </div>
              </div>

              {/* 1. Shop Tab */}
              {activeTab === 'shop' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
                  {/* Left Column: Form Fields */}
                  <LteCard title="Shop Identity & Logo" icon="fa-id-card">
                    <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                      Configure your official store name, logo, contact and tax info printed on every bill receipt.
                    </p>

                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label style={{ fontWeight: 700 }}>Shop / Store Name *</label>
                      <input
                        type="text"
                        value={form.businessName || ''}
                        onChange={e => upd('businessName', e.target.value)}
                        placeholder="e.g. Rahul Kirana & Supermarket"
                        style={{ fontSize: 14, fontWeight: 700 }}
                        required
                      />
                    </div>

                    <div className="form-grid" style={{ marginBottom: 12 }}>
                      <div className="form-group">
                        <label><i className="fas fa-tag"></i> Store Tagline</label>
                        <input
                          type="text"
                          value={form.storeHeadline || ''}
                          onChange={e => upd('storeHeadline', e.target.value)}
                          placeholder="e.g. Pure Desi Ghee & Fresh Groceries"
                        />
                      </div>
                      <div className="form-group">
                        <label><i className="fas fa-file-invoice"></i> GSTIN / Tax Number</label>
                        <input
                          type="text"
                          value={form.gstinNumber || ''}
                          onChange={e => upd('gstinNumber', e.target.value)}
                          placeholder="e.g. 07AAAAA0000A1Z5"
                        />
                      </div>
                    </div>

                    <div className="form-grid" style={{ marginBottom: 12 }}>
                      <div className="form-group">
                        <label><i className="fas fa-phone"></i> Phone / Mobile</label>
                        <input
                          type="text"
                          value={form.phone || ''}
                          onChange={e => upd('phone', e.target.value)}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div className="form-group">
                        <label><i className="fas fa-envelope"></i> Email (Optional)</label>
                        <input
                          type="email"
                          value={form.email || ''}
                          onChange={e => upd('email', e.target.value)}
                          placeholder="store@example.com"
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label><i className="fas fa-location-dot"></i> Full Address (Shown on receipt)</label>
                      <textarea
                        rows="2"
                        value={form.address || ''}
                        onChange={e => upd('address', e.target.value)}
                        placeholder="Shop No. 12, Main Market, City - PIN"
                      ></textarea>
                    </div>

                    {/* Logo Section */}
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label style={{ fontWeight: 700, display: 'block', marginBottom: 8 }}>
                        <i className="fas fa-image"></i> Shop Logo (Printed on all receipts)
                      </label>
                      
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          border: '2px dashed #cbd5e1',
                          padding: '16px',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          marginBottom: 12
                        }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) handleLogoFile(e.dataTransfer.files[0]);
                        }}
                      >
                        <div style={{ width: 70, height: 70, borderRadius: 8, background: '#ffffff', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 4 }}>
                          {form.logoUrl ? (
                            <img src={form.logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          ) : (
                            <i className="fas fa-store" style={{ color: '#94a3b8', fontSize: 28 }}></i>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Upload Custom Store Logo</div>
                          <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 8 }}>JPG, PNG or SVG · Auto-compressed for instant fast printing</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleLogoFile(e.target.files[0])} />
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => logoInputRef.current && logoInputRef.current.click()}>
                              <i className="fas fa-upload" style={{ marginRight: 4 }}></i> Choose Photo
                            </button>
                            {form.logoUrl && (
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => upd('logoUrl', '')} style={{ color: '#ef4444' }}>
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ready-Made Supermarket Logos */}
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                          Or Pick a Ready-Made Supermarket / Kirana Logo:
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          {PRESET_LOGOS.map((pl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => upd('logoUrl', pl.url)}
                              style={{
                                padding: '8px 6px',
                                borderRadius: 8,
                                border: (form.logoUrl === pl.url) ? '2px solid var(--navy-accent)' : '1px solid #cbd5e1',
                                background: (form.logoUrl === pl.url) ? '#e0f2fe' : '#ffffff',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <img src={pl.url} alt="" style={{ width: 34, height: 34, objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} />
                              <span style={{ fontSize: 10, color: '#334155', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <label><i className="fas fa-comment-dots"></i> Bill Receipt Footer Note</label>
                      <input
                        type="text"
                        value={form.receiptFooter || ''}
                        onChange={e => upd('receiptFooter', e.target.value)}
                        placeholder="e.g. Bika hua maal wapas nahi hoga · Thank you!"
                      />
                    </div>
                  </LteCard>

                  {/* Right Column: Live Thermal Print Preview */}
                  <div>
                    <LteCard title="Live Receipt Print Preview" icon="fa-receipt">
                      <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
                        Live preview of how your logo, shop name and address will print on customer bills:
                      </div>

                      <div style={{
                        background: '#ffffff',
                        border: '1px dashed #94a3b8',
                        padding: '16px 14px',
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: 12,
                        borderRadius: 6,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        color: '#0f172a',
                        maxWidth: 320,
                        margin: '0 auto'
                      }}>
                        <div style={{ textAlign: 'center', marginBottom: 10 }}>
                          {form.logoUrl ? (
                            <img src={form.logoUrl} alt="Logo" style={{ maxWidth: 80, maxHeight: 55, objectFit: 'contain', margin: '0 auto 6px', display: 'block' }} />
                          ) : (
                            <div style={{ fontSize: 24, marginBottom: 4 }}><i className="fas fa-store"></i></div>
                          )}
                          <div style={{ fontWeight: 800, fontSize: 14.5, textTransform: 'uppercase' }}>
                            {form.businessName || 'YOUR SHOP NAME'}
                          </div>
                          {form.storeHeadline ? <div style={{ fontSize: 10.5, fontStyle: 'italic', color: '#475569' }}>{form.storeHeadline}</div> : null}
                          {form.address ? <div style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>{form.address}</div> : null}
                          {form.phone ? <div style={{ fontSize: 11, color: '#334155' }}>Ph: {form.phone}</div> : null}
                          {form.gstinNumber ? <div style={{ fontSize: 11, fontWeight: 700 }}>GSTIN: {form.gstinNumber}</div> : null}
                          <div style={{ fontWeight: 700, borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '3px 0', margin: '8px 0 4px', fontSize: 11 }}>
                            --- TAX INVOICE / RETAIL BILL ---
                          </div>
                        </div>

                        <div style={{ fontSize: 11, marginBottom: 6 }}>
                          <div>Date: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          <div>Bill No: INV-SAMPLE-01</div>
                          <div>Customer: Walk-in</div>
                        </div>

                        <div style={{ borderTop: '1px dashed #94a3b8', borderBottom: '1px dashed #94a3b8', padding: '4px 0', margin: '6px 0', fontSize: 11 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                            <span>Item</span><span>Total</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                            <span>Basmati Rice 5kg</span><span>{form.currencySymbol || '₹'} 450.00</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                            <span>Pure Mustard Oil 1L</span><span>{form.currencySymbol || '₹'} 160.00</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 13, margin: '6px 0' }}>
                          <span>GRAND TOTAL</span>
                          <span>{form.currencySymbol || '₹'} 610.00</span>
                        </div>

                        <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: 8, marginTop: 10, fontSize: 10.5, color: '#475569' }}>
                          <div>{form.receiptFooter || 'Thank you for shopping with us! Visit again.'}</div>
                        </div>
                      </div>
                    </LteCard>
                  </div>
                </div>
              )}

              {/* 2. Storefront Tab */}
              {activeTab === 'storefront' && (
                <LteCard title="Storefront details" icon="fa-shop">
                  <div className="form-group">
                    <label>Store Headline</label>
                    <input type="text" value={form.storeHeadline || ''} onChange={e => upd('storeHeadline', e.target.value)} placeholder="Specialty Handcrafted Boba Drinks & Artisanal Coffee" />
                  </div>
                  <div className="form-group">
                    <label>About Text</label>
                    <textarea rows="3" value={form.storeAbout || ''} onChange={e => upd('storeAbout', e.target.value)} placeholder="Our story, fresh tea brewing process, and ingredients..."></textarea>
                  </div>
                  <div className="form-group">
                    <label>Hero Banner Image URL</label>
                    <input type="text" value={form.heroBannerUrl || ''} onChange={e => upd('heroBannerUrl', e.target.value)} placeholder="https://... banner.jpg" />
                  </div>
                  <div className="form-group">
                    <label>Top Announcement Bar</label>
                    <input type="text" value={form.announcement || ''} onChange={e => upd('announcement', e.target.value)} placeholder="e.g. Free Toppings on all Fruit Teas today!" />
                  </div>
                </LteCard>
              )}

              {/* 3. Opening Hours */}
              {activeTab === 'hours' && (
                <LteCard title="Weekly Operating Schedule" icon="fa-clock">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Opening Time</label>
                      <input type="time" value={form.openingTime || '08:00'} onChange={e => upd('openingTime', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Closing Time</label>
                      <input type="time" value={form.closingTime || '22:00'} onChange={e => upd('closingTime', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Last Online Order (Minutes before close)</label>
                      <input type="number" min="0" value={form.lastOrderMinutes || 30} onChange={e => upd('lastOrderMinutes', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label><i className="fas fa-store"></i> Store Open Right Now</label>
                      <div>
                        <label className="switch-pill"><input type="checkbox" checked={form.isStoreOpen !== false} onChange={e => upd('isStoreOpen', e.target.checked)} /><span className="switch-slider"></span></label>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Weekly Schedule Note</label>
                    <input type="text" value={form.weeklySchedule || ''} onChange={e => upd('weeklySchedule', e.target.value)} placeholder="Monday - Sunday: 8:00 AM - 10:00 PM" />
                  </div>
                </LteCard>
              )}

              {/* 4. Ordering & Pickup */}
              {activeTab === 'ordering' && (
                <LteCard title="Ordering & Pickup Configuration" icon="fa-bag-shopping">
                  <div className="form-grid">
                    <div className="form-group">
                      <label><i className="fas fa-pause"></i> Temporary Pause Online Ordering</label>
                      <div><label className="switch-pill"><input type="checkbox" checked={!!form.isPaused} onChange={e => upd('isPaused', e.target.checked)} /><span className="switch-slider"></span></label></div>
                    </div>
                    <div className="form-group">
                      <label>Default Kitchen Preparation Time (Minutes)</label>
                      <input type="number" min="1" value={form.defaultPrepTime || 10} onChange={e => upd('defaultPrepTime', e.target.value)} />
                    </div>
                  </div>
                  {form.isPaused && (
                    <div className="form-group">
                      <label>Pause Reason (Shown to visitors)</label>
                      <input type="text" value={form.pauseReason || ''} onChange={e => upd('pauseReason', e.target.value)} placeholder="Kitchen at peak capacity, orders resuming in 20 minutes." />
                    </div>
                  )}
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Delivery Fee</label>
                      <input type="number" step="0.01" min="0" value={form.deliveryFee || 0} onChange={e => upd('deliveryFee', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Minimum Order Amount</label>
                      <input type="number" step="0.01" min="0" value={form.minOrderAmount || 0} onChange={e => upd('minOrderAmount', e.target.value)} />
                    </div>
                  </div>
                </LteCard>
              )}

              {/* 5. Wholesale & Tax Configuration */}
              {activeTab === 'wholesale' && (
                <LteCard title="Wholesale Rules & Tax Setup" icon="fa-boxes-stacked">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Default Wholesale Discount (% off MRP)</label>
                      <input type="number" step="0.1" min="0" max="100" value={form.wholesaleDiscountPct || 15} onChange={e => upd('wholesaleDiscountPct', Number(e.target.value))} placeholder="15" />
                    </div>
                    <div className="form-group">
                      <label>Default Wholesale Minimum Qty (MOQ)</label>
                      <input type="number" min="1" value={form.defaultWholesaleMoq || 5} onChange={e => upd('defaultWholesaleMoq', Number(e.target.value))} placeholder="5" />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>GSTIN / Tax Registration Number</label>
                      <input type="text" value={form.gstinNumber || ''} onChange={e => upd('gstinNumber', e.target.value)} placeholder="e.g. 07AAAAA0000A1Z5" />
                    </div>
                    <div className="form-group">
                      <label>Default HSN / SAC Code</label>
                      <input type="text" value={form.defaultHsn || ''} onChange={e => upd('defaultHsn', e.target.value)} placeholder="e.g. 1006" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Units of Measurement (Comma separated)</label>
                    <input type="text" value={form.availableUnits || 'Pcs, Box, Carton, Kg, Gram, Pack, Dozen, Ltr, Meter, Bundle'} onChange={e => upd('availableUnits', e.target.value)} placeholder="Pcs, Box, Carton, Kg, Gram, Pack, Dozen, Ltr, Meter, Bundle" />
                  </div>
                </LteCard>
              )}

              {/* 6. Currency */}
              {activeTab === 'currency' && (
                <LteCard title="Currency & Pricing Configuration" icon="fa-coins">
                  {/* Quick Preset Buttons */}
                  <div style={{ marginBottom: 18, background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 8 }}>
                      <i className="fas fa-bolt" style={{ color: '#eab308', marginRight: 6 }}></i>
                      Quick Currency Presets (1-Click Set):
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { code: 'INR', sym: '₹', label: 'INR (₹ - Indian Rupee)' },
                        { code: 'USD', sym: '$', label: 'USD ($ - US Dollar)' },
                        { code: 'EUR', sym: '€', label: 'EUR (€ - Euro)' },
                        { code: 'GBP', sym: '£', label: 'GBP (£ - British Pound)' },
                        { code: 'AED', sym: 'AED', label: 'AED (Dirham)' },
                        { code: 'NPR', sym: 'Rs.', label: 'NPR (Rs - Nepal)' },
                        { code: 'BDT', sym: '৳', label: 'BDT (৳ - Bangladesh)' }
                      ].map(cur => (
                        <button
                          key={cur.code}
                          type="button"
                          onClick={() => { upd('currencySymbol', cur.sym); upd('currencyCode', cur.code); }}
                          style={{
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            borderRadius: 6,
                            border: (form.currencyCode === cur.code) ? '2px solid var(--navy-accent)' : '1px solid #cbd5e1',
                            background: (form.currencyCode === cur.code) ? '#e0f2fe' : '#ffffff',
                            color: (form.currencyCode === cur.code) ? '#0369a1' : '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          {cur.label}
                        </button>
                      ))}
                    </div>
                    {/* Live Preview */}
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Live Bill Display Preview:</span>
                      <strong style={{ fontSize: 16, color: '#16a34a' }}>
                        {form.currencySymbol || '₹'} {Number(1450.5).toLocaleString('en-US', { minimumFractionDigits: form.currencyDecimals ?? 2, maximumFractionDigits: form.currencyDecimals ?? 2 })}
                      </strong>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Currency Symbol</label>
                      <input type="text" value={form.currencySymbol || '₹'} onChange={e => upd('currencySymbol', e.target.value)} placeholder="₹" />
                    </div>
                    <div className="form-group">
                      <label>Currency Code</label>
                      <input type="text" value={form.currencyCode || 'INR'} onChange={e => upd('currencyCode', e.target.value)} placeholder="INR" />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Currency Decimals</label>
                      <select value={form.currencyDecimals ?? 2} onChange={e => upd('currencyDecimals', Number(e.target.value))}>
                        <option value={2}>2 Decimals (₹10.50)</option>
                        <option value={0}>0 Decimals (Whole ₹500)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Default Tax Rate (%)</label>
                      <input type="number" step="0.01" min="0" value={form.taxRate ?? ''} onChange={e => upd('taxRate', e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label><i className="fas fa-toggle-on"></i> Prices Include Tax</label>
                    <div><label className="switch-pill"><input type="checkbox" checked={!!form.taxInclusive} onChange={e => upd('taxInclusive', e.target.checked)} /><span className="switch-slider"></span></label></div>
                  </div>
                </LteCard>
              )}

              {/* 7. Payments & Receipts */}
              {activeTab === 'receipts' && (
                <LteCard title="Receipts & Slip Verification" icon="fa-receipt">
                  <div className="form-group">
                    <label><i className="fas fa-file-arrow-up"></i> Require Slip / Receipt Upload for Online Payments</label>
                    <div><label className="switch-pill"><input type="checkbox" checked={!!form.requireReceiptUpload} onChange={e => upd('requireReceiptUpload', e.target.checked)} /><span className="switch-slider"></span></label></div>
                  </div>
                  <div className="form-group">
                    <label>Payment Instructions (Shown at checkout)</label>
                    <textarea rows="2" value={form.paymentInstructions || ''} onChange={e => upd('paymentInstructions', e.target.value)} placeholder="Please make payment and upload receipt screenshot above."></textarea>
                  </div>
                  <div className="form-group">
                    <label>Receipt Header Note</label>
                    <textarea rows="2" value={form.receiptHeader || ''} onChange={e => upd('receiptHeader', e.target.value)} placeholder="Welcome to Soft Drink Shop! Freshly brewed every day."></textarea>
                  </div>
                  <div className="form-group">
                    <label>Receipt Footer Note</label>
                    <textarea rows="2" value={form.receiptFooter || ''} onChange={e => upd('receiptFooter', e.target.value)} placeholder="Thank you for visiting! Follow us on Instagram @softdrinkshop"></textarea>
                  </div>
                </LteCard>
              )}

              {/* 8. Notifications */}
              {activeTab === 'notifications' && (
                <LteCard title="Email & WhatsApp Notifications" icon="fa-bell">
                  <div className="form-group">
                    <label>Shop Admin Notification Email</label>
                    <input type="email" value={form.notifyAdminEmail || ''} onChange={e => upd('notifyAdminEmail', e.target.value)} placeholder="orders@drinkshop.com" />
                  </div>
                  <div className="form-group">
                    <label><i className="fas fa-envelope"></i> Send Order Confirmations via Email</label>
                    <div><label className="switch-pill"><input type="checkbox" checked={form.orderEmailAlerts !== false} onChange={e => upd('orderEmailAlerts', e.target.checked)} /><span className="switch-slider"></span></label></div>
                  </div>
                  <div className="form-group">
                    <label><i className="fab fa-whatsapp"></i> WhatsApp Order Ready Message Template</label>
                    <textarea rows="3" value={form.whatsappTemplate || ''} onChange={e => upd('whatsappTemplate', e.target.value)} placeholder="Hello {customer}, your beverage order #{invoice} is fresh and ready for pickup!"></textarea>
                    <small style={{ color: '#64748b' }}>Tokens: <code>{'{customer}'}</code>, <code>{'{invoice}'}</code>, <code>{'{amount}'}</code></small>
                  </div>
                </LteCard>
              )}

              {/* 9. Printing & Dates */}
              {activeTab === 'printing' && (
                <LteCard title="Hardware Printing & Date Formats" icon="fa-print">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Thermal Receipt Roll Width</label>
                      <select value={form.receiptRollWidth || '80mm'} onChange={e => upd('receiptRollWidth', e.target.value)}>
                        <option value="80mm">80mm (Standard POS Counter Printer)</option>
                        <option value="58mm">58mm (Compact Mobile Bluetooth Printer)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Display Date Format</label>
                      <select value={form.dateFormat || 'DD/MM/YYYY'} onChange={e => upd('dateFormat', e.target.value)}>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/12/2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 12/25/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-12-25)</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Invoice Number Prefix</label>
                    <input type="text" value={form.invoicePrefix || 'INV-'} onChange={e => upd('invoicePrefix', e.target.value)} placeholder="INV-" />
                  </div>
                </LteCard>
              )}

              {/* 10. Backup & Maintenance */}
              {activeTab === 'backup' && (
                <LteCard title="Database Safety & Backup" icon="fa-shield-halved">
                  <div className="form-group" style={{ marginBottom: 18 }}>
                    <label><i className="fas fa-cloud-arrow-up"></i> Nightly Automatic Database Snapshot</label>
                    <div><label className="switch-pill"><input type="checkbox" checked={form.nightlyBackupEnabled !== false} onChange={e => upd('nightlyBackupEnabled', e.target.checked)} /><span className="switch-slider"></span></label></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                    <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: 14.5 }}><i className="fas fa-download"></i> Export Database (JSON)</h4>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px 0' }}>Download complete real-time JSON backup of products, sales, customers, and settings.</p>
                      <button type="button" className="btn btn-primary" onClick={handleExportBackup}><i className="fas fa-file-export"></i> Download JSON</button>
                    </div>
                    <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: 14.5 }}><i className="fas fa-upload"></i> Restore Database (JSON)</h4>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px 0' }}>Upload a previous JSON backup file to restore database data.</p>
                      <input ref={backupInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleRestoreBackup} />
                      <button type="button" className="btn btn-secondary" onClick={() => backupInputRef.current && backupInputRef.current.click()}><i className="fas fa-file-import"></i> Upload &amp; Restore</button>
                    </div>
                  </div>
                </LteCard>
              )}

              {/* Sticky Bottom Save Action Bar (Matching Screenshot 1) */}
              <div className="settings-bottom-bar">
                <div className="settings-bottom-status">
                  <span className="status-dot"></span>
                  <span>All changes saved</span>
                </div>
                <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save settings</>}
                </button>
              </div>

            </div>
          </div>
        </div>
      );
    }
