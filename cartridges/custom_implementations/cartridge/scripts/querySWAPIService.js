var SWAPIService = require('~/cartridge/scripts/services/swapi');

function callSWAPI(resource) {
  var result = SWAPIService.call(resource);

  return result;
}

module.export = callSWAPI;
