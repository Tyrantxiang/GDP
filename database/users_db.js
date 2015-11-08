'use strict';

/*
 * usersData.js
 * 
 * Queries for the Users database table
 *
 * @authors Joe Ringham
*/

var usersData = {}
	, TABLE_NAME = "users"
	, dbutils = require('./dbutils.js')
	, bcrypt = require('bcrypt');
	;

//Creates an entry on the user table
// Includes validation of details and password salting
usersData.createUser = function(pass, fail, userObj) {
	//Validates the details given
	validateUserDetails(saltPassword, fail, userObj);
	
	//After validation, creates a salted password
	function saltPassword(){
		createSaltedPassword(queryExecution, fail, userObj.password);
	}

	//Once the hash is created, user can be persisted!
	function queryExecution(saltedpw){
		delete userObj.password;
		userObj.saltedpw = saltedpw;

		dbutils.create(pass, fail, TABLE_NAME, userObj);
	}
}

//Reads a user entry given an id
usersData.readUserById = function(pass, fail, id){
	dbutils.readById(pass, fail, TABLE_NAME, ["id", "username", "dob", "currency", "created", "modified"], id);
}

//Reads a user entry given a username
usersData.readUserByName = function(pass, fail, username){
	dbutils.readSingle(pass, fail, TABLE_NAME, ["id", "username", "dob", "currency", "created", "modified"],
		{"username": username}, null);
}

//Authenticates a user given a username and password
// Verifies the password is correct against the stored saltedpassword
usersData.authenticateUser = function(pass, fail, username, givenpw){
	dbutils.readSingle(comparePasswords, fail, TABLE_NAME, ["id", "username", "saltedpw", "dob", "currency", "created", "modified"],
		{"username": username});

	function comparePasswords(userObj){
		if(!userObj)
			return fail("User does not exist");

		bcrypt.compare(givenpw, userObj.saltedpw, function(err, passCorrect){
			if(err)
				return fail(err);
			
			if(!passCorrect)
				return fail({
					name: 'ERR_PASSWORD_INCORRECT'
					, message: 'Password is incorrect for user '+username
				});

			delete userObj.saltedpw;
			pass(userObj);
		});
	}
}

//Updates all user details provided in the updatedUserObj
usersData.updateUserDetails = function(pass, fail, updatedUserObj, id){
	//Validates the details given
	validateUserDetails(saltPasswordIfExists, fail, updatedUserObj);

	//After validation, creates a salted password if exists
	function saltPasswordIfExists(){
		if(updatedUserObj.password) {
			createSaltedPassword(queryExecutionWithNewPassword, fail, updatedUserObj.password);
		} else {
			dbutils.updateById(pass, fail, TABLE_NAME, updatedUserObj, id);
		}
	}

	//Once the hash is created, updated user can be persisted!
	function queryExecutionWithNewPassword(saltedpw){
		delete updatedUserObj.password;
		updatedUserObj.saltedpw = saltedpw;

		dbutils.updateById(pass, fail, TABLE_NAME, updatedUserObj, id);
	}
}

//Updates only currency for a user entry
usersData.updateUserCurrency = function(pass, fail, newCurrency, id){
	validateCurrency(queryExecution, fail, newCurrency);

	function queryExecution(){
		dbutils.updateById(pass, fail, TABLE_NAME, {"currency": newCurrency}, id);
	}
}

//Deletes a user entry given an id
usersData.deleteUser = function(pass, fail, id){
	dbutils.deleteById(pass, fail, TABLE_NAME, id);
}

/*
 * HELPER FUNCTIONS
*/

//Will soon validate the username, password and dob to make sure they are correct before persisting
function validateUserDetails(pass, fail, userObj){
	pass();
}

//Will soon validate the currency to make sure it is correct before persisting
function validateCurrency(pass, fail, currency){
	pass();
}

function createSaltedPassword(pass, fail, password){
	bcrypt.genSalt(10, function(err, salt){
		if(err)	return fail(err);
		
		bcrypt.hash(password, salt, function(err, saltedpw){
			if(err) return fail(err);
			
			pass(saltedpw);
		});
	});
}

module.exports = usersData;