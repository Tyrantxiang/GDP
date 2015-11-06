'use strict';

/*
 * playsData.js
 * 
 * Queries for the Sessions database table
 *
 * @authors Joe Ringham
*/

var playsData = {}
	, TABLE_NAME = "plays"
	, dbutils = require('./dbutils.js')
	;

playsData.createPlay = function(pass, fail, playObj) {
	//Validates the details given
	validatePlayDetails(validationPass, fail, playObj);
	
	//After validation, persists the play obj
	function validationPass(){
		dbutils.create(pass, fail, TABLE_NAME, playObj);
	}
}

playsData.readPlayById = function(pass, fail, id){
	dbutils.readById(pass, fail, TABLE_NAME, ["id", "user_id", "game_id", "start_time", "end_time", "score", "created"], id);
}

playsData.getScores = function(pass, fail, filterConds, limit){
	dbutils.read(pass, fail, TABLE_NAME, ["id", "user_id", "game_id", "start_time", "end_time", "score", "created"],
		filterConds, limit);
}

playsData.deletePlay = function(pass, fail, id){
	dbutils.deleteById(pass, fail, TABLE_NAME, id);
}

/*
 * HELPER FUNCTIONS
*/

function validatePlayDetails(pass, fail, start_ts, end_ts, score){
	pass();
}

module.exports = playsData;