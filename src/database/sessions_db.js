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
	;

//Creates a new entry on the Sessions table
sessionsDB.createSession = function(sessionObj) {		
	var session = Sessions.build(sessionObj);
	
	return session.validate().then(function(isNotValid){
		console.log(isNotValid);
		if(isNotValid) throw new Error(isNotValid.message);
		else return session.save();
	});
}

//Gets the session entry that matches the given
sessionsDB.readSessionById = function(pass, fail, id){
	return Sessions.findById(id).then(pass).catch(fail);
}

//This updates a session entry to have the end_time of said session
//When the session ends, this should be called
sessionsDB.endSession = function(end_ts, userid){
	/*function validateTimes(sessionObj){
	//	validateDetails(queryExecution, fail, {start_time: sessionObj.start_time, end_time: end_ts});	
	}*/
	
	return Sessions.findById(userid).then(function(session){
		session.end_time = end_ts;
		
		var isNotValid = session.validate();
		
		if(isNotValid) throw new Error(isNotValid.message);
		else return session.save();
	});
}

//Deletes the entry that matches the id
sessionsDB.deleteSession = function(pass, fail, id){
	return Sessions.destroy({ where : { 'id' : id } }).then(pass).catch(fail);
}

module.exports = function(seq){
	Sessions = seq.Sessions;
	
	return sessionsDB;
}