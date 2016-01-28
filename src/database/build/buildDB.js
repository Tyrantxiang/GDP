'use strict';

/*
 * buildDB.js
 * 
 * Runs the build script on the database
 *
 * @authors Joe Ringham
*/


var isWindows = process.platform === "win32",
	fs = require("fs"),
	path = require("path"),

	config = require('../../config.js'),
	db = require('../database.js');



module.exports = function build(pass, fail, databaseName){
	var settings;



	function createBuildScript(){
		fs.readFile(path.join(__dirname, '/schema.sql'), function(err, data){
			if(err) { return fail(err); }

			var buildScript = data.toString().replace(/{schema}/g, settings.schema);

			fs.writeFile(path.join(__dirname, '/build.sql'), buildScript, function(err, data){
				if(err) { return fail(err) };

				runBuildScript();
			});

		});
	}

	function runBuildScript(){
		var exp = (isWindows) ? "set" : "export";

		var command = [
			  exp + " PGPASSWORD="+settings.password
			, 'psql -q -h ' + settings.hostname + ' -U ' + settings.username + ' -d ' + settings.database + ' -c "\\i ' + path.join(__dirname, '/build.sql') + '"'
			, exp + " PGPASSWORD=foo" //resets password to something unrecognisable
		].join("; ");

		var exec = require('child_process').exec;
		exec(command, function(error, stdout, stderr){
			if (error !== null) {
				fail(error);
			} else if(stderr.indexOf("FATAL") > -1){
				fail(stderr);
			} else {
				pass({
					stdout: stdout
					, stderr: stderr
				});
			}
		});
	}




	if(!databaseName){
		return fail("******* YOU NEED TO PROVIDE DATABASE NAME ***********");
	} else {
		settings = config.database.getSettings(databaseName);

		db.init(createBuildScript, fail, settings);


	}
};

module.exports(console.log, console.error, process.argv[2]);
