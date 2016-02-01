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
	;

//Creates a user_inventory entry
userInventoryDB.createUserInventory = function(inventoryObj) {	
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
	});
}

//Gets the user_inventory entry that matches the given id
userInventoryDB.readUserInventoryById = function(id){
	return UserInventory.findById(id);
}

userInventoryDB.getInventoryForUser = function(user_id){	
	return UserInventory.findAll({
		attributes : [
			'item_id'
		], where : {
			'user_id' : user_id,
		}
	}).map(function(result){
		return result.item_id;
	});
}

//Deletes the entry that matches the id
userInventoryDB.deleteUserInventory = function(id){
	return UserInventory.destroy({
		where : {
			'id' : id
		}
	});
}

module.exports = function(seq){
	UserInventory = seq.UserInventory;
	
	return userInventoryDB;
}