'use strict';

/*
 * userInventory_db.js
 * 
 * Queries for the user_inventory database table
 *
 * @authors Joe Ringham
*/

var userInventoryDB = {}
	, TABLE_NAME = "user_inventory"
	, dbutils = require('./dbutils.js')
	, validateDetails = require("../validateDetails.js")
	;

//Creates a user_inventory entry
userInventoryDB.createUserInventory = function(pass, fail, inventoryObj) {
	//Validates the details given
	validateDetails(queryExecution, fail, inventoryObj);
	
	//After validation, persists the play obj
	function queryExecution(){
		dbutils.create(pass, fail, TABLE_NAME, inventoryObj);
	}
}

//Gets the user_inventory entry that matches the given id
userInventoryDB.readUserInventoryById = function(pass, fail, id){
	dbutils.readById(pass, fail, TABLE_NAME, ["id", "user_id", "item_id", "active", "created"], id);
}

userInventoryDB.getInventoryForUser = function(pass, fail, user_id){
	dbutils.readLatestActive(resultsFormatting, fail, TABLE_NAME, 
		["item_id"], ["user_id, item_id"], {active: true, user_id: user_id});

	function resultsFormatting(results){
		var idArray = []
			;

		results.forEach(function(item){
			idArray.push(item.item_id);
		});

		pass(idArray);
	}
}

//Deletes the entry that matches the id
userInventoryDB.deleteUserInventory = function(pass, fail, id){
	dbutils.deleteById(pass, fail, TABLE_NAME, id);
}

module.exports = userInventoryDB;