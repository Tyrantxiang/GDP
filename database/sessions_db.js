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

//Creates a new entry on the Sessions table
sessionsData.createSession = function(pass, fail, sessionObj) {
	//Validates the sessionObj given
	validateSession(queryExecution, fail, sessionObj);
	
	//After validation, persists the session obj
	function queryExecution(){
		dbutils.create(pass, fail, TABLE_NAME, sessionObj);
	}
}

//Gets the session entry that matches the given
sessionsData.readSessionById = function(pass, fail, id){
	dbutils.readById(pass, fail, TABLE_NAME, ["id", "user_id", "start_time", "end_time", "created", "modified"], id);
}

//This updates a session entry to have the end_time of said session
//When the session ends, this should be called
sessionsData.endSession = function(pass, fail, end_ts, id){
	sessionsData.readSessionById(validateTimes, fail, id);

	function validateTimes(sessionObj){
		validateEndTime(queryExecution, fail, end_ts, sessionObj.start_time);	
	}

	function queryExecution(){
		dbutils.updateById(pass, fail, TABLE_NAME, {"end_time": end_ts}, id);
	}
}

//Deletes the entry that matches the id
sessionsData.deleteSession = function(pass, fail, id){
	dbutils.deleteById(pass, fail, TABLE_NAME, id);
}

/*
 * HELPER FUNCTIONS
*/

function validateSession(pass, fail, sessionObj){
	pass();
}

function validateEndTime(pass, fail, end_ts, start_ts){
	pass();
}

module.exports = sessionsData;