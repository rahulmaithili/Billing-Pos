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
          businessName: form.businessName || 'Demo Drinks',
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
          sugarLevels: form.sugarLevels || '100% (Regular), 70% (Less Sweet), 50% (Half Sweet), 30% (Slight Sweet), 0% (No Sugar)',
          iceLevels: form.iceLevels || 'Regular Ice, Less Ice, No Ice, Warm / Hot',
          availableAddons: form.availableAddons || 'Tapioca Pearls, Coconut Jelly, Grass Jelly, Popping Boba, Cheese Foam',
          currencySymbol: form.currencySymbol || '$',
          currencyCode: form.currencyCode || 'USD',
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
        { id: 'drinks', title: 'Drink options', sub: 'Sugar and ice levels', icon: 'fa-mug-hot', heroDesc: 'Sweetness percentages, ice levels and drink customizations.' },
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
                  <span>{form.businessName || 'Demo Drinks'}</span>
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
                <LteCard title="Shop details" icon="fa-id-card">
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                    Name, contact and the logo used on receipts.
                  </p>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Shop name *</label>
                      <input type="text" value={form.businessName || ''} onChange={e => upd('businessName', e.target.value)} placeholder="Demo Drinks" />
                    </div>
                    <div className="form-group">
                      <label><i className="fas fa-phone"></i> Phone</label>
                      <input type="text" value={form.phone || ''} onChange={e => upd('phone', e.target.value)} placeholder="03001000001" />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label><i className="fas fa-envelope"></i> Email</label>
                      <input type="email" value={form.email || ''} onChange={e => upd('email', e.target.value)} placeholder="shop@demo.com" />
                    </div>
                    <div className="form-group">
                      <label><i className="fas fa-map-location-dot"></i> Map link</label>
                      <input type="text" value={form.mapLink || ''} onChange={e => upd('mapLink', e.target.value)} placeholder="https://maps.google.com/?q=Demo+City" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label><i className="fas fa-location-dot"></i> Address</label>
                    <textarea rows="2" value={form.address || ''} onChange={e => upd('address', e.target.value)} placeholder="Shop 1, Street 1, Demo City"></textarea>
                  </div>
                  <div className="form-group">
                    <label><i className="fas fa-image"></i> Logo</label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        border: '1.5px dashed #cbd5e1',
                        padding: '16px 20px',
                        borderRadius: '8px',
                        background: '#f8fafc'
                      }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) handleLogoFile(e.dataTransfer.files[0]);
                      }}
                    >
                      <div style={{ width: 50, height: 50, borderRadius: 8, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {form.logoUrl ? (
                          <img src={form.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <i className="fas fa-store" style={{ color: '#94a3b8', fontSize: 24 }}></i>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>Drag &amp; drop the logo here</div>
                        <div style={{ fontSize: 11.5, color: '#64748b' }}>PNG with a clear background works best · up to 12 MB</div>
                      </div>
                      <div>
                        <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleLogoFile(e.target.files[0])} />
                        <button type="button" className="btn btn-secondary" style={{ fontSize: 12.5 }} onClick={() => logoInputRef.current && logoInputRef.current.click()}>
                          Choose File
                        </button>
                      </div>
                    </div>
                  </div>
                </LteCard>
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
                        <input type="checkbox" className="toggle" checked={form.isStoreOpen !== false} onChange={e => upd('isStoreOpen', e.target.checked)} />
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
                      <div><input type="checkbox" className="toggle" checked={!!form.isPaused} onChange={e => upd('isPaused', e.target.checked)} /></div>
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

              {/* 5. Drink Options */}
              {activeTab === 'drinks' && (
                <LteCard title="Drink Customization Levels" icon="fa-mug-hot">
                  <div className="form-group">
                    <label>Sugar Sweetness Levels (Comma separated)</label>
                    <textarea rows="2" value={form.sugarLevels || ''} onChange={e => upd('sugarLevels', e.target.value)} placeholder="100% (Regular), 70% (Less Sweet), 50% (Half Sweet), 30% (Slight Sweet), 0% (No Sugar)"></textarea>
                  </div>
                  <div className="form-group">
                    <label>Ice Levels (Comma separated)</label>
                    <textarea rows="2" value={form.iceLevels || ''} onChange={e => upd('iceLevels', e.target.value)} placeholder="Regular Ice, Less Ice, No Ice, Warm / Hot"></textarea>
                  </div>
                  <div className="form-group">
                    <label>Default Available Add-ons (Quick tags)</label>
                    <textarea rows="2" value={form.availableAddons || ''} onChange={e => upd('availableAddons', e.target.value)} placeholder="Tapioca Pearls, Coconut Jelly, Grass Jelly, Popping Boba, Cheese Foam"></textarea>
                  </div>
                </LteCard>
              )}

              {/* 6. Currency */}
              {activeTab === 'currency' && (
                <LteCard title="Currency & Pricing Configuration" icon="fa-coins">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Currency Symbol</label>
                      <input type="text" value={form.currencySymbol || '$'} onChange={e => upd('currencySymbol', e.target.value)} placeholder="$" />
                    </div>
                    <div className="form-group">
                      <label>Currency Code</label>
                      <input type="text" value={form.currencyCode || 'USD'} onChange={e => upd('currencyCode', e.target.value)} placeholder="USD" />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Currency Decimals</label>
                      <select value={form.currencyDecimals ?? 2} onChange={e => upd('currencyDecimals', Number(e.target.value))}>
                        <option value={2}>2 Decimals ($10.50)</option>
                        <option value={0}>0 Decimals (Whole NT$ 100, Rs 500)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Default Tax Rate (%)</label>
                      <input type="number" step="0.01" min="0" value={form.taxRate ?? ''} onChange={e => upd('taxRate', e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label><i className="fas fa-toggle-on"></i> Prices Include Tax</label>
                    <div><input type="checkbox" className="toggle" checked={!!form.taxInclusive} onChange={e => upd('taxInclusive', e.target.checked)} /></div>
                  </div>
                </LteCard>
              )}

              {/* 7. Payments & Receipts */}
              {activeTab === 'receipts' && (
                <LteCard title="Receipts & Slip Verification" icon="fa-receipt">
                  <div className="form-group">
                    <label><i className="fas fa-file-arrow-up"></i> Require Slip / Receipt Upload for Online Payments</label>
                    <div><input type="checkbox" className="toggle" checked={!!form.requireReceiptUpload} onChange={e => upd('requireReceiptUpload', e.target.checked)} /></div>
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
                    <div><input type="checkbox" className="toggle" checked={form.orderEmailAlerts !== false} onChange={e => upd('orderEmailAlerts', e.target.checked)} /></div>
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
                    <div><input type="checkbox" className="toggle" checked={form.nightlyBackupEnabled !== false} onChange={e => upd('nightlyBackupEnabled', e.target.checked)} /></div>
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

    // --- Order Board (Kitchen / Barista Live Queue Kanban) ---
