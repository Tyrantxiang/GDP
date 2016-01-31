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
	, seq = require('./model.js')(false)
	, databaseReq = [seq, require('./users_db.js')(seq)
	, require('./sessions_db.js')(seq)
	, require('./plays_db.js')(seq)
	, require('./userConditions_db.js')(seq)
	, require('./userInventory_db.js')(seq)
	, require('./userEquipped_db.js')(seq) ]
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
	console.log(settings);
	//db.validateServerSettings(setConnString, fail, settings);

	pass.call(null, db);

	return db;
}

module.exports = db;