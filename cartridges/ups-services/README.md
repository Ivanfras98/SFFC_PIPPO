# UPS Services

## What is it?

This cartridge exists to provide the community with support for integrating UPS services into their Commerce Cloud storefront.

The initial release implements Address Verification (AVS). Contributions from the community are requested, to expand the cartridge with additional services and functionality.

## Installation

- Import metadata from `sites/site_template/`
- Upload cartridge `int_ups` to your instance
- Add `int_ups` to your storefront cartridge path
- Configure your site's Custom Preferences for UPS with UPS user name, password, and access key (from [UPS Developer Kit](https://www.ups.com/upsdeveloperkit?loc=en_US))
- In Business Manager, review `Administration > Operations > Services` to ensure your new UPS service(s) are enabled.

## Usage

### AVS

The AVS service implementation provides a hook that can be called within your checkout code. Implementation of the hook is up to your discretion.

Example hook execution:
```javascript
'use strict';

const HookMgr = require('dw/system/HookMgr');
const Logger = require('dw/system/Logger');

var avsResult;
var address = {
  address1: '1234 Some Street',
  address2: 'Suite A',
  city: 'San Francisco',
  state: 'CA',
  countryCode: 'US',
  postalCode: '54321'
};

if (!empty(address) && HookMgr.hasHook('app.shipping.addressValidation')) {
    avsResult = HookMgr.callHook(
        'app.shipping.addressValidation',
        'addressValidation',
        address
    );
    // OR use a callback function to handle the result, useful if multiple AVS providers
    HookMgr.callHook(
        'app.shipping.addressValidation',
        'addressValidation',
        address,
        function avsResults(result) {
            // we're calling a hook with multiple registered providers, so lets ensure we get the proper return value
            // ideally one service should actually return a value, we're not concerned with merging results in this example
            avsResult = result;
        }
    );

    // UPS will return a candidate address even if it exactly matches what was submitted, so let's remove exact matches
    if (avsResult && !avsResult.isError) {
        avsResult.candidates = avsResult.candidates.filter(function removeExactMatch(candidate){
            // returns false if all elements match
            return !(
                address.address1 === candidate.address1
                // not comparing address2, as UPS ignores/removes address2
                && address.city === candidate.city
                && address.state === candidate.state
                && address.countryCode === candidate.countryCode
                && address.postalCode === candidate.postalCode
            );
        });
    }
}
Logger.debug('AVS result: {0}', JSON.stringify(avsResult));
```

## Releases

- **v1.0.0**: Initial release, includes AVS service and hook