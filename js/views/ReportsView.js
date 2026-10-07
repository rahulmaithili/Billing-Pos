function ReportsView({ user, role }) {
      const [sales, setSales] = useState([]);
      const [expenses, setExpenses] = useState([]);
      const [loading, setLoading] = useState(false);

      useEffect(() => {
        setLoading(true);
        Promise.all([fbGetSales(), fbGetExpenses()]).then(([sRes, eRes]) => {
          if (sRes.success) setSales(sRes.data);
          if (eRes.success) setExpenses(eRes.data);
          setLoading(false);
        });
      }, []);

      const totalRevenue = useMemo(() => sales.reduce((sum, s) => sum + Number(s.grandTotal || 0), 0), [sales]);
      const totalOrders = sales.length;
      const totalExpenseAmt = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0), [expenses]);
      const netProfit = totalRevenue - totalExpenseAmt;

      return (
        <div className="data-section">
          {loading && <TopLoadingBar />}
          <div className="section-header">
            <h2><i className="fas fa-chart-column"></i> Sales &amp; Financial Analytics</h2>
          </div>

          <div className="lte-kpi-grid">
            <SmallBox value={'$' + totalRevenue.toFixed(2)} label="Gross Revenue" icon="fa-coins" color="bg-navy" />
            <SmallBox value={totalOrders} label="Total Orders" icon="fa-receipt" color="bg-info" />
            <SmallBox value={'$' + totalExpenseAmt.toFixed(2)} label="Expenses" icon="fa-money-bill-trend-up" color="bg-warning" />
            <SmallBox value={'$' + netProfit.toFixed(2)} label="Net Profit" icon="fa-chart-line" color="bg-success" />
          </div>

          <LteCard title="Recent Sales Ledger Summary" icon="fa-table">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 10).map(s => (
                    <tr key={s.id}>
                      <td><strong>#{s.invoiceNo}</strong></td>
                      <td>{new Date(s.date).toLocaleDateString()}</td>
                      <td>{s.customerName || 'Walk-in'}</td>
                      <td>{(s.items || []).length} items</td>
                      <td><strong>${Number(s.grandTotal || 0).toFixed(2)}</strong></td>
                      <td><span className="tb-pill role">{s.paymentMethod}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </LteCard>
        </div>
      );
    }

    // --- Permissions Matrix View (Role-Based Access Control) ---
