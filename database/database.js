'use strict';

/*
 * database.js
 * 
 * Initialises the database, making it ready for queries
 * Also maps all database functions into this module
 *
 * @authors Joe Ringham
*/

var db = {}
	, dbutils = require('./dbutils.js')
	, databaseReq = [
		require('./users_db.js')
		, require('./sessions_db.js')
		, require('./plays_db.js')
		, require('./userConditions_db.js')
		, require('./userInventory_db.js')
		, require('./userEquipped_db.js')
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
	
	pass();
}

function isTrue(c){
	return !!c;
}

/*
 * Creates the connection string
 */
function setConnectionString(pass, fail, creds) {
 	dbutils.connection_string = 
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
	validateSettings(validationPass, fail, settings);

	function validationPass(){
		setConnectionString(connStringPass, fail, settings);
	}

	function connStringPass(){
		//dbutils.query(pass, fail, "SET search_path TO "+settings.schema+";");
		pass(dbutils.connection_string);
	}
}

module.exports = db;