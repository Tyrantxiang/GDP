'use strict';

/*
 * sessionsData.js
 * 
 * Queries for the Sessions database table
 *
 * @authors Joe Ringham
*/

var sessionsData = {}
	, TABLE_NAME = "sessions"
	, dbutils = require('./dbutils.js')
	;

sessionsData.createSession = function(pass, fail, sessionObj) {
	//Validates the details given
	validateStartTime(validationPass, fail, sessionObj.start_time);
	
	//After validation, persists the session obj
	function validationPass(){
		dbutils.create(pass, fail, TABLE_NAME, sessionObj);
	}
}

sessionsData.readSessionById = function(pass, fail, id){
	dbutils.readById(pass, fail, TABLE_NAME, ["id", "user_id", "start_time", "end_time", "created", "modified"], id);
}

sessionsData.endSession = function(pass, fail, end_ts, id){
	sessionsData.readSessionById(readPass, fail, id);

	function readPass(sessionObj){
		validateEndTime(validationPass, fail, end_ts, sessionObj.start_time);	
	}

	function validationPass(){
		dbutils.updateById(pass, fail, TABLE_NAME, {"end_time": end_ts}, id);
	}
}

sessionsData.deleteSession = function(pass, fail, id){
	dbutils.deleteById(pass, fail, TABLE_NAME, id);
}

/*
 * HELPER FUNCTIONS
*/

function validateStartTime(pass, fail, start_ts){
	pass();
}

function validateEndTime(pass, fail, end_ts, start_ts){
	pass();
}

module.exports = sessionsData;