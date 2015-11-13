'use strict';

/*
 * user_conditions.js
 * 
 * Queries for the user_conditions database table
 *
 * @authors Joe Ringham
*/

var user_conditions = {}
	, TABLE_NAME = "user_conditions"
	, dbutils = require('./dbutils.js')
	;

//Creates a user_condition entry
user_conditions.createUserCondition = function(pass, fail, condObj) {
	//Validates the details given
	validateDetails(queryExecution, fail, condObj);
	
	//After validation, persists the play obj
	function queryExecution(){
		dbutils.create(pass, fail, TABLE_NAME, condObj);
	}
}

//Gets the user_condition entry that matches the given id
user_conditions.readUserConditionById = function(pass, fail, id){
	dbutils.readById(pass, fail, TABLE_NAME, ["id", "user_id", "condition_id", "active", "created"], id);
}

user_conditions.getConditionsForUser = function(pass, fail, user_id){
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
user_conditions.deleteUserCondition = function(pass, fail, id){
	dbutils.deleteById(pass, fail, TABLE_NAME, id);
}

/*
 * HELPER FUNCTIONS
*/

function validateConditionDetails(pass, fail, condObj){
	pass();
}

module.exports = user_conditions;