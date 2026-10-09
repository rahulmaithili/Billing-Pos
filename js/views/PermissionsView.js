    // --- Role-Based Access Control (RBAC) Permissions View ---
    function PermissionsView({ user, role }) {
      const [filterRole, setFilterRole] = useState('all');
      const [searchQuery, setSearchQuery] = useState('');

      const matrix = [
        {
          module: 'Dashboard & KPIs',
          icon: 'fa-chart-line',
          category: 'Overview',
          admin: { level: 'full', text: 'Full Access', desc: 'All Revenues, Gross Profit, Margins' },
          manager: { level: 'manage', text: 'Daily Ops', desc: 'Daily Sales & Stock Alerts' },
          cashier: { level: 'view', text: 'Shift View', desc: 'Current shift sales & drawer' },
          barista: { level: 'none', text: 'No Access', desc: 'Hidden / Blocked' }
        },
        {
          module: 'QR Sales / POS Checkout',
          icon: 'fa-cash-register',
          category: 'Sales',
          admin: { level: 'full', text: 'Full Control', desc: 'Discounts, Voids, Overrides & Returns' },
          manager: { level: 'manage', text: 'Manage & Sell', desc: 'Take orders & approve returns' },
          cashier: { level: 'operate', text: 'Primary Station', desc: 'Create orders & collect payment' },
          barista: { level: 'none', text: 'No Access', desc: 'Order status view only' }
        },
        {
          module: 'Dispatch & Fulfillment Board',
          icon: 'fa-truck-ramp-box',
          category: 'Warehouse',
          admin: { level: 'view', text: 'Full Audit', desc: 'Real-time orders queue overview' },
          manager: { level: 'manage', text: 'Manage Queue', desc: 'Prioritize, cancel or reroute orders' },
          cashier: { level: 'view', text: 'Ready Status', desc: 'Check order readiness for pickup' },
          barista: { level: 'operate', text: 'Primary Station', desc: 'Pack items & mark dispatched' }
        },
        {
          module: 'Payment Review & Slip Verification',
          icon: 'fa-magnifying-glass-dollar',
          category: 'Finance',
          admin: { level: 'full', text: 'Full Control', desc: 'Bank QR & complete reconciliation' },
          manager: { level: 'manage', text: 'Verify & Approve', desc: 'Verify QR slips & approve orders' },
          cashier: { level: 'operate', text: 'Submit Slips', desc: 'Upload customer slips & tender' },
          barista: { level: 'none', text: 'No Access', desc: 'Hidden / Blocked' }
        },
        {
          module: 'Products & Wholesale Catalog',
          icon: 'fa-boxes-stacked',
          category: 'Catalog',
          admin: { level: 'full', text: 'Full Control', desc: 'Create, edit pricing, costs & delete' },
          manager: { level: 'manage', text: 'Availability', desc: 'Toggle 86 / In-Stock items' },
          cashier: { level: 'view', text: 'View Catalog', desc: 'Lookup prices & ingredients' },
          barista: { level: 'view', text: 'View Recipes', desc: 'Product specs & pack units' }
        },
        {
          module: 'Packaging & Surcharges',
          icon: 'fa-box-archive',
          category: 'Catalog',
          admin: { level: 'full', text: 'Full Control', desc: 'Syrups, milk alternatives & prices' },
          manager: { level: 'manage', text: 'Manage Stock', desc: 'Toggle modifier availability' },
          cashier: { level: 'view', text: 'Select in Cart', desc: 'Add customizations to order' },
          barista: { level: 'view', text: 'Prep Specs', desc: 'Read order cup modifiers' }
        },
        {
          module: 'Stock In/Out Inventory',
          icon: 'fa-dolly',
          category: 'Inventory',
          admin: { level: 'full', text: 'Full Control', desc: 'Adjustments, valuations & audit' },
          manager: { level: 'manage', text: 'Stock In / Waste', desc: 'Receive stock & log wastage' },
          cashier: { level: 'none', text: 'No Access', desc: 'Stock quantities view only' },
          barista: { level: 'operate', text: 'Usage Alerts', desc: 'Request restock & log spills' }
        },
        {
          module: 'Customers & CRM',
          icon: 'fa-user-group',
          category: 'CRM',
          admin: { level: 'full', text: 'Full Access', desc: 'Export database & loyalty settings' },
          manager: { level: 'manage', text: 'Edit Profiles', desc: 'Customer history & store credit' },
          cashier: { level: 'operate', text: 'Quick Add', desc: 'Lookup & add customer at POS' },
          barista: { level: 'none', text: 'No Access', desc: 'Hidden / Blocked' }
        },
        {
          module: 'Reports & Gross Profit',
          icon: 'fa-chart-column',
          category: 'Analytics',
          admin: { level: 'full', text: 'Full P&L Reports', desc: 'Profit margins, net sales & exports' },
          manager: { level: 'view', text: 'Sales Summary', desc: 'Daily totals & shift close' },
          cashier: { level: 'view', text: 'Shift Close', desc: 'Own drawer Z-Report' },
          barista: { level: 'none', text: 'No Access', desc: 'Hidden / Blocked' }
        },
        {
          module: 'Payment Methods Configuration',
          icon: 'fa-building-columns',
          category: 'Settings',
          admin: { level: 'full', text: 'Full Control', desc: 'Setup shop UPI QR, Banks & Gateways' },
          manager: { level: 'view', text: 'View Only', desc: 'Check active payment methods' },
          cashier: { level: 'none', text: 'No Access', desc: 'Uses configured methods' },
          barista: { level: 'none', text: 'No Access', desc: 'Hidden / Blocked' }
        },
        {
          module: 'System Settings',
          icon: 'fa-sliders',
          category: 'Settings',
          admin: { level: 'full', text: 'Full Control', desc: 'Business profile, tax rates & receipts' },
          manager: { level: 'view', text: 'Printer Config', desc: 'Select local receipt printer' },
          cashier: { level: 'none', text: 'No Access', desc: 'Hidden / Blocked' },
          barista: { level: 'none', text: 'No Access', desc: 'Hidden / Blocked' }
        },
        {
          module: 'User Accounts & Roles',
          icon: 'fa-users',
          category: 'Admin',
          admin: { level: 'full', text: 'Full Access', desc: 'Create users, assign roles & PINs' },
          manager: { level: 'view', text: 'Shift Roster', desc: 'View staff attendance' },
          cashier: { level: 'none', text: 'No Access', desc: 'Hidden / Blocked' },
          barista: { level: 'none', text: 'No Access', desc: 'Hidden / Blocked' }
        }
      ];

      const renderPermBadge = (perm) => {
        const clsMap = {
          full: 'perm-full',
          manage: 'perm-manage',
          operate: 'perm-operate',
          view: 'perm-view',
          none: 'perm-none'
        };
        const iconMap = {
          full: 'fa-circle-check',
          manage: 'fa-sliders',
          operate: 'fa-bolt',
          view: 'fa-eye',
          none: 'fa-ban'
        };
        return (
          <span className={`perm-badge ${clsMap[perm.level] || 'perm-view'}`}>
            <span><i className={`fas ${iconMap[perm.level] || 'fa-circle'}`}></i> {perm.text}</span>
            <small>{perm.desc}</small>
          </span>
        );
      };

      const filteredMatrix = matrix.filter(row => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return row.module.toLowerCase().includes(q) || row.category.toLowerCase().includes(q);
      });

      return (
        <div className="data-section">
          {/* Header Banner - Light & Premium */}
          <div className="rbac-hero">
            <h2><i className="fas fa-shield-halved"></i> Role-Based Access Control (RBAC) Permissions</h2>
            <p>Security permissions, authorization scope, and functional capabilities assigned across store staff roles.</p>
            <div className="rbac-roles-grid">
              <div className="rbac-role-card card-admin">
                <span className="rbac-role-badge badge-admin"><i className="fas fa-crown"></i> Admin</span>
                <p className="rbac-role-desc">Full store ownership, system configuration, financials, user administration &amp; profit analytics.</p>
              </div>
              <div className="rbac-role-card card-manager">
                <span className="rbac-role-badge badge-manager"><i className="fas fa-user-tie"></i> Manager</span>
                <p className="rbac-role-desc">Store floor management, stock receipt &amp; waste, order approvals, daily sales totals &amp; returns.</p>
              </div>
              <div className="rbac-role-card card-cashier">
                <span className="rbac-role-badge badge-cashier"><i className="fas fa-cash-register"></i> Cashier</span>
                <p className="rbac-role-desc">Counter billing, customer lookups, payment processing, slip uploads &amp; personal shift totals.</p>
              </div>
              <div className="rbac-role-card card-barista">
                <span className="rbac-role-badge badge-barista"><i className="fas fa-mug-hot"></i> Barista</span>
                <p className="rbac-role-desc">Kitchen Display Queue, drink customization specifications &amp; reporting ingredient shortages.</p>
              </div>
            </div>
          </div>

          {/* Filtering and Search Controls */}
          <div className="rbac-controls">
            <div className="rbac-tabs">
              <button type="button" className={`rbac-tab-btn ${filterRole === 'all' ? 'active' : ''}`} onClick={() => setFilterRole('all')}>
                All Roles
              </button>
              <button type="button" className={`rbac-tab-btn ${filterRole === 'admin' ? 'active' : ''}`} onClick={() => setFilterRole('admin')}>
                <i className="fas fa-crown"></i> Admin
              </button>
              <button type="button" className={`rbac-tab-btn ${filterRole === 'manager' ? 'active' : ''}`} onClick={() => setFilterRole('manager')}>
                <i className="fas fa-user-tie"></i> Manager
              </button>
              <button type="button" className={`rbac-tab-btn ${filterRole === 'cashier' ? 'active' : ''}`} onClick={() => setFilterRole('cashier')}>
                <i className="fas fa-cash-register"></i> Cashier
              </button>
              <button type="button" className={`rbac-tab-btn ${filterRole === 'barista' ? 'active' : ''}`} onClick={() => setFilterRole('barista')}>
                <i className="fas fa-mug-hot"></i> Barista
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="rbac-search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => window.print()} title="Print Permissions Matrix">
                <i className="fas fa-print"></i> Print Matrix
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="rbac-legend">
            <strong style={{ color: '#0f172a' }}>Legend:</strong>
            <span className="rbac-legend-item"><span className="perm-badge perm-full" style={{ padding: '2px 8px', minWidth: 'auto', minHeight: 'auto', display: 'inline-block' }}>Full Access</span> All CRUD &amp; Config</span>
            <span className="rbac-legend-item"><span className="perm-badge perm-manage" style={{ padding: '2px 8px', minWidth: 'auto', minHeight: 'auto', display: 'inline-block' }}>Manage</span> Operational Edits</span>
            <span className="rbac-legend-item"><span className="perm-badge perm-operate" style={{ padding: '2px 8px', minWidth: 'auto', minHeight: 'auto', display: 'inline-block' }}>Operate</span> Station User</span>
            <span className="rbac-legend-item"><span className="perm-badge perm-view" style={{ padding: '2px 8px', minWidth: 'auto', minHeight: 'auto', display: 'inline-block' }}>View Only</span> Read-only</span>
            <span className="rbac-legend-item"><span className="perm-badge perm-none" style={{ padding: '2px 8px', minWidth: 'auto', minHeight: 'auto', display: 'inline-block' }}>No Access</span> Hidden / Blocked</span>
          </div>

          {/* Matrix Table with Premium Table Card Styling */}
          <div className="premium-table-wrap">
            <table className="premium-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 220, paddingLeft: 20 }}>Module / Feature</th>
                  <th style={{ minWidth: 100 }}>Category</th>
                  {(filterRole === 'all' || filterRole === 'admin') && (
                    <th style={{ textAlign: 'center', minWidth: 150 }}>
                      <span className="badge badge-admin" style={{ padding: '4px 12px', fontSize: 12 }}>
                        <i className="fas fa-crown"></i> Admin
                      </span>
                    </th>
                  )}
                  {(filterRole === 'all' || filterRole === 'manager') && (
                    <th style={{ textAlign: 'center', minWidth: 150 }}>
                      <span className="badge badge-manager" style={{ padding: '4px 12px', fontSize: 12 }}>
                        <i className="fas fa-user-tie"></i> Manager
                      </span>
                    </th>
                  )}
                  {(filterRole === 'all' || filterRole === 'cashier') && (
                    <th style={{ textAlign: 'center', minWidth: 150 }}>
                      <span className="badge badge-cashier" style={{ padding: '4px 12px', fontSize: 12 }}>
                        <i className="fas fa-cash-register"></i> Cashier
                      </span>
                    </th>
                  )}
                  {(filterRole === 'all' || filterRole === 'barista') && (
                    <th style={{ textAlign: 'center', minWidth: 150 }}>
                      <span className="badge badge-barista" style={{ padding: '4px 12px', fontSize: 12 }}>
                        <i className="fas fa-mug-hot"></i> Barista
                      </span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredMatrix.map((row, i) => (
                  <tr key={i}>
                    <td style={{ paddingLeft: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm, 8px)', background: '#f1f5f9', color: 'var(--navy-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                          <i className={`fas ${row.icon}`}></i>
                        </div>
                        <strong style={{ color: '#0f172a', fontSize: 13.5 }}>{row.module}</strong>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 11.5, padding: '3px 10px', background: '#f1f5f9', borderRadius: 'var(--r-pill, 999px)', color: '#475569', fontWeight: 600 }}>
                        {row.category}
                      </span>
                    </td>
                    {(filterRole === 'all' || filterRole === 'admin') && (
                      <td style={{ textAlign: 'center', padding: '10px 8px' }}>{renderPermBadge(row.admin)}</td>
                    )}
                    {(filterRole === 'all' || filterRole === 'manager') && (
                      <td style={{ textAlign: 'center', padding: '10px 8px' }}>{renderPermBadge(row.manager)}</td>
                    )}
                    {(filterRole === 'all' || filterRole === 'cashier') && (
                      <td style={{ textAlign: 'center', padding: '10px 8px' }}>{renderPermBadge(row.cashier)}</td>
                    )}
                    {(filterRole === 'all' || filterRole === 'barista') && (
                      <td style={{ textAlign: 'center', padding: '10px 8px' }}>{renderPermBadge(row.barista)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
