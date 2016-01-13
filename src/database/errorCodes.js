'use strict';

/*
 * errorCodes.js
 * 
 * A mapping of psql error codes into more human-readable and useful errors
 *
 * @authors Joe Ringham
*/

var errorMap = {
	"23502" : "ERR_NOT_NULL_VIOLATION" //A provided value was undefined or null, which violates a column specification
	, "23505" : "ERR_UNIQUE_VIOLATION" //A provided value already exists in the database, but it needed to be unique
	, "42703" : "ERR_UNDEFINED_COLUMN" //A key in the provided object does not match a column in the table
	, "22P02" : "ERR_INVALID_TYPE_GIVEN" //A provided value has the wrong type (i.e. an int column was given a string value)
	, "23503" : "ERR_FK_DOES_NOT_EXIST" //A value given for a FK column does not exist in that table
};


module.exports = function(code){
	return errorMap[code] || {
		code : code
		, name : "ERR_UNKNOWN_CODE"
	}
}