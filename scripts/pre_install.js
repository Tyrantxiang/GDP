"use strict";

/*
 * Pre npm install script to put the application in a usable state
 *
 * Will:
 ** Warn about installation requirements
 */

var os = process.platform,
    fs = require("fs"),
    path = require("path"),
    root = path.resolve(__dirname, "../"),
    configFile = path.join(root, "config.json"),
    config = JSON.parse(fs.readFileSync(configFile));

console.log();
console.log("==================== Preinstall script ====================");
console.log();


/****** Scan for external dependencies ******/
console.log("Scanning for external dependencies");

console.log("Currently automatic detection not avalible");
console.log("Please make sure the following are installed");
console.log("PostgreSQL: http://www.postgresql.org/download/");
console.log("Dependencies for the bcrypt module: https://www.npmjs.com/package/bcrypt#dependencies");
console.log("Cairo for the canvas package: https://www.npmjs.com/package/canvas#installation");

console.log("Will attempt to continue, but running or installing may fail if these are not installed");



console.log();
console.log("===========================================================");
console.log();
