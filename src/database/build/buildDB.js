'use strict';

/*
 * buildDB.js
 * 
 * Runs the build script on the database
 *
 * @authors Joe Ringham
*/

var config = require('../../config.js'),
	db = require('../model.js')(true);