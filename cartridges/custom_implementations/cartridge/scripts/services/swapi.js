'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/**
 * Create AVS service
 * @returns {dw.svc.HTTPService} HTTP service object
 */
function addressValidation() {
  return LocalServiceRegistry.createService('swapi.service', {
        /**
         * @param {dw.svc.HTTPService} svc
         * @returns {string} request body
         */
    createRequest: function (svc, resource) {
      svc.addHeader('Content-Type', 'application/json');
      svc.addHeader('Accept', 'application/json');
      svc.setRequestMethod('GET');

      svc.setAuthentication('NONE');

            /*
            Valid resources:
            planet, people, films, etc.. see https://swapi.dev/documentation#schema
             */
      var reqOption = '1';
      svc.URL += '/' + resource;
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
    mockCall: function () {
      return {
        statusCode: 200,
        statusMessage: 'Success',
        text: ''
      };
    }
  });
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
    errorText: client.detail
  };
}


module.exports = addressValidation();
