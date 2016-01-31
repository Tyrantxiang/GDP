'use strict';

/*
 * test.js
 * 
 * Scrap file used for testing
 *
 * @authors Joe Ringham
*/

var config = require('../config.js')
	, db = require('./database.js').init(function(){console.log("PASS\n********************");},
											tfail, config.database.getSettings("main"));
	;


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

db.getEquippedForUser(tpass, tfail, 1);