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
	;

//Creates an entry on the user table
// Includes validation of details and password salting
usersDB.createUser = function(userObj) {		
	return createSaltedPassword(userObj.password).then(function queryExecution(saltedpw){
		delete userObj.password;
		userObj.saltedpw = saltedpw;
		
		return Users.create(userObj);
	});
}

//Reads a user entry given an id
usersDB.readUserById = function(id){
	return Users.findOne({
		where : {
			'id' : id
		}, attributes : {
			exclude : ['saltedpw']
		}
	});
}

//Reads a user entry given a username
usersDB.readUserByName = function(username){		
	return Users.findOne({
		where : {
			'username' : username
		}, attributes : {
			exclude : ['saltedpw']
		}
	});
}

//Authenticates a user given a username and password
// Verifies the password is correct against the stored saltedpassword
usersDB.authenticateUser = function(username, givenpw){
	return Users.findOne({
		where : {
			'username' : username
		}
	}).bind({}).then(function(userObj){
		if(!userObj)
			throw Error("User does not exist");
		
		this.id = userObj.id;
		
		return bcrypt.compareAsync(givenpw, userObj.saltedpw);
	}).then(function(passCorrect){		
		if(!passCorrect)
			throw new Error('Password is incorrect for user '+username.toString());
		
		return Promise.resolve(this);
	});
}

// This will always succed, as a "fail" is it not existing, which actually means it doesn't exist
usersDB.checkUsernameExists = function(username){
	return Users.count({
		where : {
			'username' : username
		}
	}).then(function(count){
		return Promise.resolve(!!count);
	});
}

//Updates all user details provided in the updatedUserObj
usersDB.updateUserDetails = function(updatedUserObj, id){	
	if(updatedUserObj){
		return createSaltedPassword(updatedUserObj.password).then(function(saltedpw){
			delete updatedUserObj.password;
			updatedUserObj.saltedpw = saltedpw;
			
			return Users.update(updatedUserObj, { where : { 'id' : id } });
		});
	}else{
		return Users.update(updatedUserObj, { where : { 'id' : id } });
	}
}

//Updates only currency for a user entry
usersDB.updateUserCurrency = function(newCurrency, id){
	return Users.update({
		'currency': newCurrency
	}, {
		where : {
			'id' : id
		}
	});
}

//Deletes a user entry given an id
usersDB.deleteUser = function(id){
	return Users.destroy({
		where : {
			'id' : id
		}
	});
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