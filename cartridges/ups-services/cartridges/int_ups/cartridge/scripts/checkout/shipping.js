'use strict';

const Site = require('dw/system/Site');
const Resource = require('dw/web/Resource');
var addressValidationService = require('~/cartridge/scripts/services/addressValidation');

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
 * Executes address validation if the submitted address is in the allowed country preference(s)
 * @param {Address} address
 * @param {Function} callbackFn Optional callback to execute with result
 * @returns {{isError: boolean, errorText: string, candidates: Array}}
 */
function addressValidation(address, callbackFn) {
    var curSite = Site.getCurrent();
    var allowedTerritories = getEnumsAsArray(curSite.getCustomPreferenceValue('upsAVSAllowedTerritories'));
    var excludedTerritories = getEnumsAsArray(curSite.getCustomPreferenceValue('upsAVSExcludedTerritories'));

    if (allowedTerritories.length === 0) {
        // if no allowed territories defined, allow all territories
        allowedTerritories = getPossibleEnumValues('upsAVSAllowedTerritories');
    }
    // filter out excluded territories
    allowedTerritories = allowedTerritories.filter(function(e) {
        return this.indexOf(e) < 0;
    }, excludedTerritories);

    // ensure uppercase country
    address.countryCode = address.countryCode.toUpperCase();

    //dw.system.Logger.debug('allowedTerroritories: {0}', JSON.stringify(allowedTerritories));
    //dw.system.Logger.debug('submitted address: {0}', JSON.stringify(address));

    if (allowedTerritories.indexOf(address.countryCode) > -1) {
        // only execute for matching country code
        var avsResult = addressValidationService.call(address);
        var avsObject = avsResult.object;
        if (!avsResult.ok && avsResult.status === avsResult.SERVICE_UNAVAILABLE) {
            // return early, the service is unavailable
            return;
        }
        if (avsResult.ok && avsObject) {
            var errorText = avsObject.errorText;
            var candidates = [];
            if (!avsObject.isError) {
                if (avsObject.isValidJSON) {
                    var responseObj = avsObject.responseObj;

                    var reformatAddress = function (candidate) {
                        var postalCode = candidate.PostcodePrimaryLow;
                        if (candidate.PostcodeExtendedLow) {
                            postalCode += '-' + candidate.PostcodeExtendedLow;
                        }
                        return {
                            address1: candidate.AddressLine,
                            address2: address.address2, // preserve user submitted address2
                            city: candidate.PoliticalDivision2,
                            state: candidate.PoliticalDivision1,
                            countryCode: candidate.CountryCode,
                            postalCode: postalCode
                        };
                    };

                    if ('Candidate' in responseObj.XAVResponse) {
                        if (Array.isArray(responseObj.XAVResponse.Candidate)) {
                            responseObj.XAVResponse.Candidate.forEach(function (candidate) {
                                candidates.push(reformatAddress(candidate.AddressKeyFormat));
                            });
                        } else {
                            candidates.push(reformatAddress(responseObj.XAVResponse.Candidate.AddressKeyFormat));
                        }
                    }
                }
            } else if (avsObject.isError && avsObject.isValidJSON) {
                var responseObj = avsObject.responseObj;
                if ('response' in responseObj) {
                    if ('errors' in responseObj.response) {
                        errorText = [];
                        for each(var error in responseObj.response.errors) {
                            errorText.push(Resource.msgf('ups.errorText', 'upsservices', null, error.code, error.message));
                        }
                    }
                }
            }
            //dw.system.Logger.debug('candidates: {0}', JSON.stringify(candidates));
            var result = {
                isError: !(avsResult.ok && !avsObject.isError),
                errorText: errorText || avsResult.errorMessage,
                candidates: candidates
            };
            if (callbackFn) {
                callbackFn(result);
            }
            return result;
        }
    }
}

/**
 * Gets full range of values from a custom preference, returns as a simple array
 * @param {string} attributeName Preference attribute name
 * @returns {Array}
 */
function getPossibleEnumValues(attributeName) {
    const SystemObjectMgr = require('dw/object/SystemObjectMgr');
    var describedSitePreferences = SystemObjectMgr.describe('SitePreferences');
    var attributeDefinition = describedSitePreferences.getCustomAttributeDefinition(attributeName);
    return getEnumsAsArray(attributeDefinition.values);
}

/**
 * Converts list of EnumValue to a simple array
 * @param {dw.util.Collection} enumValueList
 * @returns {Array}
 */
function getEnumsAsArray(enumValueList) {
    var enumValuesArray = [];
    for each (var enumValue in enumValueList) {
        enumValuesArray.push(enumValue.getValue());
    }
    return enumValuesArray;
}

exports.addressValidation = addressValidation;
