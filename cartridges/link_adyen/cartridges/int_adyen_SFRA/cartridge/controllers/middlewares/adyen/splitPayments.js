"use strict";

var Logger = require('dw/system/Logger');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

var BasketMgr = require('dw/order/BasketMgr');

function createSplitPaymentsOrder(req, res, next) {
  try {
    //        Logger.getLogger('Adyen').error('inside  createSplitPaymentsOrder');
    var currentBasket = BasketMgr.getCurrentBasket();
    var request = JSON.parse(req.body); //        Logger.getLogger('Adyen').error('request is ' + JSON.stringify(request));

    var paymentMethod;

    if (request.paymentMethod) {
      paymentMethod = request.paymentMethod;
    } //        Logger.getLogger('Adyen').error('paymentMethod is ' + JSON.stringify(paymentMethod));


    var splitPaymentsRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: {
        currency: currentBasket.currencyCode,
        value: AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).value
      },
      reference: currentBasket.getUUID()
    }; //        Logger.getLogger('Adyen').error('splitPaymentsRequest is ' + JSON.stringify(splitPaymentsRequest));

    var response = adyenCheckout.doCreateSplitPaymentOrderCall(splitPaymentsRequest); //        Logger.getLogger('Adyen').error('split payments response is ' + JSON.stringify(response));

    res.json(response);
    return next();
  } catch (error) {
    Logger.getLogger('Adyen').error('Failed to create split payments order');
    Logger.getLogger('Adyen').error(error);
    return next();
  }
}

module.exports = createSplitPaymentsOrder;