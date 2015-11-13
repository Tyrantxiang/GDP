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
	validatePlayDetails(queryExecution, fail, playObj);
	
	//After validation, persists the play obj
	function queryExecution(){
		dbutils.create(pass, fail, TABLE_NAME, playObj);
	}
}

//Gets the play entry that matches the given id
playsData.readPlayById = function(pass, fail, id){
	dbutils.readById(pass, fail, TABLE_NAME, ["id", "user_id", "game_id", "start_time", "end_time", "score", "created"], id);
}

/*
 * Versatile function for getting scores, which can be shaped by providing filters, orders and limits
 * 
filterConds = {
	user_id : 1,
	game_id : null,
	time_range : {
		start: 1000,
		end : null
	}
} ======> WHERE user_id=1 AND start_time>=1000

orderBy = {
	column : "score",
	direction : "DESC"
} ======> ORDER BY score DESC

limit = 10
======> LIMIT 10
*/
playsData.getScores = function(pass, fail, filterConds, orderBy, limit){

	dbutils.prepareFilterString(queryCreation, fail, filterConds);

	function queryCreation(filterString, filterVals, placeIndex){
		var orderByString = ""
			, limitString = ""
			;

		if(orderBy && orderBy.column){
			orderByString = "ORDER BY "+orderBy.column+" "
			orderByString += orderBy.direction || "DESC"
		}

		if(limit){
			limitString = "LIMIT $"+placeIndex
			filterVals.push(limit);
		}

		var preparedStatement= {
			text : [
				"SELECT p.id, p.user_id, u.username, p.game_id, p.start_time, p.end_time, p.score, p.created"
				, "FROM plays p JOIN users u ON p.user_id = u.id"
				, filterString
				, orderByString
				, limitString
				].join(" ")
			, values: filterVals
		};

		dbutils.query(resultsHandling, fail, preparedStatement);
	}

	function resultsHandling(results){
		pass(results.rows);
	}
}

//Deletes the entry that matches the id
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