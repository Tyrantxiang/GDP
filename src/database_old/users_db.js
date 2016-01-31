'use strict';

/*
 * users_db.js
 * 
 * Queries for the Users database table
 *
 * @authors Joe Ringham
*/

var usersDB = {}
	, TABLE_NAME = "users"
	, dbutils = require('./dbutils.js')
	, bcrypt = require('bcrypt')
	, validateDetails = require("../validateDetails.js")
	;

//Creates an entry on the user table
// Includes validation of details and password salting
usersDB.createUser = function(pass, fail, userObj) {
	//Validates the details given
	validateDetails(saltPassword, fail, userObj);
	
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
usersDB.readUserById = function(pass, fail, id){
	dbutils.readById(pass, fail, TABLE_NAME, ["id", "username", "dob", "currency", "created", "modified"], id);
}

//Reads a user entry given a username
usersDB.readUserByName = function(pass, fail, username){
	dbutils.readSingle(pass, fail, TABLE_NAME, ["id", "username", "dob", "currency", "created", "modified"],
		{"username": username}, null);
}

//Authenticates a user given a username and password
// Verifies the password is correct against the stored saltedpassword
usersDB.authenticateUser = function(pass, fail, username, givenpw){
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

// This will always succed, as a "fail" is it not existing, which actually means it doesn't exist
usersDB.checkUsernameExists = function(pass, fail, username){
	dbutils.readSingle(exists, notExists, TABLE_NAME, [ "id" ], { username : username });

	function exists(){
		pass(true);
	}
	function notExists(err){
		if(err.name === "ERR_NO_MATCHING_ENTRY"){
			pass(false);
		}else{
			fail(err);
		}
	}
}

//Updates all user details provided in the updatedUserObj
usersDB.updateUserDetails = function(pass, fail, updatedUserObj, id){
	//Validates the details given
	validateDetails(saltPasswordIfExists, fail, updatedUserObj);

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
usersDB.updateUserCurrency = function(pass, fail, newCurrency, id){
	validateDetails(queryExecution, fail, {currency: newCurrency});

	function queryExecution(){
		dbutils.updateById(pass, fail, TABLE_NAME, {"currency": newCurrency}, id);
	}
}

//Deletes a user entry given an id
usersDB.deleteUser = function(pass, fail, id){
	dbutils.deleteById(pass, fail, TABLE_NAME, id);
}

/*
 * HELPER FUNCTIONS
*/

function createSaltedPassword(pass, fail, password){
	bcrypt.genSalt(10, function(err, salt){
		if(err)	return fail(err);
		
		bcrypt.hash(password, salt, function(err, saltedpw){
			if(err) return fail(err);
			
			pass(saltedpw);
		});
	});
}

module.exports = usersDB;