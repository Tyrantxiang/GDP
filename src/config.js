"use strict";

/**
 * Module that stores the configuration for all aspects of the system
 * Deals with system properties (port, pg database info, etc)
 * Scans the filesystem for new games and returns the file paths and assets when a game is requested
 *
 * @module config
 */




var fs = require("fs"),
    path = require("path"),

    rootLocation = path.join(__dirname,  "../"),
    configFileLocation = path.join(rootLocation, "/config.json"),
    config = JSON.parse(fs.readFileSync(configFileLocation)); // Sync as it is run only once on startup

    // Fill in things for empty config file
    if(!config.app){
        config.app = {};
    }



var exporter = {};


/**
 * Contains functions to get configuration for the application as a whole
 *
 * @namespace app
 * @memberof module:config
 */
exporter.app = {
    /**
     * Gets the port to bind the web server to
     * 
     * @memberof module:config.app
     * @return {int|null} - The port number, or null if it is not specified in config.json
     */
    getPort : function() {
        if(config.app.port){
            return config.app.port;
        }
        return null;
    },

    /**
     * Gets the version of the client currently stored on the server
     *
     * @memberof module:config.app
     * @return {int|undefined} - The version number of the client, or undefined if it is not specified in config.json
     */
    getClientVersion : function(){
        return config.app.clientVersion;
    },

    /**
     * Gets the version of the client currently stored on the server
     *
     * @memberof module:config.app
     * @return {int|undefined} - The version number of the client, or undefined if it is not specified in config.json
     */
    getServerVersion : function(){
        return config.app.serverVersion;
    },

    /**
     * Gets the location of the application root (the location of app.js and config.json)
     *
     * @memberof module:config.app
     * @return {string} The directory of the app root
     */
     getRootDirectory : function(){
        return rootLocation;
     }
};


/**
 * Contains functions to get configuration for accessing and using the database
 *
 * @namespace database
 * @memberof module:config
 */
exporter.database = {
    /**
     * Gets the default schema to use for the application
     *
     * @memberof module:config.database
     * @return {string} - The name of the default database schema or "main" if not specified
     */
    getDefaultSchema : function(){
        return config.defaultDatabase || "main";
    },

    /**
     * Gets the settings for a given database including username, password, schema etc
     *
     * @memberof module:config.database
     * @param {string} databaseName - The name of the database to get settings for
     * @return {Object} - The settings for the given database
     */
    getSettings : function(databaseName){
        return config.databases[databaseName];
    }
};


/**
 * Contains functions to get configuration for accessing and using the database
 *
 * @namespace hub
 * @memberof module:config
 */
exporter.hub = {
    /**
     * Gets the background image for the hub
     *
     * @memberof module:config.hub
     * @return {Object} config     - Config for the background image
     * @return {string} config.url - The url of the image
     */
    getBackgroundImages : function(){
        return config.hub.backgroundImages;
    },

    /**
     * Gets the metadata on an item slot
     *
     * @memberof module:config.hub
     * @return {Object<string, {
                    default: int, left: int, top: int, scale: int, select_scale: int
                }>} - Config for the background image
     */
    getItemMetaData : function(){
        return config.hub.itemMetaData;
    },

    /**
     * Gets the all the currently configured items slots
     *
     * @memberof module:config.hub
     * @return {string[]} - Config for the background image
     */
    getItemSlots : function(){
        return Object.keys(config.hub.itemMetaData);
    }
};


/**
 * Function takes a directory and sets up watchers on the config files within the subdirectories
 * Also watches the directory itself for new subdirectories
 *
 * @param {string} directory - The directory to set a config reader up for
 * @return {module:config~configReader} - The config reader object using the given directory
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






    /**
     * The configs objects and generic functions for a config directory
     *
     * @typedef {Object} configReader
     *
     * @property {Object}                              configs   - A map of the config objects for this directory
     * @property {module:config~configReaderFunctions} functions - The generic functions generated for this directory
     */
    var rObject = {
        configs : configs,


        /** 
         * Config reader generic functions
         * 
         * @mixin configReaderFunctions
         */
        functions : {
            /**
             * Return if a config file exists for the given ID
             *
             * @memberof module:config~configReaderFunctions
             * @param {int} id - The config ID
             * @return {boolean} - True if the config file exists, false if not
             */
            exists : function(id){
                return !!configs[id];
            },

            /**
             * Return an array of objects representing all the config files
             *
             * @memberof module:config~configReaderFunctions
             * @return {Object[]} - Array of objects each representing a config file
             */
            listAll : function(){
                var a = [];
                for(var cfg in configs){
                    a.push(rObject.functions.getConfig(cfg));
                }
                return a;
            },

            /**
             * Gets the name of the config for the given ID
             *
             * @memberof module:config~configReaderFunctions
             * @param {int} id - The config ID
             * @return {string} - The config's name
             */
            getName : function(id){
                return configs[id] && configs[id].name;
            },

            /**
             * Get a specific config from the game ID or all configs is 'configName' is falsy
             * 
             * @memberof module:config~configReaderFunctions
             * @param {int} id - The config ID
             * @param {string} [configName] - The config value requested
             * @return {Object} - The request config value or the entire config file as an object
             */
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





/** Wrapper to contain the code for game config, keeps it seperate from other config
 * Self calling
 *
 * @namespace games
 * @memberof module:config
 * @mixes module:config~configReaderFunctions
 */
exporter.games = (function(){
    console.log("Loading configs for games");
    // Variables
    var gamesRelativeDir = config.app.gamesDir || "games",
        gamesDir = path.join(rootLocation, gamesRelativeDir),

        configReader = configReaderFactory(gamesDir),
        gameConfigs = configReader.configs,
        functions = configReader.functions;



    /** Get the URLs of the scripts for the given game 
    @function getScripts
    @memberof module:config.games */
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





exporter.items = (function(){
    console.log("Loading configs for items");

    var itemsRelativeDir = config.app.itemsDir || "items",
        itemsDir = path.join(rootLocation, itemsRelativeDir),
        spritesExt = ".png",
   
        slots = exporter.hub.getItemSlots(),
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


exporter.carriables = (function(){
    console.log("Loading configs for carriables");

    var carriablesRelativeDir = config.app.carriablesDir || "carriables",
        carriablesDir = path.join(rootLocation, carriablesRelativeDir),
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
exporter.conditions = (function(){
    console.log("Loading configs for conditions");

    var conditionsRelativeDir = config.app.conditionsDir || "conditions",
        conditionsDir = path.join(rootLocation, conditionsRelativeDir),

        // Generate the config readers and extract generated functions
        configReader = configReaderFactory(conditionsDir),

        functions = configReader.functions;


    return functions;

})();

exporter.statuses = (function(){
    console.log("Loading configs for statuses");

    var statusesRelativeDir = config.app.statusesDir || "statuses",
        statusesDir = path.join(rootLocation, statusesRelativeDir),

        // Generate the config readers and extract generated functions
        configReader = configReaderFactory(statusesDir),

        functions = configReader.functions;


    return functions;

})();



module.exports = exporter;
