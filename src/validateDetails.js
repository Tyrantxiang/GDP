'use strict';

/*
 * validateDetails.js
 * 
 * Used to validate common things throughout app
 * Just add new properties to constraints objects to add more things to validate!
 * See http://validatejs.org/
 *
 * @authors Joe Ringham
*/

var validate = require("validate.js")
	;
validate.Promise = require('bluebird');

//Constraints: see http://validatejs.org/
var constraints = {
	password : {
		length : {
			minimum : 6 
		}
	}
}

module.exports = function(pass, fail, obj){
	//Asynchronously call the validation
	validate.async(obj, constraints).then(pass, handleFail);

	function handleFail(error){
		if (error instanceof Error)
			return fail(err);
  		
		fail({
			name : "ERR_VALIDATION_FAILED"
			// Message lists all the properties the validation failed for
			, message : "Validation has failed for properties: "+Object.keys(error).join(', ')
			, detail : error
		});
	}
};
