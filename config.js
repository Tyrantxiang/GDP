"use strict";

/* File to store the configoration for all aspects of the system
 * Deals with system properties (port, pg database info, etc)
 * Scans the filesystem for new games and returns the file paths and assets when a game is requested
 */




var fs = require("fs"),
    path = require("path"),

    configFileLocation = __dirname + "/config.json",
    config = JSON.parse(fs.readFileSync(configFileLocation)); // Sync as it is run only once on startup

    // Fill in things for empty config file
    if(!config.app){
        config.app = {};
    }





// General app configs
module.exports.app = {
    getPort : function() {
        if(config.app.port){
            return config.app.port;
        }
        return null;
    },

    getClientVersion : function(){
        return config.app.clientVersion;
    },

    getServerVersion : function(){
        return config.app.serverVersion;
    }
};

//Database settings config
module.exports.database = {
    getDefaultSchema : function(){
        return config.defaultDatabase || "main";
    },

    getSettings : function(databaseName){
        return config.databases[databaseName];
    }
};

module.exports.hub = {
    getBackgroundImages : function(){
        return config.hub.backgroundImages;
    },

    getItemMetaData : function(){
        return config.hub.itemMetaData;
    },

    getItemSlots : function(){
        return Object.keys(config.hub.itemMetaData);
    }
};


/*
 * Function takes a directory and sets up watchers on the config files within the subdirectories
 * Also watches the directory itself for new subdirectories
 */
function configReaderFactory(directory){
    var configFileName = "config.json",
        // Map of a subdirectory to it's watcher
        configWatchers = {},
        // Subdirectories in directory, they don't have to have a config file in to work
        subDirectories = [],
        // The actual configs
        configs = {};



    /* Get the subdirectories in the directory folder
     * They do not have to have valid config files to be returned
     * Cached,'update' will cause the directory to be rescanned
     */
    function getSubDirs(cb, update){
        if(update || subDirectories.length === 0){

            fs.readdir(directory, function(err, list){
                if(err){
                    throw new Error("Count not get subdirs");
                }
                var latch = (function(num, complete){
                    return function(){
                        num--;
                        if(num === 0){
                            complete();
                        }
                    };
                })(list.length, function(){
                    cb(subDirectories);
                });

                subDirectories = [];

                list.forEach(function(f){
                    // Make sure it is a directory
                    var dir = path.join(directory, f);
                    fs.stat(dir, function(err, stat){
                        if(stat.isDirectory()){
                            subDirectories.push(dir);
                            latch();
                        }
                    });
                });
            });

        }else{
            cb(subDirectories);
        }
    }




    /* Takes a particular config dir and loads it into memory */
    function updateConfig(dir){
        // Check if directory still exists
        fs.stat(dir, function(err, stat){
            if(!err && stat.isDirectory()){

                // Recurse into the directory and read the game's config
                fs.readFile(path.join(dir, configFileName), function(err, data){
                    try {
                        data = JSON.parse(data);

                        // Check required elements are present
                        if(data.name && data.id){
                            console.log("          Config read: " + path.join(dir, configFileName));
                            data.directory = dir;
                            configs[data.id] = data;
                        }else{
                            throw new Error("Required settings (ID and name) missing");
                        }
                    }catch(e){
                        // Report error here
                        console.error("          Error reading config: " + path.join(dir, configFileName));
                        console.error("          ", e);
                    }
                });
            }else{
                // Does not exist
                // Find which config had this game in and delete it
                for(config in configs){
                    if(configs[config].directory === dir){
                        delete configs[config];
                        break;
                    }
                }
                // Delete it's watcher
                if(configWatchers[dir]){
                    configWatchers[dir].close();
                }

                // Always delete subdir from the directory list
                delete subDirectories[dir];

                console.log("          Unloaded config: " + path.join(dir, configFileName));
            }
        });
    }




    /* Function runs through the game config directory and loads the configs into memory */
    function updateConfigs(){
        // Reset the configs
        configs = {};
        getSubDirs(function(dirs){
            dirs.forEach(updateConfig);
        }, true);
    }




    /* Updates a watcher on a particular subdirectory */
    function updateWatcher(d){
        var file = path.join(d, configFileName);

        // Close any already active watchers
        if(configWatchers[d]){
            configWatchers[d].close();
            delete configWatchers[d];
        }

        fs.stat(file, function(err, stat){
            if(!err && stat.isFile()){

                console.log("     Watching: " + file);
                var watcher = fs.watch(file, { persistent : false }, function(event, filename){
                    updateConfig(d);
                });

                configWatchers[d] = watcher;
            }else{
                // Fail
                console.log("     Not watching: " + file);
            }
        });
    }



    /* Sets up all the watchers to check if the config files change */
    function updateWatchers(){
        // Close all open watchers
        for(var w in configWatchers){
            configWatchers[w].close();
            delete configWatchers[w];
        }

        getSubDirs(function(dirs){
            dirs.forEach(updateWatcher);
        });
    }



    // Inital watch on games directory (for when new games are placed in)
    fs.watch(directory, { persistent : false }, function(event, filename){
        if(filename){
            filename = path.join(directory, filename);
            updateConfig(filename);
            updateWatcher(filename);
        }else{
            // Filename is not always defined, so just do all if this is the case
            updateConfigs();
            updateWatchers();
        }
    });

    // Inital config update
    updateConfigs();
    // Set up inital watchers
    updateWatchers();







    var rObject = {
        configs : configs,

        // Functions wrapped in their own object
        functions : {
            /* Return if a config file exists, given by ID */
            exists : function(id){
                return !!configs[id];
            },

            /* Return a list of objects representing the avalible games */
            listAll : function(){
                var a = [];
                for(var cfg in configs){
                    a.push(rObject.functions.getConfig(cfg));
                }
                return a;
            },

            /* Get the name of a game from a given ID */
            getName : function(id){
                return configs[id] && configs[id].name;
            },

            /* Get a specific config from the game ID or all configs is 'configName' is falsy */
            getConfig : function(id, configName){
                var cfg = configs[id];
                if(!cfg){
                    return null;
                }
                if(!configName){
                    var n = {};
                    for(var c in cfg){
                        n[c] = cfg[c];
                    }
                    delete n.directory;
                    return n;
                }
                return cfg[configName];
            }
        }
    };

    return rObject;
}





