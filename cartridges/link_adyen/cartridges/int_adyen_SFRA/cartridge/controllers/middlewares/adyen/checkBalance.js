"use strict";

var Logger = require('dw/system/Logger');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

var BasketMgr = require('dw/order/BasketMgr');

function callCheckBalance(req, res, next) {
  try {
    var currentBasket = BasketMgr.getCurrentBasket();
    var request = JSON.parse(req.body); //        Logger.getLogger('Adyen').error('request is ' + JSON.stringify(request));

    var paymentMethod;

    if (request.paymentMethod) {
      paymentMethod = request.paymentMethod;
    } //        Logger.getLogger('Adyen').error('paymentMethod is ' + JSON.stringify(paymentMethod));


    var checkBalanceRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: {
        currency: currentBasket.currencyCode,
        value: AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).value
      },
      reference: currentBasket.getUUID(),
      paymentMethod: paymentMethod
    }; //        Logger.getLogger('Adyen').error('checkBalanceRequest is ' + JSON.stringify(checkBalanceRequest));

    var response = adyenCheckout.doCheckBalanceCall(checkBalanceRequest);
    res.json(response);
    return next();
  } catch (error) {
    Logger.getLogger('Adyen').error('Failed to check gift card balance');
    Logger.getLogger('Adyen').error(error);
    return next();
  }
}

module.exports = callCheckBalance;