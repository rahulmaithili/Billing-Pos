// --- Layout Routing ---
    function MainContent({ activeMenu, user, role, setActiveMenu }) {
      switch (activeMenu) {
        case 'dashboard': return <DashboardView user={user} role={role} setActiveMenu={setActiveMenu} />;
        case 'pos': return <POSView user={user} role={role} setActiveMenu={setActiveMenu} />;
        case 'board': return <OrderBoardView user={user} role={role} setActiveMenu={setActiveMenu} />;
        case 'review': return <PaymentReviewView user={user} role={role} setActiveMenu={setActiveMenu} />;
        case 'sales-history': return <SalesHistoryView user={user} role={role} setActiveMenu={setActiveMenu} />;
        case 'products': return <ProductsView user={user} role={role} setActiveMenu={setActiveMenu} />;
        case 'categories': return <CategoriesView user={user} role={role} setActiveMenu={setActiveMenu} />;
        case 'addons': return <AddonsView user={user} role={role} />;
        case 'stock': return <StockView user={user} role={role} />;
        case 'records': return <RecordsView user={user} role={role} />;
        case 'reports': return <ReportsView user={user} role={role} />;
        case 'expenses': return <ExpensesView user={user} role={role} />;
        case 'suppliers': return <SuppliersView user={user} role={role} />;
        case 'purchase-orders': return <PurchaseOrdersView user={user} role={role} />;
        case 'payment-methods': return <PaymentMethodsView user={user} role={role} />;
        case 'settings': return <SettingsView user={user} role={role} />;
        case 'users': return <UsersView user={user} role={role} />;
        case 'permissions': return <PermissionsView user={user} role={role} />;
        case 'logs': return <LogsView />;
        case 'my-settings': return <MySettingsView user={user} role={role} />;
        case 'my-account': return <MyAccountView user={user} role={role} />;
        case 'about': return <AboutView />;
        default: return null;
      }
    }

    function Dashboard({ user, role, onLogout, themeMode, onThemeToggle }) {
      const [activeMenu, setActiveMenu] = useState(role === 'Admin' ? 'dashboard' : 'records');
      const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sb_collapsed') === '1');
      const [showShortcuts, setShowShortcuts] = useState(false);
      const toggleSidebar = () => setCollapsed(c => { localStorage.setItem('sb_collapsed', c ? '0' : '1'); return !c; });
      const { data: logsData } = useFetch(() => fbGetLogs(), [activeMenu]);
      const notifs = useMemo(() => (logsData && logsData.success ? logsData.data.slice(0, 5).map(l => ({ text: l.action + ': ' + l.detail, icon: 'fa-bell' })) : []), [logsData]);

      const [cfgKey, setCfgKey] = useState(0);
      const { data: cfgData } = useFetch(() => Promise.all([fbGetSettings(), fbGetCategories()]), [cfgKey]);
      const settings = useMemo(() => (cfgData && cfgData[0] && cfgData[0].success ? cfgData[0].data : {}), [cfgData]);
      const categories = useMemo(() => (cfgData && cfgData[1] && cfgData[1].success ? cfgData[1].data : []), [cfgData]);
      useEffect(() => { if (settings && Object.keys(settings).length) applySettings(settings); }, [settings]);
      const refreshConfig = useCallback(() => setCfgKey(k => k + 1), []);

      // global hotkeys
      useEffect(() => {
        const onKeyDown = (e) => {
          if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '') || e.target.isContentEditable) return;
          if (e.key === 'F1') { e.preventDefault(); if (role === 'Admin') setActiveMenu('dashboard'); }
          else if (e.key === 'F2') { e.preventDefault(); setActiveMenu('pos'); }
          else if (e.key === 'F3') { e.preventDefault(); setActiveMenu('products'); }
          else if (e.key === 'F4') { e.preventDefault(); setActiveMenu('records'); }
          else if (e.key === '?') { e.preventDefault(); setShowShortcuts(s => !s); }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
      }, [role]);

      const titles = {
        dashboard: 'Dashboard',
        pos: 'QR Sales',
        board: 'Order Board',
        review: 'Payment Review',
        'sales-history': 'All Orders',
        products: 'Products',
        categories: 'Categories',
        addons: 'Add-ons',
        stock: 'Stock In/Out',
        records: 'Customers',
        reports: 'Reports',
        expenses: 'Expenses',
        suppliers: 'Suppliers',
        'purchase-orders': 'Purchase Orders',
        'payment-methods': 'Payment Methods',
        settings: 'Settings',
        users: 'Users',
        permissions: 'Permissions',
        logs: 'Activity Logs',
        'my-settings': 'My Settings',
        'my-account': 'My Account',
        about: 'About'
      };

      const icons = {
        dashboard: 'fa-chart-line',
        pos: 'fa-cash-register',
        board: 'fa-truck-ramp-box',
        review: 'fa-magnifying-glass-dollar',
        'sales-history': 'fa-receipt',
        products: 'fa-boxes-stacked',
        categories: 'fa-layer-group',
        addons: 'fa-box-archive',
        stock: 'fa-dolly',
        records: 'fa-user-group',
        reports: 'fa-chart-column',
        expenses: 'fa-money-bill-trend-up',
        suppliers: 'fa-truck-field',
        'purchase-orders': 'fa-file-invoice-dollar',
        'payment-methods': 'fa-building-columns',
        settings: 'fa-sliders',
        users: 'fa-users',
        permissions: 'fa-user-shield',
        logs: 'fa-clock-rotate-left',
        'my-settings': 'fa-palette',
        'my-account': 'fa-user-circle',
        about: 'fa-circle-info'
      };

      return (
        <ConfigContext.Provider value={{ settings, categories, refreshConfig }}>
          <div className="app-container">
            <ProcessingOverlay />
            <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} role={role} user={user} onLogout={onLogout} collapsed={collapsed} />
            <div className="main-content">
              <Navbar icon={icons[activeMenu] || 'fa-circle'} title={titles[activeMenu] || 'Shop'} userName={user?.name} role={role} notifs={notifs} onLogout={onLogout} setActiveMenu={setActiveMenu} toggleSidebar={toggleSidebar} themeMode={themeMode} onThemeToggle={onThemeToggle} onOpenShortcuts={() => setShowShortcuts(true)} />
              <MainContent activeMenu={activeMenu} user={user} role={role} setActiveMenu={setActiveMenu} />
            </div>
            <BottomNavigation activeMenu={activeMenu} setActiveMenu={setActiveMenu} role={role} toggleSidebar={toggleSidebar} />
            {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
          </div>
        </ConfigContext.Provider>
      );
    }

    function App() {
      const [isLoggedIn, setIsLoggedIn] = useState(false);
      const [currentUser, setCurrentUser] = useState(null);
      const [userRole, setUserRole] = useState(null);
      const [checkingSession, setCheckingSession] = useState(true);
      const [themeMode, setThemeMode] = useState(() => ls.get('app_theme_mode') || 'light');

      useEffect(() => {
        applySavedTheme();
        if (themeMode === 'dark') document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
      }, [themeMode]);

      const handleThemeToggle = () => {
        const next = themeMode === 'dark' ? 'light' : 'dark';
        setThemeMode(next);
        ls.set('app_theme_mode', next);
      };

      useEffect(() => {
        const saved = localStorage.getItem('fb_user');
        if (saved) {
          try { const u = JSON.parse(saved); setIsLoggedIn(true); setCurrentUser(u); setUserRole(u.role); } catch (e) { }
        }
        setCheckingSession(false);
      }, []);

      const handleLogin = (user, role) => {
        localStorage.setItem('fb_user', JSON.stringify(user));
        setIsLoggedIn(true); setCurrentUser(user); setUserRole(role);
      };
      const handleLogout = () => {
        localStorage.removeItem('fb_user');
        setIsLoggedIn(false); setCurrentUser(null); setUserRole(null);
      };

      if (checkingSession) return <div className="login-container"><div className="login-box"><i className="fas fa-spinner fa-spin" style={{ fontSize: '40px', color: 'var(--navy-primary)' }}></i></div></div>;

      return <div>{!isLoggedIn ? <LoginPage onLogin={handleLogin} /> : <Dashboard user={currentUser} role={userRole} onLogout={handleLogout} themeMode={themeMode} onThemeToggle={handleThemeToggle} />}</div>;
    }

    class ErrorBoundary extends React.Component {
      state = { err: null };
      static getDerivedStateFromError(err) { return { err }; }
      componentDidCatch(err) { console.error('ui crash', err); }
      render() {
        if (this.state.err) return (
          <div className="login-container"><div className="login-box">
            <i className="fas fa-triangle-exclamation" style={{ fontSize: 40, color: 'var(--danger)' }}></i>
            <h2>Something broke</h2>
            <button className="btn btn-primary" onClick={() => location.reload()}><i className="fas fa-rotate"></i> Reload</button>
          </div></div>
        );
        return this.props.children;
      }
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);
