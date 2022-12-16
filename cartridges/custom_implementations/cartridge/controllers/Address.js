'use strict';

var server = require('server');
var HookMgr = require('dw/system/HookMgr');
var CustomerMgr = require('dw/customer/CustomerMgr');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.extend(module.superModule);

server.prepend('SaveAddress', csrfProtection.validateAjaxRequest, function (req, res, next) {
  var viewData = res.getViewData();

  var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );

  var addressBook = customer.getProfile().getAddressBook().getAddresses().iterator();
  var address = {};
  var result = {};

  while (addressBook.hasNext()) {
    address = addressBook.next();
    result = HookMgr.callHook('app.validate.address', 'validateAddress', address);
    if (result.error === true) {
      viewData.result = result;
    }
  }

  res.setViewData(viewData);
  next();
});

module.exports = server.exports();
