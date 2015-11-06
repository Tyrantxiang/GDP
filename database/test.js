'use strict';

/*
 * test.js
 * 
 * Interface for all database interaction
 * Maps all functions in different modules into this one interface
 *
 * @authors Joe Ringham
*/

var db = require('./database.js')
	;

function testPass(){
	console.log("PASS");
}

function testFail(err){
	console.log("FAIL");
	console.log(err);
}

var dummyServerSettings = {
	username: 'u',
	password: 'p',
	hostname: 'h',
	database: 'd',
	schema: 's'
}

var filters = {
	user_id : 2
	, game_id : "gogo"
	, time_range : {
		start : 123
		, end : null
	}
}

db.init(function(){
			console.log(db.connection_string)
		}, testFail, dummyServerSettings);

db.getScores(testPass, testFail, filters, {column: "score", direction: "DESC"}, 10);