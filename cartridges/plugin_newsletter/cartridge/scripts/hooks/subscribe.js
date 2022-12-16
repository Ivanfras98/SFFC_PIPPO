
function createNewsletterObj(email) {

var newsletterForm = server.forms.getForm('newsletter');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

 var Newsletter_Forms = CustomObjectMgr.createCustomObject('Newsletter_Forms', newsletterForm.email.value);

}
