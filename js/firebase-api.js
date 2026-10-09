// firebase init - RTDB only, no auth/apiKey needed for basic read/write
    firebase.initializeApp({
      databaseURL: "https://project-bf864408-f4e2-4d6f-83c-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "project-bf864408-f4e2-4d6f-83c"
    });
    window.db = firebase.database();

      function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function nowIso() { return new Date().toISOString(); }

// seed demo login + sample records once, first run only
async function seedDemoData() {
        const usersSnap = await db.ref('users').once('value');
        if (!usersSnap.exists()) {
          await db.ref('users').set({
            u1: { email: 'admin@demo.com', password: 'admin123', role: 'Admin', name: 'Admin User' },
            u2: { email: 'user1@demo.com', password: 'user123', role: 'User', name: 'User 1' }
          });
        }
        const recSnap = await db.ref('records').once('value');
        if (!recSnap.exists()) {
          const cats = ['Electronics', 'Clothing', 'Food', 'Services', 'Other'];
          const recs = {};
          for (let i = 1; i <= 6; i++) {
            const d = new Date(); d.setMonth(d.getMonth() - (6 - i));
            recs['r' + i] = {
              name: 'Customer ' + i, email: 'customer' + i + '@demo.com', phone: '0300' + String(1000000 + i),
              category: cats[(i - 1) % cats.length], amount: i * 100, active: i % 2 === 0,
              notes: 'Sample note for record ' + i, addedBy: 'admin@demo.com', createdAt: d.toISOString()
            };
          }
          await db.ref('records').set(recs);
        }
        const setSnap = await db.ref('settings').once('value');
        if (!setSnap.exists()) {
          await db.ref('settings').set({
            businessName: 'My Business', currencySymbol: '$', currencyCode: 'USD', taxRate: 0, taxInclusive: false,
            invoicePrefix: 'INV-', lowStockDefault: 5, receiptHeader: '', receiptFooter: 'Thank you for your purchase!',
            address: '', phone: '', email: '', logoUrl: ''
          });
        }
        const catSnap = await db.ref('categories').once('value');
        if (!catSnap.exists()) {
          const cats = ['Electronics', 'Clothing', 'Food', 'Services', 'Other'];
          const obj = {}; cats.forEach((c, i) => obj['c' + (i + 1)] = { name: c, createdAt: nowIso() });
          await db.ref('categories').set(obj);
        }
      }
