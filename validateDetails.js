'use strict';

/*
 * buildDB.js
 * 
 * Runs the build script on the database
 *
 * @authors Joe Ringham
*/

var validate = require("validate.js")
	;
validate.Promise = require('rsvp').Promise;

//Date time validation functions
validate.extend(validate.validators.datetime, {
	parse: function(value, options) {
		return new Date(value);
	},
	format: function(value, options) {
		return value.toISOString();
	}
});

//Constraints: see http://validatejs.org/
var constraints = {
	username : {
		format : {
			pattern : "^[a-z0-9]+$"
			, flags : "i"
			, message : "can only contain a-z and 0-9"
		}
		, length : {
			minimum: 1
			, maximum : 25
		}
	}
	, password : {
		length : {
			minimum : 6 
		}
	}
	, dob : {
		datetime : {
			latest : new Date(Date.now() - (1000 * 60 * 60 * 24 * 365 * 10))
		}
	}
	, currency : {
		numericality : {
			onlyInteger: true
			, greaterThan: 0
		}
	}
	, start_time : {
		datetime : {
			latest : new Date(Date.now())
		}
	}
	, end_time : {
		datetime : {
			earliest : "start_time"
			, latest : new Date(Date.now())
		} 
	}
	, score : {
		numericality : {
			onlyInteger: true
		}
	}
}

module.exports = function(pass, fail, obj){
	//If end_time exists, check against start_time to make sure it is later!
	if(obj.end_time && (!obj.start_time || obj.end_time < obj.start_time)) {
		return fail({
			name : "ERR_VALIDATION_FAILED"
			, message : "Validation has failed for given properties"
			, detail : {
				end_time : "end_time must not be earlier than given start_time"
			}
		});
	}

	validate.async(obj, constraints).then(pass, handleFail);

	function handleFail(error){
		if (error instanceof Error)
			return fail(err);
  		
		fail({
			name : "ERR_VALIDATION_FAILED"
			, message : "Validation has failed for given properties"
			, detail : error
		});
	}
};
