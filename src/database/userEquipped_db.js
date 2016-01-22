'use strict';

/*
 * userEquipped_db.js
 * 
 * Queries for the user_equipped database table
 *
 * @authors Joe Ringham
*/

var userEquippedDB = {}
	, TABLE_NAME = "user_equipped"
	, dbutils = require('./dbutils.js')
	, validateDetails = require("../validateDetails.js")
	;

//Creates a user_equipped entry
userEquippedDB.createUserEquipped = function(pass, fail, equippedObj) {
	//Validates the details given
	validateDetails(queryExecution, fail, equippedObj);
	
	//After validation, persists the play obj
	function queryExecution(){
		dbutils.create(pass, fail, TABLE_NAME, equippedObj);
	}
}

//Gets the user_equipped entry that matches the given id
userEquippedDB.readUserEquippedById = function(pass, fail, id){
	dbutils.readById(pass, fail, TABLE_NAME, ["*"], id);
}

//Returns all the columns for the matching Equipped entry
//Doing '*' here because it is one less place something needs to be changed when a new slot is added
userEquippedDB.getEquippedForUser = function(pass, fail, user_id){
	dbutils.read(resultsHandling, fail, TABLE_NAME, ["*"], {"user_id": user_id}, "ORDER BY id DESC", 1);

	function resultsHandling(results){
		if(results.length > 0){
			pass(results[0]);
		}else{
			pass({});
		}
	}
}

//Deletes the entry that matches the id
userEquippedDB.deleteUserEquipped = function(pass, fail, id){
	dbutils.deleteById(pass, fail, TABLE_NAME, id);
}

module.exports = userEquippedDB;