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
	return Sessions.build(sessionObj).save();
}

//Gets the session entry that matches the given
sessionsDB.readSessionById = function(id){
	return Sessions.findById(id);
}

//This updates a session entry to have the end_time of said session
//When the session ends, this should be called
sessionsDB.endSession = function(end_ts, userid){	
	return Sessions.findOne({
		where : {
			user_id : userid
		}, order : [['id', 'DESC']]
	}).then(function(session){
		session.end_time = end_ts;
		
		return session.save();
	});
}

//Deletes the entry that matches the id
sessionsDB.deleteSession = function(id){
	return Sessions.destroy({ 
		where : { 
			'id' : id 
		}
	});
}

module.exports = function(seq){
	Sessions = seq.Sessions;
	
	return sessionsDB;
}