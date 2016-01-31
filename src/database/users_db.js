'use strict';

/*
 * users_db.js
 * 
 * Queries for the Users database table
 *
 * @authors Joe Ringham
*/

var usersDB = {}
	, Users = undefined
	, bcrypt = require('bluebird').promisifyAll(require('bcrypt'))
	//, validateDetails = require("../validateDetails.js")
	;

//Creates an entry on the user table
// Includes validation of details and password salting
usersDB.createUser = function(pass, fail, userObj) {
	//Validates the details given
	//validateDetails(saltPassword, fail, userObj);
		
	return createSaltedPassword(userObj.password).then(function queryExecution(saltedpw){
		delete userObj.password;
		userObj.saltedpw = saltedpw;
		
		return Users.create(userObj);
	}).then(pass).catch(fail);
}

//Reads a user entry given an id
usersDB.readUserById = function(pass, fail, id){
	return Users.findOne({
		where : {
			'id' : id
		}, attributes : {
			exclude : ['saltedpw']
		}
	}).then(pass).catch(fail);
}

//Reads a user entry given a username
usersDB.readUserByName = function(pass, fail, username){		
	return Users.findOne({
		where : {
			'username' : username
		}, attributes : {
			exclude : ['saltedpw']
		}
	}).then(pass).catch(fail);
}

//Authenticates a user given a username and password
// Verifies the password is correct against the stored saltedpassword
usersDB.authenticateUser = function(pass, fail, username, givenpw){
	return Users.findOne({
		where : {
			username : username
		}
	}).then(function(userObj){
		if(!userObj) 
			throw Error("User does not exist");
		
		return bcrypt.compareAsync(givenpw, userObj.saltedpw).then(function(passCorrect){
			if(!passCorrect && (userObj.saltedpw!==givenpw))
				throw new Error('Password is incorrect for user '+username.toString());

			delete userObj.saltedpw;
			return Promise.resolve(userObj);
		});
	}).then(pass).catch(fail);
}

// This will always succed, as a "fail" is it not existing, which actually means it doesn't exist
usersDB.checkUsernameExists = function(pass, fail, username){
	return Users.count({
		where : {
			username : username
		}
	}).then(function(count){
		return Promise.resolve(!!count);
	}).then(pass).catch(fail);
}

//Updates all user details provided in the updatedUserObj
usersDB.updateUserDetails = function(pass, fail, updatedUserObj, id){
	//Validates the details given
	//validateDetails(saltPasswordIfExists, fail, updatedUserObj);
	
	if(updatedUserObj){
		return createSaltedPassword(updatedUserObj.password).then(function(saltedpw){
			delete updatedUserObj.password;
			updatedUserObj.saltedpw = saltedpw;
			
			return Users.update(updatedUserObj, { where : { 'id' : id } });
		}).then(pass).catch(fail);
	}else{
		return Users.update(updatedUserObj, { where : { 'id' : id } }).then(pass).catch(fail);
	}
}

//Updates only currency for a user entry
usersDB.updateUserCurrency = function(pass, fail, newCurrency, id){
	//validateDetails(queryExecution, fail, {currency: newCurrency});
	return Users.update({
		'currency': newCurrency
	}, {
		where : {
			'id' : id
		}
	}).then(pass).catch(fail);
}

//Deletes a user entry given an id
usersDB.deleteUser = function(pass, fail, id){
	return Users.destroy({
		where : {
			id : id
		}
	}).then(pass).catch(fail);
}

/*
 * HELPER FUNCTIONS
*/

function createSaltedPassword(password){
	return bcrypt.genSaltAsync(10).then(function(salt){
		return bcrypt.hashAsync(password, salt);
	});
}

module.exports = function(seq){
	Users = seq.Users;
	
	return usersDB;
}