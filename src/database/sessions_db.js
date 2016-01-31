'use strict';

/*
 * sessions_db.js
 * 
 * Queries for the Sessions database table
 *
 * @authors Joe Ringham
*/

var sessionsDB = {}
	, Sessions = undefined
	//, validateDetails = require("../validateDetails.js")
	;

//Creates a new entry on the Sessions table
sessionsDB.createSession = function(pass, fail, sessionObj) {
	//Validates the sessionObj given
	//validateDetails(queryExecution, fail, sessionObj);
	
	return Sessions.create(sessionObj).then(pass).catch(fail);
}

//Gets the session entry that matches the given
sessionsDB.readSessionById = function(pass, fail, id){
	return Sessions.findById(id).then(pass).catch(fail);
}

//This updates a session entry to have the end_time of said session
//When the session ends, this should be called
sessionsDB.endSession = function(pass, fail, end_ts, id){
	/*function validateTimes(sessionObj){
	//	validateDetails(queryExecution, fail, {start_time: sessionObj.start_time, end_time: end_ts});	
	}*/
	
	return Sessions.findById(id).then(function(session){
		session.end_time = end_ts;
		
		return sessions.save();
	}).then(pass).catch(fail);
}

//Deletes the entry that matches the id
sessionsDB.deleteSession = function(pass, fail, id){
	return Sessions.destroy({ where : { 'id' : id } }).then(pass).catch(fail);
}

module.exports = function(seq){
	Sessions = seq.Sessions;
	
	return sessionsDB;
}