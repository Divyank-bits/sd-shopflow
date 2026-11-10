/** Invoice creation, listing and cancellation. */

function financialYear_(d) {
  var y = d.getFullYear(), m = d.getMonth();
  var start = m >= 3 ? y : y - 1;
  return String(start).slice(2) + '-' + String(start + 1).slice(2);
}

/**
 * req: { customerId (optional for walk-in), customerName, placeOfSupply,
 *        items: [{productId, qty, rate, discount}] }
 */
function createInvoice(req) {
  if (!req.items || !req.items.length) throw new Error('Add at least one item');
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var s = getSettings();
    var products = {};
    listProducts().forEach(function (p) { products[p.id] = p; });
    var customer = req.customerId
      ? listCustomers().filter(function (c) { return c.id === req.customerId; })[0] : null;
    var pos = String(req.placeOfSupply || (customer && customer.state) || s.stateCode);
    var inter = isInterState(s.stateCode, pos);

    var items = req.items.map(function (it) {
      var p = products[it.productId];
      if (!p) throw new Error('Unknown product');
      var qty = Number(it.qty);
      if (!(qty > 0)) throw new Error('Quantity must be positive for ' + p.name);
      if (p.stock < qty) throw new Error('Insufficient stock for ' + p.name + ' (have ' + p.stock + ')');
      return { productId: p.id, name: p.name, hsn: p.hsn, unit: p.unit, qty: qty,
               rate: Number(it.rate !== undefined && it.rate !== '' ? it.rate : p.price),
               discount: Number(it.discount) || 0, gst: Number(p.gst) };
    });
    var calc = calcInvoice(items, inter);

    var now = new Date();
    var no = s.prefix + '/' + financialYear_(now) + '/' + String(s.nextNo).padStart(4, '0');
    saveSetting('nextNo', Number(s.nextNo) + 1);

    items.forEach(function (it, i) {
      var l = calc.lines[i];
      append_('InvoiceItems', { invoiceNo: no, productId: it.productId, name: it.name, hsn: it.hsn,
        qty: it.qty, unit: it.unit, rate: it.rate, discount: it.discount, gst: it.gst,
        taxable: l.taxable, cgst: l.cgst, sgst: l.sgst, igst: l.igst, total: l.total });
      adjustStock_(it.productId, -it.qty, 'Sale', no);
    });

    var inv = { invoiceNo: no, date: now, customerId: customer ? customer.id : '',
      customerName: customer ? customer.name : (req.customerName || 'Cash Sale'),
      customerGstin: customer ? customer.gstin : '', placeOfSupply: pos,
      taxable: calc.taxable, cgst: calc.cgst, sgst: calc.sgst, igst: calc.igst,
      roundOff: calc.roundOff, total: calc.total, pdfUrl: '', status: 'Active' };
    append_('Invoices', inv);

    var url = buildPdf_(no);
    setInvoiceField_(no, 'pdfUrl', url);
    inv.pdfUrl = url;
    inv.date = now.toISOString();
    return inv;
  } finally {
    lock.releaseLock();
  }
}

function adjustStock_(productId, change, reason, ref) {
  var row = rows_('Products').filter(function (r) { return r.id === productId; })[0];
  if (!row) return;
  var col = SCHEMA.Products.indexOf('stock') + 1;
  sheet_('Products').getRange(row._row, col).setValue(Number(row.stock) + change);
  append_('StockLog', { date: new Date(), productId: productId, change: change, reason: reason, ref: ref });
}

function setInvoiceField_(no, field, value) {
  var row = rows_('Invoices').filter(function (r) { return r.invoiceNo === no; })[0];
  if (!row) throw new Error('Invoice not found');
  sheet_('Invoices').getRange(row._row, SCHEMA.Invoices.indexOf(field) + 1).setValue(value);
}

function listInvoices(query) {
  var q = String(query || '').toLowerCase();
  return rows_('Invoices').map(function (r) {
    var o = strip_(r); o.date = new Date(o.date).toISOString(); return o;
  }).filter(function (r) {
    return !q || (r.invoiceNo + ' ' + r.customerName).toLowerCase().indexOf(q) >= 0;
  }).reverse().slice(0, 100);
}

/** Cancel an invoice and return its stock. */
function cancelInvoice(no) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var inv = rows_('Invoices').filter(function (r) { return r.invoiceNo === no; })[0];
    if (!inv) throw new Error('Invoice not found');
    if (inv.status === 'Cancelled') throw new Error('Already cancelled');
    rows_('InvoiceItems').filter(function (r) { return r.invoiceNo === no; }).forEach(function (it) {
      adjustStock_(it.productId, Number(it.qty), 'Cancel', no);
    });
    setInvoiceField_(no, 'status', 'Cancelled');
    return true;
  } finally {
    lock.releaseLock();
  }
}
