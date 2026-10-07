function SalesHistoryView({ user, role, setActiveMenu }) {
      const [reloadKey, setReloadKey] = useState(0);
      const [returnSaleId, setReturnSaleId] = useState(null);
      const [viewSale, setViewSale] = useState(null);
      const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);
      const [payStage, setPayStage] = useState('all');
      const [showZReport, setShowZReport] = useState(false);
      const tableInstanceRef = useRef(null);
      const searchFnRef = useRef(null);

      const { loading, data, err } = useFetch(() => Promise.all([fbGetSales(), fbGetReturns()]), [reloadKey]);
      const sales = useMemo(() => (data && data[0] && data[0].success ? data[0].data : []), [data]);
      const returns = useMemo(() => (data && data[1] && data[1].success ? data[1].data : []), [data]);
      const reload = () => setReloadKey(k => k + 1);
      const byId = useMemo(() => sales.reduce((m, s) => (m[s.id] = s, m), {}), [sales]);

      const tableData = useMemo(() => sales.map(s => {
        const itemCount = (s.items || []).reduce((n, it) => n + it.qty, 0);
        const cogs = (s.items || []).reduce((c, it) => c + (Number(it.cost) || 0) * it.qty, 0);
        const profit = round2(Number(s.subtotal != null ? s.subtotal : s.total || 0) - Number(s.discount || 0) - cogs);
        const returnedTotal = returns.filter(r => r.saleId === s.id).reduce((sum, r) => sum + Number(r.totalRefund || 0), 0);
        return Object.assign({}, s, { itemCount, profit, returnedTotal });
      }), [sales, returns]);

      const summary = useMemo(() => ({
        count: sales.length,
        total: tableData.reduce((s, r) => s + Number(r.total || 0), 0),
        profit: tableData.reduce((s, r) => s + Number(r.profit || 0), 0),
        returned: tableData.reduce((s, r) => s + Number(r.returnedTotal || 0), 0)
      }), [tableData, sales.length]);

      const payStages = useMemo(() => [
        { k: 'all', label: 'All Invoices', n: tableData.length, tone: 'var(--navy-primary)' },
        { k: 'Cash', label: 'Cash', n: tableData.filter(s => (s.paymentMethod || '').toLowerCase() === 'cash').length, tone: 'var(--success)' },
        { k: 'Card', label: 'Card', n: tableData.filter(s => (s.paymentMethod || '').toLowerCase() === 'card').length, tone: 'var(--navy-accent)' },
        { k: 'Online', label: 'UPI / Online', n: tableData.filter(s => ['online', 'upi'].includes((s.paymentMethod || '').toLowerCase())).length, tone: '#8e44ad' },
        { k: 'Credit', label: 'Credit / Due', n: tableData.filter(s => s.status === 'credit' || (s.paymentMethod || '').toLowerCase() === 'credit').length, tone: 'var(--danger)' }
      ], [tableData]);

      const onPickPayStage = (stage) => {
        setPayStage(stage);
        if (!tableInstanceRef.current) return;
        const dt = tableInstanceRef.current;
        const ext = $.fn.dataTable.ext.search;
        const prev = ext.indexOf(searchFnRef.current); if (prev !== -1) ext.splice(prev, 1);
        if (stage === 'all') {
          searchFnRef.current = null;
        } else {
          const fn = (settings, dataRow, dataIndex) => {
            const s = tableData[dataIndex];
            if (!s) return true;
            if (stage === 'Credit') return s.status === 'credit' || (s.paymentMethod || '').toLowerCase() === 'credit';
            if (stage === 'Online') return ['online', 'upi'].includes((s.paymentMethod || '').toLowerCase());
            return (s.paymentMethod || '').toLowerCase() === stage.toLowerCase();
          };
          searchFnRef.current = fn;
          ext.push(fn);
        }
        dt.draw();
      };

      useEffect(() => {
        if (err || (data && data[0] && !data[0].success)) Swal.fire({ icon: 'error', title: 'Error', text: (data && data[0] && data[0].message) || 'Failed to load sales' });
      }, [err, data]);

      useEffect(() => {
        if (loading) return;
        let table = tableInstanceRef.current;
        if (table) {
          table.clear().rows.add(tableData).draw(false);
        } else {
          table = $('#salesTable').DataTable({
            data: tableData,
            columnDefs: [{ targets: '_all', defaultContent: '' }],
            createdRow: (row, d) => { if (d.status === 'credit') $(row).addClass('row-danger'); else if (Number(d.returnedTotal) > 0) $(row).addClass('row-warn'); },
            columns: [
              { data: 'invoiceNo', title: 'Invoice', render: (d, t, row) => t === 'display' ? '<code>' + esc(d || String(row.id).slice(-6).toUpperCase()) + '</code>' : (d || row.id) },
              { data: 'createdAt', title: 'Date', render: (d, t) => t === 'display' ? formatDateForDisplay(d) : d },
              { data: 'customerName', title: 'Customer', render: (d, t) => t === 'display' ? esc(d || 'Walk-in') : d },
              { data: 'cashier', title: 'Cashier', render: (d, t) => t === 'display' ? esc(d || '') : d },
              { data: 'itemCount', title: 'Items' },
              { data: 'total', title: 'Total', render: (d, t) => t === 'display' ? money(d) : d },
              { data: 'paymentMethod', title: 'Payment', render: (d, t) => t === 'display' ? (d ? '<span class="type-chip">' + esc(d) + '</span>' : '-') : (d || '') },
              { data: 'profit', title: 'Profit', render: (d, t) => t === 'display' ? `<span style="color:${Number(d) >= 0 ? '#155724' : '#721c24'};font-weight:600">${money(d)}</span>` : d },
              { data: 'returnedTotal', title: 'Returned', render: (d, t) => t === 'display' ? (d > 0 ? '<span class="status-badge status-inactive">' + money(d) + '</span>' : '-') : d },
              {
                data: null,
                title: 'Actions',
                orderable: false,
                render: () =>
                  `<button class="action-icon" data-action="view" title="View Order Details"><i class="fas fa-eye"></i></button>` +
                  `<button class="action-icon print-icon" data-action="print" title="Print Thermal Receipt"><i class="fas fa-print"></i></button>` +
                  (role === 'Admin' ? `<button class="action-icon qr-icon" data-action="return" title="Return / Refund"><i class="fas fa-rotate-left"></i></button>` : '')
              }
            ],
            pageLength: 10,
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, 'All']],
            responsive: true,
            dom: 'Blfrtip',
            buttons: [
              { extend: 'csv', text: '<i class="fas fa-file-csv"></i> CSV', exportOptions: { columns: ':not(:last-child)' } },
              { extend: 'pdf', text: '<i class="fas fa-file-pdf"></i> PDF', exportOptions: { columns: ':not(:last-child)' } },
              { extend: 'print', text: '<i class="fas fa-print"></i> Print', exportOptions: { columns: ':not(:last-child)' } }
            ],
            order: [[1, 'desc']]
          });
          tableInstanceRef.current = table;
        }
        $('#salesTable').off('click', '.action-icon').on('click', '.action-icon', function () {
          const id = table.row($(this).parents('tr')).data().id;
          const action = $(this).data('action');
          if (action === 'view') setSelectedOrderForModal(byId[id]);
          else if (action === 'print') setViewSale(byId[id]);
          else if (action === 'return') setReturnSaleId(id);
        });
      }, [loading, tableData, role]);

      useEffect(() => () => {
        const ext = $.fn.dataTable.ext.search;
        const i = ext.indexOf(searchFnRef.current); if (i !== -1) ext.splice(i, 1);
        if (tableInstanceRef.current) { try { tableInstanceRef.current.destroy(); tableInstanceRef.current = null; } catch (e) { } }
      }, []);

      return (
        <div className="data-section">
          <div className="section-header">
            <h2><i className="fas fa-receipt"></i> Sales History</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <RefreshBtn onClick={reload} />
              <button className="btn btn-secondary" onClick={() => setShowZReport(true)}><i className="fas fa-cash-register"></i> Daily Register (Z-Report)</button>
            </div>
          </div>
          {!loading && <Pipeline stages={payStages} value={payStage} onPick={onPickPayStage} />}
          {loading && <TableSkeleton rows={8} columns={10} />}
          <div style={{ display: loading ? 'none' : 'block' }}>
            <table id="salesTable" className="display" style={{ width: '100%' }}></table>
            {sales.length > 0 && <SummaryBar items={[{ label: 'Sales', value: summary.count }, { label: 'Total', value: money(summary.total) }, { label: 'Profit', value: money(summary.profit) }, { label: 'Returned', value: money(summary.returned) }]} />}
          </div>
          {selectedOrderForModal && (
            <OrderDetailsModal
              order={selectedOrderForModal}
              onClose={() => setSelectedOrderForModal(null)}
              onReviewPayment={(sale) => {
                setSelectedOrderForModal(null);
                window.selectedReviewSaleId = sale.id;
                if (setActiveMenu) setActiveMenu('review');
              }}
              onPrint={(sale) => setViewSale(sale)}
              user={user}
              onOrderUpdated={reload}
            />
          )}
          {viewSale && <ThermalReceiptOverlay sale={viewSale} onClose={() => setViewSale(null)} />}
          {returnSaleId && <ReturnModal sale={byId[returnSaleId]} returns={returns} user={user} onClose={() => setReturnSaleId(null)} onDone={() => { setReturnSaleId(null); reload(); }} />}
          {showZReport && <RegisterZReportModal sales={sales} returns={returns} onClose={() => setShowZReport(false)} />}
        </div>
      );
    }
