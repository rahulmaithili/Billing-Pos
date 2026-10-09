// --- Daily Rojnamcha (Cashbook & Register) + Shop Profile with Logo View ---
function ReportsView({ user, role, setActiveMenu }) {
  const [activeTab, setActiveTab] = useState('rojnamcha'); // 'rojnamcha' | 'profile' | 'analytics'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey(k => k + 1);

  // Modals
  const [showBankDepositModal, setShowBankDepositModal] = useState(false);
  const [showOpeningBalModal, setShowOpeningBalModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showCashTallyModal, setShowCashTallyModal] = useState(false);
  const [showPrintSlip, setShowPrintSlip] = useState(false);
  const [showCollectDuesModal, setShowCollectDuesModal] = useState(false);

  // Form states for modals
  const [depositAmt, setDepositAmt] = useState('');
  const [depositNote, setDepositNote] = useState('Daily Cash Drawer Deposit to Bank');
  const [depositRef, setDepositRef] = useState('');

  const [openingCashInput, setOpeningCashInput] = useState(() => ls.get('rojnamcha_opening_cash_' + selectedDate) || ls.get('rojnamcha_def_opening_cash') || '2000');
  const [openingBankInput, setOpeningBankInput] = useState(() => ls.get('rojnamcha_opening_bank_' + selectedDate) || ls.get('rojnamcha_def_opening_bank') || '15000');

  // Physical cash count state
  const [actualCashCount, setActualCashCount] = useState('');

  // New Expense Quick Form
  const [expTitle, setExpTitle] = useState('');
  const [expAmt, setExpAmt] = useState('');
  const [expCat, setExpCat] = useState('Supplies');
  const [expPayMode, setExpPayMode] = useState('Cash');

  // Shop Profile state
  const [shopName, setShopName] = useState(() => ls.get('shop_name') || (window.CFG && window.CFG.business && window.CFG.business.name) || 'Kirana & Supermarket Mart');
  const [shopTagline, setShopTagline] = useState(() => ls.get('shop_tagline') || 'Chakki Atta, Pure Desi Ghee & Fresh Grocery at Lowest Prices');
  const [shopOwner, setShopOwner] = useState(() => ls.get('shop_owner') || user?.name || 'Store Owner');
  const [shopPhone, setShopPhone] = useState(() => ls.get('shop_phone') || (window.CFG && window.CFG.business && window.CFG.business.phone) || '+91 98765 43210');
  const [shopAddress, setShopAddress] = useState(() => ls.get('shop_address') || (window.CFG && window.CFG.business && window.CFG.business.address) || 'Main Market, Kirana & Supermarket Complex');
  const [shopGstin, setShopGstin] = useState(() => ls.get('shop_gstin') || '');
  const [shopFssai, setShopFssai] = useState(() => ls.get('shop_fssai') || '');
  const [shopLogoUrl, setShopLogoUrl] = useState(() => ls.get('shop_logo_url') || 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiGXxCe0WNNedmFqSWeF761f7Kshhc-NP5ChRQKz9fr97cO8VaarvD0KlCwqHojJVBWv-RAxfOqMI5rD4H78KnARyOc6QgwL1nRRFWf5xNQ1d9F9HfAoLPPGlTyP0GwNl4n-INMEsWLQ4Y7zJtz5bOdAnc2ePH9-uCRgshlo6BsS6gJEz6fhrxL-5U5O3sX/s160/channels4_profile.jpg');
  const [shopUpiId, setShopUpiId] = useState(() => ls.get('pos_custom_upi') || (window.CFG && window.CFG.upiId) || 'shop@upi');
  const [receiptFooter, setReceiptFooter] = useState(() => ls.get('shop_receipt_footer') || (window.CFG && window.CFG.business && window.CFG.business.receiptFooter) || 'Thank you for shopping with us! Visit again.');

  // Fetch Data
  const { loading: loadingSales, data: salesData } = useFetch(() => fbGetSales(), [reloadKey]);
  const sales = useMemo(() => (salesData && salesData.success ? salesData.data : []), [salesData]);

  const { loading: loadingExpenses, data: expData } = useFetch(() => fbGetExpenses(), [reloadKey]);
  const expenses = useMemo(() => (expData && expData.success ? expData.data : []), [expData]);

  const { loading: loadingCust, data: custData } = useFetch(() => fbGetRecords(), [reloadKey]);
  const { loading: loadingDues, data: duesData } = useFetch(() => fbGetDuesCollections(), [reloadKey]);
  const duesCollections = useMemo(() => (duesData && duesData.success ? duesData.data : []), [duesData]);
  const customers = useMemo(() => (custData && custData.success ? custData.data : []), [custData]);

  // Bank Deposits for selected date (Stored in localStorage / state)
  const [bankDeposits, setBankDeposits] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rojnamcha_deposits_' + selectedDate) || '[]'); } catch (e) { return []; }
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rojnamcha_deposits_' + selectedDate) || '[]');
      setBankDeposits(saved);
      setOpeningCashInput(ls.get('rojnamcha_opening_cash_' + selectedDate) || ls.get('rojnamcha_def_opening_cash') || '2000');
      setOpeningBankInput(ls.get('rojnamcha_opening_bank_' + selectedDate) || ls.get('rojnamcha_def_opening_bank') || '15000');
      setActualCashCount(ls.get('rojnamcha_actual_cash_' + selectedDate) || '');
    } catch (e) {}
  }, [selectedDate]);

  // Date steppers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };
  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };
  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  // Filter Sales for Selected Date
  const dateSales = useMemo(() => {
    return sales.filter(s => {
      const d = (s.createdAt || s.date || '').slice(0, 10);
      return d === selectedDate;
    });
  }, [sales, selectedDate]);

  // Filter Expenses for Selected Date
  const dateExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = (e.date || e.createdAt || '').slice(0, 10);
      return d === selectedDate;
    });
  }, [expenses, selectedDate]);

  // Opening balances
  const openingCash = Number(openingCashInput) || 0;
  const openingBank = Number(openingBankInput) || 0;

  // Sales breakdown by payment method
  const salesBreakdown = useMemo(() => {
    let cash = 0, online = 0, splitCash = 0, splitOnline = 0, card = 0, khata = 0, gross = 0;
    dateSales.forEach(s => {
      const amt = Number(s.grandTotal != null ? s.grandTotal : s.total || 0);
      gross += amt;
      const pm = String(s.paymentMethod || '').toLowerCase();
      if (pm === 'cash') cash += amt;
      else if (pm === 'online' || pm === 'upi') online += amt;
      else if (pm === 'card') card += amt;
      else if (pm === 'khata' || pm === 'credit' || pm === 'udhar') khata += amt;
      else if (pm === 'split') {
        const sC = Number(s.splitCash) || 0;
        const sO = Number(s.splitOnline) || 0;
        splitCash += sC;
        splitOnline += sO;
      } else cash += amt;
    });
    return {
      gross,
      cash: cash + splitCash,
      online: online + splitOnline,
      card,
      khata,
      ordersCount: dateSales.length
    };
  }, [dateSales]);

  // Expenses breakdown
  const expBreakdown = useMemo(() => {
    let total = 0, cash = 0, bank = 0;
    dateExpenses.forEach(e => {
      const amt = Number(e.amount || 0);
      total += amt;
      const pm = String(e.paymentMethod || e.mode || 'cash').toLowerCase();
      if (pm.includes('bank') || pm.includes('online') || pm.includes('upi')) bank += amt;
      else cash += amt;
    });
    return { total, cash, bank, count: dateExpenses.length };
  }, [dateExpenses]);

  // Total Sent to Bank (Deposits) today
  const totalSentToBank = useMemo(() => {
    return bankDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [bankDeposits]);

  // Filter Dues Collections for Selected Date
  const dateDuesCollections = useMemo(() => {
    return duesCollections.filter(d => {
      const day = (d.date || d.createdAt || '').slice(0, 10);
      return day === selectedDate;
    });
  }, [duesCollections, selectedDate]);

  const duesCollectedCash = useMemo(() => {
    return dateDuesCollections.filter(d => (d.paymentMode || '').toLowerCase() === 'cash').reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [dateDuesCollections]);

  const duesCollectedOnline = useMemo(() => {
    return dateDuesCollections.filter(d => (d.paymentMode || '').toLowerCase() !== 'cash').reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [dateDuesCollections]);

  const totalDuesCollectedToday = duesCollectedCash + duesCollectedOnline;

  // Customer Dues (Udhar) Tracking
  const todayNewDues = salesBreakdown.khata;
  const totalMarketDues = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [customers]);

  // Expected Drawer Cash calculation
  // Expected Drawer Cash = Opening Cash + Cash Sales - Cash Expenses - Sent to Bank
  const expectedDrawerCash = Math.max(0, round2(openingCash + salesBreakdown.cash + duesCollectedCash - expBreakdown.cash - totalSentToBank));

  // Expected Bank Balance calculation
  // Expected Bank = Opening Bank + Online Sales + Card Sales + Cash Deposited - Bank Expenses
  const expectedBankBalance = round2(openingBank + salesBreakdown.online + salesBreakdown.card + duesCollectedOnline + totalSentToBank - expBreakdown.bank);

  // Total Closing Liquid Assets (Drawer Cash + Bank)
  const totalClosingBalance = round2(expectedDrawerCash + expectedBankBalance);

  // Cash Tally Variance
  const actualCashNum = Number(actualCashCount) || 0;
  const cashVariance = actualCashCount ? round2(actualCashNum - expectedDrawerCash) : null;

  // Handle Save Opening Balance
  const handleSaveOpening = () => {
    ls.set('rojnamcha_opening_cash_' + selectedDate, String(openingCash));
    ls.set('rojnamcha_opening_bank_' + selectedDate, String(openingBank));
    ls.set('rojnamcha_def_opening_cash', String(openingCash));
    ls.set('rojnamcha_def_opening_bank', String(openingBank));
    setShowOpeningBalModal(false);
    Swal.fire({ icon: 'success', title: 'Opening Balance Saved', timer: 1200, showConfirmButton: false });
  };

  // Handle Send to Bank Deposit
  const handleAddDeposit = () => {
    const amt = Number(depositAmt);
    if (!amt || amt <= 0) {
      Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Please enter a valid deposit amount.' });
      return;
    }
    if (amt > expectedDrawerCash) {
      Swal.fire({ icon: 'warning', title: 'Insufficient Drawer Cash', text: `Drawer only has ${money(expectedDrawerCash)}. You cannot deposit ${money(amt)}.` });
      return;
    }

    const newDep = {
      id: Date.now(),
      amount: amt,
      note: depositNote.trim(),
      ref: depositRef.trim() || 'CASH-DEP-' + String(Date.now()).slice(-4),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...bankDeposits, newDep];
    setBankDeposits(updated);
    localStorage.setItem('rojnamcha_deposits_' + selectedDate, JSON.stringify(updated));
    setDepositAmt('');
    setDepositRef('');
    setShowBankDepositModal(false);
    Swal.fire({ icon: 'success', title: 'Deposited to Bank!', text: `${money(amt)} moved from Drawer to Bank Account.`, timer: 1400, showConfirmButton: false });
  };

  // Handle Quick Add Expense
  const handleSaveQuickExpense = async (e) => {
    e.preventDefault();
    if (!expTitle.trim() || !expAmt || Number(expAmt) <= 0) {
      Swal.fire({ icon: 'warning', title: 'Required Fields', text: 'Please enter expense name and valid amount.' });
      return;
    }
    const payload = {
      title: expTitle.trim(),
      amount: Number(expAmt),
      category: expCat,
      paymentMethod: expPayMode,
      date: selectedDate,
      createdAt: new Date().toISOString()
    };
    const res = await fbAddExpense(payload, user);
    if (res.success) {
      setExpTitle('');
      setExpAmt('');
      setShowAddExpenseModal(false);
      reload();
      Swal.fire({ icon: 'success', title: 'Expense Recorded', timer: 1200, showConfirmButton: false });
    } else {
      Swal.fire({ icon: 'error', title: 'Failed to Record Expense', text: res.message });
    }
  };

  // Handle Physical Cash Tally Save
  const handleSaveCashTally = () => {
    ls.set('rojnamcha_actual_cash_' + selectedDate, String(actualCashCount));
    setShowCashTallyModal(false);
    Swal.fire({ icon: 'success', title: 'Physical Cash Recorded', timer: 1200, showConfirmButton: false });
  };

  // Handle Save Shop Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!shopName.trim()) {
      Swal.fire({ icon: 'warning', title: 'Shop Name Required', text: 'Please enter your shop name.' });
      return;
    }

    ls.set('shop_name', shopName.trim());
    ls.set('shop_tagline', shopTagline.trim());
    ls.set('shop_owner', shopOwner.trim());
    ls.set('shop_phone', shopPhone.trim());
    ls.set('shop_address', shopAddress.trim());
    ls.set('shop_gstin', shopGstin.trim());
    ls.set('shop_fssai', shopFssai.trim());
    ls.set('shop_logo_url', shopLogoUrl.trim());
    ls.set('pos_custom_upi', shopUpiId.trim());
    ls.set('shop_receipt_footer', receiptFooter.trim());

    if (window.CFG && window.CFG.business) {
      window.CFG.business.name = shopName.trim();
      window.CFG.business.phone = shopPhone.trim();
      window.CFG.business.address = shopAddress.trim();
      window.CFG.business.receiptFooter = receiptFooter.trim();
      window.CFG.upiId = shopUpiId.trim();
    }

    // Also persist in Firebase settings
    await fbSaveSettings({
      businessName: shopName.trim(),
      phone: shopPhone.trim(),
      address: shopAddress.trim(),
      storeHeadline: shopTagline.trim(),
      logoUrl: shopLogoUrl.trim(),
      gstinNumber: shopGstin.trim()
    }, user);

    Swal.fire({ icon: 'success', title: 'Shop Profile & Logo Saved!', text: 'Your shop name and logo are updated across the whole software and bill prints.', timer: 1600, showConfirmButton: false });
    reload();
  };

  // Handle Logo Upload File
  const handleLogoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setShopLogoUrl(ev.target.result);
      ls.set('shop_logo_url', ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  // WhatsApp Share Text
  const shareRojnamchaWhatsapp = () => {
    const text = `*=== ${shopName.toUpperCase()} ===*
*DAILY ROJNAMCHA / DAY BOOK SUMMARY*
📅 Date: ${selectedDate}

💵 *Cash in Drawer (Galla):* ${money(expectedDrawerCash)}
🏦 *Bank Account Balance:* ${money(expectedBankBalance)}
━━━━━━━━━━━━━━━━━━
💰 *Gross Sales:* ${money(salesBreakdown.gross)} (${salesBreakdown.ordersCount} Bills)
  • Cash Sales: ${money(salesBreakdown.cash)}
  • UPI / Online: ${money(salesBreakdown.online)}
  • Card: ${money(salesBreakdown.card)}
  • Aaj ka Naya Udhar: ${money(todayNewDues)}
━━━━━━━━━━━━━━━━━━
📉 *Today Expenses:* ${money(expBreakdown.total)} (${expBreakdown.count} Entries)
🏛️ *Sent to Bank (Deposits):* ${money(totalSentToBank)}
📒 *Total Market Udhar:* ${money(totalMarketDues)}
━━━━━━━━━━━━━━━━━━
✨ *Total Closing Balance:* ${money(totalClosingBalance)}
Generated by Kirana & Supermarket POS`;

    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(text), '_blank');
  };

  // Preset Supermarket Logos
  const PRESET_LOGOS = [
    { name: 'Supermarket Cart', url: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png' },
    { name: 'Kirana Grocery', url: 'https://cdn-icons-png.flaticon.com/512/372/372627.png' },
    { name: 'Fresh Mart Green', url: 'https://cdn-icons-png.flaticon.com/512/2981/2981297.png' },
    { name: 'Shree Ganesh Mart', url: 'https://cdn-icons-png.flaticon.com/512/3759/3759041.png' },
    { name: 'Departmental Store', url: 'https://cdn-icons-png.flaticon.com/512/1170/1170678.png' },
    { name: 'Wholesale Trade', url: 'https://cdn-icons-png.flaticon.com/512/2897/2897818.png' }
  ];

  return (
    <div className="data-section" style={{ padding: '0 0 24px' }}>
      {(loadingSales || loadingExpenses) && <TopLoadingBar />}

      {/* Breadcrumb & Section Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div>
          <div className="dash-breadcrumb" style={{ margin: '0 0 4px' }}>
            <span><i className="fas fa-book-journal-whills" style={{ color: 'var(--navy-accent)' }}></i> <strong>Rojnamcha</strong></span>
            <span>/</span>
            <span>Accounts</span>
            <span>/</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Daily Cash &amp; Bank Register</span>
          </div>
          <h2 style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-book-journal-whills" style={{ color: 'var(--navy-accent)' }}></i>
            {activeTab === 'rojnamcha' ? 'Daily Rojnamcha & Cash Drawer' : 'Financial Analytics'}
          </h2>
        </div>

        {/* Top View Mode Tabs */}
        <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 8, border: '1px solid #cbd5e1' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'rojnamcha' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('rojnamcha')}
            style={{ fontWeight: 700, fontSize: 12.5 }}
          >
            <i className="fas fa-book-journal-whills" style={{ marginRight: 6 }}></i> Rojnamcha (Day Book)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('analytics')}
            style={{ fontWeight: 700, fontSize: 12.5 }}
          >
            <i className="fas fa-chart-line" style={{ marginRight: 6 }}></i> P&amp;L Analytics
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DAILY ROJNAMCHA (CASHBOOK & DRAWER REGISTER) */}
      {/* ======================================================== */}
      {activeTab === 'rojnamcha' && (
        <div>
          {/* Date Selector & Action Toolbar */}
          <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            {/* Date Navigator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrevDay} title="Previous Day">
                <i className="fas fa-chevron-left"></i>
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 700, fontSize: 13, color: '#0f172a' }}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleNextDay} title="Next Day">
                <i className="fas fa-chevron-right"></i>
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleSetToday} style={{ fontWeight: 600 }}>
                Today
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowOpeningBalModal(true)}
                title="Edit morning opening cash & bank"
                style={{ fontWeight: 600 }}
              >
                <i className="fas fa-wallet" style={{ color: '#0284c7', marginRight: 5 }}></i> Opening Bal
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowBankDepositModal(true)}
                title="Cash drawer se bank me jama karein"
                style={{ fontWeight: 600, background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }}
              >
                <i className="fas fa-building-columns" style={{ marginRight: 5 }}></i> Send to Bank
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddExpenseModal(true)}
                title="Record new expense"
                style={{ fontWeight: 600, background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}
              >
                <i className="fas fa-minus" style={{ marginRight: 5 }}></i> Add Expense
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowCashTallyModal(true)}
                title="Physical cash count verify karein"
                style={{ fontWeight: 600, background: '#fffbeb', borderColor: '#fde68a', color: '#b45309' }}
              >
                <i className="fas fa-calculator" style={{ marginRight: 5 }}></i> Galla Tally
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowPrintSlip(true)}
                style={{ fontWeight: 700 }}
              >
                <i className="fas fa-print" style={{ marginRight: 5 }}></i> Print Rojnamcha
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={shareRojnamchaWhatsapp}
                style={{ background: '#25d366', color: '#fff', borderColor: '#25d366', fontWeight: 700 }}
                title="WhatsApp par share karein"
              >
                <i className="fab fa-whatsapp"></i>
              </button>
            </div>
          </div>

          {/* 4 PRIMARY ROJNAMCHA CARDS (Galla Cash, Bank Balance, Kharche, Udhar) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 18 }}>
            {/* 1. Cash in Drawer (Galla Cash) */}
            <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Drawer Cash (Galla)</span>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>{money(expectedDrawerCash)}</div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  <i className="fas fa-cash-register"></i>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Opening Cash:</span> <strong>{money(openingCash)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                  <span>+ Cash Sales Today:</span> <strong>+{money(salesBreakdown.cash)}</strong>
                </div>
                {duesCollectedCash > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                    <span>+ Cash Udhar Wasooli:</span> <strong>+{money(duesCollectedCash)}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                  <span>- Cash Expenses:</span> <strong>-{money(expBreakdown.cash)}</strong>
                </div>
                {totalSentToBank > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7' }}>
                    <span>- Sent to Bank:</span> <strong>-{money(totalSentToBank)}</strong>
                  </div>
                )}
                {cashVariance != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, padding: '2px 6px', borderRadius: 4, background: cashVariance === 0 ? '#dcfce7' : (cashVariance > 0 ? '#fef3c7' : '#fee2e2'), color: cashVariance === 0 ? '#15803d' : (cashVariance > 0 ? '#b45309' : '#dc2626'), fontWeight: 700 }}>
                    <span>Counted: {money(actualCashNum)}</span>
                    <span>{cashVariance === 0 ? '✓ Match' : (cashVariance > 0 ? `+${money(cashVariance)} Excess` : `${money(cashVariance)} Short`)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Bank Account Balance */}
            <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bank Account Balance</span>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0284c7', marginTop: 2 }}>{money(expectedBankBalance)}</div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  <i className="fas fa-building-columns"></i>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Opening Bank:</span> <strong>{money(openingBank)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                  <span>+ UPI / QR Online:</span> <strong>+{money(salesBreakdown.online)}</strong>
                </div>
                {duesCollectedOnline > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                    <span>+ UPI Udhar Wasooli:</span> <strong>+{money(duesCollectedOnline)}</strong>
                  </div>
                )}
                {salesBreakdown.card > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                    <span>+ Card POS:</span> <strong>+{money(salesBreakdown.card)}</strong>
                  </div>
                )}
                {totalSentToBank > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7' }}>
                    <span>+ Cash Deposited:</span> <strong>+{money(totalSentToBank)}</strong>
                  </div>
                )}
                {expBreakdown.bank > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>- Bank Expenses:</span> <strong>-{money(expBreakdown.bank)}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Today's Expenses (Kharche) */}
            <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today Expenses (Kharche)</span>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#dc2626', marginTop: 2 }}>{money(expBreakdown.total)}</div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  <i className="fas fa-money-bill-transfer"></i>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Entries:</span> <strong>{expBreakdown.count} bills</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Paid from Drawer Cash:</span> <strong>{money(expBreakdown.cash)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Paid from Bank/UPI:</span> <strong>{money(expBreakdown.bank)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <button type="button" onClick={() => setShowAddExpenseModal(true)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                    + Record new expense &gt;
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Customer Dues (Khata / Udhar) */}
            <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Dues (Udhar)</span>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#d97706', marginTop: 2 }}>{money(totalMarketDues)}</div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  <i className="fas fa-book-bookmark"></i>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
                  <span>Today New Udhar:</span> <strong>{money(todayNewDues)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                  <span>Today Wasooli:</span> <strong>+{money(totalDuesCollectedToday)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Market Baaki:</span> <strong>{money(totalMarketDues)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <button type="button" onClick={() => setShowCollectDuesModal(true)} style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', fontSize: 11, fontWeight: 700, borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>
                    <i className="fas fa-hand-holding-dollar"></i> Collect Dues (Wasooli)
                  </button>
                  <button type="button" onClick={() => setActiveMenu && setActiveMenu('records')} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                    Khata Register &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TOTAL CLOSING LIQUIDITY BANNER */}
          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', padding: '14px 20px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Closing Balance (Cash Drawer + Bank Account)
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#38bdf8' }}>
                {money(totalClosingBalance)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#cbd5e1' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Gross Sales:</span> <strong style={{ color: '#fff' }}>{money(salesBreakdown.gross)}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Expenses:</span> <strong style={{ color: '#fca5a5' }}>{money(expBreakdown.total)}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Net Operating Flow:</span> <strong style={{ color: '#86efac' }}>{money(salesBreakdown.gross - expBreakdown.total)}</strong>
              </div>
            </div>
          </div>

          {/* DETAILED TRANSACTION ROJNAMCHA LEDGER TABLE */}
          <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-list-check" style={{ color: 'var(--navy-accent)' }}></i>
                Today's Rojnamcha Entries ({selectedDate})
              </div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                {dateSales.length} Sales · {dateExpenses.length} Expenses · {bankDeposits.length} Bank Deposits
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="dash-attention-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Particulars / Description</th>
                    <th>Mode</th>
                    <th style={{ textAlign: 'right' }}>Cash In (+)</th>
                    <th style={{ textAlign: 'right' }}>Cash Out (-)</th>
                    <th style={{ textAlign: 'right' }}>Bank In (+)</th>
                    <th style={{ textAlign: 'right' }}>Bank Out (-)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening Balance Row */}
                  <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                    <td>08:00 AM</td>
                    <td><span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>OPENING</span></td>
                    <td>Morning Opening Balance (Shuruaat)</td>
                    <td>—</td>
                    <td style={{ textAlign: 'right', color: '#16a34a' }}>{money(openingCash)}</td>
                    <td style={{ textAlign: 'right' }}>—</td>
                    <td style={{ textAlign: 'right', color: '#0284c7' }}>{money(openingBank)}</td>
                    <td style={{ textAlign: 'right' }}>—</td>
                  </tr>

                  {/* Bank Deposits Rows */}
                  {bankDeposits.map(d => (
                    <tr key={'dep-' + d.id} style={{ background: '#f0fdf4' }}>
                      <td>{d.time || '—'}</td>
                      <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>DEPOSIT</span></td>
                      <td>Sent to Bank: {d.note} ({d.ref})</td>
                      <td>Cash ➔ Bank</td>
                      <td style={{ textAlign: 'right' }}>—</td>
                      <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>-{money(d.amount)}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>+{money(d.amount)}</td>
                      <td style={{ textAlign: 'right' }}>—</td>
                    </tr>
                  ))}

                  {/* Sales Rows */}
                  {dateSales.map(s => {
                    const amt = Number(s.grandTotal != null ? s.grandTotal : s.total || 0);
                    const pm = String(s.paymentMethod || 'Cash');
                    const time = s.date ? new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                    const isCash = pm.toLowerCase() === 'cash';
                    const isOnline = pm.toLowerCase() === 'online' || pm.toLowerCase() === 'upi';
                    const isCard = pm.toLowerCase() === 'card';
                    const isKhata = pm.toLowerCase() === 'khata' || pm.toLowerCase() === 'credit';
                    const isSplit = pm.toLowerCase() === 'split';

                    return (
                      <tr key={'sale-' + s.id}>
                        <td>{time}</td>
                        <td><span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>SALE</span></td>
                        <td>Bill #{s.invoiceNo || s.id?.slice(-5)} · {s.customerName || 'Walk-in'}</td>
                        <td><span style={{ fontWeight: 600 }}>{pm}</span></td>
                        <td style={{ textAlign: 'right', color: isCash ? '#16a34a' : '#94a3b8', fontWeight: isCash ? 700 : 400 }}>
                          {isCash ? money(amt) : (isSplit ? money(s.splitCash || 0) : '—')}
                        </td>
                        <td style={{ textAlign: 'right' }}>—</td>
                        <td style={{ textAlign: 'right', color: (isOnline || isCard) ? '#0284c7' : '#94a3b8', fontWeight: (isOnline || isCard) ? 700 : 400 }}>
                          {(isOnline || isCard) ? money(amt) : (isSplit ? money(s.splitOnline || 0) : '—')}
                        </td>
                        <td style={{ textAlign: 'right' }}>—</td>
                      </tr>
                    );
                  })}

                  {/* Dues Collections Rows */}
                  {dateDuesCollections.map(dc => {
                    const isCash = (dc.paymentMode || '').toLowerCase() === 'cash';
                    const amt = Number(dc.amount || 0);
                    const time = dc.createdAt ? new Date(dc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                    return (
                      <tr key={'dues-' + dc.id} style={{ background: '#f0fdf4' }}>
                        <td>{time}</td>
                        <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>WASOOLI</span></td>
                        <td>Dues Collected (Wasooli): {dc.customerName} {dc.note ? `(${dc.note})` : ''}</td>
                        <td><span style={{ fontWeight: 600 }}>{isCash ? '💵 Cash' : '📱 Online UPI'}</span></td>
                        <td style={{ textAlign: 'right', color: isCash ? '#16a34a' : '#94a3b8', fontWeight: isCash ? 700 : 400 }}>
                          {isCash ? '+' + money(amt) : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>—</td>
                        <td style={{ textAlign: 'right', color: !isCash ? '#0284c7' : '#94a3b8', fontWeight: !isCash ? 700 : 400 }}>
                          {!isCash ? '+' + money(amt) : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>—</td>
                      </tr>
                    );
                  })}

                  {/* Expenses Rows */}
                  {dateExpenses.map(e => {
                    const amt = Number(e.amount || 0);
                    const pm = String(e.paymentMethod || e.mode || 'Cash');
                    const isBank = pm.toLowerCase().includes('bank') || pm.toLowerCase().includes('online') || pm.toLowerCase().includes('upi');

                    return (
                      <tr key={'exp-' + e.id} style={{ background: '#fff5f5' }}>
                        <td>{e.date ? new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td><span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>EXPENSE</span></td>
                        <td>{e.title || e.name} ({e.category || 'General'})</td>
                        <td>{pm}</td>
                        <td style={{ textAlign: 'right' }}>—</td>
                        <td style={{ textAlign: 'right', color: !isBank ? '#dc2626' : '#94a3b8', fontWeight: !isBank ? 700 : 400 }}>
                          {!isBank ? `-${money(amt)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>—</td>
                        <td style={{ textAlign: 'right', color: isBank ? '#dc2626' : '#94a3b8', fontWeight: isBank ? 700 : 400 }}>
                          {isBank ? `-${money(amt)}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: FINANCIAL & P&L ANALYTICS */}
      {/* ======================================================== */}
      {activeTab === 'analytics' && (
        <div>
          <div className="lte-kpi-grid">
            <SmallBox value={money(sales.reduce((s, x) => s + (Number(x.grandTotal != null ? x.grandTotal : x.total) || 0), 0))} label="All-Time Revenue" icon="fa-coins" color="bg-navy" />
            <SmallBox value={sales.length} label="Total Completed Orders" icon="fa-receipt" color="bg-info" />
            <SmallBox value={money(expenses.reduce((s, x) => s + (Number(x.amount) || 0), 0))} label="Total Expenses" icon="fa-money-bill-trend-up" color="bg-warning" />
            <SmallBox value={money(sales.reduce((s, x) => s + (Number(x.grandTotal != null ? x.grandTotal : x.total) || 0), 0) - expenses.reduce((s, x) => s + (Number(x.amount) || 0), 0))} label="Net Profit (All Time)" icon="fa-chart-line" color="bg-success" />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: SEND TO BANK (DRAWER CASH ➔ BANK DEPOSIT) */}
      {/* ======================================================== */}
      {showBankDepositModal && (
        <div className="modal-backdrop" onClick={() => setShowBankDepositModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                <i className="fas fa-building-columns" style={{ color: '#16a34a', marginRight: 8 }}></i>
                Send Cash to Bank Account
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowBankDepositModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: 18 }}>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0', marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Current Cash in Drawer:</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{money(expectedDrawerCash)}</div>
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Deposit Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={depositAmt}
                  onChange={e => setDepositAmt(e.target.value)}
                  placeholder="e.g. 5000"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15, fontWeight: 700 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Deposit Description</label>
                <input
                  type="text"
                  value={depositNote}
                  onChange={e => setDepositNote(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Bank Slip / Reference No.</label>
                <input
                  type="text"
                  value={depositRef}
                  onChange={e => setDepositRef(e.target.value)}
                  placeholder="Optional reference number"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowBankDepositModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleAddDeposit} style={{ fontWeight: 700 }}>
                Confirm Bank Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: SET OPENING BALANCE */}
      {/* ======================================================== */}
      {showOpeningBalModal && (
        <div className="modal-backdrop" onClick={() => setShowOpeningBalModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                <i className="fas fa-wallet" style={{ color: '#0284c7', marginRight: 8 }}></i>
                Set Opening Balance ({selectedDate})
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowOpeningBalModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: 18 }}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Morning Opening Cash in Drawer (Galla)</label>
                <input
                  type="number"
                  step="0.01"
                  value={openingCashInput}
                  onChange={e => setOpeningCashInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15, fontWeight: 700 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Morning Bank Account Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={openingBankInput}
                  onChange={e => setOpeningBankInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15, fontWeight: 700 }}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowOpeningBalModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveOpening} style={{ fontWeight: 700 }}>Save Opening Bal</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: QUICK ADD EXPENSE */}
      {/* ======================================================== */}
      {showAddExpenseModal && (
        <div className="modal-backdrop" onClick={() => setShowAddExpenseModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                <i className="fas fa-minus-circle" style={{ color: '#dc2626', marginRight: 8 }}></i>
                Record Daily Expense
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddExpenseModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveQuickExpense}>
              <div className="modal-body" style={{ padding: 18 }}>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Expense Name / Particulars *</label>
                  <input
                    type="text"
                    value={expTitle}
                    onChange={e => setExpTitle(e.target.value)}
                    placeholder="e.g. Staff Chai & Snacks / Dukan Bijli Bill"
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={expAmt}
                      onChange={e => setExpAmt(e.target.value)}
                      required
                      placeholder="150"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 700 }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Category</label>
                    <select
                      value={expCat}
                      onChange={e => setExpCat(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
                    >
                      <option value="Supplies">Supplies / Tea</option>
                      <option value="Rent">Shop Rent</option>
                      <option value="Utilities">Electricity / Water</option>
                      <option value="Salaries">Staff Salary / Daily Wages</option>
                      <option value="Transport">Freight / Transport</option>
                      <option value="Maintenance">Maintenance / Repairs</option>
                      <option value="Other">Other Expenses</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Paid From</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      <input type="radio" name="expPay" checked={expPayMode === 'Cash'} onChange={() => setExpPayMode('Cash')} />
                      Cash Drawer (Galla)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      <input type="radio" name="expPay" checked={expPayMode === 'Bank'} onChange={() => setExpPayMode('Bank')} />
                      Bank Account / UPI
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddExpenseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 700, background: '#dc2626', borderColor: '#dc2626' }}>
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: PHYSICAL CASH COUNT (GALLA TALLY) */}
      {/* ======================================================== */}
      {showCashTallyModal && (
        <div className="modal-backdrop" onClick={() => setShowCashTallyModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                <i className="fas fa-calculator" style={{ color: '#b45309', marginRight: 8 }}></i>
                Physical Cash Count (Galla Tally)
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowCashTallyModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: 18 }}>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0', marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Expected Cash according to System:</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{money(expectedDrawerCash)}</div>
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Actual Cash Counted in Drawer (Galla gin kar dalein):</label>
                <input
                  type="number"
                  step="0.01"
                  value={actualCashCount}
                  onChange={e => setActualCashCount(e.target.value)}
                  placeholder="e.g. 5420"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 16, fontWeight: 800 }}
                />
              </div>

              {actualCashCount && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: cashVariance === 0 ? '#dcfce7' : (cashVariance > 0 ? '#fef3c7' : '#fee2e2'), color: cashVariance === 0 ? '#15803d' : (cashVariance > 0 ? '#b45309' : '#dc2626'), fontWeight: 700, fontSize: 13 }}>
                  {cashVariance === 0 ? '✓ Exact Match! Cash drawer is 100% balanced.' : (cashVariance > 0 ? `⚠️ Excess Cash: ${money(cashVariance)} more than system records.` : `⚠️ Short Cash: ${money(Math.abs(cashVariance))} cash is missing/short.`)}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCashTallyModal(false)}>Close</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveCashTally} style={{ fontWeight: 700 }}>
                Save Count
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: PRINT ROJNAMCHA SLIP */}
      {/* ======================================================== */}
      {showCollectDuesModal && (
        <CollectDuesModal
          customers={customers}
          user={user}
          onClose={() => setShowCollectDuesModal(false)}
          onCollected={() => reload()}
        />
      )}
      {showPrintSlip && (
        <div className="modal-backdrop" onClick={() => setShowPrintSlip(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                <i className="fas fa-print" style={{ marginRight: 6 }}></i>
                Print Daily Rojnamcha Slip
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowPrintSlip(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: 16, background: '#f8fafc' }}>
              <div id="rojnamcha-print-area" style={{ background: '#fff', padding: '16px 14px', borderRadius: 8, border: '1px dashed #cbd5e1', fontFamily: 'monospace', fontSize: 12, color: '#000' }}>
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <img src={shopLogoUrl} alt="" style={{ width: 44, height: 44, objectFit: 'contain', margin: '0 auto 4px' }} />
                  <div style={{ fontWeight: 'bold', fontSize: 15 }}>{shopName}</div>
                  <div style={{ fontSize: 10 }}>{shopTagline}</div>
                  <div style={{ fontSize: 10 }}>{shopAddress}</div>
                  <div style={{ fontSize: 10 }}>Tel: {shopPhone}</div>
                  {shopGstin && <div style={{ fontSize: 10 }}>GSTIN: {shopGstin}</div>}
                  <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }}></div>
                  <div style={{ fontWeight: 'bold' }}>DAILY ROJNAMCHA / CASH REGISTER</div>
                  <div>Date: {selectedDate}</div>
                </div>

                <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Opening Cash (Galla):</span> <strong>{money(openingCash)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Opening Bank Bal:</span> <strong>{money(openingBank)}</strong>
                </div>

                <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }}></div>
                <div style={{ fontWeight: 'bold', marginBottom: 2 }}>TODAY'S COLLECTIONS (IN):</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>  Cash Sales ({salesBreakdown.ordersCount} bills):</span> <span>+{money(salesBreakdown.cash)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>  UPI / QR Online:</span> <span>+{money(salesBreakdown.online)}</span>
                </div>
                {salesBreakdown.card > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>  Card Payments:</span> <span>+{money(salesBreakdown.card)}</span>
                  </div>
                )}
                {salesBreakdown.khata > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>  Aaj ka Naya Udhar:</span> <span>+{money(salesBreakdown.khata)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px dotted #ccc', marginTop: 2 }}>
                  <span>  Total Gross Sales:</span> <span>{money(salesBreakdown.gross)}</span>
                </div>

                <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }}></div>
                <div style={{ fontWeight: 'bold', marginBottom: 2 }}>TODAY'S EXPENSES (OUT):</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>  Cash Expenses:</span> <span>-{money(expBreakdown.cash)}</span>
                </div>
                {expBreakdown.bank > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>  Bank/UPI Expenses:</span> <span>-{money(expBreakdown.bank)}</span>
                  </div>
                )}
                {totalSentToBank > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>  Sent to Bank (Deposit):</span> <span>-{money(totalSentToBank)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px dotted #ccc', marginTop: 2 }}>
                  <span>  Total Expenses:</span> <span>-{money(expBreakdown.total)}</span>
                </div>

                <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }}></div>
                <div style={{ fontWeight: 'bold', marginBottom: 2 }}>CLOSING BALANCES:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>Cash in Drawer (Galla):</span> <strong>{money(expectedDrawerCash)}</strong>
                </div>
                {actualCashCount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span>Physical Cash Counted:</span> <span>{money(actualCashNum)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>Bank Account Bal:</span> <strong>{money(expectedBankBalance)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 'bold', borderTop: '1px dashed #000', paddingTop: 4, marginTop: 4 }}>
                  <span>TOTAL CLOSING:</span> <span>{money(totalClosingBalance)}</span>
                </div>

                <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Market Udhar:</span> <strong>{money(totalMarketDues)}</strong>
                </div>

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <div>--------------------------------</div>
                  <div style={{ fontSize: 10 }}>Cashier / Manager Signature</div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPrintSlip(false)}>Close</button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const printContents = document.getElementById('rojnamcha-print-area').innerHTML;
                  const win = window.open('', '', 'width=450,height=600');
                  win.document.write('<html><head><title>Daily Rojnamcha</title><style>body{font-family:monospace;padding:10px;margin:0;}</style></head><body>');
                  win.document.write(printContents);
                  win.document.write('</body></html>');
                  win.document.close();
                  win.focus();
                  win.print();
                  win.close();
                }}
                style={{ fontWeight: 700 }}
              >
                <i className="fas fa-print" style={{ marginRight: 6 }}></i> Print Slip Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
