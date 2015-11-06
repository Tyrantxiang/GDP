'use strict';

/*
 * database.js
 * 
 * Initialises the database, making it ready for queries
 * Also maps all database functions into this module
 *
 * @authors Joe Ringham
*/
//dbutils =  require('./dbutils') 
var db = {}
	, databaseReq = [
		require('./usersData.js')
		, require('./sessionsData.js')
		, require('./playsData.js')
	]
;

//Maps all functions in different modules into this one interface
databaseReq.forEach(function(req){
	for(var func in req){
		if(req.hasOwnProperty(func)){
			db[func] = req[func];
		}
	}
});

/*
 * Creates the connection string
 */
function validateSettings(pass, fail, settings){
	var credentials = 
		[ 
			settings.username
			, settings.password
			, settings.hostname
			, settings.database
			, settings.schema
		];

	//Checks all credentials are not undefined
	if( !credentials.every(isTrue) )
		return fail("Missing Parameters");
	
	setConnectionString(pass, fail, settings);
}

function isTrue(c){
	return !!c;
}

/*
 * Creates the connection string
 */
function setConnectionString(pass, fail, creds) {
 	db.connection_string = 
 		[ 
 			"postgres://"
			, creds['username']
			, ":"
			, creds['password']
			, "@"
			, creds['hostname']
			, "/"
			, creds['database']
		
		].join('');
	pass();
}


db.init = function(pass, fail, settings) {
	validateSettings(pass, fail, settings);
}

module.exports = db;