seedDemoData();

    async function fbLogin(email, password) {
      try {
        const snap = await db.ref('users').orderByChild('email').equalTo(email).once('value');
        const val = snap.val();
        if (!val) return { success: false, message: 'Invalid email or password' };
        const entry = Object.entries(val)[0];
        const id = entry[0], user = entry[1];
        if (user.password !== password) return { success: false, message: 'Invalid email or password' };
        return { success: true, data: { id: id, email: user.email, name: user.name, role: user.role } };
      } catch (e) { return { success: false, message: 'Connection error: ' + e.message }; }
    }

    async function fbGetRecords() {
      try {
        const snap = await db.ref('records').once('value');
        const val = snap.val() || {};
        return { success: true, data: Object.entries(val).map(function (e) { return Object.assign({ id: e[0] }, e[1]); }) };
      } catch (e) { return { success: false, message: e.message, data: [] }; }
    }

    async function fbLogActivity(action, user, detail) {
      await db.ref('activity_logs').push({ action: action, detail: detail, user: (user && (user.name || user.email)) || 'System', ts: nowIso() });
    }

    // business settings - single object at /settings
    async function fbGetSettings() {
      try { const snap = await db.ref('settings').once('value'); return { success: true, data: snap.val() || {} }; }
      catch (e) { return { success: false, message: e.message, data: {} }; }
    }
    async function fbSaveSettings(data, user) {
      try { await db.ref('settings').update(data); await fbLogActivity('Update Settings', user, 'Business settings updated'); return { success: true, message: 'Settings saved' }; }
      catch (e) { return { success: false, message: e.message }; }
    }

    // categories - data-driven now (was a hardcoded enum)
    async function fbGetCategories() {
      try { const snap = await db.ref('categories').once('value'); const val = snap.val() || {}; return { success: true, data: Object.entries(val).map(function (e) { return Object.assign({ id: e[0] }, e[1]); }) }; }
      catch (e) { return { success: false, message: e.message, data: [] }; }
    }
    async function fbAddCategory(nameOrData, user) {
      try {
        const isObj = typeof nameOrData === 'object' && nameOrData !== null;
        const nm = String(isObj ? (nameOrData.name || '') : (nameOrData || '')).trim();
        if (!nm) return { success: false, message: 'Category name required' };
        const dupe = await db.ref('categories').orderByChild('name').equalTo(nm).once('value');
        if (dupe.exists()) return { success: false, message: 'That category already exists' };
        const payload = isObj
          ? Object.assign({ createdAt: nowIso(), icon: 'fa-box', description: '' }, nameOrData, { name: nm })
          : { name: nm, icon: 'fa-box', description: '', createdAt: nowIso() };
        const ref = await db.ref('categories').push(payload);
        await fbLogActivity('Add Category', user, nm);
        return { success: true, message: 'Category added', id: ref.key };
      } catch (e) { return { success: false, message: e.message }; }
    }

        async function fbSeedKiranaCategories(user) {
      try {
        const defaults = [
          { name: 'Atta, Flours & Sooji', icon: 'fa-wheat-awn', description: 'Chakki fresh wheat atta, maida, besan, sooji & grains' },
          { name: 'Dals & Pulses', icon: 'fa-seedling', description: 'Toor dal, moong, chana, urad, rajma, chhole & pulses' },
          { name: 'Rice, Basmati & Poha', icon: 'fa-bowl-rice', description: 'Daily rice, premium basmati, kolam, poha & murmura' },
          { name: 'Edible Oils & Pure Ghee', icon: 'fa-droplet', description: 'Mustard oil, refined sunflower, groundnut oil & desi ghee' },
          { name: 'Spices & Whole Masalas', icon: 'fa-pepper-hot', description: 'Haldi, mirch, dhaniya, jeera, rai, hing & whole spices' },
          { name: 'Salt, Sugar & Jaggery', icon: 'fa-cubes', description: 'Tata salt, white sugar, brown sugar & pure gur (jaggery)' },
          { name: 'Snacks, Biscuits & Namkeen', icon: 'fa-cookie-bite', description: 'Biscuits, chips, bhujia, namkeen & instant noodles' },
          { name: 'Dairy & Bakery', icon: 'fa-cheese', description: 'Butter, paneer, cheese, bread, rusks & breakfast items' },
          { name: 'Tea, Coffee & Cold Drinks', icon: 'fa-bottle-water', description: 'Tea leaves, instant coffee, juices & cold soft drinks' },
          { name: 'Personal Care & Soaps', icon: 'fa-pump-soap', description: 'Bathing soaps, shampoos, toothpastes & hair oils' },
          { name: 'Cleaning & Detergents', icon: 'fa-spray-can-sparkles', description: 'Detergent powder, dishwash bars, floor cleaners & liquids' },
          { name: 'Dry Fruits & Nuts', icon: 'fa-cubes-stacked', description: 'Almonds (badam), cashews (kaju), raisins & walnuts' },
          { name: 'Pooja Needs & Agarbatti', icon: 'fa-bell', description: 'Incense sticks, dhoop, kapoor, diya batti & matches' },
          { name: 'Wholesale Cartons & Boras', icon: 'fa-boxes-packing', description: 'Wholesale trade cartons, 25kg/50kg bori & bulk cases' }
        ];
        let added = 0;
        for (const item of defaults) {
          const snap = await db.ref('categories').orderByChild('name').equalTo(item.name).once('value');
          if (!snap.exists()) {
            await db.ref('categories').push(Object.assign({ createdAt: nowIso() }, item));
            added++;
          }
        }
        await fbLogActivity('Seed Categories', user, `${added} Kirana & Supermarket categories seeded`);
        return { success: true, message: `${added} Kirana & Supermarket categories created!`, count: added };
      } catch (e) { return { success: false, message: e.message }; }
    }
    const fbSeedRetailCategories = fbSeedKiranaCategories;
    const fbSeedBeverageCategories = fbSeedKiranaCategories;
    async function fbDeleteCategory(id, name, user) {
      try {
        await db.ref('categories/' + id).remove();
        await fbLogActivity('Delete Category', user, name);
        return { success: true, message: 'Category deleted' };
      } catch (e) {
        return { success: false, message: e.message };
      }
    }

    async function fbUpdateCategory(id, data, user) {
      try {
        const cleanData = typeof data === 'string' ? { name: data.trim() } : data;
        await db.ref('categories/' + id).update(cleanData);
        await fbLogActivity('Update Category', user, cleanData.name || id);
        return { success: true, message: 'Category updated' };
      } catch (e) {
        return { success: false, message: e.message };
      }
    }

    // customers live in /records (repurposed) - POS reads the same node via fbGetCustomers
    async function fbAddRecord(data, user) {
      try {
        const ref = await db.ref('records').push(Object.assign({}, data, { addedBy: user.email, createdAt: nowIso() }));
        await fbLogActivity('Add Customer', user, data.name);
        return { success: true, message: 'Customer added', id: ref.key };
      } catch (e) { return { success: false, message: e.message }; }
    }

    async function fbUpdateRecord(id, data, user) {
      try {
        await db.ref('records/' + id).update(data);
        await fbLogActivity('Update Customer', user, data.name);
        return { success: true, message: 'Customer updated' };
      } catch (e) { return { success: false, message: e.message }; }
    }

    async function fbDeleteRecord(id, name, user) {
      try {
        await db.ref('records/' + id).remove();
        await fbLogActivity('Delete Customer', user, name);
        return { success: true, message: 'Customer deleted' };
      } catch (e) { return { success: false, message: e.message }; }
    }
    const fbGetCustomers = fbGetRecords;

    function toggleActive(id, val) {
      db.ref('records/' + id).update({ active: !!val }).then(function () {
        if (window.refreshRecords) window.refreshRecords();
      }).catch(function (e) { Swal.fire({ icon: 'error', title: 'Error', text: e.message }); });
    }
    window.toggleActive = toggleActive;

    async function fbGetLogs() {
      try {
        const snap = await db.ref('activity_logs').limitToLast(20).once('value');
        const val = snap.val() || {};
        const arr = Object.entries(val).map(function (e) { return Object.assign({ id: e[0] }, e[1]); });
        arr.reverse();
        return { success: true, data: arr };
      } catch (e) { return { success: false, message: e.message, data: [] }; }
    }

    // products - sku via the one transaction() in the app, low-contention sequential counter
    async function fbGenerateSku() {
      try {
        const res = await db.ref('counters/products').transaction(function (cur) { return (cur || 0) + 1; });
        if (!res.committed) return { success: false, message: 'Could not reserve SKU number, try again' };
        const n = res.snapshot.val();
        return { success: true, data: 'SKU-' + String(n).padStart(5, '0') };
      } catch (e) { return { success: false, message: e.message }; }
    }

    // atomic sequential invoice number - prefix from settings
    async function fbGenerateInvoiceNo() {
      try {
        const res = await db.ref('counters/sales').transaction(function (cur) { return (cur || 0) + 1; });
        if (!res.committed) return { success: false, message: 'Could not reserve invoice number, try again' };
        return { success: true, data: (CFG.invoicePrefix || 'INV-') + String(res.snapshot.val()).padStart(5, '0') };
      } catch (e) { return { success: false, message: e.message }; }
    }

    async function fbGetProducts() {
      try {
        const snap = await db.ref('products').once('value');
        const val = snap.val() || {};
        return { success: true, data: Object.entries(val).map(function (e) { return Object.assign({ id: e[0] }, e[1]); }) };
      } catch (e) { return { success: false, message: e.message, data: [] }; }
    }

    async function fbAddProduct(data, user) {
      try {
        const skuRes = await fbGenerateSku();
        if (!skuRes.success) return { success: false, message: skuRes.message };
        const ref = await db.ref('products').push(Object.assign({}, data, { sku: skuRes.data, addedBy: user.email, createdAt: nowIso() }));
        await fbLogActivity('Add Product', user, data.name + ' (' + skuRes.data + ')');
        return { success: true, message: 'Product added (' + skuRes.data + ')', id: ref.key };
      } catch (e) { return { success: false, message: e.message }; }
    }

    // sku is immutable - data here never includes it, so update() can't touch it
    async function fbUpdateProduct(id, data, user) {
      try {
        await db.ref('products/' + id).update(data);
        await fbLogActivity('Update Product', user, data.name);
        return { success: true, message: 'Product updated' };
      } catch (e) { return { success: false, message: e.message }; }
    }

    async function fbDeleteProduct(id, name, user) {
      try {
        await db.ref('products/' + id).remove();
        await fbLogActivity('Delete Product', user, name);
        return { success: true, message: 'Product deleted' };
      } catch (e) { return { success: false, message: e.message }; }
    }

    // stock ledger - qty on hand always derived live from this list, never stored
    async function fbGetStockMovements() {
      try {
        const snap = await db.ref('stock_movements').once('value');
        const val = snap.val() || {};
        return { success: true, data: Object.entries(val).map(function (e) { return Object.assign({ id: e[0] }, e[1]); }) };
      } catch (e) { return { success: false, message: e.message, data: [] }; }
    }

    // productName passed separately (not persisted) just to build the log detail string
    async function fbAddStockMovement(data, productName, user) {
      try {
        const ref = await db.ref('stock_movements').push(Object.assign({}, data, { performedBy: user.email, createdAt: nowIso() }));
        const action = data.type === 'in' ? 'Stock In' : 'Stock Out';
        await fbLogActivity(action, user, data.qty + ' x ' + productName + (data.reason ? ' (' + data.reason + ')' : ''));
        return { success: true, message: action + ' recorded', id: ref.key };
      } catch (e) { return { success: false, message: e.message }; }
    }

    async function fbDeleteStockMovement(id, detail, user) {
      try {
        await db.ref('stock_movements/' + id).remove();
        await fbLogActivity('Delete Stock Entry', user, detail);
        return { success: true, message: 'Stock entry deleted' };
      } catch (e) { return { success: false, message: e.message }; }
    }

    // resolve a scanned/typed code to a product - try it as a firebase key first (qr encodes the push key), fall back to sku match
    async function fbFindProductByCode(code) {
      const trimmed = String(code || '').trim();
      if (!trimmed) return { success: false, message: 'Empty code' };
      try {
        const byKeySnap = await db.ref('products/' + trimmed).once('value');
        if (byKeySnap.exists()) return { success: true, data: Object.assign({ id: trimmed }, byKeySnap.val()) };
      } catch (e) { /* not a valid key - fall through to sku match */ }
      try {
        const bySkuSnap = await db.ref('products').orderByChild('sku').equalTo(trimmed).once('value');
        const val = bySkuSnap.val();
        if (val) { const entry = Object.entries(val)[0]; return { success: true, data: Object.assign({ id: entry[0] }, entry[1]) }; }
      } catch (e) { /* fall through to barcode match */ }
      try {
        const byBarSnap = await db.ref('products').orderByChild('barcode').equalTo(trimmed).once('value');
        const val = byBarSnap.val();
        if (val) { const entry = Object.entries(val)[0]; return { success: true, data: Object.assign({ id: entry[0] }, entry[1]) }; }
      } catch (e) { /* fall through */ }
      try {
        const byCodeSnap = await db.ref('products').orderByChild('code').equalTo(trimmed).once('value');
        const val = byCodeSnap.val();
        if (val) { const entry = Object.entries(val)[0]; return { success: true, data: Object.assign({ id: entry[0] }, entry[1]) }; }
        return { success: false, message: 'No product found for code: ' + trimmed };
      } catch (e) { return { success: false, message: e.message }; }
    }

    // checkout - creates the sale, deducts stock via the ledger (1 out entry per line), logs activity
    async function fbCreateSale(sale, user) {
      try {
        const invRes = await fbGenerateInvoiceNo();
        const invoiceNo = invRes.success ? invRes.data : '';
        const payload = Object.assign({ status: 'completed' }, sale, { invoiceNo, cashier: user.name, createdAt: nowIso() });
        const ref = await db.ref('sales').push(payload);
        const saleId = ref.key;
        await Promise.all(sale.items.map(function (it) {
          return fbAddStockMovement({ productId: it.productId, type: 'out', qty: it.qty, reason: 'Sale', reference: saleId }, it.name, user);
        }));
        const totalStr = CFG.currency + Number(sale.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        await fbLogActivity('Sale', user, invoiceNo + ' — Total ' + totalStr + ' (' + sale.items.length + ' item' + (sale.items.length === 1 ? '' : 's') + ')');
        return { success: true, message: 'Sale completed', id: saleId, data: Object.assign({ id: saleId }, payload) };
      } catch (e) { return { success: false, message: e.message }; }
    }

    async function fbGetSales() {
      try {
        const snap = await db.ref('sales').once('value');
        const val = snap.val() || {};
        const arr = Object.entries(val).map(function (e) { return Object.assign({ id: e[0] }, e[1]); });
        arr.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
        return { success: true, data: arr };
      } catch (e) { return { success: false, message: e.message, data: [] }; }
    }

    async function fbGetReturns() {
      try {
        const snap = await db.ref('returns').once('value');
        const val = snap.val() || {};
        return { success: true, data: Object.entries(val).map(function (e) { return Object.assign({ id: e[0] }, e[1]); }) };
      } catch (e) { return { success: false, message: e.message, data: [] }; }
    }

    // returns credit stock back via the same ledger (type:'in', reason:'Return', reference: saleId), never edits the original sale
    async function fbCreateReturn(saleId, items, user) {
      try {
        const totalRefund = items.reduce(function (s, it) { return s + it.lineTotal; }, 0);
        const ref = await db.ref('returns').push({ saleId: saleId, items: items, totalRefund: totalRefund, processedBy: user.email, createdAt: nowIso() });
        await Promise.all(items.map(function (it) {
          return fbAddStockMovement({ productId: it.productId, type: 'in', qty: it.qty, reason: 'Return', reference: saleId }, it.name, user);
        }));
        const refundStr = '$' + Number(totalRefund || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        await fbLogActivity('Return', user, 'Refund ' + refundStr + ' (' + items.length + ' item' + (items.length === 1 ? '' : 's') + ') for sale ' + saleId);
        return { success: true, message: 'Return processed', id: ref.key };
      } catch (e) { return { success: false, message: e.message }; }
    }

    // bulk receiving - reuses fbAddStockMovement per line, one shared reason/reference across the whole batch
    async function fbBulkStockIn(lines, user) {
      try {
        await Promise.all(lines.map(function (l) {
          return fbAddStockMovement({ productId: l.productId, type: 'in', qty: l.qty, reason: l.reason, reference: l.reference }, l.name, user);
        }));
        const ref = lines[0] && lines[0].reference ? ' (' + lines[0].reference + ')' : '';
        await fbLogActivity('Bulk Stock In', user, lines.length + ' product' + (lines.length === 1 ? '' : 's') + ' received' + ref);
        return { success: true, message: 'Stock received (' + lines.length + ' item' + (lines.length === 1 ? '' : 's') + ')' };
      } catch (e) { return { success: false, message: e.message }; }
    }

    // suppliers - vendor directory + payables opening balance
    async function fbGetSuppliers() {
      try { const snap = await db.ref('suppliers').once('value'); const val = snap.val() || {}; return { success: true, data: Object.entries(val).map(function (e) { return Object.assign({ id: e[0] }, e[1]); }) }; }
      catch (e) { return { success: false, message: e.message, data: [] }; }
    }
    async function fbAddSupplier(data, user) {
      try {
        const ref = await db.ref('suppliers').push(Object.assign({}, data, { addedBy: user.email, createdAt: nowIso() }));
        await fbLogActivity('Add Supplier', user, data.name);
        return { success: true, message: 'Supplier added', id: ref.key };
      } catch (e) { return { success: false, message: e.message }; }
    }
    async function fbUpdateSupplier(id, data, user) {
      try { await db.ref('suppliers/' + id).update(data); await fbLogActivity('Update Supplier', user, data.name || id); return { success: true, message: 'Supplier updated' }; }
      catch (e) { return { success: false, message: e.message }; }
    }
    async function fbDeleteSupplier(id, name, user) {
      try { await db.ref('suppliers/' + id).remove(); await fbLogActivity('Delete Supplier', user, name); return { success: true, message: 'Supplier deleted' }; }
      catch (e) { return { success: false, message: e.message }; }
    }

    // expenses - operating costs feeding the P&L
    async function fbGetExpenses() {
      try { const snap = await db.ref('expenses').once('value'); const val = snap.val() || {}; const arr = Object.entries(val).map(function (e) { return Object.assign({ id: e[0] }, e[1]); }); arr.sort(function (a, b) { return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt); }); return { success: true, data: arr }; }
      catch (e) { return { success: false, message: e.message, data: [] }; }
    }
    async function fbAddExpense(data, user) {
      try {
        const ref = await db.ref('expenses').push(Object.assign({}, data, { addedBy: user.email, createdAt: nowIso() }));
        await fbLogActivity('Add Expense', user, (data.category || 'Expense') + ' ' + CFG.currency + (Number(data.amount) || 0));
        return { success: true, message: 'Expense added', id: ref.key };
      } catch (e) { return { success: false, message: e.message }; }
    }
    async function fbUpdateExpense(id, data, user) {
      try { await db.ref('expenses/' + id).update(data); await fbLogActivity('Update Expense', user, (data.category || 'Expense')); return { success: true, message: 'Expense updated' }; }
      catch (e) { return { success: false, message: e.message }; }
    }
    async function fbDeleteExpense(id, detail, user) {
      try { await db.ref('expenses/' + id).remove(); await fbLogActivity('Delete Expense', user, detail); return { success: true, message: 'Expense deleted' }; }
      catch (e) { return { success: false, message: e.message }; }
    }

    // purchase orders - create -> (later) receive into the stock ledger
    async function fbGeneratePoNumber() {
      try {
        const res = await db.ref('counters/pos').transaction(function (cur) { return (cur || 0) + 1; });
        if (!res.committed) return { success: false, message: 'Could not reserve PO number, try again' };
        return { success: true, data: 'PO-' + String(res.snapshot.val()).padStart(5, '0') };
      } catch (e) { return { success: false, message: e.message }; }
    }
    async function fbGetPurchaseOrders() {
      try { const snap = await db.ref('purchase_orders').once('value'); const val = snap.val() || {}; const arr = Object.entries(val).map(function (e) { return Object.assign({ id: e[0] }, e[1]); }); arr.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }); return { success: true, data: arr }; }
      catch (e) { return { success: false, message: e.message, data: [] }; }
    }
    async function fbCreatePurchaseOrder(po, user) {
      try {
        const poRes = await fbGeneratePoNumber();
        const poNumber = poRes.success ? poRes.data : '';
        const payload = Object.assign({ status: 'ordered' }, po, { poNumber, createdBy: user.email, createdAt: nowIso() });
        const ref = await db.ref('purchase_orders').push(payload);
        await fbLogActivity('Create PO', user, poNumber + ' — ' + (po.supplierName || '') + ' (' + CFG.currency + (Number(po.total) || 0) + ')');
        return { success: true, message: 'PO ' + poNumber + ' created', id: ref.key, data: Object.assign({ id: ref.key }, payload) };
      } catch (e) { return { success: false, message: e.message }; }
    }
    // receive: one Stock In per line (reason Purchase, carries unit cost + supplier), then flag the PO received
    async function fbReceivePurchaseOrder(po, user, updateCost) {
      try {
        await Promise.all((po.items || []).map(function (it) {
          return fbAddStockMovement({ productId: it.productId, type: 'in', qty: it.qty, reason: 'Purchase', reference: po.poNumber, unitCost: Number(it.unitCost) || 0, supplier: po.supplierName || null, notes: 'PO receipt' }, it.name, user);
        }));
        if (updateCost) await Promise.all((po.items || []).filter(function (it) { return Number(it.unitCost) > 0; }).map(function (it) { return fbUpdateProduct(it.productId, { cost: Number(it.unitCost) }, user); }));
        await db.ref('purchase_orders/' + po.id).update({ status: 'received', receivedAt: nowIso() });
        await fbLogActivity('Receive PO', user, po.poNumber + ' (' + (po.items || []).length + ' line' + ((po.items || []).length === 1 ? '' : 's') + ')');
        return { success: true, message: 'PO received — stock updated' };
      } catch (e) { return { success: false, message: e.message }; }
    }
    async function fbUpdatePurchaseOrder(id, data, user) {
      try { await db.ref('purchase_orders/' + id).update(data); await fbLogActivity('Update PO', user, data.poNumber || id); return { success: true, message: 'PO updated' }; }
      catch (e) { return { success: false, message: e.message }; }
    }
    async function fbDeletePurchaseOrder(id, poNumber, user) {
      try { await db.ref('purchase_orders/' + id).remove(); await fbLogActivity('Delete PO', user, poNumber); return { success: true, message: 'PO deleted' }; }
      catch (e) { return { success: false, message: e.message }; }
    }

    async function fbGetUsers() {
      try {
        const snap = await db.ref('users').once('value');
        const val = snap.val() || {};
        return { success: true, data: Object.entries(val).map(function (e) { return Object.assign({ id: e[0] }, e[1]); }) };
      } catch (e) { return { success: false, message: e.message, data: [] }; }
    }

    async function fbAddUser(data, user) {
      try {
        const existing = await db.ref('users').orderByChild('email').equalTo(data.email).once('value');
        if (existing.exists()) return { success: false, message: 'A user with this email already exists' };
        const ref = await db.ref('users').push({ name: data.name, email: data.email, password: data.password, role: data.role });
        await fbLogActivity('Add User', user, data.name + ' (' + data.email + ')');
        return { success: true, message: 'User added', id: ref.key };
      } catch (e) { return { success: false, message: e.message }; }
    }

    // data.password is only present when the caller actually changed it - update() merges, so omitting it keeps the old one
    async function fbUpdateUser(id, data, user) {
      try {
        if (data.email) {
          const existing = await db.ref('users').orderByChild('email').equalTo(data.email).once('value');
          const val = existing.val() || {};
          const clash = Object.keys(val).some(function (k) { return k !== id; });
          if (clash) return { success: false, message: 'Another user already uses this email' };
        }
        await db.ref('users/' + id).update(data);
        await fbLogActivity('Update User', user, data.name || id);
        return { success: true, message: 'User updated' };
      } catch (e) { return { success: false, message: e.message }; }
    }

    async function fbDeleteUser(id, name, user) {
      try {
        await db.ref('users/' + id).remove();
        await fbLogActivity('Delete User', user, name);
        return { success: true, message: 'User deleted' };
      } catch (e) { return { success: false, message: e.message }; }
    }

    // payment methods CRUD at /payment_methods
    async function fbGetPaymentMethods() {
      try {
        const snap = await db.ref('payment_methods').once('value');
        const val = snap.val();
        if (!val) {
          const defaults = {
            pm_cash: { name: 'Cash', code: 'Cash', icon: 'fa-money-bill-wave', details: 'Pay with cash at counter', active: true, requiresReceipt: false },
            pm_card: { name: 'Credit / Debit Card', code: 'Card', icon: 'fa-credit-card', details: 'Visa, MasterCard, Amex', active: true, requiresReceipt: false },
            pm_upi: { name: 'UPI / QR Scan', code: 'Online', icon: 'fa-qrcode', details: 'Scan store UPI QR code to pay', active: true, requiresReceipt: true },
            pm_bank: { name: 'Bank Transfer', code: 'Bank', icon: 'fa-building-columns', details: 'Direct wire or NEFT transfer', active: true, requiresReceipt: true },
            pm_credit: { name: 'Store Credit / Due', code: 'Credit', icon: 'fa-file-invoice', details: 'Customer tab ledger', active: true, requiresReceipt: false }
          };
          await db.ref('payment_methods').set(defaults);
          return { success: true, data: Object.entries(defaults).map(([id, d]) => Object.assign({ id }, d)) };
        }
        return { success: true, data: Object.entries(val).map(([id, d]) => Object.assign({ id }, d)) };
      } catch (e) { return { success: false, message: e.message, data: [] }; }
    }

    async function fbSavePaymentMethod(data, user) {
      try {
        const id = data.id || ('pm_' + Date.now());
        const payload = {
          name: data.name || 'New Payment Method',
          code: data.code || data.name,
          icon: data.icon || 'fa-money-bill',
          type: data.type || 'other',
          details: data.details || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          accountTitle: data.accountTitle || '',
          ifsc: data.ifsc || '',
          qrData: data.qrData || '',
          displayOrder: Number(data.displayOrder) || 0,
          active: data.active !== false,
          requiresReceipt: !!data.requiresReceipt
        };
        await db.ref('payment_methods/' + id).set(payload);
        await fbLogActivity('Save Payment Method', user, payload.name);
        return { success: true, message: 'Payment method saved', id };
      } catch (e) { return { success: false, message: e.message }; }
    }

    async function fbDeletePaymentMethod(id, name, user) {
      try {
        await db.ref('payment_methods/' + id).remove();
        await fbLogActivity('Delete Payment Method', user, name);
        return { success: true, message: 'Payment method removed' };
      } catch (e) { return { success: false, message: e.message }; }
    }

    async function fbUpdateSaleStatus(saleId, status, user) {
      try {
        await db.ref('sales/' + saleId + '/orderStatus').set(status);
        await fbLogActivity('Order Status', user, 'Order ' + saleId.slice(-6).toUpperCase() + ' status -> ' + status);
        return { success: true, message: 'Status updated to ' + status };
      } catch (e) { return { success: false, message: e.message }; }
    }

        async function fbApprovePayment(saleId, approved, user, rejectReason) {
      try {
        const updateData = {
          paymentApproved: approved,
          paymentStatus: approved ? 'verified' : 'rejected'
        };
        if (!approved && rejectReason) updateData.rejectReason = rejectReason;
        if (approved) {
          updateData.verifiedAt = nowIso();
          updateData.verifiedBy = user?.name || 'Staff';
        }
        await db.ref('sales/' + saleId).update(updateData);
        await fbLogActivity('Payment Approval', user, 'Order ' + saleId.slice(-6).toUpperCase() + ' payment ' + (approved ? 'Approved' : 'Rejected' + (rejectReason ? ': ' + rejectReason : '')));
        return { success: true, message: approved ? 'Payment approved' : 'Payment rejected' };
      } catch (e) { return { success: false, message: e.message }; }
    }

    async function fbUpdateSaleNote(saleId, note, user) {
      try {
        await db.ref('sales/' + saleId + '/adminNote').set(note);
        await fbLogActivity('Order Note', user, 'Updated note for order ' + saleId.slice(-6).toUpperCase());
        return { success: true, message: 'Note saved' };
      } catch (e) { return { success: false, message: e.message }; }
    }

    async function fbGetAddons() {
      try {
        const snap = await db.ref('addons').once('value');
        const val = snap.val();
        if (!val) {
          const defaults = {
            add_boba: { name: 'Brown Sugar Pearls', category: 'Toppings', price: 0.75, available: true },
            add_pudding: { name: 'Egg Pudding', category: 'Toppings', price: 0.85, available: true },
            add_jelly: { name: 'Grass Jelly', category: 'Toppings', price: 0.65, available: true },
            add_coconut: { name: 'Coconut Jelly', category: 'Toppings', price: 0.70, available: true },
            add_cheese: { name: 'Sea Salt Cheese Foam', category: 'Foam & Cream', price: 1.25, available: true },
            add_espresso: { name: 'Extra Espresso Shot', category: 'Coffee Shots', price: 1.00, available: true }
          };
          await db.ref('addons').set(defaults);
          return { success: true, data: Object.entries(defaults).map(([id, d]) => Object.assign({ id }, d)) };
        }
        return { success: true, data: Object.entries(val).map(([id, d]) => Object.assign({ id }, d)) };
      } catch (e) { return { success: false, message: e.message, data: [] }; }
    }

    async function fbSaveAddon(data, user) {
      try {
        const id = data.id || ('add_' + Date.now());
        const payload = {
          name: data.name || 'New Add-on',
          category: data.category || 'Toppings',
          price: Number(data.price) || 0,
          available: data.available !== false
        };
        await db.ref('addons/' + id).set(payload);
        await fbLogActivity('Save Addon', user, payload.name);
        return { success: true, message: 'Add-on saved', id };
      } catch (e) { return { success: false, message: e.message }; }
    }

    async function fbDeleteAddon(id, name, user) {
      try {
        await db.ref('addons/' + id).remove();
        await fbLogActivity('Delete Addon', user, name);
        return { success: true, message: 'Add-on deleted' };
      } catch (e) { return { success: false, message: e.message }; }
    }

        // Seed Demo Products (Kirana & Supermarket catalog)
    async function fbSeedKiranaProducts(user) {
      try {
        const demoItems = [
          { name: 'Aashirvaad Shudh Chakki Atta (10 Kg Bag)', sku: 'KIR-ATTA-10K', price: 425.00, mrp: 460.00, retailPrice: 425.00, wholesalePrice: 405.00, cost: 385.00, category: 'Atta, Flours & Sooji', unit: 'Bag', status: 'active', qty: 40, hsnCode: '1101' },
          { name: 'Fortune Sunlite Refined Sunflower Oil (1 Litre)', sku: 'KIR-OIL-1L', price: 132.00, mrp: 145.00, retailPrice: 132.00, wholesalePrice: 124.00, cost: 116.00, category: 'Edible Oils & Pure Ghee', unit: 'Pcs', status: 'active', qty: 100, hsnCode: '1512' },
          { name: 'Tata Salt Vacuum Evaporated (1 Kg)', sku: 'KIR-SALT-1K', price: 25.00, mrp: 28.00, retailPrice: 25.00, wholesalePrice: 22.00, cost: 20.00, category: 'Salt, Sugar & Jaggery', unit: 'Pcs', status: 'active', qty: 150, hsnCode: '2501' },
          { name: 'Premium Unpolished Toor Dal (1 Kg)', sku: 'KIR-DAL-1K', price: 165.00, mrp: 180.00, retailPrice: 165.00, wholesalePrice: 152.00, cost: 142.00, category: 'Dals & Pulses', unit: 'Kg', status: 'active', qty: 80, hsnCode: '0713' },
          { name: 'India Gate Basmati Rice Feast Rozzana (5 Kg)', sku: 'KIR-RIC-5K', price: 380.00, mrp: 425.00, retailPrice: 380.00, wholesalePrice: 355.00, cost: 330.00, category: 'Rice, Basmati & Poha', unit: 'Bag', status: 'active', qty: 50, hsnCode: '1006' },
          { name: 'Maggi 2-Minute Masala Noodles (Pack of 12)', sku: 'KIR-MAG-12P', price: 150.00, mrp: 168.00, retailPrice: 150.00, wholesalePrice: 138.00, cost: 128.00, category: 'Snacks, Biscuits & Namkeen', unit: 'Pack', status: 'active', qty: 60, hsnCode: '1902' },
          { name: 'Surf Excel Easy Wash Detergent Powder (1 Kg)', sku: 'KIR-SRF-1K', price: 130.00, mrp: 145.00, retailPrice: 130.00, wholesalePrice: 120.00, cost: 112.00, category: 'Cleaning & Detergents', unit: 'Pcs', status: 'active', qty: 70, hsnCode: '3402' },
          { name: 'Dettol Original Bathing Soap (Pack of 4 x 125g)', sku: 'KIR-DET-4P', price: 195.00, mrp: 220.00, retailPrice: 195.00, wholesalePrice: 180.00, cost: 168.00, category: 'Personal Care & Hygiene', unit: 'Pack', status: 'active', qty: 65, hsnCode: '3401' },
          { name: 'Amul Pasteurised Butter (500g Pack)', sku: 'KIR-BTR-500G', price: 265.00, mrp: 275.00, retailPrice: 265.00, wholesalePrice: 255.00, cost: 245.00, category: 'Dairy & Bakery', unit: 'Pcs', status: 'active', qty: 45, hsnCode: '0405' },
          { name: 'Fine White Sugar (Loose per Kg)', sku: 'KIR-SGR-1K', price: 44.00, mrp: 48.00, retailPrice: 44.00, wholesalePrice: 41.00, cost: 38.00, category: 'Salt, Sugar & Jaggery', unit: 'Kg', status: 'active', qty: 200, hsnCode: '1701' },
          { name: 'Premium Sabut Jeera / Cumin Seeds (per Kg)', sku: 'KIR-JRA-1K', price: 340.00, mrp: 380.00, retailPrice: 340.00, wholesalePrice: 310.00, cost: 285.00, category: 'Spices & Whole Masalas', unit: 'Kg', status: 'active', qty: 60, hsnCode: '0909' },
          { name: 'California Almonds Badam Giri (500g Pack)', sku: 'KIR-BDM-500G', price: 399.00, mrp: 450.00, retailPrice: 399.00, wholesalePrice: 365.00, cost: 340.00, category: 'Dry Fruits & Nuts', unit: 'Pack', status: 'active', qty: 40, hsnCode: '0802' }
        ];

        let added = 0;
        for (const d of demoItems) {
          const snap = await db.ref('products').orderByChild('name').equalTo(d.name).once('value');
          if (!snap.exists()) {
            const res = await fbAddProduct({
              name: d.name,
              sku: d.sku,
              price: d.price,
              mrp: d.mrp,
              retailPrice: d.price,
              wholesalePrice: d.wholesalePrice,
              wholesale_price: d.wholesalePrice,
              cost: d.cost,
              category: d.category,
              unit: d.unit,
              hsnCode: d.hsnCode,
              reorderLevel: 10,
              status: d.status
            }, user);
            if (res.success) {
              await fbAddStockMovement({
                productId: res.id,
                type: 'in',
                qty: d.qty,
                reason: 'Opening stock (Kirana Supermarket Seeder)',
                reference: 'KIRANA-SEED',
                unitCost: d.cost
              }, d.name, user);
              added++;
            }
          }
        }
        await fbLogActivity('Seed Demo Products', user, `Seeded ${added} Kirana supermarket products`);
        return { success: true, message: `Successfully seeded ${added} top Kirana & Supermarket items!` };
      } catch (e) { return { success: false, message: e.message }; }
    }
    const fbSeedDemoProducts = fbSeedKiranaProducts;
    const fbSeedDemoDrinks = fbSeedKiranaProducts;

    // Database Backup & Restore
    async function fbExportDatabase() {
      try {
        const snap = await db.ref().once('value');
        return { success: true, data: snap.val() || {} };
      } catch (e) { return { success: false, message: e.message }; }
    }

    async function fbRestoreDatabase(data, user) {
      try {
        if (!data || typeof data !== 'object') return { success: false, message: 'Invalid backup JSON data' };
        await db.ref().set(data);
        await fbLogActivity('Restore Database', user, 'Full database restore from backup JSON');
        return { success: true, message: 'Database successfully restored!' };
      } catch (e) { return { success: false, message: e.message }; }
    }
