/** One-time setup: creates all tabs with headers and default settings. */

var SCHEMA = {
  Settings: ['key', 'value'],
  Products: ['id', 'name', 'hsn', 'unit', 'price', 'gst', 'stock', 'lowStock'],
  Customers: ['id', 'name', 'gstin', 'address', 'state', 'stateName', 'phone', 'email', 'agent'],
  Invoices: ['invoiceNo', 'date', 'customerId', 'customerName', 'customerGstin', 'placeOfSupply',
             'taxable', 'cgst', 'sgst', 'igst', 'roundOff', 'total', 'pdfUrl', 'status'],
  InvoiceItems: ['invoiceNo', 'productId', 'name', 'hsn', 'qty', 'unit', 'rate', 'discount',
                 'gst', 'taxable', 'cgst', 'sgst', 'igst', 'total'],
  StockLog: ['date', 'productId', 'change', 'reason', 'ref']
};

var DEFAULT_SETTINGS = {
  shopName: 'SIKHWAL DRESSES',
  address: '05-FIRST FLOOR, HINDURAJ TIRAHA, PANERIO KI MADRI, UDAIPUR',
  phone: '9214973181',
  mobile: '9414442691',
  email: 'narendra22vyas@gmail.com',
  gstin: '08AFCPV9963Q1Z7',
  stateCode: '08',
  prefix: 'SL',
  nextNo: 1,
  bank: 'HDFC BANK',
  accountNo: '',
  ifsc: 'HDFC0005259',
  transport: 'BY HAND',
  logoUrl: '',
  terms: 'Payment within days from bill date.\nAfter Due Date Interest Will Be Charged @21% Rs. 4.00 PER DAY.\nPayment should be made by A/c pay Chq/DD/Net Banking only.\nGoods once sold will not be taken back.\nAll disputes subject to BHILWARA jurisdiction only.',
  folderId: ''
};

function setup() {
  var ss = db_();
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, SCHEMA[name].length).setValues([SCHEMA[name]]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });
  var existing = getSettings();
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) {
    if (existing[k] === undefined) append_('Settings', { key: k, value: DEFAULT_SETTINGS[k] });
  });
  if (!getSettings().folderId) {
    var folder = DriveApp.createFolder('GST Invoices');
    saveSetting('folderId', folder.getId());
  }
  return 'Setup complete';
}

function getSettings() {
  var o = {};
  rows_('Settings').forEach(function (r) { o[r.key] = r.value; });
  return o;
}

function saveSetting(key, value) {
  var sh = sheet_('Settings');
  var row = rows_('Settings').filter(function (r) { return r.key === key; })[0];
  if (row) sh.getRange(row._row, 2).setValue(value);
  else append_('Settings', { key: key, value: value });
}

function saveSettings(obj) {
  Object.keys(obj).forEach(function (k) { saveSetting(k, obj[k]); });
  return getSettings();
}
