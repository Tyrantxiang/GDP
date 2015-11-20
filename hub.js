"use strict";

/* File to handle the buiness logic of the server side application
 * Each session has a hub object that deals with it's interaction with the application
 * and acts as a proxy for loading the minigames
 */

var config;
function setConfig(cfg){
    if(!cfg && typeof cfg !== Object){
        throw new Error("Config object not defined");
    }
    config = cfg;
}
function getConfig(){
    return config;
}

var db;
function setDatabase(database){
    if(!database){
        throw new Error("Database object not defined");
    }
    db = database;
}
function getDatabase(){
    return db;
}


function generateSessionId(gameId){
    return Math.floor(Math.random() * 10000);
}


var locations = {
    IN_HUB : 0,
    IN_MINIGAME : 1
};

function Hub(userId, comms){
    if(!userId || !comms){
        throw new Error("UserId and comms must be defined");
    }

    this.userId = userId;
    this.user = null;

    this.bag = new Bag();

    // Where the player currently resides, always starts in the hub
    this.currentlocation = locations.IN_HUB;

    // The minigame ID that the player is currently in
    this.gameId = null;
    // The ID for the current game session, generated randomly
    this.gameSessionId = null;

    // The time the player started the current game
    this.gameStartTime = null;

    // Time they logged on (this object was created)
    this.connectedTime = new Date();

    this.statuses = {};
    this.health = 100;
    
    // Get the user data from the db
    db.createSession(function(){},
                        function(){},
                            {userId: userId, start_time: this.connectedTime.toISOString()}
                    );
                    
    //load the users statuses here
    db.getConditionsForUser(function(results){
                for(var i=0; i<results.length; i++){
                    //loop over all statuses and start
                    var statuses = config.conditions.getConfig(results[i]).statuses;
                    for(var j=0; j<statuses.length; j++){
                        var currentStatus = config.statuses.getConfig(statuses[j]);
                        this.statues[currentStatus.id] = new Status(currentStatus);
                    }
                }
            }, function(){
                
            },
            this.userId);

	this.imgMaker = require("./imageCompositer")(300);

};
// Set the locations as "class constants"
Hub.locations = locations;


Hub.prototype.exit = function(){
    // Cleanup code when a client disconnects

    // Save session data in db
    var disconnectTime = new Date();

    db.endSession(function(){}, function(){}, disconnectTime.toISOString(), this.userId);
};

