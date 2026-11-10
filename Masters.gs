/** Products and customers CRUD (called from the web UI via google.script.run). */

function listProducts() { return rows_('Products').map(strip_); }
function listCustomers() { return rows_('Customers').map(strip_); }

function strip_(o) { var c = {}; Object.keys(o).forEach(function (k) { if (k !== '_row') c[k] = o[k]; }); return c; }

function saveProduct(p) {
  if (!p.name) throw new Error('Product name is required');
  p.price = Number(p.price) || 0;
  p.gst = Number(p.gst) || 0;
  p.stock = Number(p.stock) || 0;
  p.lowStock = Number(p.lowStock) || 0;
  return save_('Products', p, 'P');
}

function saveCustomer(c) {
  if (!c.name) throw new Error('Customer name is required');
  if (c.gstin) {
    c.gstin = String(c.gstin).toUpperCase().trim();
    if (!isValidGstin(c.gstin)) throw new Error('Invalid GSTIN');
    c.state = c.gstin.substring(0, 2);
  }
  return save_('Customers', c, 'C');
}

function save_(sheetName, obj, prefix) {
  var sh = sheet_(sheetName);
  if (obj.id) {
    var row = rows_(sheetName).filter(function (r) { return r.id === obj.id; })[0];
    if (!row) throw new Error('Record not found');
    var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    sh.getRange(row._row, 1, 1, head.length).setValues([head.map(function (h) {
      return obj[h] === undefined ? row[h] : obj[h];
    })]);
  } else {
    obj.id = uid_(prefix);
    append_(sheetName, obj);
  }
  return obj;
}

function deleteRecord(sheetName, id) {
  if (['Products', 'Customers'].indexOf(sheetName) < 0) throw new Error('Not allowed');
  var row = rows_(sheetName).filter(function (r) { return r.id === id; })[0];
  if (row) sheet_(sheetName).deleteRow(row._row);
  return true;
}

function lowStockProducts() {
  return listProducts().filter(function (p) { return p.lowStock > 0 && p.stock <= p.lowStock; });
}
