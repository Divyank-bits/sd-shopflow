/** Sales summary and GSTR-1 style export. */

function monthRange_(ym) {
  var p = ym.split('-');
  return { from: new Date(Number(p[0]), Number(p[1]) - 1, 1), to: new Date(Number(p[0]), Number(p[1]), 1) };
}

function activeInvoices_(ym) {
  var r = monthRange_(ym);
  return rows_('Invoices').filter(function (i) {
    var d = new Date(i.date);
    return i.status === 'Active' && d >= r.from && d < r.to;
  });
}

/** ym = 'YYYY-MM' */
function salesSummary(ym) {
  var list = activeInvoices_(ym);
  var t = { count: list.length, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
  list.forEach(function (i) {
    ['taxable', 'cgst', 'sgst', 'igst', 'total'].forEach(function (k) { t[k] += Number(i[k]); });
  });
  Object.keys(t).forEach(function (k) { if (k !== 'count') t[k] = round2(t[k]); });
  return t;
}

/** Writes a "GSTR1 YYYY-MM" sheet with B2B, B2C and HSN sections; returns its URL. */
function exportGstr1(ym) {
  var list = activeInvoices_(ym);
  var nos = {};
  list.forEach(function (i) { nos[i.invoiceNo] = true; });
  var ss = db_();
  var name = 'GSTR1 ' + ym;
  var sh = ss.getSheetByName(name);
  if (sh) sh.clear(); else sh = ss.insertSheet(name);

  var out = [['B2B (registered customers)'],
    ['GSTIN', 'Invoice No', 'Date', 'Place of Supply', 'Taxable', 'CGST', 'SGST', 'IGST', 'Invoice Value']];
  var b2c = [['B2C (unregistered)'],
    ['Invoice No', 'Date', 'Place of Supply', 'Taxable', 'CGST', 'SGST', 'IGST', 'Invoice Value']];
  list.forEach(function (i) {
    var date = Utilities.formatDate(new Date(i.date), 'Asia/Kolkata', 'dd-MMM-yyyy');
    if (i.customerGstin) out.push([i.customerGstin, i.invoiceNo, date, i.placeOfSupply, i.taxable, i.cgst, i.sgst, i.igst, i.total]);
    else b2c.push([i.invoiceNo, date, i.placeOfSupply, i.taxable, i.cgst, i.sgst, i.igst, i.total]);
  });

  var hsn = {};
  rows_('InvoiceItems').filter(function (r) { return nos[r.invoiceNo]; }).forEach(function (r) {
    var k = r.hsn + '|' + r.gst;
    var h = hsn[k] = hsn[k] || { hsn: r.hsn, gst: r.gst, qty: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    h.qty += Number(r.qty); h.taxable += Number(r.taxable); h.cgst += Number(r.cgst);
    h.sgst += Number(r.sgst); h.igst += Number(r.igst);
  });
  var hs = [['HSN summary'], ['HSN', 'GST %', 'Qty', 'Taxable', 'CGST', 'SGST', 'IGST']];
  Object.keys(hsn).forEach(function (k) {
    var h = hsn[k];
    hs.push([h.hsn, h.gst, h.qty, round2(h.taxable), round2(h.cgst), round2(h.sgst), round2(h.igst)]);
  });

  var row = 1;
  [out, b2c, hs].forEach(function (block) {
    var w = Math.max.apply(null, block.map(function (r) { return r.length; }));
    var padded = block.map(function (r) { while (r.length < w) r.push(''); return r; });
    sh.getRange(row, 1, padded.length, w).setValues(padded);
    sh.getRange(row, 1).setFontWeight('bold');
    sh.getRange(row + 1, 1, 1, w).setFontWeight('bold').setBackground('#eeeeee');
    row += padded.length + 2;
  });
  return ss.getUrl() + '#gid=' + sh.getSheetId();
}