/* Wrapper to contain the code for game config, keeps it seperate from other config
 * Self calling
 */
module.exports.games = (function(){
    console.log("Loading configs for games");
    // Variables
    var gamesRelativeDir = config.app.gamesDir || "games",
        gamesDir = path.join(__dirname, gamesRelativeDir),

        configReader = configReaderFactory(gamesDir),
        gameConfigs = configReader.configs,
        functions = configReader.functions;



    /* Get the URLs of the scripts for the given game */
    functions.getScripts = function(id){
        var scripts = gameConfigs[id].scripts.map(function(s){
            return "/" + gamesRelativeDir + "/" + id + "/" + "scripts" + "/" + s;
        });

        return scripts;
    };

    /* Get the base URL directory that contains the assets for the given game */
    functions.getAssetsBaseURL = function(id){
        return "/" + gamesRelativeDir + "/" + id + "/" + "assets/";
    };

    /* Gets the object that the `run` function will be called on client side to start the game */
    functions.getEntryObject = function(id){
        return gameConfigs[id] && gameConfigs[id].entryObject;
    };


    /* A express route function, that will serve a game's file */
    functions.serveFile = function(req, res){
        var gameId = req.params.game;

        if(gameConfigs[gameId]){
            var fileType = req.params.fileType,
                filename = req.params.filename,
                dir = gameConfigs[gameId].directory,
                p;

            if(fileType === "scripts"){
                p = path.join(dir, "scripts", filename);
            }
            if(fileType === "assets"){
                p = path.join(dir, "assets", filename);
            }

            res.sendFile(p);
        }else{
            res.status(404).send("error, no game with that ID");
        }

    };



    return functions;

})();





