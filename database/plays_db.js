'use strict';

/*
 * playsData.js
 * 
 * Queries for the Plays database table
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

playsData.getScores = function(pass, fail, filterConds, orderBy, limit){
	var orderByString = ""
		;

	if(orderBy && orderBy.column && orderBy.direction)
		orderByString = "ORDER BY "+orderBy.column+" "+orderBy.direction;

	dbutils.read(pass, fail, TABLE_NAME, ["id", "user_id", "game_id", "start_time", "end_time", "score", "created"],
		filterConds, orderByString, limit);
}

playsData.deletePlay = function(pass, fail, id){
	dbutils.deleteById(pass, fail, TABLE_NAME, id);
}

/*
 * HELPER FUNCTIONS
*/

function validatePlayDetails(pass, fail, playObj){
	pass();
}

module.exports = playsData;