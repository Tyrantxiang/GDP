'use strict';

/*
 * database.js
 * 
 * Initialises the database, making it ready for queries
 * Also maps all database functions into this module
 *
 * @authors Joe Ringham
*/
var db = {};

db.init = function(pass, fail, settings) {
	
	var seq = require('./model.js')(settings, false)
	, databaseReq = [seq, require('./users_db.js')(seq)
	, require('./sessions_db.js')(seq)
	, require('./plays_db.js')(seq)
	, require('./userConditions_db.js')(seq)
	, require('./userInventory_db.js')(seq)
	, require('./userEquipped_db.js')(seq)
	, require('./userCurrency_db.js')(seq) ]
	;

	//Maps all functions in different modules into this one interface
	databaseReq.forEach(function(req){
		for(var func in req){
			if(req.hasOwnProperty(func)){
				db[func] = req[func];
			}
		}
	});

	seq.syncPromise.then(function(){
		pass(db);
	/*}).catch(function(err){
		console.log("rip");
		console.log(err);*/
	});

	return db;
}

module.exports = db;