'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Site = require('dw/system/Site');
const UUIDUtils = require('dw/util/UUIDUtils');

/**
 * @typedef {Object} Address
 * @property {string} address1
 * @property {string} address2
 * @property {string} city
 * @property {string} state
 * @property {string} countryCode
 * @property {string} postalCode
 */

/**
 * Create AVS service
 * @returns {dw.svc.HTTPService} HTTP service object
 */
function addressValidation() {
    return LocalServiceRegistry.createService('ups.rest.addressvalidation', {
        /**
         * @param {dw.svc.HTTPService} svc
         * @param {Address} address
         * @returns {string} request body
         */
        createRequest: function (svc, address) {
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Accept', 'application/json');
            svc.setRequestMethod('POST');

            svc.setAuthentication('NONE');

            var curSite = Site.getCurrent();
            var accessKey = curSite.getCustomPreferenceValue('upsAccessKey');
            var username = curSite.getCustomPreferenceValue('upsUsername');
            var password = curSite.getCustomPreferenceValue('upsPassword');

            if (empty(accessKey)) {
                throw new Error('UPS service configuration requires valid access key in Site custom preferences');
            }
            if (empty(username) || empty(password)) {
                throw new Error('UPS service configuration requires valid client username and password in Site custom preferences');
            }

            svc.addHeader('transId', UUIDUtils.createUUID()); // unique identifier
            svc.addHeader('transactionSrc', 'SFCC UPS cartridge v1.00'); // client app ID
            svc.addHeader('AccessLicenseNumber', accessKey); // UPS access key
            svc.addHeader('Username', username); // MyUPS username
            svc.addHeader('Password', password); // MyUPS password

            /*
            Request option values:
            1 - Address Validation
            2 - Address Classification (residential vs business)
            3 - Address Validation and Address Classification.
             */
            var reqOption = '1';
            svc.URL += '/addressvalidation/v1/' + reqOption;
            svc.URL = svc.URL.replace(/([^:]\/)\/+/g, "$1"); // remove multi slash

            // candidate list size, default is 15
            //svs.URL += '?maximumcandidatelistsize=15';

            var requestBody = {
                'XAVRequest': {
                    'AddressKeyFormat': {
                        //'ConsigneeName': '',
                        //'BuildingName': '',
                        'AddressLine': address.address1,
                        //'Region': '',
                        'PoliticalDivision2': address.city,
                        'PoliticalDivision1': address.state,
                        'PostcodePrimaryLow': address.postalCode,
                        //'PostcodeExtendedLow': '',
                        // Puerto Rico political division 3
                        //'Urbanization': '',
                        'CountryCode': address.countryCode
                    }
                }
            };
            return JSON.stringify(requestBody);
        },
        /**
         *
         * @param {dw.svc.HTTPService} svc
         * @param {dw.net.HTTPClient} client
         * @returns {{responseObj: Object, isError: boolean, isValidJSON: boolean, errorText: string}}
         */
        parseResponse: function (svc, client) {
            var result = parseResponse(svc, client);
            return result;
        },
        /**
         *
         * @param {dw.svc.HTTPService} svc
         * @param {Address} address
         * @returns {{text: string, statusMessage: string, statusCode: number}}
         */
        mockCall: function (svc, address) {
            var response = {
                'XAVResponse': {
                    'Response': {
                        'ResponseStatus': {
                            'Code': '1',
                            'Description': 'Success'
                        },
                        'TransactionReference': {
                            'CustomerContext': 'mockCallID',
                            'TransactionIdentifier': 'someRandomIdentifierFromUPS'
                        }
                    },
                    'ValidAddressIndicator': '',
                    'Candidate': {
                        'AddressKeyFormat': {
                            'AddressLine': address.address1,
                            'PoliticalDivision2': address.city,
                            'PoliticalDivision1': address.state,
                            'PostcodePrimaryLow': address.postalCode,
                            'PostcodeExtendedLow': '1234',
                            'Region': address.city + ' ' + address.stateCode + ' ' + address.postalCode + '-1234',
                            'CountryCode': address.countryCode
                        }
                    }
                }
            };
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: JSON.stringify(response)
            };
        }
    });
}

/**
 * Returns object describing UPS error codes
 * @returns {Object}
 */
