/* API Includes */
var CustomerMgr = require('dw/customer/CustomerMgr');
var Filewriter = require('dw/io/FileWriter');
var File = require('dw/io/File');

var logger = require('dw/system/Logger').getLogger('Process', 'something');

function execute() {
  var header = '<? xml version = "1.0" encoding = "UTF-8" ?> <orders xmlns="http://www.demandware.com/xml/impex/orders/2015-07-01">';
  var footer = '</orders>';

  // Customer List -> Current Site
  var customerlistIterator = CustomerMgr.getSiteCustomerList().iterator();
  var customer = '';
  var xml = '';

  logger.info('CustomerList retreived');
  while (customerlistIterator.hasNext()) {
    customer = customerlistIterator.next();
    logger.info('Customer: ', customer.getProfile().getCustomerNo());

        // Get Orders for Customer
    var orderHistory = customer.orderHistory();
    var orderCount = orderHistory.getOrderCount();
    if (orderCount > 0) {
      logger.info('N. of Orders: ', orderHistory.getOrderCount());

      var orders = orderHistory.getOrders(null, 'creationDate DESC');

      while (orders.hasNext()) {
        var order = orders.next();

        // Export OrderXML
        xml += order.getOrderExportXML();
      }
    }
  }

  var exportData = header + xml + footer;
  var orderXML = new XML(exportData);

  var filewriter = new Filewriter(File.IMPEX + '/orderExport.xml');
  filewriter.write(orderXML);
  filewriter.close();

  return PIPELET_NEXT;
}


module.exports = execute;
