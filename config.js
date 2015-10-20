"use strict";

/* File to store the configoration for all aspects of the system
 * Deals with system properties (port, pg database info, etc)
 * Scans the filesystem for new games and returns the file paths and assets when a game is requested
 */




var fs = require("fs"),
    path = require("path"),

    configFileLocation = "./config.json",
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









/* Wrapper to contain the code for game config, keeps it seperate from other config
 * Self calling
 */
module.exports.games = (function(){
    // Variables
    var gamesDir = config.app.gamesDir || "games",
        gameConfigsName = "config.json",
        gameConfigsList = [],
        // Map of the directory to it's watcher
        gameConfigWatchers = {},

        // The current game directories
        gameDirectories = [],
        gameConfigs = {};


    /* Get the directories in the gameDirectory folder
     * They do not have to have valid config files to be returned
     * Cached,'update' will cause the directory to be rescanned
     */
    function getGameDirs(cb, update){
        if(update || gameDirectories.length === 0){

            fs.readdir(gamesDir, function(err, list){
                gameDirectories = list.map(function(f){
                    return path.join(gamesDir, f);
                });
                cb(gameDirectories);
            });

        }else{
            cb(gameDirectories);
        }
    }

    function getGameConfigListItemIndex(id){
        for(var i = 0; i < gameConfigsList; i++){
            if(gameConfigsList[i].id === id){
                return i;
            }
        }
    }

    /* Removes an item from gameConfigsList */
    function removeItemFromGameConfigsList(id){
        var index = getGameConfigListItemIndex(id);

        if(index){
            array.splice(index, 1);
        }
    }

    /* Updates an item from gameConfigsList */
    function updateItemFromGameConfigsList(id, name){
        var index = getGameConfigListItemIndex(id);

        if(index){
            gameConfigsList[index].name = name;
        }
    }



    /* Takes a particular game config and loads it into memory */
    function updateGameConfig(dir){
        fs.stat(dir, function(err, stat){
            if(!err && stat.isDirectory()){

                // Recurse into the directory and read the game's config
                fs.readFile(path.join(dir, gameConfigsName), function(err, data){
                    data = JSON.parse(data);

                    // Check required elements are present
                    if(data.name && data.id && data.entryObject){
                        data.directory = dir;
                        gameConfigs[data.id] = data;

                        updateItemFromGameConfigsList(data.id, data.name);
                    }else{
                        // TODO: Maybe throw an error here?
                    }
                });
            }else{
                // Find which config had this game in and delete it
                for(config in gameConfigs){
                    if(gameConfigs[config].directory === dir){
                        delete gameConfigs[config];
                        removeItemFromGameConfigsList(config);
                        break;
                    }
                }
                // Always delete dir from games directory list
                delete gameDirectories[dir];
            }
        });
    }


    /* Function runs through the game config directory and loads the configs into memory */ 
    function updateGameConfigs(){
        gameConfigs = {};
        getGameDirs(function(dirs){
            dirs.forEach(updateGameConfig);
        }, true);
    }


    function updateWatcher(d){
        var file = path.join(d, gameConfigsName);
        fs.stat(file, function(err, stat){
            if(!err && stat.isFile()){

                // Close any already active watchers
                if(gameConfigWatchers[dir]){
                    gameConfigWatchers[dir].close();
                }

                var watcher = fs.watch(file, { persistent : false }, function(event, filename){
                    updateGameConfig(d);
                });

                gameConfigWatchers[dir] = watcher;
            }
        });
    }

    /* Sets up the watchers to check if the config files change */
    function updateWatchers(){
        getGameDirs(function(dirs){
            dirs.forEach(updateWatcher);
        });
    }



    // Inital watch on games directory (for when new games are placed in)
    fs.watch(gamesDir, { persistent : false }, function(event, filename){
        if(filename){
            updateGameConfig(filename);
            updateWatcher(filename);
        }else{
            // Filename is not always definied, so just do all if this is the case
            updateGameConfigs();
            updateWatchers();
        }
    });

    // Inital game config update
    updateGameConfigs();
    // Set up inital watchers
    updateWatchers();



 
    // Return the functions exposed by the module
    return {
        /* Return a list of objects representing the avalible games */
        listAll : function(){
            return gameConfigsList.splice(0);
        },

        exists : function(id){
            return !!gameConfigs[id];
        },

        /* Get the name of a game from a given ID */
        getName : function(id){
            return gameConfigs[id] && gameConfigs[id].name;
        },

        /* Get a specific config from the game ID or all configs is 'configName' is falsy */
        getConfig : function(id, configName){
            if(!gameConfigs[id]){
                return null;
            }
            if(!configName){
                return gameConfigs[id];
            }
            return gameConfigs[id][configName];
        },

        /* Get the URLs of the scripts for the given game */
        getScripts : function(id){
            var scripts = gameConfigs[id].scripts.map(function(s){
                return path.join(gamesDir, dir, "scripts", s);
            });

            return scripts;
        },

        /* Get the base URL directory that contains the assets for the given game */
        getAssetsBaseURL : function(id){
            var dir = gameConfigs[id].directory;
            
            return path.join(gamesDir, dir, "assets");
        },

        /* Gets the object that the `run` function will be called on client side to start the game */
        getEntryObject : function(id){
            return gameConfigs[id] && gameConfigs[id].entryObject;
        },


        /* A express route function, that will serve a game's file */
        serveFile : function(req, res){
            var gameId = req.params.game;

            if(gameConfigs[gameId]){
                var fileType = req.params.fileType,
                    filename = req.params.filename,
                    dir = gameConfigs[gameId].directory,
                    path;

                if(fileType === "scripts"){
                    path = path.join(gamesDir, dir, "scripts", filename);
                }
                if(fileType === "assets"){
                    path = path.join(gamesDir, dir, "assets", filename);
                }

                res.sendFile(path);
            }else{
                res.status(404).send("error, no game with that ID");
            }

        }
    };

})();



