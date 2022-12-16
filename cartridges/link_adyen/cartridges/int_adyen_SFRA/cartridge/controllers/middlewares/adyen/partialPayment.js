"use strict";

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

var BasketMgr = require('dw/order/BasketMgr');

var PaymentMgr = require('dw/order/PaymentMgr');

var Logger = require('dw/system/Logger');

var Transaction = require('dw/system/Transaction');

var OrderMgr = require('dw/order/OrderMgr');

var URLUtils = require('dw/web/URLUtils');

var Money = require('dw/value/Money');

var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var constants = require('*/cartridge/adyenConstants/constants');

var collections = require('*/cartridge/scripts/util/collections');

function makePartialPayment(req, res, next) {
  try {
    Logger.getLogger('Adyen').error("inside makePartialPayment"); //                let response = {
    //                order: {
    //                                    orderData: {},
    //                                    remainingAmount: {currency: "USD", amount: 5000.00},
    //                                    pspReference: "4273908jfdsio",
    //                }
    //                };
    //                res.json(response);
    //                return next();

    var request = JSON.parse(req.body);
    var paymentMethod = request.paymentMethod,
        splitPaymentsOrder = request.splitPaymentsOrder,
        amount = request.amount;
    Logger.getLogger('Adyen').error('paymentMethod is ' + JSON.stringify(paymentMethod));
    var partialPaymentRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: amount,
      reference: "partialPaymentRef",
      paymentMethod: paymentMethod,
      order: splitPaymentsOrder
    }; //        Logger.getLogger('Adyen').error('partialPaymentrequest is ' + JSON.stringify(partialPaymentRequest));

    Logger.getLogger('Adyen').error('paymentMethod is ' + JSON.stringify(paymentMethod));
    var currentBasket = BasketMgr.getCurrentBasket(); //        Logger.getLogger('Adyen').error('currentBasket inside makePartialPayment ' + currentBasket);

    var paymentInstrument;
    Transaction.wrap(function () {
      collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
        currentBasket.removePaymentInstrument(item);
      });
      paymentInstrument = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, currentBasket.totalGrossPrice);
      Logger.getLogger('Adyen').error('gift card PM is ' + paymentInstrument);

      var _PaymentMgr$getPaymen = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod),
          paymentProcessor = _PaymentMgr$getPaymen.paymentProcessor;

      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor; //            paymentInstrument.custom.adyenPaymentData = JSON.stringify({paymentMethod: paymentMethod});

      paymentInstrument.custom.adyenSplitPaymentsOrder = JSON.stringify(splitPaymentsOrder); //            paymentInstrument.custom.adyenPaymentMethod = `split payment: ${request.paymentMethod.type} ${request.paymentMethod.brand ? request.paymentMethod.brand : ""}`; //1 payment processor
      //            paymentInstrument.custom.adyenPaymentMethod = `${request.paymentMethod.type}` ; // for 2 payment processors

      paymentInstrument.custom.adyenGiftCardUsed = true;
      paymentInstrument.custom.adyenGiftCardAmount = JSON.stringify(amount); //            Logger.getLogger('Adyen').error('paymentInstrument.custom.adyenPaymentData is ' + JSON.stringify(paymentInstrument.custom.adyenPaymentData));
    }); //                        Logger.getLogger('Adyen').error('paymentMethod is ' + JSON.stringify(paymentMethod));
    //        const order = COHelpers.createOrder(currentBasket);

    response = adyenCheckout.doPaymentsCall(0, 0, partialPaymentRequest);
    Transaction.wrap(function () {
      paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(response);
    }); //        Logger.getLogger('Adyen').error('paymentInstrument.paymentTransaction.custom.Adyen_log ' + JSON.stringify(paymentInstrument.paymentTransaction.custom.Adyen_log));

    var remainingAmount = new Money(response.order.remainingAmount.value, response.order.remainingAmount.currency).divide(100);
    response.remainingAmountFormatted = remainingAmount.toFormattedString();
    res.json(response);
    return next();
  } catch (error) {
    Logger.getLogger('Adyen').error('Failed to create partial payment');
    Logger.getLogger('Adyen').error(error);
    return next();
  }
}

module.exports = makePartialPayment;