function AboutView() {
      return (
        <div className="about-section">
          <div className="about-header">
            <div className="about-logo"><img src={LOGO_URL} alt="Developer Logo" /></div>
            <div className="about-title">
              <h1>Firebase Records Manager</h1>
              <p className="about-dev">Developed by <strong>Mohammad Rameez Imdad</strong> (Rameez Scripts)</p>
            </div>
          </div>
          <div className="about-card">
            <h2><i className="fas fa-question-circle"></i> What is this App?</h2>
            <p>So basicaly this is a records + inventory manager that saves evrything straight into a Firebase real-time database. Its used to add/edit/delete records, manage products with printable QR labels, track warehouse Stock In/Out, and ring up QR-scanned sales that print a thermal receipt. Think of it like a digital notebook where somthing you save shows up instantly for evryone else using the app too.</p>
          </div>
          <div className="about-card">
            <h2><i className="fas fa-clipboard-list"></i> What Can You Do With It?</h2>
            <ul className="about-features">
              <li><i className="fas fa-lock"></i> Secure Login</li>
              <li><i className="fas fa-address-book"></i> Customers / CRM</li>
              <li><i className="fas fa-trash"></i> Delete Customers (Admin)</li>
              <li><i className="fas fa-filter"></i> Search & Filter</li>
              <li><i className="fas fa-file-csv"></i> CSV / PDF / Print Export</li>
              <li><i className="fas fa-chart-pie"></i> Dashboard Analytics</li>
              <li><i className="fas fa-history"></i> Activity Logs</li>
              <li><i className="fas fa-bolt"></i> Real-Time Firebase Sync</li>
              <li><i className="fas fa-mobile-alt"></i> Mobile Friendly</li>
              <li><i className="fas fa-qrcode"></i> QR Code Product Labels</li>
              <li><i className="fas fa-dolly"></i> Stock In/Out Tracking</li>
              <li><i className="fas fa-cash-register"></i> QR/Barcode POS Checkout</li>
              <li><i className="fas fa-barcode"></i> Retail Barcode Lookup</li>
              <li><i className="fas fa-receipt"></i> Thermal Receipt Printing</li>
              <li><i className="fas fa-rotate-left"></i> Sales Returns</li>
              <li><i className="fas fa-percent"></i> Discounts &amp; Tax</li>
              <li><i className="fas fa-money-bill-wave"></i> Multiple Payment Methods</li>
              <li><i className="fas fa-pause"></i> Hold / Recall Sale</li>
              <li><i className="fas fa-file-invoice"></i> Sequential Invoices</li>
              <li><i className="fas fa-truck-ramp-box"></i> Bulk Stock Receiving</li>
              <li><i className="fas fa-scale-balanced"></i> Stocktake / Adjustments</li>
              <li><i className="fas fa-money-check-dollar"></i> Landed Cost on Receiving</li>
              <li><i className="fas fa-triangle-exclamation"></i> Reorder Report Printing</li>
              <li><i className="fas fa-users-cog"></i> User Management</li>
              <li><i className="fas fa-truck-field"></i> Supplier Directory</li>
              <li><i className="fas fa-money-bill-trend-up"></i> Expense Tracking</li>
              <li><i className="fas fa-gear"></i> Business Settings</li>
            </ul>
          </div>
          <div className="about-card">
            <h2><i className="fas fa-users-cog"></i> Role-Based Access Control (RBAC) Permissions</h2>
            <p className="mb-24">Security permissions and functional capabilities assigned across store staff roles (Admin, Manager, Cashier, Staff).</p>
            <div className="about-table-wrapper">
              <table className="about-roles-table">
                <thead>
                  <tr>
                    <th>Module / Feature</th>
                    <th><span className="badge badge-admin"><i className="fas fa-crown"></i> Admin</span></th>
                    <th><span className="badge badge-manager"><i className="fas fa-user-tie"></i> Manager</span></th>
                    <th><span className="badge badge-cashier"><i className="fas fa-cash-register"></i> Cashier</span></th>
                    <th><span className="badge badge-staff"><i className="fas fa-boxes-stacked"></i> Stock Staff</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Dashboard &amp; KPIs</td><td><span className="perm-badge perm-full">Full Access</span></td><td><span className="perm-badge perm-manage">Daily Ops</span></td><td><span className="perm-badge perm-view">Shift View</span></td><td><span className="perm-badge perm-none">No Access</span></td></tr>
                  <tr><td>QR Sales / POS Checkout</td><td><span className="perm-badge perm-full">Full Control</span></td><td><span className="perm-badge perm-manage">Manage &amp; Sell</span></td><td><span className="perm-badge perm-operate">Primary Station</span></td><td><span className="perm-badge perm-none">No Access</span></td></tr>
                  <tr><td>Dispatch &amp; Fulfillment Board</td><td><span className="perm-badge perm-view">Audit View</span></td><td><span className="perm-badge perm-manage">Manage Queue</span></td><td><span className="perm-badge perm-view">Ready Status</span></td><td><span className="perm-badge perm-operate">Warehouse</span></td></tr>
                  <tr><td>Payment Review &amp; Slip Verification</td><td><span className="perm-badge perm-full">Full Control</span></td><td><span className="perm-badge perm-manage">Verify &amp; Approve</span></td><td><span className="perm-badge perm-operate">Submit Slips</span></td><td><span className="perm-badge perm-none">No Access</span></td></tr>
                  <tr><td>Products &amp; Catalog</td><td><span className="perm-badge perm-full">Full Control</span></td><td><span className="perm-badge perm-manage">Availability</span></td><td><span className="perm-badge perm-view">Catalog View</span></td><td><span className="perm-badge perm-view">Wholesale Specs</span></td></tr>
                  <tr><td>Packaging &amp; Surcharges</td><td><span className="perm-badge perm-full">Full Control</span></td><td><span className="perm-badge perm-manage">Stock Toggle</span></td><td><span className="perm-badge perm-view">Select in Cart</span></td><td><span className="perm-badge perm-view">Packaging Specs</span></td></tr>
                  <tr><td>Stock In/Out Inventory</td><td><span className="perm-badge perm-full">Full Control</span></td><td><span className="perm-badge perm-manage">Receive &amp; Waste</span></td><td><span className="perm-badge perm-none">No Access</span></td><td><span className="perm-badge perm-operate">Usage Alerts</span></td></tr>
                  <tr><td>Customers &amp; CRM</td><td><span className="perm-badge perm-full">Full Access</span></td><td><span className="perm-badge perm-manage">Edit Profiles</span></td><td><span className="perm-badge perm-operate">Quick Add</span></td><td><span className="perm-badge perm-none">No Access</span></td></tr>
                  <tr><td>Reports &amp; Gross Profit</td><td><span className="perm-badge perm-full">P&amp;L Reports</span></td><td><span className="perm-badge perm-view">Sales Summary</span></td><td><span className="perm-badge perm-view">Shift Close</span></td><td><span className="perm-badge perm-none">No Access</span></td></tr>
                  <tr><td>Payment Methods Configuration</td><td><span className="perm-badge perm-full">Configure All</span></td><td><span className="perm-badge perm-view">View Only</span></td><td><span className="perm-badge perm-none">No Access</span></td><td><span className="perm-badge perm-none">No Access</span></td></tr>
                  <tr><td>System Settings</td><td><span className="perm-badge perm-full">Full Control</span></td><td><span className="perm-badge perm-view">Printer Config</span></td><td><span className="perm-badge perm-none">No Access</span></td><td><span className="perm-badge perm-none">No Access</span></td></tr>
                  <tr><td>User Accounts &amp; Roles</td><td><span className="perm-badge perm-full">Manage All</span></td><td><span className="perm-badge perm-view">Shift Roster</span></td><td><span className="perm-badge perm-none">No Access</span></td><td><span className="perm-badge perm-none">No Access</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="about-card">
            <h2><i className="fas fa-calculator"></i> Formulas & Business Logic</h2>
            <p className="mb-24">All the calculations this app does behind the scenes — so theres no confusion later about how somthing gets computed.</p>
            <div className="about-table-wrapper">
              <table className="about-roles-table">
                <thead><tr><th>What</th><th>Formula / Logic</th><th>Where Used</th></tr></thead>
                <tbody>
                  <tr><td>Total Records</td><td>Count of all records in the database</td><td>Dashboard KPI</td></tr>
                  <tr><td>Active Records</td><td>Count where active = true</td><td>Dashboard KPI</td></tr>
                  <tr><td>Inactive Records</td><td>Total Records − Active Records</td><td>Dashboard KPI</td></tr>
                  <tr><td>Total Amount</td><td>Σ amount across all records</td><td>Dashboard KPI</td></tr>
                  <tr><td>Records by Category</td><td>Group + count records per category</td><td>Dashboard Chart</td></tr>
                  <tr><td>Monthly Trend</td><td>Group + count records by created month (last 6 months)</td><td>Dashboard Chart</td></tr>
                  <tr><td>SKU Number</td><td>'SKU-' + zero-padded 5-digit sequence from /counters/products (atomic Firebase transaction, avoids duplicate SKUs under concurrent adds)</td><td>Add Product (auto, read-only after)</td></tr>
                  <tr><td>Qty On Hand</td><td>Σ qty where type='in' − Σ qty where type='out', per product, from the Stock In/Out ledger — never a stored counter, always recomputed live</td><td>Products list, Stock ledger, POS cart guard</td></tr>
                  <tr><td>Low Stock Flag</td><td>Qty On Hand &lt;= Reorder Level</td><td>Products list (red badge), Stock Status filter</td></tr>
                  <tr><td>Stock Out Negative-Qty Check</td><td>Warns (does not block) if requested qty &gt; current Qty On Hand</td><td>Stock Out flow</td></tr>
                  <tr><td>Running Balance</td><td>Per product, cumulative Σ (in − out) applied oldest→newest; each ledger row shows the on-hand right after it</td><td>Stock In/Out ledger</td></tr>
                  <tr><td>Stocktake Adjustment</td><td>Counted Qty − System On Hand → posts a correcting Stock In (if +) or Stock Out (if −) with reason "Adjustment"</td><td>Stocktake</td></tr>
                  <tr><td>Receiving Unit Cost</td><td>Optional on Stock In — records the landed unit cost and, if ticked, updates the product's cost to it</td><td>Stock In</td></tr>
                  <tr><td>Sale Line Total</td><td>qty × price, per cart line</td><td>POS Cart, Thermal Receipt</td></tr>
                  <tr><td>Order Discount</td><td>Percent → Subtotal × %; Amount → capped at Subtotal. Spread proportionally across lines so tax is charged on the discounted amount</td><td>POS Checkout</td></tr>
                  <tr><td>Sale Tax</td><td>Per line: discounted line × effective tax rate (product rate, else Settings default). Tax-inclusive mode extracts tax out of the price instead of adding it</td><td>POS Checkout, Receipt</td></tr>
                  <tr><td>Sale Grand Total</td><td>Tax-exclusive: Subtotal − Discount + Tax. Tax-inclusive: Subtotal − Discount (tax already inside)</td><td>POS Checkout, Thermal Receipt</td></tr>
                  <tr><td>Change Due</td><td>max(0, Amount Tendered − Grand Total) — cash payments only</td><td>POS Checkout, Receipt</td></tr>
                  <tr><td>Invoice Number</td><td>Settings prefix + zero-padded 5-digit sequence from /counters/sales (atomic transaction)</td><td>Every sale</td></tr>
                  <tr><td>Gross Profit (per sale)</td><td>(Subtotal − Discount) − Σ (line cost × qty); cost is snapshotted onto each line at checkout so later cost edits don't distort history</td><td>Sales History "Profit" column</td></tr>
                  <tr><td>Total Expenses</td><td>Σ expense amounts over the selected date range / category</td><td>Expenses (feeds Net Profit)</td></tr>
                  <tr><td>Scan Resolve (fast)</td><td>Scanned/typed code matched in-memory against product id, SKU or barcode (instant) — only a miss falls back to a Firebase lookup</td><td>QR Sales / POS</td></tr>
                  <tr><td>Stock Deduction on Sale</td><td>Checkout writes one Stock Out ledger entry per cart line (reason: Sale) — stock only ever changes via the ledger, never a direct qty edit</td><td>POS Checkout → Stock ledger</td></tr>
                  <tr><td>Refund Total</td><td>Σ (qty × price) across the returned lines of a single return; each Return also credits stock back via a Stock In entry (reason: Return)</td><td>Return, Sales History "Returned" column</td></tr>
                  <tr><td>Returnable Qty</td><td>Sold Qty − Σ qty already returned against that sale line (across all prior returns) — caps how much can be returned again</td><td>Process Return</td></tr>
                  <tr><td>Suggested Reorder Qty</td><td>Reorder Qty if set, else max(0, Max Stock − Qty On Hand), else max(0, Reorder Level × 2 − Qty On Hand)</td><td>Reorder Report</td></tr>
                  <tr><td>Product Status</td><td>active / discontinued — discontinued items stay in history &amp; reports but can be filtered out of the working list (delete only as a last resort)</td><td>Products list &amp; Status filter</td></tr>
                  <tr><td>Effective Tax Rate (product)</td><td>Product Tax Rate % if set, otherwise the Settings default tax rate</td><td>Product (POS tax uses it next)</td></tr>
                  <tr><td>Currency Display</td><td>money() prefixes the configured currency symbol (Settings → Currency &amp; Tax); all amounts app-wide follow it</td><td>Every amount shown</td></tr>
                  <tr><td>Categories</td><td>Loaded live from the Categories collection (Settings), not a fixed list — add/remove to fit the business</td><td>Product/Record category dropdowns &amp; filters</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="about-card about-developer">
            <h2><i className="fas fa-code"></i> About the Developer</h2>
            <div className="developer-info">
              <img src={LOGO_URL} alt="Mohammad Rameez Imdad" className="developer-avatar" />
              <div className="developer-details">
                <h3>Mohammad Rameez Imdad</h3>
                <p className="developer-brand">Rameez Scripts</p>
                <p>I build custom web apps, dashboards, and automation tools. If you need somthing built for your buisness or project, feel free to reach out!</p>
                <div className="developer-links">
                  <a href="https://wa.me/923224083545" target="_blank" className="dev-link whatsapp"><i className="fab fa-whatsapp"></i> WhatsApp Me</a>
                  <a href="https://www.youtube.com/@rameezimdad" target="_blank" className="dev-link youtube"><i className="fab fa-youtube"></i> Subscribe on YouTube</a>
                </div>
              </div>
            </div>
          </div>
          <div className="about-footer">
            <p>Made with <i className="fas fa-heart" style={{ color: '#ea4335' }}></i> by Rameez Scripts</p>
            <p className="about-version">Version 1.0.0</p>
          </div>
        </div>
      );
    }

    // Payment Method Edit / Create Modal
    function PaymentMethodModal({ method, onClose, onSave }) {
      const [formData, setFormData] = useState({
        name: method ? method.name : '',
        code: method ? method.code : '',
        type: method ? (method.type || 'qr') : 'qr',
        icon: method ? (method.icon || 'fa-qrcode') : 'fa-qrcode',
        details: method ? (method.details || '') : '',
        bankName: method ? (method.bankName || '') : '',
        accountNumber: method ? (method.accountNumber || '') : '',
        accountTitle: method ? (method.accountTitle || '') : '',
        ifsc: method ? (method.ifsc || '') : '',
        qrData: method ? (method.qrData || '') : '',
        displayOrder: method ? (method.displayOrder || 1) : 1,
        active: method ? method.active !== false : true,
        requiresReceipt: method ? !!method.requiresReceipt : false
      });
      const [saving, setSaving] = useState(false);

      const handleQrUpload = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          setFormData(p => ({ ...p, qrData: evt.target.result }));
        };
        reader.readAsDataURL(file);
      };

      const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave(Object.assign({}, method || {}, formData));
        setSaving(false);
      };

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className={'fas ' + (formData.icon || 'fa-credit-card')}></i> {method ? 'Edit Payment Method' : 'Add Payment Method'}</h3>
              <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <form onSubmit={submit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Method Name *</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Wallet QR, Bank Transfer" />
                  </div>
                  <div className="form-group">
                    <label>Method Type</label>
                    <select value={formData.type} onChange={e => {
                      const t = e.target.value;
                      setFormData(p => ({
                        ...p,
                        type: t,
                        icon: t === 'qr' ? 'fa-qrcode' : t === 'bank' ? 'fa-building-columns' : 'fa-money-bill-wave'
                      }));
                    }}>
                      <option value="qr">Wallet / UPI QR Code</option>
                      <option value="bank">Direct Bank Transfer</option>
                      <option value="cash">Cash / Counter Payment</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Code / Identifier</label>
                    <input type="text" value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value }))} placeholder="e.g. PM-01, UPI, BANK" />
                  </div>
                  <div className="form-group">
                    <label>Icon Class</label>
                    <input type="text" value={formData.icon} onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))} placeholder="fa-qrcode, fa-building-columns" />
                  </div>
                </div>

                {formData.type === 'qr' && (
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
                    <div className="form-group">
                      <label><i className="fas fa-qrcode"></i> UPI ID / QR String (or image URL)</label>
                      <input type="text" value={formData.qrData} onChange={e => setFormData(p => ({ ...p, qrData: e.target.value }))} placeholder="e.g. shop@okaxis or https://...qr.png" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Upload QR Code Image</label>
                      <input type="file" accept="image/*" onChange={handleQrUpload} />
                    </div>
                    {formData.qrData && (
                      <div style={{ marginTop: '10px', textAlign: 'center' }}>
                        <img src={formData.qrData.startsWith('data:') || formData.qrData.startsWith('http') ? formData.qrData : ('https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent(formData.qrData))} alt="QR" style={{ width: '100px', height: '100px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      </div>
                    )}
                  </div>
                )}

                {formData.type === 'bank' && (
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Bank Name</label>
                        <input type="text" value={formData.bankName} onChange={e => setFormData(p => ({ ...p, bankName: e.target.value }))} placeholder="e.g. Demo Bank, Chase, HDFC" />
                      </div>
                      <div className="form-group">
                        <label>Account Number</label>
                        <input type="text" value={formData.accountNumber} onChange={e => setFormData(p => ({ ...p, accountNumber: e.target.value }))} placeholder="e.g. 123456788901" />
                      </div>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Account Title / Holder</label>
                        <input type="text" value={formData.accountTitle} onChange={e => setFormData(p => ({ ...p, accountTitle: e.target.value }))} placeholder="e.g. Soft Drink Shop LLC" />
                      </div>
                      <div className="form-group">
                        <label>IFSC / Branch / Routing</label>
                        <input type="text" value={formData.ifsc} onChange={e => setFormData(p => ({ ...p, ifsc: e.target.value }))} placeholder="e.g. HDFC0001234" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Customer Instructions</label>
                  <textarea rows="2" value={formData.details} onChange={e => setFormData(p => ({ ...p, details: e.target.value }))} placeholder="e.g. Please send screenshot on WhatsApp after payment."></textarea>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label><i className="fas fa-toggle-on"></i> Active Status</label>
                    <div><label className="switch-pill"><input type="checkbox" checked={formData.active} onChange={e => setFormData(p => ({ ...p, active: e.target.checked }))} /><span className="switch-slider"></span></label></div>
                  </div>
                  <div className="form-group">
                    <label><i className="fas fa-receipt"></i> Require Receipt Upload</label>
                    <div><label className="switch-pill"><input type="checkbox" checked={formData.requiresReceipt} onChange={e => setFormData(p => ({ ...p, requiresReceipt: e.target.checked }))} /><span className="switch-slider"></span></label></div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Method</>}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={onClose}><i className="fas fa-times"></i> Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // --- Dedicated Payment Methods View (Matching Screenshot 2) ---
