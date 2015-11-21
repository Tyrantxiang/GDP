'use strict';

/*
 * test.js
 * 
 * Scrap file used for testing
 *
 * @authors Joe Ringham
*/
/*
var config = require('../config.js')
	, db = require('./database.js').init(function(){console.log("PASS\n********************");},
											tfail, config.database.getSettings("test"));
	;
*/

var validateDetails = require("../validateDetails.js")
	;	

function tpass(results){
	console.log("PASS");
	console.log(results);
	console.log("*************************");
}

function tfail(err){
	console.log("FAIL");
	console.log(err);
	console.log("*************************");
}


var ts = new Date().toISOString();

var dummyUser = {
	username : 'user1'
	, password : 'pass1'
	, dob : ts
}

var dummyUser2 = {
	username : 'user2'
	, password : 'pass2'
	, dob : ts
}

//db.createUser(tpass, tfail, dummyUser);

//db.createUser(tpass, tfail, dummyUser2);

var ts = new Date()
	, ts1 = new Date()
	, ts2 = new Date();

ts1.setHours(ts1.getHours() - 1);
ts2.setHours(ts2.getHours() - 2);

var dummyPlay = {
	user_id : 1
	, game_id : 'game2' 
	, start_time : ts2
	, end_time : ts1
	, score : 5
}

//db.createPlay(tpass, tfail, dummyPlay);


var tsA = new Date()
	, tsB = new Date()
	, tsC = new Date();


tsB.setHours(tsB.getHours() - 3);
tsC.setHours(tsC.getHours() - 1);

var filters = {
	//user_id : 1,
	//username : 'user2',
	//game_id : "game1",
	time_range : {
		start : tsB, 
		end : tsC,
	}
};

var order = {column: 'id', direction: 'DESC'};

//db.getScores(tpass, tfail, filters, order, null);

//require('./creation_things/buildDB.js')(tpass, tfail, 'test');

var tsN = new Date(Date.now() + (1000 * 40))
	, tsM = new Date(Date.now() + (1000 * 30));

console.log(tsN);
console.log(tsM);

validateDetails(tpass, tfail, {start_time: tsN, end_time: tsM});