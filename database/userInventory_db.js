'use strict';

/*
 * user_inventory.js
 * 
 * Queries for the user_inventory database table
 *
 * @authors Joe Ringham
*/

var user_inventory = {}
	, TABLE_NAME = "user_inventory"
	, dbutils = require('./dbutils.js')
	;

//Creates a user_inventory entry
user_inventory.createUserInventory = function(pass, fail, inventoryObj) {
	//Validates the details given
	validateInventoryDetails(queryExecution, fail, inventoryObj);
	
	//After validation, persists the play obj
	function queryExecution(){
		dbutils.create(pass, fail, TABLE_NAME, inventoryObj);
	}
}

//Gets the user_inventory entry that matches the given id
user_inventory.readUserInventoryById = function(pass, fail, id){
	dbutils.readById(pass, fail, TABLE_NAME, ["id", "user_id", "item_id", "active", "created"], id);
}

user_inventory.getInventoryForUser = function(pass, fail, user_id){
	fail("NEEDS IMPLEMENTING");
	//dbutils.read(pass, fail, TABLE_NAME, ["item_id"], {"user_id": user_id}, limit);
}

//Deletes the entry that matches the id
user_inventory.deleteUserInventory = function(pass, fail, id){
	dbutils.deleteById(pass, fail, TABLE_NAME, id);
}

/*
 * HELPER FUNCTIONS
*/

function validateInventoryDetails(pass, fail, inventoryObj){
	pass();
}

module.exports = user_inventory;