// Define functions here
Hub.prototype.eventListeners = {
    //options are unused, here for completions sake. Can be implemented in future for
    //options such as colour blindness etc.
    //UNUSED
    get_options : function(data, fn){
        fn({});
    },
    //UNUSED
    set_options : function(data, fn){
        fn({});
    },

    get_all_item_info : function(data, fn){
        fn(config.items.listAll());
    },

    get_single_item_info : function(data, fn){
        fn(config.items.getConfig(data.id, undefined));
    },
    
    get_hub_backgroud_image : function(data, fn){
        fn(config.hub.getBackgroundImages());
    },

    get_user_unlocked_items : function(data, fn){
        db.getInventoryForUser(
            function(results){
                fn(results);
            }, function(err){
                fn({err: err});
            },
            this.userId
        );
    },

    get_user_equipped_items : function(data, fn){
        db.getEquippedForUser(
            function(results){
                // Get the meta data for the items
                var itemMetaData = config.hub.getItemMetaData(),
                    sendBack = {},
                    slot;
                for(slot in itemMetaData){
                    let md = itemMetaData[slot],
                        itemConfig = config.items.getConfig(results[slot] || md.default),
                        url = config.items.getSpriteURL(itemConfig.id);

                    sendBack[slot] = {
                        id : itemConfig.id,
                        name : itemConfig.name,
                        description : itemConfig.description,
                        price : itemConfig.price,

                        left: md.left,
                        top: md.top,
                        scale: md.scale,
                        select_scale: md.select_scale,

                        slot : slot,
                        url : url
                    };
                }

                fn(sendBack);
            },
            function(){
                fn({err: "Error in db"});
            },
            this.user_id
        );
		
		
    },

    update_equipped_items : function(data, fn){
        var invObj = {
            user_id : this.userId,
            head: data.head,
            eyes: data.eyes,
            skin: data.skin,
            shirt: data.shirt
        };
        
        db.createEqippedItems(
            function(results){
				this.eventListeners.modify_hp_value(0, fn);
            }, function(){
                fn({err: "Error in db"});
            },
            invObj
        );
    },

    get_bag : function(data, fn){
		if(this.bag === undefined){
			this.bag = new Bag();
		}
		var bagret = this.bag.getCarriables();
        fn( {carriables: bagret} );
    },

    set_bag : function(data, fn){
        this.bag.setCarriables(data.carriables);

        fn();
    },

	get_all_carriables : function(data, fn){
		fn(config.carriables.listAll().map(function(l){
            l.url = config.items.getSpriteURL(l.id);
        }));
	},

	get_single_carriable : function(data, fn){
		fn(config.carriables.getConfig(data.id));
	},
    
    use_carriable : function(data, fn){
        var carriable_id = data.carriable_id,
            carriableCfg = config.carriables.getConfig(carriable_id);
        
        for(obj in carriableCfg.effects){
            if(obj.id === "hp"){
                this.eventListeners.modify_hp_value({value: obj.amount}, fn);
            }else{
                this.eventListeners.modify_status_value({"status": obj.id, value: obj.amount});
            }
        }
        
        //TODO: remove the carriable frm bag
    },

    list_minigames : function(data, fn){
        fn(config.games.listAll());
    },

    launch_minigame : function(data, fn){
        // Get all of the items required for the game and send them to the client
        var id = data.gameId;

        if(config.games.exists(id)){
            var name = config.games.getName(id),
                assetBaseURL = config.games.getAssetsBaseURL(id),
                scriptURLs = config.games.getScripts(id),
                entryObject = config.games.getEntryObject(id),
                version = config.games.getConfig(id, "version"),

                sessionId = generateSessionId(id);


            // Set the game we are in
            this.currentlocation = Hub.locations.IN_MINIGAME;
            this.gameId = id;
            this.gameSessionId = sessionId;
            this.gameStartTime = new Date();

            fn({
                gameId : id,
                name : name,
                assetBaseURL : assetBaseURL,
                scriptURLs : scriptURLs,
                entryObject : entryObject,
                version : version,
                sessionId : sessionId
            });
        }else{
            fn({
                err : "No game with that ID"
            });
        }
    },

    finish_minigame : function(data, fn){
        var id = data.gameId,
            score = data.score;

        if(id === this.gameId){
            var playObj = { user_id: this.userId,
                            game_id: id,
                            start_time: this.gameStartTime.toISOString(),
                            end_time: (new Date()).toISOString(),
                            score: score
                        };

            this.currentlocation = Hub.locations.IN_HUB;
            this.gameId = undefined;
            this.gameSessionId = undefined;
            this.gameStartTime = undefined;

            //update the users currency
            db.readUserById(function(result){
                                db.updateUserCurrency(function(){}, function(){}, result.currency+data.currency, this.user_id);
                            },
                            function(err){
                                fn( {err: "Error reading user ID or "} );
                            },
                            this.user_id
            );

            // Save score in database
            db.createPlay(  function(){ fn(); },
                            function(){ fn({err: "An error occured"}); },
                            playObj
                        );
        }else{
            fn({
                err : "Game ID supplied does not match the server's"
            });
        }
    },

    get_scores : function(data, fn){
        var numOfScores = 100;

        var filterConds = {};

        if(data.option_num === 0){
            //get top 100 overall scores
            filterConds = {};
        }else if(data.option_num === 1){
            //filtering on user for all games
            filterConds = {game_id: data.game_id};
        }else if(data.option_num === 2){
            filterConds = {user_id: data.user_id};
        }else if(data.option_num === 3){
            filterConds = {user_id: data.user_id, game_id: data.game_id}
        }else{
            fn({err: "Invalid score option selected"});
        }

        db.getScores(   function(results){
                            fn({data: results});
                        },
                        function(err){ fn({err: "Error accessing database entries" }); },
                        filterConds,
                        {column: "score", direction: "DESC"},
                        numOfScores
                    );
    },

    modify_hp_value : function(data, fn){
        var value = data.value;
        for(stat in this.statuses){
            value *= stat.getMultiplier();
        }
        this.health += value;
        
		//var base_image = getBaseImage();
		var urls = [];
		
        if(this.health < 30){
			urls.push(""); //getHealthyImage();
        }else{
			urls.push(""); //getUnhealthyImage();
        }
		
		var imgs = this.eventListeners.get_user_equipped_items(
			{},
			function(data){
				var main = 0;
				for(var i=0; i<data.length; i++){
					var obj = data[key];
					if(obj.slot==="SKIN") main = i;
					urls.push(obj.url);
				}
				var tmp = urls[0];
				urls[0]	= urls[i];
				urls[i] = tmp;
			}
		);
        
		var base64string = this.imgMaker(urls);
        fn({img: base64string});
    },
    
    modify_status_value : function(data, fn){
        var arr = config.statuses.listAll();
        for(cfg in arr){
            if(cfg.name === data["status"]){
                this.statuses[cfg.id].addToValue(data.value);
            }
        }
        
        fn({});
    }
};



/* Class representing a 'bag', that is the carriables the player currently holds */
function Bag(){
    // Modelled as an array of carriables contained in the bag
    var carriables = [];

    this.getCarriables = function(){
        return this.carriables;
    }

    this.setCarriables = function(carriablesArray){
        if(Array.isArray(carriablesArray)) this.carriables = carriablesArray;
    }
}

function Status(configObj){
    var id = configObj.id;
    var name = configObj.name;
    var value = parseInt((configObj.healthy_min + configObj.healthy_max) / 2, 10);
    var healthy_min = configObj.healthy_min;
    var healthy_max = configObj.healthy_max;
    var min = configObj.min;
    var max = configObj.max;
    
    function setValue(newValue){
        this.value = newValue;
    }
    
    //the addValue may be negative, allow subtraction
    function addToValue(addValue){
        this.value += addValue;
        if(this.value<this.min){
            this.value = this.min;
        }else if(this.value>this.max){
            this.value = this.max;
        }
        
        if(this.value < this.healthy_min){
            //do unhealty avatar stuff
        }else if(this.value > this.healthy_max){
            //do unhealthy stuff
        }
    }
    
    function getMultiplier(){
        var multiplier = 1;
        
        if(this.value<this.healthy_min){
            var difference = this.healthy_min-this.value;
            multiplier *= (difference / this.heathy_min);
        }else if(this.value>this.healthy_max){
            var difference = this.value-this.healthy_max;
            mutiplier *= (difference / this.healthy_max);
        }
        
        return multiplier;
    }
}

module.exports = function (cfg, db){
    setConfig(cfg);
    setDatabase(db);

    return {
        setConfig : setConfig,
        getConfig : getConfig,
        setDatabase : setDatabase,
        getDatabase : getDatabase,

        // Creates a new hub object and assigns the event listeners to the given comms object
        create : function (userId, comms){
            var h = new Hub(userId, comms);

            // Set up the hub event listeners for the comms module
            comms.setEventListeners(h.eventListeners);

            return h;
        }
    };
};