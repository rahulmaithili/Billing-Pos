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
    async function fbAddCategory(name, user) {
      try {
        const nm = String(name || '').trim();
        if (!nm) return { success: false, message: 'Category name required' };
        const dupe = await db.ref('categories').orderByChild('name').equalTo(nm).once('value');
        if (dupe.exists()) return { success: false, message: 'That category already exists' };
        const ref = await db.ref('categories').push({ name: nm, createdAt: nowIso() });
        await fbLogActivity('Add Category', user, nm);
        return { success: true, message: 'Category added', id: ref.key };
      } catch (e) { return { success: false, message: e.message }; }
    }
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

    // Seed Demo Drinks (specialty cafe/beverage catalog)
    async function fbSeedDemoDrinks(user) {
      try {
        const drinks = [
          { name: 'Classic Brown Sugar Boba Milk', sku: 'DRK-BOBA-01', price: 5.50, cost: 2.20, category: 'Boba & Tea', brand: 'House Special', unit: 'Cup', status: 'active', qty: 100 },
          { name: 'Matcha Green Tea Latte', sku: 'DRK-TEA-02', price: 5.00, cost: 1.80, category: 'Boba & Tea', brand: 'Uji Matcha', unit: 'Cup', status: 'active', qty: 85 },
          { name: 'Iced Caramel Macchiato', sku: 'DRK-COF-03', price: 4.80, cost: 1.50, category: 'Coffee', brand: 'Artisan Roast', unit: 'Cup', status: 'active', qty: 90 },
          { name: 'Mango Passionfruit Smoothie', sku: 'DRK-SMO-04', price: 6.00, cost: 2.10, category: 'Smoothies', brand: 'Fresh Fruit', unit: 'Cup', status: 'active', qty: 70 },
          { name: 'Strawberry Jasmine Fruit Tea', sku: 'DRK-TEA-05', price: 5.20, cost: 1.90, category: 'Fruit Tea', brand: 'Jasmine Pure', unit: 'Cup', status: 'active', qty: 80 },
          { name: 'Taro Milk Tea with Pearls', sku: 'DRK-BOBA-06', price: 5.50, cost: 2.00, category: 'Boba & Tea', brand: 'House Special', unit: 'Cup', status: 'active', qty: 75 },
          { name: 'Espresso Double Shot', sku: 'DRK-COF-07', price: 3.50, cost: 0.90, category: 'Coffee', brand: 'Italian Blend', unit: 'Cup', status: 'active', qty: 120 },
          { name: 'Cold Brew Citrus Splash', sku: 'DRK-COF-08', price: 4.50, cost: 1.40, category: 'Coffee', brand: 'Slow Steep', unit: 'Cup', status: 'active', qty: 65 }
        ];

        const cats = ['Boba & Tea', 'Coffee', 'Smoothies', 'Fruit Tea'];
        for (const c of cats) {
          const snap = await db.ref('categories').orderByChild('name').equalTo(c).once('value');
          if (!snap.exists()) {
            await db.ref('categories').push({ name: c, createdAt: nowIso() });
          }
        }

        let added = 0;
        for (const d of drinks) {
          const snap = await db.ref('products').orderByChild('name').equalTo(d.name).once('value');
          if (!snap.exists()) {
            const res = await fbAddProduct({
              name: d.name,
              sku: d.sku,
              price: d.price,
              cost: d.cost,
              category: d.category,
              brand: d.brand,
              unit: d.unit,
              reorderLevel: 10,
              status: d.status
            }, user);
            if (res.success) {
              await fbAddStockMovement({
                productId: res.id,
                type: 'in',
                qty: d.qty,
                reason: 'Opening stock (Demo Drinks Seeder)',
                reference: 'DEMO-SEED',
                unitCost: d.cost
              }, d.name, user);
              added++;
            }
          }
        }
        await fbLogActivity('Seed Demo Drinks', user, `Seeded ${added} demo drinks into catalog`);
        return { success: true, message: `Successfully seeded ${added} delicious demo drinks!` };
      } catch (e) { return { success: false, message: e.message }; }
    }

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
