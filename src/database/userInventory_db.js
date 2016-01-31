'use strict';

/*
 * userInventory_db.js
 * 
 * Queries for the user_inventory database table
 *
 * @authors Joe Ringham
*/

var userInventoryDB = {}
	, UserInventory = undefined
	//, validateDetails = require("../validateDetails.js")
	;

//Creates a user_inventory entry
userInventoryDB.createUserInventory = function(pass, fail, inventoryObj) {
	//Validates the details given
	//validateDetails(queryExecution, fail, inventoryObj);
	
	//if active = false, delete
	//if active = true, delete all old and then add
	return UserInventory.destroy({
		where : {
			user_id : inventoryObj.user_id,
			item_id : inventoryObj.item_id
		}
	}).then(function(){
		if(inventoryObj.active) return UserInventory.create(inventoryObj);
		else return Promise.resolve();
	}).then(pass).catch(fail);
}

//Gets the user_inventory entry that matches the given id
userInventoryDB.readUserInventoryById = function(pass, fail, id){
	return UserInventory.findById(id).then(pass).catch(fail);
}

userInventoryDB.getInventoryForUser = function(pass, fail, user_id){	
	return UserInventory.findAll({
		attributes : [
			'item_id'
		], where : {
			'user_id' : user_id,
		}
	}).map(function(result){
		return result.item_id;
	}).then(pass).catch(fail);
}

//Deletes the entry that matches the id
userInventoryDB.deleteUserInventory = function(pass, fail, id){
	return UserInventory.destroy({
		where : {
			id : id
		}
	}).then(pass).catch(fail);
}

module.exports = function(seq){
	UserInventory = seq.UserInventory;
	
	return userInventoryDB;
}