function configReaderFactory(directory){

    var configs = {};


    function updateConfig(file){
        fs.readFile(path.join(directory, file), function(err, data){
            if(err){
                // Remove configfrom the list of configs and return
                for(config in configs){
                    if(configs[config].filename === file){
                        delete configs[config];
                        return;
                    }
                }
                return;
            }

            data = JSON.parse(data);

            // Check if required data is there
            if(data.id && data.name){
                data.filename = file;
                configs[data.id] = data;
            }else{
                // Maybs throw/log an error?
            }
        });
    }

    function updateConfigs(){
        fs.readdir(directory, function(err, files){
            files.foreach(function(file){
                fs.stat(path.join(directory, file), function(err, stat){
                    if(!err && stat.isFile()){
                        updateConfig(file);
                    }
                });
            });
        });
    }


    // Add the watcher to the config directory
    fs.watch(directory, { persistent : false }, function(event, filename){
        if(filename){
            updateConfig(filename);
        }else{
            updateConfigs();
        }

    });




    return {
        configs : configs,

        // Functions wrapped in their own object
        functions : {
            listAll : function(){
                return configs.map(function(config){
                    return {
                        id : config.id,
                        name : config.name
                    };
                });
            },

            getName : function(id){
                return configs[id] && itemsConfigs[id].name;
            },

            getConfig : function(id, configName){
                if(!configs[id]){
                    return null;
                }
                if(!configName){
                    return configs[id];
                }
                return configs[id][configName];
            }

        }
    };



}




/* Wrapper for item configs
 *
 */
module.exports.items = (function(){
    var itemsDir = config.app.itemsDir || "items",
        itemsConfigDir = path.join(itemsDir, config.app.itemsConfigDir || "configs"),
        itemsSpritesDir = path.join(itemsDir, config.app.itemsSpritesDir || "sprites"),

        itemsSpritesExt = ".png",


        // Generate the config readers and extract generated functions
        configReader = configReaderFactory(itemsConfigDir),

        functions = configReader.functions;


    // Add the additional item functions

    /* Get the full URL of the sprite that represents this item */
    functions.getSpriteURL = function(id){
        return path.join(itemsSpritesDir, id + itemsSpritesExt);
    }
    functions.serveFile = function(req, res){};


    return functions;

})();



/* Wrapper for disease configs
 *
 */
module.exports.diseases = (function(){

    var diseasesConfigDir = config.app.diseasesConfigDir || "diseases",

        // Generate the config readers and extract generated functions
        configReader = configReaderFactory(diseasesConfigDir),

        functions = configReader.functions;


    return functions;

})();


