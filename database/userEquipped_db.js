'use strict';

/*
 * user_equipped.js
 * 
 * Queries for the user_equipped database table
 *
 * @authors Joe Ringham
*/

var user_equipped = {}
	, TABLE_NAME = "user_equipped"
	, dbutils = require('./dbutils.js')
	;

//Creates a user_equipped entry
user_equipped.createUserEquipped = function(pass, fail, equippedObj) {
	//Validates the details given
	validateEquippedDetails(queryExecution, fail, equippedObj);
	
	//After validation, persists the play obj
	function queryExecution(){
		dbutils.create(pass, fail, TABLE_NAME, equippedObj);
	}
}

//Gets the user_equipped entry that matches the given id
user_equipped.readUserEquippedById = function(pass, fail, id){
	dbutils.readById(pass, fail, TABLE_NAME, ["id", "user_id", "item_id", "active", "created"], id);
}

user_equipped.getEquippedForUser = function(pass, fail, user_id){
	dbutils.read(pass, fail, TABLE_NAME, ["*"], {"user_id": user_id}, "ORDER BY id DESC");
}

//Deletes the entry that matches the id
user_equipped.deleteUserEquipped = function(pass, fail, id){
	dbutils.deleteById(pass, fail, TABLE_NAME, id);
}

/*
 * HELPER FUNCTIONS
*/

function validateEquippedDetails(pass, fail, equippedObj){
	pass();
}

module.exports = user_equipped;