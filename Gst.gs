/** Pure GST calculation helpers (no Sheets access, so they are easy to test). */

var GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function isValidGstin(g) {
  return GSTIN_RE.test(String(g || '').toUpperCase());
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate invoice totals.
 * @param {Array} items [{qty, rate, discount (amount), gst (percent)}]
 * @param {boolean} interState true -> IGST, false -> CGST+SGST
 */
function calcInvoice(items, interState) {
  var t = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
  var lines = items.map(function (it) {
    var taxable = round2(it.qty * it.rate - (it.discount || 0));
    var tax = round2(taxable * it.gst / 100);
    var line = { taxable: taxable, cgst: 0, sgst: 0, igst: 0 };
    if (interState) {
      line.igst = tax;
    } else {
      line.cgst = round2(tax / 2);
      line.sgst = round2(tax - line.cgst);
    }
    line.total = round2(taxable + line.cgst + line.sgst + line.igst);
    t.taxable += taxable; t.cgst += line.cgst; t.sgst += line.sgst; t.igst += line.igst;
    return line;
  });
  var gross = t.taxable + t.cgst + t.sgst + t.igst;
  var total = Math.round(gross);
  return {
    lines: lines,
    taxable: round2(t.taxable), cgst: round2(t.cgst), sgst: round2(t.sgst), igst: round2(t.igst),
    roundOff: round2(total - gross),
    total: total
  };
}

/** Intra-state if customer state equals shop state. */
function isInterState(shopState, placeOfSupply) {
  return String(shopState).padStart(2, '0') !== String(placeOfSupply).padStart(2, '0');
}

/** Amount in words, Indian numbering. */
function amountInWords(n) {
  n = Math.round(n);
  if (n === 0) return 'Zero Rupees Only';
  var a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
    'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function two(x) { return x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : ''); }
  function three(x) {
    return (x >= 100 ? a[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' : '') : '') + (x % 100 ? two(x % 100) : '');
  }
  var parts = [];
  var cr = Math.floor(n / 10000000); n %= 10000000;
  var lk = Math.floor(n / 100000); n %= 100000;
  var th = Math.floor(n / 1000); n %= 1000;
  if (cr) parts.push(three(cr) + ' Crore');
  if (lk) parts.push(two(lk) + ' Lakh');
  if (th) parts.push(two(th) + ' Thousand');
  if (n) parts.push(three(n));
  return parts.join(' ') + ' Rupees Only';
}

/** Run from the Apps Script editor. */
function runTests() {
  function eq(actual, expected, label) {
    if (actual !== expected) throw new Error(label + ': expected ' + expected + ' got ' + actual);
  }
  var intra = calcInvoice([{ qty: 2, rate: 100, discount: 0, gst: 18 }], false);
  eq(intra.cgst, 18, 'intra cgst'); eq(intra.sgst, 18, 'intra sgst'); eq(intra.igst, 0, 'intra igst');
  eq(intra.total, 236, 'intra total');
  var inter = calcInvoice([{ qty: 2, rate: 100, discount: 0, gst: 18 }], true);
  eq(inter.igst, 36, 'inter igst'); eq(inter.cgst, 0, 'inter cgst');
  var zero = calcInvoice([{ qty: 1, rate: 50, discount: 0, gst: 0 }], false);
  eq(zero.total, 50, 'zero gst');
  var odd = calcInvoice([{ qty: 1, rate: 99.99, discount: 0, gst: 5 }], false);
  eq(odd.total, 105, 'rounding');
  eq(isInterState('27', '29'), true, 'inter detect'); eq(isInterState('27', '27'), false, 'intra detect');
  eq(amountInWords(123456), 'One Lakh Twenty Three Thousand Four Hundred Fifty Six Rupees Only', 'words');
  eq(isValidGstin('27AAPFU0939F1ZV'), true, 'gstin ok'); eq(isValidGstin('BAD'), false, 'gstin bad');
  Logger.log('All tests passed');
}
