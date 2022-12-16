'use strict';

/**
 * validates the current users address
 * @param {dw.order.Basket} address - The current user's basket
 * @returns {Object} an error object
 */
function validateAddress(address) {

    var result = { error: false, message: null };

    if ((address.address1 === '') || (address.city === '') || (address.postalCode === '')) {
        result.error = true;
        result.message = 'Missing address part';
    }

    return result;

}

exports.validateAddress = validateAddress;