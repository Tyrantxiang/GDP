"use strict";

/*
 * Generates the documentation for the project
 *
 *
 */

var cp = require("child_process"),
	fs = require("fs"),
	path = require("path"),
	root = path.resolve(__dirname, "../"),
	
	isWindows = process.platform === "win32",
	jsdocName = isWindows ? "jsdoc.cmd" : "jsdoc",

	npm_bin = cp.execSync("npm bin").toString().trim(),
	npm_bin_global = cp.execSync("npm bin -g").toString().trim(),

	jsdoc = findFile(jsdocName, [npm_bin_global, npm_bin]);

// Function finds the location of a file from a given list and returns it
function findFile(fileName, locations){
	// Search each location
	for(var i = 0; i < locations.length; i++){
		try{
			var f = path.join(locations[i], fileName),
				stats = fs.statSync(f);
			if(stats && stats.isFile()){
				return f;
			}
		}catch(e){}
	}

	return null;
}

function rootPath(p){
	return path.resolve(root, p);
}

// The functions that call create the documentation
var processers = {
	all : function(){
		var a;
		for(a in processers){
			if(a !== "all"){
				console.log("    Doc: " + a);
				processers[a]();
			}
		}
	},


	jsdoc_server : function(){
		var options = [
			"-r",
			"-d",
			rootPath("docs/server/jsdoc"),
			"-t",
			rootPath("node_modules/ink-docstrap/template"),
			rootPath("app.js"),
			rootPath("src")
		];


		// Exec
		cp.execFileSync(
			jsdoc,
			options
		);
	}



}

processers.all();