function upsErrorCodes() {
    return {
        // General error codes
        '10013': {
            httpStatus: 400,
            message:
                'The message is too large to be processed by the Application.'
        },
        '20001': {
            httpStatus: 500,
            message:
                'General process failure.'
        },
        '20002': {
            httpStatus: 400,
            message:
                'The specified service name, {0}, and version number, {1}, combination is invalid.'
        },
        '20003': {
            httpStatus: 400,
            message:
                'Please check the server environment for the proper J2EE ws apis.'
        },
        '20006': {
            httpStatus: 400,
            message:
                'Invalid request action.'
        },
        '20007': {
            httpStatus: 400,
            message:
                'Missing Required field, {0}.'
        },
        '20008': {
            httpStatus: 400,
            message:
                'The field, {0}, contains invalid data, {1}.'
        },
        '20012': {
            httpStatus: 400,
            message:
                'The Client Information exceeds its Maximum Limit of {0}.'
        },
        '250001': {
            httpStatus: 401,
            message:
                'Invalid Access License for the tool. Please re-license.'
        },
        '250003': {
            httpStatus: 401,
            message:
                'Invalid Access License number.'
        },
        '250005': {
            httpStatus: 401,
            message:
                'No Access and Authentication Credentials provided.'
        },
        '250006': {
            httpStatus: 401,
            message:
                'The maximum number of user access attempts was exceeded.'
        },
        '250009': {
            httpStatus: 401,
            message:
                'License Number not found in the UPS database.'
        },
        '250019': {
            httpStatus: 401,
            message:
                'Invalid Field value.'
        },
        '250050': {
            httpStatus: 500,
            message:
                'License system not available.'
        },
        // AVS specific error codes
        '250065': {
            httpStatus: 400,
            message: 'Invalid or missing request element'
        },
        '260000': {
            httpStatus: 500,
            message: 'Service currently unavailable'
        },
        '264002': {
            httpStatus: 400,
            message: 'Country code is invalid or missing'
        },
        '264003': {
            httpStatus: 400,
            message: 'The maximum allowable Candidate List size has been exceeded with the User Request'
        },
        '264004': {
            httpStatus: 400,
            message: 'The maximum validation query time has been exceeded due to poor address data'
        },
        '264005': {
            httpStatus: 400,
            message: 'Address classification is not valid for a regional request'
        },
        '264006': {
            httpStatus: 400,
            message: 'Invalid candidate list size.'
        },
        '264007': {
            httpStatus: 400,
            message: 'Address classification is not allowed for the country requested'
        },
        '264008': {
            httpStatus: 400,
            message: 'Country code and address format combination is not allowed'
        },
        '264027': {
            httpStatus: 400,
            message: 'Additional address fields are needed to perform the requested operation'
        },
        '9264028': {
            httpStatus: 400,
            message: 'Invalid or missing request option'
        },
        '9264029': {
            httpStatus: 400,
            message: 'Missing address key format'
        },
        '9264030': {
            httpStatus: 400,
            message: 'The state is not supported in the Customer Integration Environment'
        }
    };
}

/**
 * Check if response type is JSON
 * @param {dw.net.HTTPClient} client
 * @returns {boolean}
 */
function isResponseJSON(client) {
    var contentTypeHeader = client.getResponseHeader('Content-Type');
    return contentTypeHeader && contentTypeHeader.split(';')[0].toLowerCase() === 'application/json';
}

/**
 * Parses response JSON and wraps with an object containing additional helper properties
 * @param {dw.svc.HTTPService} svc
 * @param {dw.net.HTTPClient} client
 * @returns {{responseObj: Object, isError: boolean, isValidJSON: boolean, errorText: string}}
 */
function parseResponse(svc, client) {
    var isJSON = isResponseJSON(client);
    var isError = client.statusCode >= 400;
    var parsedBody;

    if (isJSON) {
        try {
            parsedBody = JSON.parse(client.text);
        } catch (e) {
            parsedBody = client.text;
        }
    } else {
        parsedBody = client.text;
    }

    return {
        isValidJSON: isJSON,
        isError: isError,
        responseObj: parsedBody,
        errorText: client.errorText
    };
}

// execute and return the created instance
module.exports = addressValidation();
