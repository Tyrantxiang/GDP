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

usersData.createUser = function(pass, fail, userObj) {
	//Validates the details given
	validateUserDetails(validationPass, fail, userObj);
	
	//After validation, creates a salted password
	function validationPass(){
		createSaltedPassword(saltingPass, fail, userObj.password);
	}
	
	//Once the hash is created, user can be persisted!
	function saltingPass(saltedpw){
		delete userObj.password;
		userObj.saltedpw = saltedpw;

		dbutils.create(pass, fail, TABLE_NAME, userObj);
	}
}

usersData.readUserById = function(pass, fail, id){
	dbutils.readById(pass, fail, TABLE_NAME, ["id", "username", "dob", "currency", "created", "modified"], id);
}

usersData.readUserByName = function(pass, fail, username){
	dbutils.readSingle(pass, fail, TABLE_NAME, ["id", "username", "dob", "currency", "created", "modified"],
		{"username": username});
}

usersData.authenticateUser = function(pass, fail, username, givenpw){
	dbutils.readSingle(readUserPass, fail, TABLE_NAME, ["id", "username", "saltedpw", "dob", "currency", "created", "modified"],
		{"username": username});

	function readUserPass(userObj){
		bcrypt.compare(givenpw, userObj.saltedpw, function(err, passCorrect){
			if(err)
				return fail(err);
			
			if(!passCorrect)
				return fail({code: 'ERR_PASS_INCORRECT'});

			delete userObj.saltedpw;
			pass(userObj);
		});
	}
}


usersData.updateUserDetails = function(pass, fail, updatedUserObj, id){
	//Validates the details given
	validateUserDetails(validationPass, fail, updatedUserObj);

	//After validation, creates a salted password
	function validationPass(){
		createSaltedPassword(saltingPass, fail, updatedUserObj.password);
	}

	//Once the hash is created, updated user can be persisted!
	function saltingPass(saltedpw){
		delete updatedUserObj.password;
		updatedUserObj.saltedpw = saltedpw;

		dbutils.updateById(pass, fail, TABLE_NAME, updatedUserObj, id);
	}
}

usersData.updateUserCurrency = function(pass, fail, newCurrency, id){
	validateCurrency(validationPass, fail, newCurrency);

	function validationPass(){
		dbutils.updateById(pass, fail, TABLE_NAME, {"currency": newCurrency}, id);
	}
}

usersData.deleteUser = function(pass, fail, id){
	dbutils.deleteById(pass, fail, TABLE_NAME, id);
}

/*
 * HELPER FUNCTIONS
*/

function validateUserDetails(pass, fail, userObj){
	pass();
}

function validateCurrency(pass, fail, currency){
	pass();
}

function createSaltedPassword(pass, fail, pw){
	bcrypt.genSalt(10, function(err, salt){
		if(err)
			return fail(err);
		
		bcrypt.hash(pw, salt, function(err, saltedpw){
			if(err)
				return fail(err);
			
			pass(saltedpw);
		});
	});
}

module.exports = usersData;