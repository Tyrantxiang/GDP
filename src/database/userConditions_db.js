'use strict';

/*
 * userConditions_db.js
 * 
 * Queries for the user_conditions database table
 *
 * @authors Joe Ringham
*/

var userCondsDB = {}
	, UserConditions = undefined
	;

//Creates a user_condition entry
userCondsDB.createUserCondition = function(condObj) {
	//if active = false, delete
	//if active = true, delete all old and then add
	return UserConditions.destroy({
		where : {
			user_id : condObj.user_id,
			condition_id : condObj.condition_id
		}
	}).then(function(){
		if(condObj.active) return UserConditions.create(condObj);
		else return Promise.resolve();
	});
}

//Gets the user_condition entry that matches the given id
userCondsDB.readUserConditionById = function(id){
	return UserConditions.findById(id);
}

userCondsDB.getConditionsForUser = function(user_id){
	return UserConditions.findAll({
		attributes : [
			'condition_id'
		], where : {
			'user_id' : user_id,
		}
	}).map(function(ele){
		return ele.condition_id;
	});
}

//Deletes the entry that matches the id
userCondsDB.deleteUserCondition = function(id){
	return UserConditions.destroy({
		where : {
			id : id
		}
	});
}

module.exports = function(seq){
	UserConditions = seq.UserConditions;
	
	return userCondsDB;
}