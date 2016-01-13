"use strict";

/*
 * Post npm install script to put the application in a usable state
 *
 * Will:
 ** Create directories for the configs if they are not present
 ** (Set up the database tables)
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

/**** Create directories (config.js will throw errors if these do not exist) ****/
var cDirectories = {
        games : config.app.gamesDir,
        items : config.app.itemsDir,
        carriables : config.app.carriablesDir,
        conditions : config.app.conditionsDir,
        statuses : config.app.statusesDir
    },
    createDirIfNotExist = function(dir){
        try{
            dir = path.join(root, dir);
            console.log(dir);
            var stats = fs.statSync(dir);

            if(!stats.isDirectory()){
                console.error("Attempted to create directory: " + dir + ". But it already exists and is not a directory");
                console.error("Please delete the file or update config.json to a different location");
                process.exit(1);
            }
        }catch(e){
            // Error, try creating
            console.log("     " + dir);
            fs.mkdirSync(dir);
        }
    };

console.log("Create required directories...");

// Config directories
for(var d in cDirectories){
    // Take the key as the default
    createDirIfNotExist(cDirectories[d] || d);
}

// Create a directory for each item slot
var slots = Object.keys(config.hub.itemMetaData),
    itemDir = cDirectories.items || "items";

slots.forEach(function(slot){
    createDirIfNotExist(path.join(itemDir, slot));
});


/********* Set up database tables ***********/















console.log();
console.log("===========================================================");
console.log();


