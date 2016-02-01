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
	;

//Creates a user_equipped entry
userEquippedDB.createUserEquipped = function(equippedObj) {	
	return UserEquipped.destroy({
		where : {
			user_id : equippedObj.user_id,
		}
	}).then(function(){
		return UserEquipped.create(equippedObj);
	});
}

//Gets the user_equipped entry that matches the given id
userEquippedDB.readUserEquippedById = function(pass, fail, id){	
	return UserEquipped.findById(id).then(pass).catch(fail);
}

//Returns all the columns for the matching Equipped entry
//Doing '*' here because it is one less place something needs to be changed when a new slot is added
userEquippedDB.getEquippedForUser = function(user_id){	
	return UserEquipped.findOne({
		where : {
			'user_id' : user_id
		}
	});
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