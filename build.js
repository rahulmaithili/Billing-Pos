const fs = require('fs');
const path = require('path');

function runBuild() {
  const startTime = Date.now();
  console.log('🚀 Building Billing-POS application from modular files...');

  const cssDir = path.resolve(__dirname, 'css');
  const jsDir = path.resolve(__dirname, 'js');
  const compDir = path.join(jsDir, 'components');
  const viewsDir = path.join(jsDir, 'views');

  // Read Firebase Service
  const firebaseService = fs.readFileSync(path.join(jsDir, 'firebase-api.js'), 'utf8');

  // Read Components Common
  const common = fs.readFileSync(path.join(compDir, 'common.js'), 'utf8');
  const orderDetailsModal = fs.existsSync(path.join(compDir, 'OrderDetailsModal.js')) ? fs.readFileSync(path.join(compDir, 'OrderDetailsModal.js'), 'utf8') : '';

  // Read Views in dependency order
  const viewOrder = [
    'RecordsView.js',
    'ProductsView.js',
    'CategoriesView.js',
    'StockView.js',
    'POSView.js',
    'SalesHistoryView.js',
    'DashboardView.js',
    'LogsView.js',
    'SuppliersView.js',
    'ExpensesView.js',
    'PurchaseOrdersView.js',
    'UsersView.js',
    'AboutView.js',
    'PaymentMethodsView.js',
    'SettingsView.js',
    'OrderBoardView.js',
    'PaymentReviewView.js',
    'AddonsView.js',
    'ReportsView.js',
    'MySettingsView.js',
    'MyAccountView.js'
  ];

  const viewsCode = viewOrder.map(vf => {
    const p = path.join(viewsDir, vf);
    if (!fs.existsSync(p)) return '';
    return fs.readFileSync(p, 'utf8');
  }).join('\n\n');

  // Read App.js
  const appCode = fs.readFileSync(path.join(jsDir, 'App.js'), 'utf8');

  // Combine full Babel Code
  const fullBabelCode = [
    common,
    orderDetailsModal,
    viewsCode,
    appCode
  ].join('\n\n');

  // Save bundle.js in js/ directory
  fs.writeFileSync(path.join(jsDir, 'app-bundle.jsx'), fullBabelCode, 'utf8');

  const headHtml = `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <title>Firebase Records Manager & POS Terminal</title>
  <link rel="icon" href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiGXxCe0WNNedmFqSWeF761f7Kshhc-NP5ChRQKz9fr97cO8VaarvD0KlCwqHojJVBWv-RAxfOqMI5rD4H78KnARyOc6QgwL1nRRFWf5xNQ1d9F9HfAoLPPGlTyP0GwNl4n-INMEsWLQ4Y7zJtz5bOdAnc2ePH9-uCRgshlo6BsS6gJEz6fhrxL-5U5O3sX/s160/channels4_profile.jpg">

  <!-- CDN Dependencies -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <link rel="stylesheet" href="https://cdn.datatables.net/1.13.7/css/jquery.dataTables.min.css">
  <link rel="stylesheet" href="https://cdn.datatables.net/buttons/2.4.2/css/buttons.dataTables.min.css">
  <link rel="stylesheet" href="https://cdn.datatables.net/responsive/2.5.0/css/responsive.dataTables.min.css">
  <script src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js"></script>
  <script src="https://cdn.datatables.net/responsive/2.5.0/js/dataTables.responsive.min.js"></script>
  <script src="https://cdn.datatables.net/buttons/2.4.2/js/dataTables.buttons.min.js"></script>
  <script src="https://cdn.datatables.net/buttons/2.4.2/js/buttons.html5.min.js"></script>
  <script src="https://cdn.datatables.net/buttons/2.4.2/js/buttons.print.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>

  <!-- Modular Stylesheets (Separate Files) -->
  <link rel="stylesheet" href="css/root-tokens.css">
  <link rel="stylesheet" href="css/layout.css">
  <link rel="stylesheet" href="css/pos-terminal.css">
  <link rel="stylesheet" href="css/thermal-receipt.css">
</head>

<body>
  <div id="root"></div>

  <!-- Modular Scripts -->
  <script src="js/config.js"></script>
  <script src="js/firebase-api.js"></script>

  <!-- React Application Core (Transpiled by Babel) -->
  <script type="text/babel">
` + fullBabelCode.trim() + `
  </script>
</body>

</html>`;

  // Write index.html
  fs.writeFileSync(path.resolve(__dirname, 'index.html'), headHtml, 'utf8');
  const elapsed = Date.now() - startTime;
  console.log('✅ Build completed in ' + elapsed + 'ms! Saved to index.html (' + headHtml.split('\n').length + ' lines)');
}

// Watch mode support
if (process.argv.includes('--watch')) {
  runBuild();
  console.log('👀 Watching css/ and js/ directories for changes...');
  ['css', 'js'].forEach(folder => {
    fs.watch(path.resolve(__dirname, folder), { recursive: true }, (event, filename) => {
      if (filename && !filename.includes('app-bundle')) {
        console.log('⚡ File changed: ' + filename + ', rebuilding...');
        runBuild();
      }
    });
  });
} else {
  runBuild();
}

module.exports = { runBuild };
