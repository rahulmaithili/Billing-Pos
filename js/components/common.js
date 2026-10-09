const { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue } = React;

    // ============== Language System (English & Hinglish) ==============
    window.APP_LANG = localStorage.getItem('app_lang') || 'en';

    window.setAppLanguage = function(newLang) {
      window.APP_LANG = newLang;
      localStorage.setItem('app_lang', newLang);
      window.dispatchEvent(new CustomEvent('app_lang_changed', { detail: newLang }));
    };

    window.LANG_DICT = {
      // Common / Navigation
      'home': { en: 'Home', hinglish: 'Home' },
      'dashboard': { en: 'Dashboard', hinglish: 'Dashboard' },
      'pos': { en: 'QR Sales', hinglish: 'Fast Billing' },
      'products': { en: 'Products', hinglish: 'Samaan / Catalog' },
      'categories': { en: 'Categories', hinglish: 'Categories' },
      'customers': { en: 'Customers & Khata', hinglish: 'Grahak aur Khata' },
      'reports': { en: 'Rojnamcha (Daily Cashbook)', hinglish: 'Daily Rojnamcha' },
      'expenses': { en: 'Expenses', hinglish: 'Kharche' },
      'suppliers': { en: 'Suppliers', hinglish: 'Suppliers' },
      'settings': { en: 'Settings', hinglish: 'Settings' },

      // Billing / POS
      'pos_title': { en: 'Fast POS & QR Terminal', hinglish: 'Fast Billing aur QR POS' },
      'pos_subtitle': { en: 'Real-time Visual Billing, Live Stock & Instant UPI Payment', hinglish: 'Seedha Bill, Live Stock aur UPI Payment' },
      'pos_products_tab': { en: 'Products', hinglish: 'Samaan' },
      'pos_cart_tab': { en: 'Bill & Cart', hinglish: 'Kacha Bill & Cart' },
      'pos_all_items': { en: 'All Items', hinglish: 'Sabhi Samaan' },
      'pos_search_items': { en: 'Search items, products, SKU, barcode...', hinglish: 'Samaan ya barcode search karein...' },
      'pos_scan_barcode': { en: 'Scan Barcode / SKU + Enter', hinglish: 'Barcode scan karein + Enter' },
      'pos_walkin': { en: 'Walk-in (Quick Bill)', hinglish: 'Walk-in (Seedha Bill)' },
      'pos_walkin_hint': { en: 'Fast billing with 0 mandatory registration', hinglish: 'Bina registration seedha fast billing' },
      'pos_khata_customer': { en: 'Khata / Regular', hinglish: 'Khata / Regular Grahak' },
      'pos_optional_name': { en: 'Customer Name (Optional)', hinglish: 'Grahak Name (Optional)' },
      'pos_optional_phone': { en: 'Mobile No (Optional)', hinglish: 'Mobile Number (Optional)' },
      'pos_add_more': { en: 'Add More Items', hinglish: 'Aur Samaan Jodein' },
      'pos_complete_sale': { en: 'Complete Sale & Print', hinglish: 'Bill Banayein aur Print Karein' },
      'pos_floating_view_bill': { en: 'View Bill / Pay', hinglish: 'Bill Dekhein / Pay Karein' },
      'pos_total_bill': { en: 'Total Bill', hinglish: 'Kul Bill' },
      'pos_pending_dues': { en: 'Pending Khata Dues', hinglish: 'Pichla Baaki Udhar' },

      // Customers & Khata
      'cust_title': { en: 'Customers & Khata Ledger', hinglish: 'Grahak aur Khata Register' },
      'cust_subtitle': { en: 'Manage regular customers, track credit balances, and collect dues via Cash or Online UPI', hinglish: 'Grahak khata manage karein, baaki udhar track karein aur Cash ya UPI se wasooli karein' },
      'cust_collect_dues': { en: 'Collect Dues', hinglish: 'Udhar Wasooli' },
      'cust_add_customer': { en: 'Add Customer', hinglish: 'Naya Grahak Jodein' },
      'cust_all_customers': { en: 'All Customers', hinglish: 'Sabhi Grahak' },
      'cust_dues_register': { en: 'Dues Collection Register', hinglish: 'Wasooli Register' },
      'cust_market_dues': { en: 'Total Market Dues', hinglish: 'Bazaar me Kul Udhar' },
      'cust_balance': { en: 'Balance / Dues', hinglish: 'Baaki Udhar' },
      'cust_cleared': { en: 'Cleared (No Dues)', hinglish: 'Chukta (Koi Baaki Nahi)' },
      'cust_wasooli_btn': { en: 'Collect Dues', hinglish: 'Wasooli' },
      'cust_amount_to_collect': { en: 'Amount to Collect', hinglish: 'Wasooli Rashi (Amount)' },
      'cust_payment_mode': { en: 'Payment Mode', hinglish: 'Payment Ka Madhyam' },
      'cust_cash_drawer': { en: 'Cash (Drawer)', hinglish: 'Cash (Galla Cash)' },
      'cust_online_bank': { en: 'Online UPI / Bank', hinglish: 'Online UPI (Bank Khata)' },
      'cust_confirm_collection': { en: 'Confirm Collection', hinglish: 'Wasooli Jama Karein' },
      'cust_select_customer': { en: 'Select Customer', hinglish: 'Grahak Chunein' },

      // Rojnamcha
      'roj_title': { en: 'Daily Rojnamcha & Cash Register', hinglish: 'Daily Rojnamcha & Cash Register' },
      'roj_drawer_cash': { en: 'Drawer Cash (Galla)', hinglish: 'Galla Cash (Drawer)' },
      'roj_bank_balance': { en: 'Bank Account Balance', hinglish: 'Bank Khata Balance' },
      'roj_today_expenses': { en: 'Today Expenses', hinglish: 'Aaj ke Kharche' },
      'roj_customer_dues': { en: 'Customer Dues (Udhar)', hinglish: 'Grahak Udhar (Khata)' },
      'roj_closing_balance': { en: 'Total Closing Balance (Drawer Cash + Bank)', hinglish: 'Dukan Band Kul Balance (Galla + Bank)' },
      'roj_opening_cash': { en: 'Opening Cash', hinglish: 'Subah ka Galla Cash' },
      'roj_opening_bank': { en: 'Opening Bank', hinglish: 'Subah ka Bank Balance' },
      'roj_cash_sales': { en: 'Cash Sales Today', hinglish: 'Aaj ki Cash Bikri' },
      'roj_cash_dues': { en: 'Cash Udhar Wasooli', hinglish: 'Cash Udhar Wasooli' },
      'roj_online_dues': { en: 'UPI/Bank Udhar Wasooli', hinglish: 'UPI Udhar Wasooli' },
      'roj_cash_expenses': { en: 'Cash Expenses', hinglish: 'Galle se Kharche' },
      'roj_sent_to_bank': { en: 'Sent to Bank (Deposit)', hinglish: 'Bank Bheja (Deposit)' },
      'roj_today_new_dues': { en: 'Today New Udhar', hinglish: 'Aaj Naya Udhar Diya' },
      'roj_today_dues_collected': { en: 'Today Wasooli', hinglish: 'Aaj ki Udhar Wasooli' },
      'roj_total_market_dues': { en: 'Total Market Baaki', hinglish: 'Bazaar me Kul Baaki' },
      'roj_galla_tally': { en: 'Galla Tally', hinglish: 'Galla Gin-Tally' },
      'roj_print_slip': { en: 'Print Rojnamcha', hinglish: 'Rojnamcha Print Karein' }
    };

    window.t = function(key, defaultEn, defaultHinglish) {
      const currentLang = window.APP_LANG || 'en';
      if (window.LANG_DICT && window.LANG_DICT[key]) {
        return window.LANG_DICT[key][currentLang] || window.LANG_DICT[key].en || defaultEn || key;
      }
      if (currentLang === 'hinglish' && defaultHinglish) return defaultHinglish;
      return defaultEn || key;
    };

    function useLang() {
      const [lang, setLang] = useState(() => window.APP_LANG || 'en');
      useEffect(() => {
        const handler = () => setLang(window.APP_LANG || 'en');
        window.addEventListener('app_lang_changed', handler);
        return () => window.removeEventListener('app_lang_changed', handler);
      }, []);
      const tFn = useCallback((key, enVal, hinglishVal) => {
        if (window.LANG_DICT && window.LANG_DICT[key]) {
          return window.LANG_DICT[key][lang] || window.LANG_DICT[key].en || enVal || key;
        }
        if (lang === 'hinglish' && hinglishVal) return hinglishVal;
        return enVal || key;
      }, [lang]);
      return { lang, t: tFn };
    }

    function LanguageToggle() {
      const [lang, setLang] = useState(() => window.APP_LANG || 'en');
      const toggle = () => {
        const next = lang === 'en' ? 'hinglish' : 'en';
        setLang(next);
        window.setAppLanguage(next);
      };
      return (
        <button
          type="button"
          className="nav-btn nav-lang-toggle"
          onClick={toggle}
          title={lang === 'en' ? 'Switch to Hinglish' : 'Switch to English'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: lang === 'hinglish' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.12)',
            border: lang === 'hinglish' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.22)',
            color: '#ffffff',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            marginRight: '6px'
          }}
        >
          <i className="fas fa-language" style={{ fontSize: '13px', color: lang === 'hinglish' ? '#34d399' : '#ffffff' }}></i>
          <span>{lang === 'hinglish' ? 'Hinglish' : 'English'}</span>
        </button>
      );
    }


    // guarded storage — private mode / blocked storage must never throw mid-render
    const ls = {
      get: (k, d = null) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
      set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} },
      json: (k, d = null) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } },
    };

    // ============== UI Palette Registry (36 Curated Modern Palettes) ==============
    // cols per theme: id | name | primary | secondary | bg | card | accent | onAccent
    const UI_THEMES = [
      // Section 1 — Classic enterprise
      { id:'UI 1',  name:'Enterprise Navy',      primary:'#1E3A5F', secondary:'#4F6D8C', bg:'#F7F9FC', card:'#FFFFFF', accent:'#5B8DEF', onAccent:'#FFFFFF' },
      { id:'UI 2',  name:'Graphite & Cyan',      primary:'#2C313C', secondary:'#49515F', bg:'#F5F7FA', card:'#FFFFFF', accent:'#00B8D9', onAccent:'#FFFFFF' },
      { id:'UI 3',  name:'Forest Executive',     primary:'#234E52', secondary:'#52796F', bg:'#F8FAF8', card:'#FFFFFF', accent:'#84A98C', onAccent:'#FFFFFF' },
      { id:'UI 4',  name:'Walnut & Sand',        primary:'#4E3D32', secondary:'#7B6855', bg:'#FAF7F2', card:'#FFFFFF', accent:'#C49A6C', onAccent:'#FFFFFF' },
      { id:'UI 5',  name:'Emerald Corporate',    primary:'#0F766E', secondary:'#4CAF94', bg:'#F5FBFA', card:'#FFFFFF', accent:'#22C55E', onAccent:'#FFFFFF' },
      { id:'UI 6',  name:'Mocha Executive',      primary:'#5B4636', secondary:'#8B7355', bg:'#FCFAF7', card:'#FFFFFF', accent:'#D4A373', onAccent:'#FFFFFF' },
      { id:'UI 7',  name:'Charcoal & Soft Gold', primary:'#2B2F36', secondary:'#4A4F57', bg:'#F7F7F7', card:'#FFFFFF', accent:'#D4AF37', onAccent:'#222222' },
      // Section 2 — Latest SaaS 2026
      { id:'UIv1', name:'Zinc & Sky',           primary:'#18181B', secondary:'#3F3F46', bg:'#FAFAFA', card:'#FFFFFF', accent:'#0EA5E9', onAccent:'#FFFFFF' },
      { id:'UIv2', name:'Ink & Violet',         primary:'#0F0F12', secondary:'#27272A', bg:'#FAFAFA', card:'#FFFFFF', accent:'#8B5CF6', onAccent:'#FFFFFF' },
      { id:'UIv3', name:'Slate & Rose',         primary:'#1E293B', secondary:'#475569', bg:'#F8FAFC', card:'#FFFFFF', accent:'#F43F5E', onAccent:'#FFFFFF' },
      { id:'UIv4', name:'Stone & Amber',        primary:'#292524', secondary:'#57534E', bg:'#FAFAF9', card:'#FFFFFF', accent:'#F59E0B', onAccent:'#222222' },
      { id:'UIv5', name:'Mineral Teal',         primary:'#134E4A', secondary:'#5F7A78', bg:'#F4F7F6', card:'#FFFFFF', accent:'#2DD4BF', onAccent:'#134E4A' },
      { id:'UIv6', name:'Paper & Copper',       primary:'#3F2E24', secondary:'#6B5344', bg:'#FBF8F4', card:'#FFFFFF', accent:'#C47B4A', onAccent:'#FFFFFF' },
      { id:'UIv7', name:'Obsidian & Mint',      primary:'#111827', secondary:'#374151', bg:'#F9FAFB', card:'#FFFFFF', accent:'#34D399', onAccent:'#111827' },
      { id:'UIv8', name:'Cloud & Indigo Soft',  primary:'#312E81', secondary:'#4C51BF', bg:'#F5F5FF', card:'#FFFFFF', accent:'#818CF8', onAccent:'#FFFFFF' },
      // Section 3 — 2026 Trends
      { id:'UIv9',  name:'Aurora Violet',       primary:'#1A1025', secondary:'#3B2A52', bg:'#FAF8FC', card:'#FFFFFF', accent:'#A78BFA', onAccent:'#1A1025' },
      { id:'UIv10', name:'Midnight Neon',       primary:'#0A0A0F', secondary:'#1C1C28', bg:'#F7F7FB', card:'#FFFFFF', accent:'#22D3EE', onAccent:'#0A0A0F' },
      { id:'UIv11', name:'Soft Coral SaaS',     primary:'#1F2937', secondary:'#4B5563', bg:'#FFF9F7', card:'#FFFFFF', accent:'#FB7185', onAccent:'#FFFFFF' },
      { id:'UIv12', name:'Arctic Frost',        primary:'#0C4A6E', secondary:'#0369A1', bg:'#F0F9FF', card:'#FFFFFF', accent:'#38BDF8', onAccent:'#0C4A6E' },
      { id:'UIv13', name:'Quiet Olive',         primary:'#1C1917', secondary:'#44403C', bg:'#FAFAF5', card:'#FFFFFF', accent:'#A3B18A', onAccent:'#1C1917' },
      { id:'UIv14', name:'Ink & Lime',          primary:'#09090B', secondary:'#27272A', bg:'#FAFAFA', card:'#FFFFFF', accent:'#A3E635', onAccent:'#09090B' },
      { id:'UIv15', name:'Rose Quartz',         primary:'#3F1D2E', secondary:'#6B3A4F', bg:'#FDF8FA', card:'#FFFFFF', accent:'#E879A9', onAccent:'#FFFFFF' },
      { id:'UIv16', name:'Carbon Electric',     primary:'#111827', secondary:'#1F2937', bg:'#F8FAFC', card:'#FFFFFF', accent:'#6366F1', onAccent:'#FFFFFF' },
      { id:'UIv17', name:'Warm Terracotta',     primary:'#292524', secondary:'#57534E', bg:'#FFFBF5', card:'#FFFFFF', accent:'#E07A5F', onAccent:'#FFFFFF' },
      { id:'UIv18', name:'Ocean Deep',          primary:'#0B1D36', secondary:'#1B3A5F', bg:'#F4F8FC', card:'#FFFFFF', accent:'#14B8A6', onAccent:'#0B1D36' },
      // Section 4 — Designer Picks 2026
      { id:'UIv19', name:'Cloud Dancer',        primary:'#141414', secondary:'#2B2F36', bg:'#F0EEE9', card:'#FFFFFF', accent:'#BFD3E7', onAccent:'#141414' },
      { id:'UIv20', name:'Soft Ember Glow',     primary:'#2B1538', secondary:'#5A4B8A', bg:'#EDE7E3', card:'#FFFFFF', accent:'#FF6A3D', onAccent:'#FFFFFF' },
      { id:'UIv21', name:'Mood Mode Cyan',      primary:'#0B0D10', secondary:'#151A21', bg:'#F4F6F8', card:'#FFFFFF', accent:'#40E0FF', onAccent:'#0B0D10' },
      { id:'UIv22', name:'Neon Lime Pop',       primary:'#070A0F', secondary:'#1A1F2E', bg:'#F7F8FA', card:'#FFFFFF', accent:'#B6FF3B', onAccent:'#070A0F' },
      { id:'UIv23', name:'Laser Magenta',       primary:'#0F0A12', secondary:'#2A1A28', bg:'#FDF8FC', card:'#FFFFFF', accent:'#FF3BD4', onAccent:'#FFFFFF' },
      { id:'UIv24', name:'Holo Lilac AI',       primary:'#07070A', secondary:'#1A1528', bg:'#F3F0FF', card:'#FFFFFF', accent:'#B9A7FF', onAccent:'#070A0F' },
      { id:'UIv25', name:'Plasma Teal',         primary:'#0A1214', secondary:'#163038', bg:'#F0FFFC', card:'#FFFFFF', accent:'#00F5D4', onAccent:'#0A1214' },
      { id:'UIv26', name:'Eco Digital',         primary:'#101417', secondary:'#316263', bg:'#F5F7F4', card:'#FFFFFF', accent:'#C36A4A', onAccent:'#FFFFFF' },
      { id:'UIv27', name:'Warm Mahogany',       primary:'#221A18', secondary:'#7A2E2A', bg:'#F5EFE7', card:'#FFFFFF', accent:'#C9A46B', onAccent:'#221A18' },
      { id:'UIv28', name:'Fiery Coral Ruby',    primary:'#1A0A0C', secondary:'#4A1520', bg:'#FFF8F7', card:'#FFFFFF', accent:'#FF5A4A', onAccent:'#FFFFFF' },
      { id:'UIv29', name:'Signal Blue Tech',    primary:'#0A0F1A', secondary:'#152040', bg:'#F5F7FF', card:'#FFFFFF', accent:'#3B7BFF', onAccent:'#FFFFFF' },
      { id:'UIv30', name:'Fig & Pear',          primary:'#2D1F24', secondary:'#5C3D45', bg:'#FBF7F2', card:'#FFFFFF', accent:'#A8C256', onAccent:'#2D1F24' },
      // Section 5 — X / SaaS product picks
      { id:'UIv31', name:'Fintech Blurple',     primary:'#0A2540', secondary:'#425466', bg:'#F6F9FC', card:'#FFFFFF', accent:'#635BFF', onAccent:'#FFFFFF' },
      { id:'UIv32', name:'Violet Flow',         primary:'#1C1D22', secondary:'#44454D', bg:'#F7F8F8', card:'#FFFFFF', accent:'#5E6AD2', onAccent:'#FFFFFF' },
      { id:'UIv33', name:'Mono Pro',            primary:'#000000', secondary:'#525252', bg:'#FAFAFA', card:'#FFFFFF', accent:'#171717', onAccent:'#FFFFFF' },
      { id:'UIv34', name:'Warm Analytics',      primary:'#7C2D12', secondary:'#9A3412', bg:'#FFF7ED', card:'#FFFFFF', accent:'#F97316', onAccent:'#222222' },
      // Section 6 — brand palettes
      { id:'UIv35', name:'Ember & Teal',        primary:'#075056', secondary:'#233038', bg:'#FDF6E3', card:'#FFFFFF', accent:'#FF5B04', onAccent:'#233038' },
      // Section 7 - trust & security
      { id:'UItrust', name:'Trust & Security',  primary:'#0F172A', secondary:'#1E293B', bg:'#F8FAFC', card:'#FFFFFF', accent:'#2563EB', onAccent:'#FFFFFF' }
    ];

    const THEME_SECTIONS = [
      ['all', 'All', 'fa-swatchbook'],
      ['classic', 'Classic', 'fa-building-columns'],
      ['saas', 'SaaS 2026', 'fa-cloud'],
      ['trend', 'Trends', 'fa-arrow-trend-up'],
      ['designer', 'Designer', 'fa-wand-magic-sparkles'],
      ['product', 'Product', 'fa-rocket'],
      ['brand', 'Brand', 'fa-fire'],
      ['trust', 'Trust', 'fa-shield-halved']
    ];
    const themeSec = (id) => id === 'UItrust' ? 'trust' : id.indexOf('UI ') === 0 ? 'classic'
      : ((n) => n <= 8 ? 'saas' : n <= 18 ? 'trend' : n <= 30 ? 'designer' : n <= 34 ? 'product' : 'brand')(+id.slice(3));

    const themeVars = (t) => ({
      '--navy-primary': t.primary,
      '--navy-dark':    t.primary,
      '--navy-light':   t.secondary,
      '--navy-hover':   t.secondary,
      '--navy-accent':  t.accent,
      '--c-secondary':  t.secondary,
      '--c-bg':         t.bg,
      '--c-card':       t.card,
      '--c-on-accent':  t.onAccent,
      '--text-primary': '#1A1A1A',
      '--text-muted':   '#6B7280'
    });
    const findTheme = (id) => UI_THEMES.find(t => t.id === id) || null;
    const applyThemeVars = (v) => { const r = document.documentElement; Object.keys(v).forEach(k => r.style.setProperty(k, v[k])); };
    const cacheThemeVars = (v) => ls.set('app_theme_vars', v ? JSON.stringify(v) : null);
    const THEME_KEYS = ['--navy-primary','--navy-dark','--navy-light','--navy-hover','--navy-accent','--c-secondary','--c-bg','--c-card','--c-on-accent','--text-primary','--text-muted'];
    const clearThemeVars = () => { const r = document.documentElement; THEME_KEYS.forEach(k => r.style.removeProperty(k)); };
    const applySavedTheme = () => {
      clearThemeVars();
      const raw = ls.get('app_theme_vars');
      if (raw) {
        try {
          const v = JSON.parse(raw);
          if (v) { applyThemeVars(v); return true; }
        } catch (e) {}
      }
      return false;
    };
    // Initialize theme immediately
    try {
      applySavedTheme();
      if (ls.get('app_theme_mode') === 'dark') document.body.classList.add('dark-mode');
    } catch (e) {}

    function useClickAway(ref, onAway, active = true) {
      const cb = useRef(onAway); cb.current = onAway;
      useEffect(() => {
        if (!active) return;
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) cb.current(); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
      }, [active]);
    }

    function HeaderThemeMenu({ themeMode, onThemeToggle }) {
      const [open, setOpen] = useState(false);
      const [pickedId, setPickedId] = useState(ls.get('app_theme_id') || '');
      const [dirty, setDirty] = useState(false);
      const ref = useRef(null);

      useClickAway(ref, () => setOpen(false), open);

      const preview = (t) => {
        applyThemeVars(themeVars(t));
        setPickedId(t.id);
        setDirty(true);
      };

      const revert = () => {
        applySavedTheme();
        setPickedId(ls.get('app_theme_id') || '');
        setDirty(false);
      };

      const apply = () => {
        const t = findTheme(pickedId);
        if (!t) return;
        const v = themeVars(t);
        applyThemeVars(v);
        cacheThemeVars(v);
        ls.set('app_theme_id', t.id);
        setDirty(false);
        Swal.fire({ icon: 'success', title: 'Theme applied!', text: t.name, timer: 1400, showConfirmButton: false });
      };

      const isDark = themeMode === 'dark';

      return (
        <div className={'thm-dd' + (open ? ' open' : '')} ref={ref}>
          <button className="nav-btn" onClick={() => setOpen(!open)} title="Themes & Dark Mode" aria-label="Themes & Dark Mode">
            <i className="fas fa-palette"></i>
          </button>
          <div className="thm-menu">
            <div className="thm-row">
              <span className="thm-lbl">
                <i className={'fas fa-' + (isDark ? 'moon' : 'sun')}></i> Dark Mode
              </span>
              <label className="tgl">
                <input type="checkbox" checked={isDark} onChange={onThemeToggle} />
                <span className="tgl-track"></span>
              </label>
            </div>
            <div className="thm-sec">
              <div className="thm-sec-h">Color Palette (36 Themes)</div>
              {open && (
                <div className="thm-grid">
                  {UI_THEMES.map((t) => (
                    <div key={t.id} className={'thm-sw' + (pickedId === t.id ? ' on' : '')} title={t.name + ' (' + t.id + ')'} onClick={() => preview(t)}>
                      <span style={{ background: t.primary }}></span>
                      <span style={{ background: t.secondary }}></span>
                      <span style={{ background: t.accent }}></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="thm-hint">Live preview across the entire app — tap Apply to keep it.</div>
            <div className="thm-foot">
              <button className="thm-reset" onClick={revert} disabled={!dirty}>
                <i className="fas fa-rotate-left"></i> Reset
              </button>
              <button className="thm-apply" onClick={apply} disabled={!dirty}>
                <i className="fas fa-check"></i> Apply
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ===== write feedback: counted busy store -> ONE branded overlay =====
    const _busy = { n: 0, verb: '', note: '', subs: new Set() };
    const busyPing = () => _busy.subs.forEach((cb) => cb());
    const busyOn = (verb, note) => { _busy.n++; _busy.verb = verb || 'Working...'; _busy.note = note || ''; busyPing(); };
    const busyOff = () => { _busy.n = Math.max(0, _busy.n - 1); if (!_busy.n) { _busy.verb = ''; _busy.note = ''; } busyPing(); };
    const busyNote = (t) => { _busy.note = t || ''; busyPing(); };
    const busyRun = (verb, p) => { busyOn(verb); return Promise.resolve(p).finally(busyOff); };
    window.addEventListener('error', () => { if (_busy.n) { _busy.n = 0; _busy.verb = ''; _busy.note = ''; busyPing(); } });
    window.addEventListener('unhandledrejection', () => { if (_busy.n) { _busy.n = 0; _busy.verb = ''; _busy.note = ''; busyPing(); } });

    function ProcessingOverlay() {
      const [, force] = useState(0);
      useEffect(() => {
        const cb = () => force(n => n + 1);
        _busy.subs.add(cb);
        return () => _busy.subs.delete(cb);
      }, []);
      useEffect(() => {
        const esc = (e) => { if (_busy.n && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); } };
        document.addEventListener('keydown', esc, true);
        return () => document.removeEventListener('keydown', esc, true);
      }, []);
      if (!_busy.n) return null;
      return (
        <div className="proc-ov" role="status" aria-live="polite" aria-busy="true" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <img src={LOGO_URL} alt="" className="proc-logo" />
          <div className="proc-bar"><i></i></div>
          <div className="proc-label">{_busy.verb}</div>
          {_busy.note ? <div className="proc-count">{_busy.note}</div> : null}
        </div>
      );
    }

    // chevron pipeline — status tabs with live counts
    const PIPE_TONES = ['var(--navy-primary)', 'var(--navy-light)', 'var(--navy-accent)', 'var(--success)', 'var(--warning)', 'var(--danger)', 'var(--c-secondary)'];
    function Pipeline({ stages, value, onPick }) {
      return (
        <div className={'pipeline-stages' + (stages.length > 6 ? ' dense' : '')} role="tablist">
          {stages.map((s, i) => (
            <button key={s.k} type="button" role="tab" aria-selected={value === s.k}
              className={'pipeline-stage' + (value === s.k ? ' active' : '') + (s.n ? '' : ' pipeline-empty')}
              style={{ background: s.tone || PIPE_TONES[i % PIPE_TONES.length] }} onClick={() => onPick(s.k)}>
              <span className="pipeline-stage-name">{s.label}</span>
              <span className="pipeline-stage-count">({s.n || 0})</span>
            </button>
          ))}
        </div>
      );
    }

    // 360 global search across all pages & tools (hotkey: /)
    function GlobalSearch({ setActiveMenu }) {
      const [q, setQ] = useState('');
      const [open, setOpen] = useState(false);
      const [act, setAct] = useState(0);
      const ref = useRef(null);
      const inp = useRef(null);
      const term = useDeferredValue(q).trim().toLowerCase();

      useClickAway(ref, () => setOpen(false), open);

      useEffect(() => {
        const k = (e) => {
          if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '') && !e.target.isContentEditable) {
            e.preventDefault();
            inp.current && inp.current.focus();
          }
        };
        document.addEventListener('keydown', k);
        return () => document.removeEventListener('keydown', k);
      }, []);

      const groups = useMemo(() => {
        if (!term) return [];
        const hit = (s) => String(s || '').toLowerCase().includes(term);
        const out = [];

        const PAGES = [
          { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', sub: 'Overview, analytics & KPIs' },
          { id: 'pos', label: 'QR Sales / POS', icon: 'fa-cash-register', sub: 'Ring up sales, scan barcode / QR' },
          { id: 'products', label: 'Products', icon: 'fa-boxes-stacked', sub: 'Catalog, pricing, QR labels' },
          { id: 'stock', label: 'Stock In/Out', icon: 'fa-dolly', sub: 'Warehouse adjustments & stock logs' },
          { id: 'sales-history', label: 'Sales History', icon: 'fa-receipt', sub: 'View invoices, reprint receipts' },
          { id: 'records', label: 'Customers', icon: 'fa-address-book', sub: 'Manage customer accounts' },
          { id: 'suppliers', label: 'Suppliers', icon: 'fa-truck-field', sub: 'Vendor directory & purchase' },
          { id: 'purchase-orders', label: 'Purchase Orders', icon: 'fa-file-invoice-dollar', sub: 'Manage supplier orders' },
          { id: 'expenses', label: 'Expenses', icon: 'fa-money-bill-trend-up', sub: 'Track business expenses' },
          { id: 'users', label: 'Users', icon: 'fa-users-cog', sub: 'Staff & admin permissions' },
          { id: 'settings', label: 'Settings', icon: 'fa-gear', sub: 'Business info, themes & config' },
          { id: 'logs', label: 'Activity Logs', icon: 'fa-history', sub: 'Audit trail of system changes' },
          { id: 'about', label: 'About App', icon: 'fa-info-circle', sub: 'System specifications' }
        ];

        const matchedPages = PAGES.filter(p => hit(p.label) || hit(p.id) || hit(p.sub)).map(p => ({
          icon: p.icon,
          title: p.label,
          sub: p.sub,
          onClick: () => { setActiveMenu(p.id); setOpen(false); setQ(''); }
        }));
        if (matchedPages.length) out.push(['Navigation', matchedPages]);

        return out;
      }, [term, setActiveMenu]);

      const flat = useMemo(() => groups.reduce((a, g) => a.concat(g[1]), []), [groups]);

      const onKey = (e) => {
        if (e.key === 'Escape') { setOpen(false); e.target.blur(); return; }
        if (!flat.length) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setAct(a => (a + 1) % flat.length); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setAct(a => (a - 1 + flat.length) % flat.length); }
        else if (e.key === 'Enter') { e.preventDefault(); flat[act] && flat[act].onClick(); }
      };

      let n = -1;

      return (
        <div className="gsearch" ref={ref}>
          <i className="fas fa-magnifying-glass gs-lead"></i>
          <input
            className="gs-input"
            ref={inp}
            value={q}
            placeholder="Search pages & tools... ( / )"
            aria-label="Search"
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => term && setOpen(true)}
            onKeyDown={onKey}
          />
          {q && (
            <button className="gs-x" type="button" onClick={() => { setQ(''); setOpen(false); }} title="Clear">
              <i className="fas fa-xmark"></i>
            </button>
          )}
          {open && term && (
            <div className="gs-menu">
              <div className="gs-scroll">
                {flat.length === 0 ? (
                  <div className="gs-empty">
                    <i className="fas fa-magnifying-glass"></i> No matches for "{q}"
                  </div>
                ) : (
                  groups.map(([name, items]) => (
                    <div className="gs-group" key={name}>
                      <div className="gs-group-h">{name} <span>{items.length}</span></div>
                      {items.map((r, i) => {
                        n++;
                        const on = n === act;
                        return (
                          <div
                            className={'gs-item' + (on ? ' on' : '')}
                            key={i}
                            onClick={r.onClick}
                            onMouseEnter={() => setAct(n)}
                          >
                            <i className={'fas ' + r.icon + ' gs-ic'}></i>
                            <div className="gs-txt">
                              <div className="gs-t">{r.title}</div>
                              <div className="gs-s">{r.sub}</div>
                            </div>
                            <i className="fas fa-arrow-right gs-go"></i>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Keyboard shortcuts help modal
    function ShortcutsModal({ onClose }) {
      const shortcuts = [
        { key: '/', desc: 'Global 360 Search (any page)' },
        { key: 'F1', desc: 'Jump to Dashboard' },
        { key: 'F2', desc: 'Jump to QR Sales / POS' },
        { key: 'F3', desc: 'Jump to Products Catalog' },
        { key: 'F4', desc: 'Jump to Customers' },
        { key: 'F8', desc: 'Recall Held Sale (in POS)' },
        { key: 'Esc', desc: 'Close any active modal or dropdown' },
        { key: '?', desc: 'Open this Shortcuts help dialog' }
      ];
      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-keyboard"></i> Keyboard Shortcuts</h3>
              <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
                High-speed POS hotkeys for rapid billing operations:
              </p>
              <div className="kbd-grid">
                {shortcuts.map((s, i) => (
                  <div className="kbd-item" key={i}>
                    <span>{s.desc}</span>
                    <kbd>{s.key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Mobile bottom navigation bar
    function BottomNavigation({ activeMenu, setActiveMenu, role, toggleSidebar }) {
      const items = [
        { id: role === 'Admin' ? 'dashboard' : 'records', label: role === 'Admin' ? 'Dashboard' : 'Customers', icon: role === 'Admin' ? 'fa-chart-line' : 'fa-address-book' },
        { id: 'pos', label: 'POS', icon: 'fa-cash-register' },
        { id: 'products', label: 'Products', icon: 'fa-boxes-stacked' },
        { id: 'sales-history', label: 'Sales', icon: 'fa-receipt' }
      ];
      return (
        <div className="mobile-bottom-nav">
          {items.map(it => (
            <button key={it.id} type="button" className={'mb-item' + (activeMenu === it.id ? ' active' : '')} onClick={() => setActiveMenu(it.id)}>
              <i className={'fas ' + it.icon}></i>
              <span>{it.label}</span>
            </button>
          ))}
          <button type="button" className="mb-item" onClick={toggleSidebar}>
            <i className="fas fa-bars"></i>
            <span>Menu</span>
          </button>
        </div>
      );
    }

    // Daily Register Close / Z-Report modal
    function RegisterZReportModal({ sales = [], returns = [], onClose }) {
      const today = new Date().toISOString().slice(0, 10);
      const todaySales = useMemo(() => sales.filter(s => (s.createdAt || '').slice(0, 10) === today), [sales, today]);
      const todayReturns = useMemo(() => returns.filter(r => (r.createdAt || '').slice(0, 10) === today), [returns, today]);

      const summary = useMemo(() => {
        const cash = todaySales.reduce((a, s) => {
          const m = (s.paymentMethod || '').toLowerCase();
          if (m === 'cash') return a + Number(s.total || 0);
          if (m.includes('split')) return a + Number(s.splitCash || 0);
          return a;
        }, 0);
        const card = todaySales.filter(s => (s.paymentMethod || '').toLowerCase() === 'card').reduce((a, s) => a + Number(s.total || 0), 0);
        const upi = todaySales.reduce((a, s) => {
          const m = (s.paymentMethod || '').toLowerCase();
          if (['online', 'upi'].includes(m)) return a + Number(s.total || 0);
          if (m.includes('split')) return a + Number(s.splitOnline || 0);
          return a;
        }, 0);
        const credit = todaySales.filter(s => s.status === 'credit' || (s.paymentMethod || '').toLowerCase() === 'credit').reduce((a, s) => a + Number(s.total || 0), 0);
        const refund = todayReturns.reduce((a, r) => a + Number(r.totalRefund || 0), 0);
        const totalGross = todaySales.reduce((a, s) => a + Number(s.total || 0), 0);
        const netSales = round2(totalGross - refund);
        const netCashDrawer = round2(cash - refund);
        return {
          ordersCount: todaySales.length,
          totalGross,
          cash,
          card,
          upi,
          credit,
          refund,
          netSales,
          netCashDrawer
        };
      }, [todaySales, todayReturns]);

      const handlePrint = () => {
        window.print();
      };

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-cash-register"></i> Register Summary (Z-Report)</h3>
              <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div className="z-report-slip">
                <div className="z-title">{CFG.business?.name || 'Firebase POS'}</div>
                <div className="z-sub">DAY CLOSE REGISTER REPORT<br />{formatDateForDisplay(new Date().toISOString())}</div>
                <div className="z-divider"></div>
                <div className="z-row"><span>Total Orders:</span><strong>{summary.ordersCount}</strong></div>
                <div className="z-row"><span>Gross Sales:</span><span>{money(summary.totalGross)}</span></div>
                <div className="z-divider"></div>
                <div className="z-row"><span>Cash Sales:</span><span>{money(summary.cash)}</span></div>
                <div className="z-row"><span>Card Sales:</span><span>{money(summary.card)}</span></div>
                <div className="z-row"><span>UPI / Online Sales:</span><span>{money(summary.upi)}</span></div>
                <div className="z-row"><span>Credit / Due Generated:</span><span>{money(summary.credit)}</span></div>
                <div className="z-divider"></div>
                <div className="z-row"><span>Returns / Refunds:</span><span style={{ color: 'red' }}>- {money(summary.refund)}</span></div>
                <div className="z-divider"></div>
                <div className="z-total-row"><span>NET TOTAL SALES:</span><span>{money(summary.netSales)}</span></div>
                <div className="z-total-row" style={{ color: 'var(--navy-accent)' }}><span>CASH IN DRAWER:</span><span>{money(summary.netCashDrawer)}</span></div>
              </div>
              <div className="form-actions" style={{ marginTop: 14 }}>
                <button type="button" className="btn btn-primary" onClick={handlePrint}><i className="fas fa-print"></i> Print Z-Report</button>
                <button type="button" className="btn btn-secondary" onClick={onClose}><i className="fas fa-times"></i> Close</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // CSV Bulk Product Import Modal
    function ProductImportModal({ user, onClose, onDone }) {
      const [csvText, setCsvText] = useState('');
      const [parsedRows, setParsedRows] = useState([]);
      const [importing, setImporting] = useState(false);
      const [progress, setProgress] = useState({ done: 0, total: 0 });
      const fileInputRef = useRef(null);

      const parseCSVData = (text) => {
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) return [];
        const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
        const nameIdx = header.findIndex(h => h.includes('name') || h.includes('title'));
        const skuIdx = header.findIndex(h => h.includes('sku') || h.includes('code'));
        const priceIdx = header.findIndex(h => h.includes('price') || h.includes('rate'));
        const costIdx = header.findIndex(h => h.includes('cost'));
        const catIdx = header.findIndex(h => h.includes('cat') || h.includes('group'));
        const stockIdx = header.findIndex(h => h.includes('stock') || h.includes('qty'));

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length === 0 || !cols[nameIdx >= 0 ? nameIdx : 0]) continue;
          const name = nameIdx >= 0 ? cols[nameIdx] : cols[0];
          const sku = skuIdx >= 0 ? cols[skuIdx] : ('SKU-' + Math.floor(1000 + Math.random() * 9000));
          const price = priceIdx >= 0 ? Number(cols[priceIdx]) || 0 : 0;
          const cost = costIdx >= 0 ? Number(cols[costIdx]) || 0 : 0;
          const category = catIdx >= 0 ? cols[catIdx] : 'General';
          const stock = stockIdx >= 0 ? Number(cols[stockIdx]) || 0 : 0;
          rows.push({ name, sku, price, cost, category, stock });
        }
        return rows;
      };

      const handleFile = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const content = evt.target.result;
          setCsvText(content);
          const rows = parseCSVData(content);
          setParsedRows(rows);
        };
        reader.readAsText(file);
      };

      const handleTextChange = (e) => {
        const val = e.target.value;
        setCsvText(val);
        setParsedRows(parseCSVData(val));
      };

      const handleImport = async () => {
        if (!parsedRows.length) return;
        setImporting(true);
        setProgress({ done: 0, total: parsedRows.length });
        let succ = 0;
        for (let i = 0; i < parsedRows.length; i++) {
          const row = parsedRows[i];
          const res = await fbAddProduct({
            name: row.name,
            sku: row.sku,
            price: row.price,
            cost: row.cost,
            category: row.category,
            reorderLevel: 5,
            status: 'active'
          }, user);
          if (res.success && row.stock > 0) {
            await fbAddStockMovement({
              productId: res.id,
              type: 'in',
              qty: row.stock,
              reason: 'Opening stock (CSV Import)',
              reference: 'CSV-IMPORT',
              unitCost: row.cost
            }, row.name, user);
          }
          succ++;
          setProgress({ done: succ, total: parsedRows.length });
        }
        setImporting(false);
        Swal.fire({ icon: 'success', title: 'Import Complete', text: `Imported ${succ} products successfully!`, timer: 2000, showConfirmButton: false });
        onDone();
      };

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-file-import"></i> Bulk Import Products (CSV)</h3>
              <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div className="file-drop-area" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                <i className="fas fa-cloud-arrow-up file-drop-icon"></i>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Click to choose CSV file</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Format: name, sku, price, cost, category, stock</div>
                <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleFile} />
              </div>

              <div className="form-group" style={{ marginTop: 14 }}>
                <label>Or paste CSV content directly:</label>
                <textarea rows="3" value={csvText} onChange={handleTextChange} placeholder="Name,SKU,Price,Cost,Category,Stock&#10;Sample Item,SKU101,15.00,10.00,General,25"></textarea>
              </div>

              {parsedRows.length > 0 && (
                <>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 10 }}>Preview ({parsedRows.length} items detected):</div>
                  <div className="import-preview-table-wrap">
                    <table className="import-preview-table">
                      <thead>
                        <tr><th>Name</th><th>SKU</th><th>Price</th><th>Cost</th><th>Category</th><th>Stock</th></tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 10).map((r, i) => (
                          <tr key={i}>
                            <td>{r.name}</td><td><code>{r.sku}</code></td><td>{r.price}</td><td>{r.cost}</td><td>{r.category}</td><td>{r.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 10 && <small style={{ color: '#888' }}>+ {parsedRows.length - 10} more rows...</small>}
                </>
              )}

              {importing && (
                <div style={{ marginTop: 14, textAlign: 'center' }}>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>
                  Importing: {progress.done} of {progress.total}...
                </div>
              )}

              <div className="form-actions" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-primary" disabled={importing || !parsedRows.length} onClick={handleImport}>
                  <i className="fas fa-check"></i> Import {parsedRows.length} Products
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose}><i className="fas fa-times"></i> Cancel</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // app-wide config mirror - lets non-component code (money(), datatable renders, exports) read settings synchronously
    const CFG = {
      currency: '₹', currencyCode: 'INR', currencyDecimals: 2, taxRate: 0, taxInclusive: false,
      invoicePrefix: 'INV-', lowStockDefault: 5, receiptHeader: '', receiptFooter: 'Thank you for shopping with us! Visit again.',
      receiptRollWidth: '80mm', dateFormat: 'DD/MM/YYYY',
      upiId: 'shop@upi', upiPayeeName: 'Store',
      business: { name: 'Kirana & Supermarket Mart', address: 'Main Market, Kirana & Supermarket Complex', phone: '+91 98765 43210', email: '' }, logoUrl: ''
    };
    function applySettings(s) {
      if (!s) return;
      CFG.currency = s.currencySymbol || CFG.currency;
      CFG.currencyCode = s.currencyCode || CFG.currencyCode;
      CFG.currencyDecimals = s.currencyDecimals != null && s.currencyDecimals !== '' ? Number(s.currencyDecimals) : CFG.currencyDecimals;
      CFG.taxRate = Number(s.taxRate) || 0;
      CFG.taxInclusive = !!s.taxInclusive;
      CFG.invoicePrefix = s.invoicePrefix || CFG.invoicePrefix;
      CFG.lowStockDefault = (s.lowStockDefault != null && s.lowStockDefault !== '') ? Number(s.lowStockDefault) : CFG.lowStockDefault;
      CFG.receiptHeader = s.receiptHeader || '';
      CFG.receiptFooter = s.receiptFooter || CFG.receiptFooter;
      CFG.receiptRollWidth = s.receiptRollWidth || CFG.receiptRollWidth;
      CFG.dateFormat = s.dateFormat || CFG.dateFormat;
      CFG.logoUrl = s.logoUrl || '';
      CFG.upiId = s.upiId || CFG.upiId;
      CFG.upiPayeeName = s.upiPayeeName || s.businessName || CFG.upiPayeeName;
      CFG.business = { name: s.businessName || CFG.business.name, address: s.address || '', phone: s.phone || '', email: s.email || '' };
      CFG.gstinNumber = s.gstinNumber || CFG.gstinNumber || '';
      if (s.businessName) ls.set('shop_name', s.businessName);
      if (s.logoUrl) ls.set('shop_logo_url', s.logoUrl);
      if (s.address) ls.set('shop_address', s.address);
      if (s.phone) ls.set('shop_phone', s.phone);
      if (s.gstinNumber) ls.set('shop_gstin', s.gstinNumber);
      if (s.receiptFooter) ls.set('shop_receipt_footer', s.receiptFooter);
    }
    // settings + categories flow down through here; refreshConfig re-pulls after an edit
    const ConfigContext = React.createContext({ settings: {}, categories: [], refreshConfig: () => { } });
    const useConfig = () => React.useContext(ConfigContext);
    // category dropdown options - live list from DB, falls back to the seed defaults while loading
    const useCategoryOpts = () => { const { categories } = useConfig(); return useMemo(() => categories.length ? categories.map(c => ({ value: c.name, label: c.name })) : CATEGORY_OPTS, [categories]); };

    const LOGO_URL = ls.get('shop_logo_url') || 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiGXxCe0WNNedmFqSWeF761f7Kshhc-NP5ChRQKz9fr97cO8VaarvD0KlCwqHojJVBWv-RAxfOqMI5rD4H78KnARyOc6QgwL1nRRFWf5xNQ1d9F9HfAoLPPGlTyP0GwNl4n-INMEsWLQ4Y7zJtz5bOdAnc2ePH9-uCRgshlo6BsS6gJEz6fhrxL-5U5O3sX/s160/channels4_profile.jpg';

    const CATEGORY_OPTS = [
      { value: 'Electronics', label: 'Electronics' },
      { value: 'Clothing', label: 'Clothing' },
      { value: 'Food', label: 'Food' },
      { value: 'Services', label: 'Services' },
      { value: 'Other', label: 'Other' }
    ];
    const ACTIVE_OPTS = [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }];
    const LOW_STOCK_OPTS = [{ value: '1', label: 'Low Stock Only' }];
    const ROLE_OPTS = [{ value: 'Admin', label: 'Admin' }, { value: 'User', label: 'User' }];
    const STATUS_OPTS = [{ value: 'active', label: 'Active' }, { value: 'discontinued', label: 'Discontinued' }];
    const PRODUCT_STATUS_FILTER = [{ value: 'active', label: 'Active Only' }, { value: 'discontinued', label: 'Discontinued Only' }];
    const CUSTOMER_TYPE_OPTS = [{ value: 'Retail', label: 'Retail' }, { value: 'Wholesale', label: 'Wholesale' }, { value: 'Lead', label: 'Lead' }, { value: 'VIP', label: 'VIP' }];
    const EXPENSE_CATEGORY_OPTS = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'Transport', 'Maintenance', 'Fees & Taxes', 'Other'].map(c => ({ value: c, label: c }));

    // restock target: explicit reorder qty > (max stock − on hand) > (reorder level × 2 − on hand); never below 0
    function suggestedReorder(p, qtyOnHand) {
      const rl = Number(p.reorderLevel || 0), max = Number(p.maxStock || 0), rq = Number(p.reorderQty || 0);
      if (rq > 0) return rq;
      if (max > 0) return Math.max(0, max - qtyOnHand);
      return Math.max(0, rl * 2 - qtyOnHand);
    }

    const PAYMENT_OPTS = [
      { value: 'Cash', label: '💵 Cash' },
      { value: 'Online', label: '📱 UPI / Online QR' },
      { value: 'Split', label: '⚡ Split (Cash + Online)' },
      { value: 'Card', label: '💳 Card' },
      { value: 'Bank', label: '🏦 Bank Transfer' },
      { value: 'Credit', label: '📝 Credit (unpaid)' }
    ];
    const DISCOUNT_TYPE_OPTS = [{ value: 'flat', label: 'Amount' }, { value: 'percent', label: 'Percent %' }];
    const REASON_IN_OPTS = ['Purchase', 'Return', 'Adjustment', 'Opening Stock', 'Production', 'Transfer In'].map(r => ({ value: r, label: r }));
    const REASON_OUT_OPTS = ['Sale', 'Damage', 'Loss / Theft', 'Adjustment', 'Expired', 'Transfer Out'].map(r => ({ value: r, label: r }));

    // single source for POS money math: order-level discount + per-line tax (product rate or settings default), tax-inclusive aware.
    // also snapshots cost per line for accurate profit later (product cost can change after the sale).
    function computeSaleTotals(cart, prodById, discount) {
      const subtotal = cart.reduce((s, l) => s + l.qty * l.price, 0);
      let discAmt = 0;
      if (discount && Number(discount.value) > 0) discAmt = discount.type === 'percent' ? subtotal * Math.min(Number(discount.value), 100) / 100 : Math.min(Number(discount.value), subtotal);
      const factor = subtotal > 0 ? (subtotal - discAmt) / subtotal : 1; // spread order discount across lines
      let taxTotal = 0;
      const lines = cart.map(l => {
        const p = prodById[l.productId] || {};
        const rate = (p.taxRate != null && p.taxRate !== '' ? Number(p.taxRate) : Number(CFG.taxRate)) || 0;
        const lineTotal = l.qty * l.price;
        const net = lineTotal * factor;
        const lineTax = CFG.taxInclusive ? (net - net / (1 + rate / 100)) : (net * rate / 100);
        taxTotal += lineTax;
        return { productId: l.productId, name: l.name, sku: l.sku, qty: l.qty, price: l.price, cost: Number(p.cost) || 0, taxRate: rate, lineTotal: round2(lineTotal), lineTax: round2(lineTax) };
      });
      const grand = CFG.taxInclusive ? (subtotal - discAmt) : (subtotal - discAmt + taxTotal);
      return { subtotal: round2(subtotal), discount: round2(discAmt), tax: round2(taxTotal), grand: round2(grand), lines };
    }

    const money = (n) => {
      const dp = CFG.currencyDecimals != null ? CFG.currencyDecimals : 2;
      return CFG.currency + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    };
    const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
    const formatDateForDisplay = (iso) => new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const getTimeAgo = (iso) => {
      const s = Math.floor((new Date() - new Date(iso)) / 1000);
      if (s < 60) return s + 's ago';
      if (s < 3600) return Math.floor(s / 60) + 'm ago';
      if (s < 86400) return Math.floor(s / 3600) + 'h ago';
      return Math.floor(s / 86400) + 'd ago';
    };

    
    // Supermarket Barcode Scanner Sound (Web Audio API)
    function playScannerBeep(type = 'success') {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'success') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1760, ctx.currentTime);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.08);
        } else if (type === 'error') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.22);
        }
      } catch (e) {
        // audio context muted or unsupported
      }
    }

    // Format Digital Bill for WhatsApp Sharing
    function formatWhatsAppInvoice(sale) {
      if (!sale) return '';
      const shopName = (CFG.business && CFG.business.name && CFG.business.name.trim()) || ls.get('shop_name') || 'Supermarket & Kirana Mart';
      const shopPhone = CFG.business?.phone || ls.get('shop_phone') || '';
      const shopAddress = CFG.business?.address || ls.get('shop_address') || '';
      const shopGstin = CFG.gstinNumber || ls.get('shop_gstin') || '';
      const items = sale.items || [];
      const invoiceNo = sale.invoiceNo || String(sale.id).slice(-6).toUpperCase();
      const dateStr = formatDateForDisplay(sale.createdAt || sale.date || nowIso());
      const cur = CFG.currency || '₹';

      let text = '🧾 *TAX INVOICE / RETAIL BILL*\n';
      text += '🏪 *' + shopName + '*\n';
      if (shopAddress) text += '📍 ' + shopAddress + '\n';
      if (shopPhone) text += '📞 Contact: ' + shopPhone + '\n';
      if (shopGstin) text += '🏛️ GSTIN: ' + shopGstin + '\n';
      text += '--------------------------------\n';
      text += '*Bill No:* #' + invoiceNo + '\n';
      text += '*Date:* ' + dateStr + '\n';
      text += '*Customer:* ' + (sale.customerName || 'Walk-in') + '\n';
      if (sale.cashier) text += '*Cashier:* ' + sale.cashier + '\n';
      text += '--------------------------------\n';
      text += '🛒 *ITEMS PURCHASED:*\n';

      items.forEach((it, idx) => {
        const lineAmt = Number(it.lineTotal != null ? it.lineTotal : (it.qty * it.price)) || 0;
        text += (idx + 1) + '. *' + it.name + '*\n   ' + it.qty + ' x ' + cur + Number(it.price || it.unitPrice || 0).toFixed(2) + ' = *' + cur + lineAmt.toFixed(2) + '*\n';
      });

      text += '--------------------------------\n';
      text += '*Items:* ' + items.length + ' | *Total Qty:* ' + items.reduce((s, it) => s + (Number(it.qty) || 0), 0) + '\n';
      text += '*Subtotal:* ' + cur + Number(sale.subtotal || sale.total).toFixed(2) + '\n';
      if (Number(sale.discount || sale.discountAmount) > 0) {
        text += '*Discount:* -' + cur + Number(sale.discount || sale.discountAmount).toFixed(2) + '\n';
      }
      if (Number(sale.tax || sale.taxAmount) > 0) {
        text += '*Tax:* ' + cur + Number(sale.tax || sale.taxAmount).toFixed(2) + '\n';
      }
      text += '*GRAND TOTAL:* *' + cur + Number(sale.total).toFixed(2) + '*\n';
      text += '*Payment:* ' + (sale.paymentMethod || 'Cash') + '\n';
      if (sale.changeDue > 0) {
        text += '*Change:* ' + cur + Number(sale.changeDue).toFixed(2) + '\n';
      }
      text += '--------------------------------\n';
      if (sale.loyaltyPointsEarned > 0 || sale.loyaltyPointsRedeemed > 0) {
        text += '--------------------------------\n';
        text += '🎁 *CUSTOMER REWARD POINTS:*\n';
        if (sale.loyaltyPointsRedeemed > 0) {
          text += '*Points Redeemed:* ' + sale.loyaltyPointsRedeemed + ' pts (-' + cur + sale.loyaltyPointsRedeemed + ')\n';
        }
        if (sale.loyaltyPointsEarned > 0) {
          text += '*Points Earned Today:* +' + sale.loyaltyPointsEarned + ' pts\n';
        }
        if (sale.loyaltyPointsBalance != null) {
          text += '*Points Balance:* *' + sale.loyaltyPointsBalance + ' pts* (' + cur + sale.loyaltyPointsBalance + ' discount next time!)\n';
        }
      }
      text += '--------------------------------\n';
      const footerMsg = CFG.receiptFooter || ls.get('shop_receipt_footer') || 'Thank you for shopping with us! Visit again.';
      text += '🙏 *' + footerMsg + '*';
      return text;
    }

    async function shareInvoiceOnWhatsApp(sale, defaultPhone = '') {
      if (!sale) return;
      let phone = defaultPhone || sale.customerPhone || '';
      if (!phone || String(phone).replace(/\D/g, '').length < 10) {
        const { value: inputPhone } = await Swal.fire({
          title: 'Share Bill on WhatsApp',
          input: 'tel',
          inputLabel: 'Customer WhatsApp Mobile Number',
          inputPlaceholder: 'e.g. 9876543210',
          showCancelButton: true,
          confirmButtonText: '<i class="fab fa-whatsapp"></i> Send WhatsApp Bill',
          confirmButtonColor: '#25D366',
          cancelButtonText: 'Cancel',
          inputValidator: (val) => {
            if (!val || val.replace(/\D/g, '').length < 10) {
              return 'Please enter a valid 10-digit mobile number';
            }
          }
        });
        if (!inputPhone) return;
        phone = inputPhone;
      }

      let cleanPhone = String(phone).replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
      }

      const msgText = formatWhatsAppInvoice(sale);
      const waUrl = 'https://api.whatsapp.com/send?phone=' + cleanPhone + '&text=' + encodeURIComponent(msgText);
      window.open(waUrl, '_blank');
    }

    async function copyInvoiceText(sale) {
      if (!sale) return;
      const msgText = formatWhatsAppInvoice(sale);
      try {
        await navigator.clipboard.writeText(msgText);
        Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 })
          .fire({ icon: 'success', title: 'Invoice text copied to clipboard!' });
      } catch (e) {
        Swal.fire({
          title: 'Digital Invoice Text',
          text: msgText
        });
      }
    }


    // qty on hand = running total of a product's stock ledger (in adds, out subtracts) - never stored
    function computeQtyOnHand(productId, movements) {
      return (movements || []).reduce((qty, m) => m.productId === productId ? qty + (m.type === 'in' ? m.qty : -m.qty) : qty, 0);
    }

    // how much of a given sale line has already been returned - prevents returning more than was sold
    function computeReturnedQty(saleId, productId, returns) {
      return (returns || []).reduce((qty, r) => r.saleId === saleId ? qty + (r.items || []).filter(it => it.productId === productId).reduce((s, it) => s + it.qty, 0) : qty, 0);
    }

    // build an instant lookup for POS - normalized id/sku/barcode -> product (avoids a firebase round-trip per scan)
    function buildCodeIndex(products) {
      const m = new Map();
      (products || []).forEach(p => {
        const derivedCode = p.code || p.sku || ('PRD-' + (p.id ? p.id.slice(-3).toUpperCase() : '001'));
        [p.id, p.sku, p.code, derivedCode, p.barcode].forEach(k => {
          if (k) m.set(String(k).trim().toLowerCase(), p);
        });
      });
      return m;
    }


    // race-safe data loading - token guard drops stale + post-unmount results
    function useFetch(fn, deps = []) {
      const [s, setS] = useState({ loading: true, data: null, err: null });
      const tok = useRef(0);
      useEffect(() => {
        const id = ++tok.current;
        setS(p => ({ ...p, loading: true }));
        Promise.resolve(fn())
          .then(r => { if (id === tok.current) setS({ loading: false, data: r, err: null }); })
          .catch(e => { if (id === tok.current) setS({ loading: false, data: null, err: e }); });
        return () => { tok.current++; };
      }, deps);
      return s;
    }

    // --- SearchableDropdown (single-select) ---
    const DropdownItem = React.memo(function DropdownItem({ option, selected, onSelect }) {
      return <div className={`searchable-dropdown-item ${selected ? 'selected' : ''}`} onClick={() => onSelect(option)}>{option.label}</div>;
    });

    function SearchableDropdown({ options, value, onChange, placeholder = 'Select...', label, icon, required = false, disabled = false, onAdd, addLabel = 'Add' }) {
      const [isOpen, setIsOpen] = useState(false);
      const [search, setSearch] = useState('');
      const [adding, setAdding] = useState(false);
      const dropdownRef = useRef(null);
      const selectedLabel = (options.find(o => o.value === value) || {}).label || '';
      const optIdx = useMemo(() => options.map(o => ({ o, k: String(o.label).toLowerCase() })), [options]);
      const dq = useDeferredValue(search).toLowerCase();
      const filtered = useMemo(() => optIdx.filter(x => x.k.indexOf(dq) !== -1).map(x => x.o), [optIdx, dq]);
      const typed = search.trim(), exact = optIdx.some(x => x.k === typed.toLowerCase());

      useClickAway(dropdownRef, () => { setIsOpen(false); setSearch(''); }, isOpen);

      const pickOpt = useCallback((o) => { onChange(o.value); setIsOpen(false); setSearch(''); }, [onChange]);
      const addNew = () => {
        if (!typed || adding || !onAdd) return;
        setAdding(true);
        Promise.resolve(onAdd(typed)).then((v) => { if (v != null && v !== '') pickOpt({ value: v }); }).finally(() => setAdding(false));
      };

      return (
        <div className="form-group">
          {label && <label>{icon && <i className={icon}></i>} {label}{required && ' *'}</label>}
          <div className="searchable-dropdown" ref={dropdownRef}>
            <input type="text" className="searchable-dropdown-input" placeholder={placeholder} disabled={disabled}
              value={isOpen ? search : selectedLabel} required={required && !value}
              onChange={(e) => { setSearch(e.target.value); if (!isOpen) setIsOpen(true); }}
              onClick={() => { if (disabled) return; setIsOpen(!isOpen); if (!isOpen) setSearch(''); }} />
            <span className={'searchable-dropdown-arrow' + (isOpen ? ' open' : '')}><i className="fas fa-chevron-down"></i></span>
            {isOpen && !disabled && (
              <div className="searchable-dropdown-list">
                <div className={'searchable-dropdown-item' + (!value ? ' selected' : '')} onClick={() => pickOpt({ value: '', label: '' })}>{placeholder}</div>
                {filtered.length > 0
                  ? filtered.map((o, idx) => <DropdownItem key={o.value || idx} option={o} selected={value === o.value} onSelect={pickOpt} />)
                  : <div className="searchable-dropdown-item no-results">No results found</div>}
                {onAdd && (typed && !exact
                  ? <div className={'searchable-dropdown-item sd-add' + (adding ? ' busy' : '')} onClick={addNew}>
                      <i className={'fas ' + (adding ? 'fa-spinner fa-spin' : 'fa-plus')}></i> {addLabel} "{typed}"</div>
                  : !typed && <div className="searchable-dropdown-item sd-add muted"><i className="fas fa-plus"></i> Type to add new</div>)}
              </div>
            )}
          </div>
        </div>
      );
    }

    // --- SearchableMultiSelect (multi-select, ready for future multi-attribute fields) ---
    const MultiItem = React.memo(function MultiItem({ option, checked, onToggle }) {
      return <div className={`searchable-dropdown-item ${checked ? 'checked' : ''}`} onClick={() => onToggle(option.value)}>{option.label}</div>;
    });

    function SearchableMultiSelect({ options, values = [], onChange, placeholder = 'Select...', label, icon, required = false }) {
      const [isOpen, setIsOpen] = useState(false);
      const [search, setSearch] = useState('');
      const dropdownRef = useRef(null);
      const sel = useMemo(() => new Set(values), [values]);
      const selectedLabels = useMemo(() => options.filter(o => sel.has(o.value)), [options, sel]);
      const optIdx = useMemo(() => options.map(o => ({ o, k: o.label.toLowerCase() })), [options]);
      const dq = useDeferredValue(search).toLowerCase();
      const filtered = useMemo(() => optIdx.filter(x => x.k.includes(dq)).map(x => x.o), [optIdx, dq]);

      useEffect(() => {
        const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) { setIsOpen(false); setSearch(''); } };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

      const toggleOption = useCallback((optionValue) => {
        const newValues = sel.has(optionValue) ? values.filter(v => v !== optionValue) : [...values, optionValue];
        onChange(newValues);
      }, [values, sel, onChange]);
      const removeTag = (optionValue) => onChange(values.filter(v => v !== optionValue));

      return (
        <div className="form-group">
          {label && <label>{icon && <i className={icon}></i>} {label}{required && ' *'}</label>}
          {selectedLabels.length > 0 && (
            <div className="searchable-multi-tags">
              {selectedLabels.map((o, i) => <span key={i} className="searchable-multi-tag">{o.label}
                <button type="button" className="searchable-multi-tag-remove" onClick={() => removeTag(o.value)}><i className="fas fa-times"></i></button></span>)}
            </div>
          )}
          <div className="searchable-dropdown" ref={dropdownRef}>
            <input type="text" className="searchable-dropdown-input" placeholder={values.length > 0 ? `${values.length} selected` : placeholder}
              value={isOpen ? search : ''} onChange={(e) => { setSearch(e.target.value); if (!isOpen) setIsOpen(true); }}
              onClick={() => { setIsOpen(!isOpen); if (!isOpen) setSearch(''); }} required={required && values.length === 0} />
            <span className={`searchable-dropdown-arrow ${isOpen ? 'open' : ''}`}><i className="fas fa-chevron-down"></i></span>
            {isOpen && (
              <div className="searchable-dropdown-list">
                {filtered.length > 0 ? filtered.map((option, idx) => <MultiItem key={idx} option={option} checked={sel.has(option.value)} onToggle={toggleOption} />)
                  : <div className="searchable-dropdown-item no-results">No results found</div>}
              </div>
            )}
          </div>
        </div>
      );
    }

    // thin top loading bar - non-blocking, replaces the old center popup
    function TopLoadingBar() { return <div className="top-load"><div className="top-load-bar"></div></div>; }

    // reusable summary footer strip for tables - items: [{label, value}]
    function SummaryBar({ items }) {
      return <div className="table-summary">{items.filter(Boolean).map((it, i) => <div className="table-summary-item" key={i}><div className="ts-label">{it.label}</div><div className="ts-value">{it.value}</div></div>)}</div>;
    }

    // small refresh icon button for list headers
    function RefreshBtn({ onClick }) {
      return <button className="btn btn-secondary btn-refresh" onClick={onClick} title="Refresh"><i className="fas fa-rotate"></i></button>;
    }

    // ===== Action-Column Hub: reusable tabbed View modal + per-entity 360 hubs =====
    const HubField = ({ label, value }) => <div className="hub-field"><span className="hf-label">{label}</span><span className="hf-value">{value === 0 ? '0' : (value || '-')}</span></div>;
    const HubKpis = ({ items }) => <div className="hub-kpis">{items.map((it, i) => <div className="hub-kpi" key={i}><div className="k-label">{it.label}</div><div className="k-value">{it.value}</div></div>)}</div>;

    // reverse-chron activity feed from logs matching a term (name/email)
    function HubTimeline({ logs, match }) {
      const m = String(match || '').toLowerCase();
      const rows = (logs || []).filter(l => !m || (`${l.detail || ''} ${l.user || ''}`).toLowerCase().includes(m));
      if (!rows.length) return <div className="hub-empty">No activity recorded.</div>;
      return <ul className="hub-timeline">{rows.map(l => <li key={l.id}><span className="tl-icon"><i className="fas fa-clock-rotate-left"></i></span><div className="tl-body"><strong>{l.action}</strong> — {l.detail}<div className="tl-when">{l.user} · {getTimeAgo(l.ts)}</div></div></li>)}</ul>;
    }

    // tabbed view-hub modal - tabs: [{id,label,icon,content}], header = identity card + kpis
    function TabbedModal({ title, icon, header, tabs, onClose }) {
      const [active, setActive] = useState(tabs[0] && tabs[0].id);
      const cur = tabs.find(t => t.id === active) || tabs[0];
      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3><i className={`fas ${icon}`}></i> {title}</h3><button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button></div>
            <div className="modal-body">
              {header}
              <div className="modal-tabs">{tabs.map(t => <button key={t.id} className={`modal-tab ${active === t.id ? 'active' : ''}`} onClick={() => setActive(t.id)}><i className={`fas ${t.icon}`}></i> {t.label}</button>)}</div>
              <div>{cur && cur.content}</div>
            </div>
          </div>
        </div>
      );
    }

    // Customer 360 - profile + this customer's sales + timeline
    function CustomerHubModal({ customer, onClose }) {
      const { loading, data } = useFetch(() => Promise.all([fbGetSales(), fbGetLogs()]), []);
      const sales = useMemo(() => (data && data[0] && data[0].success ? data[0].data.filter(s => s.customerId === customer.id) : []), [data, customer.id]);
      const logs = useMemo(() => (data && data[1] && data[1].success ? data[1].data : []), [data]);
      const spent = sales.reduce((a, s) => a + Number(s.total || 0), 0);
      const header = (
        <>
          <div className="hub-id-card"><div className="hub-avatar"><i className="fas fa-user-tag"></i></div><div><div className="hub-name">{customer.name}</div><div className="hub-sub">{customer.customerType || 'Retail'}{customer.company ? ' · ' + customer.company : ''}</div></div></div>
          <HubKpis items={[{ label: 'Balance', value: money(customer.amount) }, { label: 'Orders', value: sales.length }, { label: 'Total Spent', value: money(spent) }, { label: 'Credit Limit', value: money(customer.creditLimit) }]} />
        </>
      );
      const tabs = [
        { id: 'overview', label: 'Overview', icon: 'fa-circle-info', content: <div><HubField label="Phone" value={customer.phone} /><HubField label="Email" value={customer.email} /><HubField label="City" value={customer.city} /><HubField label="Country" value={customer.country} /><HubField label="Group" value={customer.category} /><HubField label="Assigned To" value={customer.assignedTo} /><HubField label="Loyalty Points" value={customer.loyaltyPoints} /><HubField label="Tags" value={customer.tags} /><HubField label="Notes" value={customer.notes} /></div> },
        { id: 'sales', label: 'Sales', icon: 'fa-receipt', content: loading ? <div className="hub-empty">Loading…</div> : (sales.length ? <table className="hub-mini-table"><thead><tr><th>Invoice</th><th>Date</th><th>Total</th><th>Pay</th></tr></thead><tbody>{sales.map(s => <tr key={s.id}><td>{s.invoiceNo || String(s.id).slice(-6).toUpperCase()}</td><td>{formatDateForDisplay(s.createdAt)}</td><td>{money(s.total)}</td><td>{s.paymentMethod || '-'}</td></tr>)}</tbody></table> : <div className="hub-empty">No sales for this customer.</div>) },
        { id: 'timeline', label: 'Timeline', icon: 'fa-stream', content: loading ? <div className="hub-empty">Loading…</div> : <HubTimeline logs={logs} match={customer.name} /> }
      ];
      return <TabbedModal title={customer.name} icon="fa-user-tag" header={header} tabs={tabs} onClose={onClose} />;
    }

    // Product hub - details + stock movement ledger + sales history
    function ProductHubModal({ product, onClose }) {
      const { loading, data } = useFetch(() => Promise.all([fbGetStockMovements(), fbGetSales()]), []);
      const moves = useMemo(() => (data && data[0] && data[0].success ? data[0].data.filter(m => m.productId === product.id) : []), [data, product.id]);
      const allSales = useMemo(() => (data && data[1] && data[1].success ? data[1].data : []), [data]);
      const qty = computeQtyOnHand(product.id, moves);
      const soldLines = useMemo(() => allSales.flatMap(s => (s.items || []).filter(it => it.productId === product.id).map(it => ({ id: s.id + it.productId, when: s.createdAt, customer: s.customerName, qty: it.qty, price: it.price }))), [allSales, product.id]);
      const soldQty = soldLines.reduce((a, l) => a + Number(l.qty || 0), 0);
      const margin = Number(product.price) > 0 ? Math.round((Number(product.price) - Number(product.cost || 0)) / Number(product.price) * 100) : 0;
      const header = (
        <>
          <div className="hub-id-card"><div className="hub-avatar"><i className="fas fa-box"></i></div><div><div className="hub-name">{product.name}</div><div className="hub-sub">SKU {product.sku}{product.category ? ' · ' + product.category : ''}</div></div></div>
          <HubKpis items={[{ label: 'On Hand', value: qty }, { label: 'Stock Value', value: money(qty * (Number(product.cost) || 0)) }, { label: 'Sold', value: soldQty }, { label: 'Margin', value: margin + '%' }]} />
        </>
      );
      const tabs = [
        { id: 'details', label: 'Details', icon: 'fa-circle-info', content: <div><HubField label="Price" value={money(product.price)} /><HubField label="Cost" value={money(product.cost)} /><HubField label="Barcode" value={product.barcode} /><HubField label="Brand" value={product.brand} /><HubField label="Unit" value={product.unit} /><HubField label="Reorder Level" value={product.reorderLevel} /><HubField label="Location" value={product.location} /><HubField label="Status" value={product.status || 'active'} /></div> },
        { id: 'stock', label: 'Stock Movement', icon: 'fa-dolly', content: loading ? <div className="hub-empty">Loading…</div> : (moves.length ? <table className="hub-mini-table"><thead><tr><th>Date</th><th>Type</th><th>Qty</th><th>Reason</th></tr></thead><tbody>{moves.map(m => <tr key={m.id}><td>{formatDateForDisplay(m.createdAt)}</td><td>{m.type === 'in' ? 'IN' : 'OUT'}</td><td>{m.qty}</td><td>{m.reason || '-'}</td></tr>)}</tbody></table> : <div className="hub-empty">No stock movements.</div>) },
        { id: 'sales', label: 'Sales History', icon: 'fa-receipt', content: loading ? <div className="hub-empty">Loading…</div> : (soldLines.length ? <table className="hub-mini-table"><thead><tr><th>Date</th><th>Customer</th><th>Qty</th><th>Price</th></tr></thead><tbody>{soldLines.map(l => <tr key={l.id}><td>{formatDateForDisplay(l.when)}</td><td>{l.customer || 'Walk-in'}</td><td>{l.qty}</td><td>{money(l.price)}</td></tr>)}</tbody></table> : <div className="hub-empty">Not sold yet.</div>) }
      ];
      return <TabbedModal title={product.name} icon="fa-box" header={header} tabs={tabs} onClose={onClose} />;
    }

    // Supplier hub - profile + this supplier's POs + timeline
    function SupplierHubModal({ supplier, onClose }) {
      const { loading, data } = useFetch(() => Promise.all([fbGetPurchaseOrders(), fbGetLogs()]), []);
      const supPOs = useMemo(() => (data && data[0] && data[0].success ? data[0].data.filter(p => p.supplierName === supplier.name) : []), [data, supplier.name]);
      const logs = useMemo(() => (data && data[1] && data[1].success ? data[1].data : []), [data]);
      const poValue = supPOs.reduce((a, p) => a + Number(p.total || 0), 0);
      const header = (
        <>
          <div className="hub-id-card"><div className="hub-avatar"><i className="fas fa-truck-field"></i></div><div><div className="hub-name">{supplier.name}</div><div className="hub-sub">{supplier.contact || 'Supplier'}</div></div></div>
          <HubKpis items={[{ label: 'Payable', value: money(supplier.openingBalance) }, { label: 'POs', value: supPOs.length }, { label: 'PO Value', value: money(poValue) }]} />
        </>
      );
      const tabs = [
        { id: 'overview', label: 'Overview', icon: 'fa-circle-info', content: <div><HubField label="Contact" value={supplier.contact} /><HubField label="Phone" value={supplier.phone} /><HubField label="Email" value={supplier.email} /><HubField label="Terms" value={supplier.terms} /><HubField label="Address" value={supplier.address} /><HubField label="Notes" value={supplier.notes} /></div> },
        { id: 'pos', label: 'Purchase Orders', icon: 'fa-file-invoice-dollar', content: loading ? <div className="hub-empty">Loading…</div> : (supPOs.length ? <table className="hub-mini-table"><thead><tr><th>PO #</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>{supPOs.map(p => <tr key={p.id}><td>{p.poNumber}</td><td>{formatDateForDisplay(p.createdAt)}</td><td>{money(p.total)}</td><td>{p.status || 'draft'}</td></tr>)}</tbody></table> : <div className="hub-empty">No purchase orders.</div>) },
        { id: 'timeline', label: 'Timeline', icon: 'fa-stream', content: loading ? <div className="hub-empty">Loading…</div> : <HubTimeline logs={logs} match={supplier.name} /> }
      ];
      return <TabbedModal title={supplier.name} icon="fa-truck-field" header={header} tabs={tabs} onClose={onClose} />;
    }

    // User hub - profile + this user's activity log
    function UserHubModal({ account, onClose }) {
      const { loading, data } = useFetch(() => fbGetLogs(), []);
      const logs = useMemo(() => (data && data.success ? data.data : []), [data]);
      const mine = logs.filter(l => l.user === account.name || l.user === account.email);
      const header = (
        <>
          <div className="hub-id-card"><div className="hub-avatar"><i className="fas fa-user-gear"></i></div><div><div className="hub-name">{account.name}</div><div className="hub-sub">{account.email}</div></div></div>
          <HubKpis items={[{ label: 'Role', value: account.role }, { label: 'Recent Actions', value: mine.length }]} />
        </>
      );
      const tabs = [
        { id: 'profile', label: 'Profile', icon: 'fa-circle-info', content: <div><HubField label="Name" value={account.name} /><HubField label="Email" value={account.email} /><HubField label="Role" value={account.role} /></div> },
        { id: 'activity', label: 'Activity', icon: 'fa-clock-rotate-left', content: loading ? <div className="hub-empty">Loading…</div> : <HubTimeline logs={mine} match="" /> }
      ];
      return <TabbedModal title={account.name} icon="fa-user-gear" header={header} tabs={tabs} onClose={onClose} />;
    }

    // --- Skeletons ---
    function TableSkeleton({ rows = 5, columns = 6 }) {
      return (
        <div className="skeleton-table">
          <div className="skeleton-table-row">{[...Array(columns)].map((_, i) => <div key={i} className="skeleton skeleton-table-cell" style={{ flex: 1 }}></div>)}</div>
          {[...Array(rows)].map((_, r) => <div key={r} className="skeleton-table-row">{[...Array(columns)].map((_, c) => <div key={c} className="skeleton skeleton-table-cell" style={{ flex: 1 }}></div>)}</div>)}
        </div>
      );
    }
    function DashboardCardSkeleton() {
      return <div className="skeleton-card"><div className="skeleton skeleton-icon"></div><div className="skeleton skeleton-text-large" style={{ width: '60%' }}></div><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></div>;
    }

    // --- AdminLTE components ---
    function SmallBox({ value, label, icon, color, onMore }) {
      return (
        <div className={`small-box ${color || 'bg-navy'}`}>
          <div className="inner"><h3>{value}</h3><p>{label}</p></div>
          <div className="icon"><i className={`fas ${icon}`}></i></div>
          {onMore && <button className="small-box-footer" onClick={onMore}>More info <i className="fas fa-arrow-circle-right"></i></button>}
        </div>
      );
    }
    function LteCard({ title, icon, children }) {
      const [open, setOpen] = useState(true);
      return (
        <div className={`lte-card${open ? '' : ' collapsed'}`}>
          <div className="lte-card-header">
            <h3 className="lte-card-title"><i className={`fas ${icon}`}></i> {title}</h3>
            <div className="lte-card-tools"><button onClick={() => setOpen(!open)} title={open ? 'Collapse' : 'Expand'}><i className={`fas fa-${open ? 'minus' : 'plus'}`}></i></button></div>
          </div>
          <div className="lte-card-body">{children}</div>
        </div>
      );
    }

    // --- Navbar ---
    function NavDropdown({ trigger, children }) {
      const [open, setOpen] = useState(false);
      const ref = useRef(null);
      useEffect(() => {
        const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
      }, []);
      return (
        <div className={`nav-dd${open ? ' open' : ''}`} ref={ref}>
          <span onClick={() => setOpen(!open)}>{trigger}</span>
          <div className="nav-dd-menu" onClick={() => setOpen(false)}>{children}</div>
        </div>
      );
    }

    function Navbar({ icon, title, userName, role, notifs = [], onLogout, setActiveMenu, toggleSidebar, themeMode, onThemeToggle, onOpenShortcuts }) {
      return (
        <div className="navbar">
          <div className="navbar-start">
            <button className="nav-btn" onClick={toggleSidebar} title="Menu"><i className="fas fa-bars"></i></button>
            <div className="nav-page">
              <div className="nav-page-title"><i className={`fas ${icon}`}></i> {title}</div>
              <div className="nav-crumb"><i className="fas fa-house"></i> Home <span className="nav-crumb-sep">/</span> {title}</div>
            </div>
          </div>
          <GlobalSearch setActiveMenu={setActiveMenu} />
          <div className="navbar-end">
            <span className="nav-welcome"><span className="nav-welcome-hi">Welcome</span><strong>{userName}</strong></span>
            {onOpenShortcuts && <button className="nav-btn" onClick={onOpenShortcuts} title="Keyboard Shortcuts (?)"><i className="fas fa-keyboard"></i></button>}
            <LanguageToggle />
            <HeaderThemeMenu themeMode={themeMode} onThemeToggle={onThemeToggle} />
            <NavDropdown trigger={<button className="nav-btn" title="Notifications"><i className="fas fa-bell"></i>{notifs.length > 0 && <span className="nav-badge">{notifs.length}</span>}</button>}>
              <div className="nav-dd-head"><div className="dd-title">{notifs.length} Notifications</div>{notifs[0] && <div className="dd-sub">{notifs[0].text}</div>}</div>
              {notifs.slice(0, 5).map((n, i) => <div className="nav-notif" key={i}><i className={`fas ${n.icon || 'fa-circle-info'}`}></i><span>{n.text}</span></div>)}
              <div className="nav-dd-foot"><button className="btn-block" onClick={() => setActiveMenu('logs')}><i className="fas fa-list"></i> View all</button></div>
            </NavDropdown>
            <NavDropdown trigger={<img className="nav-avatar" src={LOGO_URL} alt="" />}>
              <a onClick={() => setActiveMenu('about')}><span><i className="fas fa-user"></i> Profile</span><span className="dd-badge">{role}</span></a>
              <button onClick={onLogout}><span><i className="fas fa-right-from-bracket"></i> Logout</span></button>
            </NavDropdown>
          </div>
        </div>
      );
    }

    // --- Sidebar ---
    function Sidebar({ activeMenu, setActiveMenu, role, user, onLogout, collapsed, mobileOpen, onCloseMobile }) {
      const isAdmin = role === 'Admin';
      return (
        <div className={'sidebar' + (collapsed ? ' collapsed' : '') + (mobileOpen ? ' mobile-open' : '')}>
          <div className="sidebar-brand">
            <img src={LOGO_URL} alt="" className="sidebar-brand-logo" />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
              <span className="sidebar-brand-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{ls.get('shop_name') || 'Kirana & Supermarket POS'}</span>
              <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.18)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.8px', marginTop: '2px' }}>{role ? role.toUpperCase() : 'ADMIN'}</span>
            </div>
            {onCloseMobile && (
              <button
                type="button"
                className="sidebar-mobile-close-btn"
                onClick={onCloseMobile}
                title="Close Menu"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          <div className="sidebar-user-info"><div className="sidebar-user-name">{user?.name}</div><div className="sidebar-user-role">{role}</div></div>
          <div className="sidebar-menu-section">
            
            {/* GENERAL */}
            <div className="sidebar-group">
              <div className="sidebar-group-title">General</div>
              <ul className="sidebar-menu">
                {isAdmin && <li><button className={activeMenu === 'dashboard' ? 'active' : ''} onClick={() => setActiveMenu('dashboard')}><i className="fas fa-chart-line"></i><span>Dashboard</span></button></li>}
                <li><button className={activeMenu === 'pos' ? 'active' : ''} onClick={() => setActiveMenu('pos')}><i className="fas fa-cash-register"></i><span>QR Sales</span></button></li>
              </ul>
            </div>

            {/* ORDERS */}
            <div className="sidebar-group">
              <div className="sidebar-group-title">Orders</div>
              <ul className="sidebar-menu">
                <li><button className={activeMenu === 'board' ? 'active' : ''} onClick={() => setActiveMenu('board')}><i className="fas fa-truck-ramp-box"></i><span>Dispatch Board</span><em className="nav-badge-pill">1</em></button></li>
                <li><button className={activeMenu === 'review' ? 'active' : ''} onClick={() => setActiveMenu('review')}><i className="fas fa-magnifying-glass-dollar"></i><span>Payment Review</span><em className="nav-badge-pill">1</em></button></li>
                <li><button className={activeMenu === 'sales-history' ? 'active' : ''} onClick={() => setActiveMenu('sales-history')}><i className="fas fa-receipt"></i><span>All Orders</span></button></li>
              </ul>
            </div>

            {/* CATALOG */}
            <div className="sidebar-group">
              <div className="sidebar-group-title">Catalog</div>
              <ul className="sidebar-menu">
                <li><button className={activeMenu === 'products' ? 'active' : ''} onClick={() => setActiveMenu('products')}><i className="fas fa-boxes-stacked"></i><span>Products</span></button></li>
                <li><button className={activeMenu === 'categories' ? 'active' : ''} onClick={() => setActiveMenu('categories')}><i className="fas fa-layer-group"></i><span>Categories</span></button></li>
                <li><button className={activeMenu === 'addons' ? 'active' : ''} onClick={() => setActiveMenu('addons')}><i className="fas fa-box-archive"></i><span>Packaging &amp; Extras</span></button></li>
                <li><button className={activeMenu === 'stock' ? 'active' : ''} onClick={() => setActiveMenu('stock')}><i className="fas fa-dolly"></i><span>Stock In/Out</span></button></li>
              </ul>
            </div>

            {/* SALES */}
            <div className="sidebar-group">
              <div className="sidebar-group-title">Sales</div>
              <ul className="sidebar-menu">
                <li><button className={activeMenu === 'records' ? 'active' : ''} onClick={() => setActiveMenu('records')}><i className="fas fa-user-group"></i><span>Customers</span></button></li>
                <li><button className={activeMenu === 'reports' ? 'active' : ''} onClick={() => setActiveMenu('reports')}><i className="fas fa-book-journal-whills"></i><span>Rojnamcha</span><em className="nav-badge-pill" style={{ background: '#16a34a' }}>Day Book</em></button></li>
                {isAdmin && <li><button className={activeMenu === 'expenses' ? 'active' : ''} onClick={() => setActiveMenu('expenses')}><i className="fas fa-money-bill-trend-up"></i><span>Expenses</span></button></li>}
                {isAdmin && <li><button className={activeMenu === 'suppliers' ? 'active' : ''} onClick={() => setActiveMenu('suppliers')}><i className="fas fa-truck-field"></i><span>Suppliers</span></button></li>}
                {isAdmin && <li><button className={activeMenu === 'purchase-orders' ? 'active' : ''} onClick={() => setActiveMenu('purchase-orders')}><i className="fas fa-file-invoice-dollar"></i><span>Purchase Orders</span></button></li>}
              </ul>
            </div>

            {/* SETUP */}
            {isAdmin && (
              <div className="sidebar-group">
                <div className="sidebar-group-title">Setup</div>
                <ul className="sidebar-menu">
                  <li><button className={activeMenu === 'payment-methods' ? 'active' : ''} onClick={() => setActiveMenu('payment-methods')}><i className="fas fa-building-columns"></i><span>Payment Methods</span></button></li>
                  <li><button className={activeMenu === 'settings' ? 'active' : ''} onClick={() => setActiveMenu('settings')}><i className="fas fa-sliders"></i><span>Settings</span></button></li>
                </ul>
              </div>
            )}

            {/* SYSTEM */}
            <div className="sidebar-group">
              <div className="sidebar-group-title">System</div>
              <ul className="sidebar-menu">
                {isAdmin && <li><button className={activeMenu === 'users' ? 'active' : ''} onClick={() => setActiveMenu('users')}><i className="fas fa-users"></i><span>Users</span></button></li>}
                {isAdmin && <li><button className={activeMenu === 'logs' ? 'active' : ''} onClick={() => setActiveMenu('logs')}><i className="fas fa-clock-rotate-left"></i><span>Activity Logs</span></button></li>}
                <li><button className={activeMenu === 'my-settings' ? 'active' : ''} onClick={() => setActiveMenu('my-settings')}><i className="fas fa-palette"></i><span>My Settings</span></button></li>
                <li><button className={activeMenu === 'my-account' ? 'active' : ''} onClick={() => setActiveMenu('my-account')}><i className="fas fa-user-circle"></i><span>My Account</span></button></li>
                <li><button className={activeMenu === 'about' ? 'active' : ''} onClick={() => setActiveMenu('about')}><i className="fas fa-circle-info"></i><span>About</span></button></li>
              </ul>
            </div>

          </div>
          <div className="sidebar-logout"><button onClick={onLogout}><i className="fas fa-sign-out-alt"></i><span>Logout</span></button></div>
        </div>
      );
    }

    // --- Login ---
    function LoginPage({ onLogin }) {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [error, setError] = useState('');
      const [loading, setLoading] = useState(false);

      const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
          const result = await fbLogin(email, password);
          setLoading(false);
          if (result.success) onLogin(result.data, result.data.role);
          else setError(result.message);
        } catch (err) { setLoading(false); setError('Connection error. Please try again.'); }
      };

      return (
        <div className="login-container">
          <div className="login-box">
            <img src={LOGO_URL} alt="Logo" className="login-logo" />
            <h2>Firebase Records Manager</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <div className="form-group"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Logging in...</> : <><i className="fas fa-sign-in-alt"></i> Login</>}
              </button>
              {error && <div className="error">{error}</div>}
            </form>
            <p style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>Demo: admin@demo.com / admin123 (Admin) &nbsp;•&nbsp; user1@demo.com / user123 (User)</p>
          </div>
        </div>
      );
    }

    // --- Record Modal ---
    function RecordModal({ record, onClose, onSave }) {
      const catOpts = useCategoryOpts();
      const [formData, setFormData] = useState({
        name: record?.name || '', email: record?.email || '', phone: record?.phone || '',
        company: record?.company || '', customerType: record?.customerType || 'Retail', taxId: record?.taxId || '',
        category: record?.category || '', address: record?.address || '', city: record?.city || '', country: record?.country || '',
        amount: record?.amount ?? '', creditLimit: record?.creditLimit ?? '', loyaltyPoints: record?.loyaltyPoints ?? '',
        assignedTo: record?.assignedTo || '', source: record?.source || '', nextFollowUp: record?.nextFollowUp || '',
        tags: record?.tags || '', active: record?.active ?? true, notes: record?.notes || ''
      });
      const [saving, setSaving] = useState(false);
      const num = (v) => Number(v) || 0;

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-user-tag"></i> {record ? 'Edit' : 'Add'} Customer</h3>
              <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => { e.preventDefault(); setSaving(true); onSave({ ...formData, amount: num(formData.amount), creditLimit: num(formData.creditLimit), loyaltyPoints: num(formData.loyaltyPoints) }); }}>
                <div className="form-grid">
                  <div className="form-group"><label>Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required /></div>
                  <div className="form-group"><label>Company</label><input type="text" value={formData.company} onChange={(e) => setFormData(p => ({ ...p, company: e.target.value }))} /></div>
                  <div className="form-group"><label>Phone</label><input type="text" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
                  <SearchableDropdown label="Customer Type" icon="fas fa-user-group" options={CUSTOMER_TYPE_OPTS} value={formData.customerType} onChange={(val) => setFormData(p => ({ ...p, customerType: val }))} placeholder="Retail" />
                  <SearchableDropdown label="Group / Category" icon="fas fa-tag" options={catOpts} value={formData.category} onChange={(val) => setFormData(p => ({ ...p, category: val }))} placeholder="Select group..." />
                  <div className="form-group"><label>Tax ID / GST No</label><input type="text" value={formData.taxId} onChange={(e) => setFormData(p => ({ ...p, taxId: e.target.value }))} /></div>
                  <div className="form-group"><label>City</label><input type="text" value={formData.city} onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))} /></div>
                  <div className="form-group"><label>Country</label><input type="text" value={formData.country} onChange={(e) => setFormData(p => ({ ...p, country: e.target.value }))} /></div>
                  <div className="form-group"><label>Opening Balance</label><input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))} /></div>
                  <div className="form-group"><label>Credit Limit</label><input type="number" step="0.01" min="0" value={formData.creditLimit} onChange={(e) => setFormData(p => ({ ...p, creditLimit: e.target.value }))} /></div>
                  <div className="form-group"><label>Loyalty Points</label><input type="number" step="1" min="0" value={formData.loyaltyPoints} onChange={(e) => setFormData(p => ({ ...p, loyaltyPoints: e.target.value }))} /></div>
                  <div className="form-group"><label>Assigned To</label><input type="text" placeholder="Salesperson" value={formData.assignedTo} onChange={(e) => setFormData(p => ({ ...p, assignedTo: e.target.value }))} /></div>
                  <div className="form-group"><label>Source</label><input type="text" placeholder="Walk-in, Referral, Web..." value={formData.source} onChange={(e) => setFormData(p => ({ ...p, source: e.target.value }))} /></div>
                  <div className="form-group"><label><i className="fas fa-calendar-check"></i> Next Follow-up</label><input type="date" value={formData.nextFollowUp} onChange={(e) => setFormData(p => ({ ...p, nextFollowUp: e.target.value }))} /></div>
                  <div className="form-group"><label>Tags</label><input type="text" placeholder="comma,separated" value={formData.tags} onChange={(e) => setFormData(p => ({ ...p, tags: e.target.value }))} /></div>
                  <div className="form-group">
                    <label><i className="fas fa-toggle-on"></i> Active</label>
                    <div><label className="switch-pill"><input type="checkbox" checked={formData.active} onChange={(e) => setFormData(p => ({ ...p, active: e.target.checked }))} /><span className="switch-slider"></span></label></div>
                  </div>
                </div>
                <div className="form-group"><label>Address</label><textarea rows="2" value={formData.address} onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}></textarea></div>
                <div className="form-group"><label>Notes</label><textarea rows="2" value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}></textarea></div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save</>}</button>
                  <button type="button" className="btn btn-secondary" onClick={onClose}><i className="fas fa-times"></i> Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // --- Records View (DataTable CRUD) ---
