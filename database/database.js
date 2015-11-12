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
	//, dbutils = 
	, databaseReq = [
		require('./dbutils.js')
		, require('./users_db.js')
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


db.init = function(pass, fail, settings) {
	db.validateServerSettings(setConnString, fail, settings);

	function setConnString(){
		db.setConnectionString(returnDB, fail, settings);
	}

	function returnDB(){
		pass.call(null, db);
	}

	return db;
}

module.exports = db;