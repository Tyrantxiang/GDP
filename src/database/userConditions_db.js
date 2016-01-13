

'use strict';

/*
 * userConditions_db.js
 * 
 * Queries for the user_conditions database table
 *
 * @authors Joe Ringham
*/

var userCondsDB = {}
	, TABLE_NAME = "user_conditions"
	, dbutils = require('./dbutils.js')
	, validateDetails = require("../validateDetails.js")
	;

//Creates a user_condition entry
userCondsDB.createUserCondition = function(pass, fail, condObj) {
	//Validates the details given
	validateDetails(queryExecution, fail, condObj);
	
	//After validation, persists the play obj
	function queryExecution(){
		dbutils.create(pass, fail, TABLE_NAME, condObj);
	}
}

//Gets the user_condition entry that matches the given id
userCondsDB.readUserConditionById = function(pass, fail, id){
	dbutils.readById(pass, fail, TABLE_NAME, ["id", "user_id", "condition_id", "active", "created"], id);
}

userCondsDB.getConditionsForUser = function(pass, fail, user_id){
	dbutils.readLatestActive(resultsFormatting, fail, TABLE_NAME, 
		["condition_id"], ["user_id, condition_id"], {active: true, user_id: user_id});

	function resultsFormatting(results){
		var idArray = []
			;

		results.forEach(function(cond){
			idArray.push(cond.condition_id);
		});

		pass(idArray);
	}
}

//Deletes the entry that matches the id
userCondsDB.deleteUserCondition = function(pass, fail, id){
	dbutils.deleteById(pass, fail, TABLE_NAME, id);
}

module.exports = userCondsDB;