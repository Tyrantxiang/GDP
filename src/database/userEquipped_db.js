'use strict';

/*
 * userEquipped_db.js
 * 
 * Queries for the user_equipped database table
 *
 * @authors Joe Ringham
*/

var userEquippedDB = {}
	, UserEquipped = undefined
	//, validateDetails = require("../validateDetails.js")
	;

//Creates a user_equipped entry
userEquippedDB.createUserEquipped = function(pass, fail, equippedObj) {
	//Validates the details given
	//validateDetails(queryExecution, fail, equippedObj);
	
	console.log(equippedObj);
	return UserEquipped.destroy({
		where : {
			user_id : equippedObj.user_id,
		}
	}).then(function(){
		return UserEquipped.create(equippedObj);
	}).then(pass).catch(fail);
}

//Gets the user_equipped entry that matches the given id
userEquippedDB.readUserEquippedById = function(pass, fail, id){	
	return UserEquipped.findById(id).then(pass).catch(fail);
}

//Returns all the columns for the matching Equipped entry
//Doing '*' here because it is one less place something needs to be changed when a new slot is added
userEquippedDB.getEquippedForUser = function(pass, fail, user_id){	
	return UserEquipped.findOne({
		where : {
			'user_id' : user_id
		}
	}).then(pass).catch(fail);
}

//Deletes the entry that matches the id
userEquippedDB.deleteUserEquipped = function(pass, fail, id){
	return UserEquipped.destroy({
		where : {
			id : id
		}
	}).then(pass).catch(fail);
}

module.exports = function(seq){
	UserEquipped = seq.UserEquipped;
	
	return userEquippedDB;
}