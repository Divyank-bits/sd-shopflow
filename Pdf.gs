/** Render an invoice to PDF and save it in the Drive folder. */

function invoiceData_(no) {
  var s = getSettings();
  var inv = rows_('Invoices').filter(function (r) { return r.invoiceNo === no; })[0];
  if (!inv) throw new Error('Invoice not found');
  var items = rows_('InvoiceItems').filter(function (r) { return r.invoiceNo === no; });
  var customer = listCustomers().filter(function (c) { return c.id === inv.customerId; })[0] || {};
  return {
    s: s, inv: inv, items: items, customer: customer,
    inter: isInterState(s.stateCode, inv.placeOfSupply),
    words: amountInWords(inv.total),
    dateText: Utilities.formatDate(new Date(inv.date), 'Asia/Kolkata', 'dd-MMM-yyyy')
  };
}

function buildPdf_(no) {
  var t = HtmlService.createTemplateFromFile('InvoiceTemplate');
  t.d = invoiceData_(no);
  var html = t.evaluate().getContent();
  var blob = Utilities.newBlob(html, 'text/html', no.replace(/\//g, '-') + '.html')
    .getAs('application/pdf').setName(no.replace(/\//g, '-') + '.pdf');
  var s = getSettings();
  var folder = s.folderId ? DriveApp.getFolderById(s.folderId) : DriveApp.getRootFolder();
  return folder.createFile(blob).getUrl();
}

function getPdfBlob_(no) {
  var inv = rows_('Invoices').filter(function (r) { return r.invoiceNo === no; })[0];
  if (!inv || !inv.pdfUrl) throw new Error('PDF not available');
  var id = String(inv.pdfUrl).match(/[-\w]{25,}/)[0];
  return DriveApp.getFileById(id).getBlob();
}
