/** Email and WhatsApp sharing. */

function emailInvoice(no, to) {
  var d = invoiceData_(no);
  to = to || d.customer.email;
  if (!to) throw new Error('No email address for this customer');
  MailApp.sendEmail({
    to: to,
    subject: 'Invoice ' + no + ' from ' + d.s.shopName,
    htmlBody: 'Dear ' + d.inv.customerName + ',<br><br>Please find attached invoice <b>' + no +
      '</b> for <b>Rs. ' + d.inv.total + '</b>.<br><br>Thank you,<br>' + d.s.shopName,
    attachments: [getPdfBlob_(no)]
  });
  return 'Sent to ' + to;
}

/** Returns a wa.me link (WhatsApp cannot attach files via link, so the PDF URL is included). */
function whatsappLink(no, phone) {
  var d = invoiceData_(no);
  phone = String(phone || d.customer.phone || '').replace(/\D/g, '');
  if (phone.length === 10) phone = '91' + phone;
  if (!phone) throw new Error('No phone number for this customer');
  DriveApp.getFileById(String(d.inv.pdfUrl).match(/[-\w]{25,}/)[0])
    .setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var msg = 'Invoice ' + no + ' from ' + d.s.shopName + '\nAmount: Rs. ' + d.inv.total +
    '\nDownload: ' + d.inv.pdfUrl;
  return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
}
