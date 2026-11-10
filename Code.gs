/** Entry points and shared helpers. */

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('GST Billing')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('GST Billing')
    .addItem('Run setup', 'setup')
    .addItem('Run GST tests', 'runTests')
    .addToUi();
}

/** Spreadsheet used as the database. Creates one automatically if none exists. */
function db_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch(e) { props.deleteProperty('SHEET_ID'); }
  }
  // Try bound spreadsheet first
  try {
    var bound = SpreadsheetApp.getActiveSpreadsheet();
    if (bound) { props.setProperty('SHEET_ID', bound.getId()); return bound; }
  } catch(e) {}
  // Standalone script — create a new spreadsheet in Drive
  var ss = SpreadsheetApp.create('SD Shopflow — Database');
  props.setProperty('SHEET_ID', ss.getId());
  return ss;
}

function sheet_(name) {
  var sh = db_().getSheetByName(name);
  if (!sh) throw new Error('Missing sheet: ' + name + '. Run setup().');
  return sh;
}

/** Read a sheet into an array of objects keyed by header. */
function rows_(name) {
  var sh = sheet_(name);
  var data = sh.getDataRange().getValues();
  var head = data.shift();
  return data.filter(function (r) { return r[0] !== ''; }).map(function (r, i) {
    var o = { _row: i + 2 };
    head.forEach(function (h, c) { o[h] = r[c]; });
    return o;
  });
}

function append_(name, obj) {
  var sh = sheet_(name);
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  sh.appendRow(head.map(function (h) { return obj[h] === undefined ? '' : obj[h]; }));
}

function uid_(prefix) {
  return prefix + Utilities.getUuid().slice(0, 8).toUpperCase();
}