module.exports.items = (function(){
    console.log("Loading configs for items");

    var itemsRelativeDir = config.app.itemsDir || "items",
        itemsDir = path.join(__dirname, itemsRelativeDir),
        spritesExt = ".png",
        slots = module.exports.hub.getItemSlots(),
        funcs = {},

        slotFunctions = slots.map(function(slot){
            return configReaderFactory(path.join(itemsDir, slot)).functions;
        });

    // Fill in config reader factory functions
    for(var func in slotFunctions[0]){
        funcs[func] = (function(func){
            return function(){
                var id = arguments[0];
                for(var i = 0; i < slots.length; i++){
                    if(slotFunctions[i].exists(id)){
                        return slotFunctions[i][func].apply(null, arguments);
                    }
                }
                if(func === "exists"){
                    return false;
                }else{
                    return undefined;
                }
            };
        })(func);
    }

    funcs.listItemsForSlot = function(slot){
        var s = slots.indexOf(slot);
        if(s < 0){
            return null;
        }

        return slotFunctions[s].listAll();
    };


    funcs.getSpriteURL = function(id){
        return itemsRelativeDir + "/" + id + "/" + "sprite" + spritesExt;
    };
    funcs.serveFile = function(req, res){
        var itemId = req.params.item,
            filename = req.params.filename;
        if(filename.substr(filename.lastIndexOf(".")) === spritesExt){
            for(var slot in slotFunctions){
                if(slotFunctions[slot].exists(itemId)){
                    var dir = slotFunctions[slot].getConfig(itemId, "directory"),
                        p = path.join(dir, filename);
                    console.log(p);

                    res.sendFile(p);
                    return true;
                }
            }
        }

        res.status(404).send("error, no item with that ID");
        return false;
    };
    funcs.listAll = function(){
        var a = [];
        for(var slot in slotFunctions){
			var tmpArr = slotFunctions[slot].listAll();
            a = a.concat(tmpArr);
        }
        return a;
    };

    return funcs;
})();


module.exports.carriables = (function(){
    console.log("Loading configs for carriables");

    var carriablesRelativeDir = config.app.carriablesDir || "carriables",
        carriablesDir = path.join(__dirname, carriablesRelativeDir),
        carriablesSpritesExt = ".png",


        // Generate the config readers and extract generated functions
        configReader = configReaderFactory(carriablesDir),
        carriableConfigs = configReader.configs,
        functions = configReader.functions;

    // Add the additional carriable functions

    /* Get the full URL of the sprite that represents this carriable */
    functions.getSpriteURL = function(id){
        return carriablesRelativeDir + "/" + id + "/" + "sprite" + carriablesSpritesExt;
    };
    functions.serveFile = function(req, res){
        var carriableId = req.params.carriable,
            filename = req.params.filename;

        if(carriableConfigs[carriableId] && filename.substr(filename.lastIndexOf(".")) === carriablesSpritesExt){
            var dir = carriableConfigs[carriableId].directory,
                p = path.join(dir, filename);

                res.sendFile(p);
        }else{
            res.status(404).send("error, no item with that ID");
        }
    };


    return functions;
})();




/* Wrapper for disease configs
 *
 */
module.exports.conditions = (function(){
    console.log("Loading configs for conditions");

    var conditionsRelativeDir = config.app.conditionsDir || "conditions",
        conditionsDir = path.join(__dirname, conditionsRelativeDir),

        // Generate the config readers and extract generated functions
        configReader = configReaderFactory(conditionsDir),

        functions = configReader.functions;


    return functions;

})();

module.exports.statuses = (function(){
    console.log("Loading configs for statuses");

    var statusesRelativeDir = config.app.statusesDir || "statuses",
        statusesDir = path.join(__dirname, statusesRelativeDir),

        // Generate the config readers and extract generated functions
        configReader = configReaderFactory(statusesDir),

        functions = configReader.functions;


    return functions;

})();
