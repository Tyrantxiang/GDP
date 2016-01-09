"use strict";

/**
 * Module to handle the buiness logic of the server side application
 * Each session has a hub object that deals with it's interaction with the application
 * and acts as a proxy for loading the minigames
 *
 * @module server/hub
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

function latch(num, complete){
    if(num < 1){
        complete();
    }

    return function(){
        if(!--num){
            complete();
        }
    };
}




/** 
 * Represents a user's session while in the Hub.
 *
 * This is the central object, containing all
 * the server side implementations of socket endpoints.
 * Also keeps track of the session variables, such as
 * health, status values and bag contents.
 * They are created by client comms when a socket opens
 * 
 * @constructor
 * @param {int} userId  - The ID for the user this hub is associated with (see {@link Hub#userId})
 * @param {Comms} comms - The {@link Comms} object that created the Hub
 */
function Hub(userId, comms){
    if(!userId || !comms){
        throw new Error("UserId and comms must be defined");
    }

    /** The ID for the user this hub is associated with */
    this.userId = userId;
    /** Further information about the user. Currently unused */
    this.user = null;

    /** The user's bag
     @type {Bag} */
    this.bag = new Bag();

    /** Where the player currently resides, always starts in the hub
     @type {Hub.locations} */
    this.currentlocation = Hub.locations.IN_HUB;

    /** The minigame ID that the player is currently in */
    this.gameId = null;
    /** The ID for the current game session, generated randomly */
    this.gameSessionId = null;

    /** The time the player started the current game
      @type {Date} */
    this.gameStartTime = null;

    /** Time they logged on (this object was created)
     @type {Date} */
    this.connectedTime = new Date();

    /** The statuses of a user
     @type Object.<int, Status> */
    this.statuses = {};
    /** The user's current health */
    this.health = 100;
	
	this.avatarImage = undefined;

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

    /** A function that generates images for given parts */
    this.imgMaker = require("./imageCompositer")(300);
}

/**
 * Enum representing the location of the user in a hub
 * @readonly
 * @enum {int}
 */
Hub.locations = {
    IN_HUB : 0,
    IN_MINIGAME : 1
};

/**
 * Cleans up the Hub object and stores session information
 * in the database
 * Called when the client disconnects
 */
Hub.prototype.exit = function(){
    // Save session data in db
    var disconnectTime = new Date();

    db.endSession(function(){}, function(){}, disconnectTime.toISOString(), this.userId);
};

/**
 * Generates and returns symtoms from a given health value
 *
 * @param {int} health  - The health value to generate symtoms
 * @param {function} cb - Callback with the array of symtoms the user has
 */
Hub.prototype.generateSymptoms = function(health, cb){
    var words = {
        60 : "tired",
        40 : "cold",
        20 : "nauseated"
    };
    var retValue = [];
    
    for(var i in words){
        if(health < i) 
            retValue.push(words[i]);
    }
    
    cb(retValue);
};

/**
 * Function to determine whether a new avatar image needs to be generated
 * (There has been a change in how the avatar looks)
 *
 * @param {int} oldHealth - The health of the user before the request
 * @param {int} newHealth - The health of the user after the request
 * @param {function} cb   - Callback with it's first parameter as whether a new avatar image is needed
 */
Hub.prototype.newAvatarImageNeeded = function(oldHealth, newHealth, cb){
    var h = this;
    h.generateSymptoms(oldHealth, function(oldSymps){
        h.generateSymptoms(newHealth, function(newSymps){

            if(oldSymps.length !== newSymps.length){
                cb(true);
            } else {
                cb(false);
            }

        });
    });
};

/**
 * Generates an avatar image using the user's equipt items and status.
 * Updates Hub#avatarImage with the new image as well as returning it
 *
 * @param {function} cb - Called when the image has been generated
 */
Hub.prototype.generateAvatarImage = function(cb){
    var urls = [],
        h = this;
		
	var order = ["skin", "eyes", "shirt", "head"];

    // Equipped items could possibly be saved locally?
    this.get_user_equipped_items(
        {},
        function(data){
			var trousers = __dirname + "/avatar_items/trousers_blue.png";
			var healthImg = __dirname + "/avatar_items/health_healthy.png";
			var mouth = __dirname + "/avatar_items/mouth_smile.png";
			var eyes = undefined;
			
			if(h.health < 60){
				delete data.eyes;
				eyes = __dirname + "/avatar_items/eyes_tired.png";
				mouth = __dirname + "/avatar_items/mouth_sad.png";
			}
			if(h.health < 40){
				healthImg = __dirname + "/avatar_items/health_cold.png";
				mouth = __dirname + "/avatar_items/mouth_cold.png";
			}
			if(h.health < 20){
				healthImg = __dirname + "/avatar_items/health_nauseated.png";
				mouth = __dirname + "/avatar_items/mouth_nauseated.png";
			}

			for(var i in order){
				if(data[order[i]]){
					var direc = config.items.getConfig(data[order[i]].id, "directory");
					direc += "/sprite.png";
					urls.push(direc);
				}
			}
			
			urls.splice(1, 0, mouth);
			urls.splice(1, 0, trousers);
			if(eyes) urls.splice(1, 0, eyes);
			urls.splice(1, 0, healthImg);
			
            h.avatarImage = h.imgMaker(urls);
            cb(h.avatarImage);
        });
};



/*
 * Functions exposed to the server via the related {@link module:server/comms~Comms|Comms} instance.
 * This are added to the prototype of {@link Hub} so all the this values for all functions
 * are the instance of hub
 *
 *  @mixin commsEventListeners
 */
var commsEventListeners = {
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
    /* This is a function
    * @function
    * @memberOf module:server/hub~Hub.prototype
    * @param {int} - An int
    * @this Hub
    */
    get_all_item_info : function(data, fn){
        fn(config.items.listAll());
    },

    get_single_item_info : function(data, fn){
		var obj = config.items.getConfig(data.id, undefined);
		if(obj){
			obj.url = config.items.getSpriteURL(data.id);
		}else{
			obj = undefined;
		}
		
        fn(obj);
    },

    get_items_for_slot : function(data, fn){
        var slot = config.items.listItemsForSlot(data.slot);
        if(!slot){
            fn({
                err : "No such slot",
                slot : data.slot
            });
            return;
        }

        fn(slot.map(function(i){
            i.url = config.items.getSpriteURL(i.id);
            return i;
        }));
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

    get_user_unlocked_items_by_slot : function(data, fn){
        var h = this;
        h.get_user_unlocked_items(null, function(unlocked_items){
            h.get_items_for_slot({ slot : data.slot }, function(slot_items){
                if(slot_items.err){
                    fn(slot_items);
                    return;
                }

                var uSlotItems = slot_items.filter(function(i){
                    if(i.price == 0){
                        return true;
                    }
                    var index = unlocked_items.indexOf(i.id.toString());
                    return index >= 0;
                });

                fn(uSlotItems);
            });
        });
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
            function(err){
				console.log(err);
                fn(err);
            },
            this.userId
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

		var t = this;
		
        db.createUserEquipped(
            function(results){
                t.generateAvatarImage(function(){
                    fn({ avatarImage : t.avatarImage });
                });
            }, function(err){
                fn({err: err});
            },
            invObj
        );
    },

    get_bag : function(data, fn){
        fn(this.bag.getCarriables());
    },

    set_bag : function(data, fn){
        this.bag.setCarriables(data.carriables);

        fn();
    },

    get_all_carriables : function(data, fn){
        fn(config.carriables.listAll().map(function(l){
            l.url = config.carriables.getSpriteURL(l.id);
            return l;
        }));
    },

    get_single_carriable : function(data, fn){
        fn(config.carriables.getConfig(data.id));
    },

    use_carriable : function(data, fn){
        try{
            var carriable_id = data.carriable_id,
                carriableCfg = config.carriables.getConfig(carriable_id),
                effects = carriableCfg.effects,
                h = this;


            // Check this item is actually being held
            this.bag.useCarriable(carriable_id);
        }catch(e){
            fn({
                err : "Item not in bag"
            });
            return;
        }


        // Apply the effects
        var l = latch(effects.length, function(){
            // Get all status values
            h.get_all_status_values(null, function(statuses){
                // Generate the avatar image
                h.generateAvatarImage(function(){

                    fn({
                        bag : h.bag.getCarriables(),
                        newhp : h.health,
                        newStatuses : statuses,
                        avatarImage : h.avatarImage
                    });

                });
            });
        });


        effects.forEach(function(effect){
            if(effect.id === "hp"){
                h.modify_hp_value({
                    value: effect.amount
                }, l);
            }else{
                h.modify_status_value({
                    status: effect.id,
                    value: effect.amount
                }, l);
            }
        });
    },

    list_minigames : function(data, fn){
        fn(config.games.listAll());
    },

    launch_minigame : function(data, fn){
        // Get all of the items required for the game and send them to the client
        var id = data.id;

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
                            score: score || 0
                        };

            this.currentlocation = Hub.locations.IN_HUB;
            this.gameId = undefined;
            this.gameSessionId = undefined;
            this.gameStartTime = undefined;

            //update the users currency
            db.readUserById(function(result){
                                db.updateUserCurrency(function(){}, function(){}, result.currency+data.currency, this.user_id);
                            },
                            function(){},
                            this.user_id
            );

            // Save score in database
            db.createPlay(  function(){ fn(); },
                            function(err){ fn({err: err}); },
                            playObj
                        );
        }else{
            fn({
                err : "Game ID supplied does not match the server's"
            });
        }
    },

    get_scores : function(data, fn){
        var numOfScores = 3;

        var filterConds = {};

        if(data.option_num === 0){
            //get top 100 overall scores
            filterConds = {};
        }else if(data.option_num === 1){
            //filtering on user for all games
            filterConds = {game_id: data.game_id};
        }else if(data.option_num === 2){
            filterConds = {user_id: this.userId};
        }else if(data.option_num === 3){
            filterConds = {user_id: this.userId, game_id: data.game_id};
        }else{
            fn({err: "Invalid score option selected"});
        }

        db.getScores(   function(results){
							if(data.option_num === 3){
								results.sort(function(a, b){
									return b.score - a.score;
								});
								var total = {};
								total[results[0].game_id] = results;
								results = total;
							}else if(data.option_num === 2){
								var total = {};
								for(var i=0; i<results.length; i++){
									var current = results[i];
									if(!total.hasOwnProperty(current.game_id)){
										total[current.game_id] = [];
									}
									total[current.game_id].push(current);
								}
								for(var j in total){
									total[j].sort(function(a, b){
										return b.score - a.score;
									});
								}
								results = total;
							}
			
                            fn(results);
                        },
                        function(err){ fn({err: "Error accessing database entries" }); },
                        filterConds,
                        {column: "score", direction: "DESC"},
                        numOfScores
                    );
    },

    modify_hp_value : function(data, fn){
		
        var value = data.value;
		
		var multiplier = 1;
        for(var stat in this.statuses){
            multiplier *= this.statuses[stat].getMultiplier();
        }
		
		//The multiplier makes bad health changes go up, and good health changes go down
		if(value < 0) value = Math.floor(value * multiplier);
		else value = Math.floor(value / multiplier);
		
        // Keep health between 100 and 0;
        var oldHealth = this.health;
        this.health = Math.max(0, Math.min(100, this.health + value));

        var h = this;

        this.newAvatarImageNeeded(oldHealth, this.health, function(newImageNeed){
            if(newImageNeed){
                h.generateAvatarImage(function(){
                    fn({
                        newhp: h.health,
                        avatarImage: h.avatarImage
                    });
                });
            } else {
                fn({
                    newhp: h.health,
                    avatarImage: false
                });
            }
        });

    },

    modify_status_value : function(data, fn){
        var status = this.statuses[data.id];
        if(status){
            status.addToValue(data.value);

            fn(statuses.getClientObject());
        }else{
            fn({
                err : "User does not have that status"
            });
        }
    },

    get_hp_value : function(data, fn){
        fn({
            health : this.health
        });
    },

    get_status_value : function(data, fn){
        var status = this.statuses[data.id];
        if(status){
            fn(status.getClientObject());
        }else{
            fn({
                err : "User does not have that status"
            });
        }
    },

    get_all_status_values : function(data, fn){
        var statuses = {};
        for(var id in this.statuses){
            var status = this.statuses[id];
            statuses[status.id] = status.getClientObject();
        }

        fn(statuses);
    },
	
	get_avatar : function(data, fn){
		var h = this;
		this.generateAvatarImage(function(){
			fn(h.avatarImage);
		});
	},

	set_hp_value : function(data, fn){
		this.health = data.newhp;
		
		// Keep health between 100 and 0;
        this.health = Math.max(0, Math.min(100, this.health));
		
		var h = this;
		
		this.generateAvatarImage(function(){
			
            fn({
                newhp: h.health,
                avatarImage: h.avatarImage
            });
        });
	},
	
	get_symptoms : function(data, fn){
        this.generateSymptoms(this.health, fn);
	}
};


// Copy the event listeners into the Hub prototype
(function(proto){
    for(var e in commsEventListeners){
        if(commsEventListeners.hasOwnProperty(e)){
            proto[e] = commsEventListeners[e];
        }
    }
})(Hub.prototype);




/**
 * Class representing a 'bag', that is the carriables the player currently holds
 * @constructor
 */
function Bag(){
    /** Modelled as an array of carriables (by carriable ID) contained in the bag
     @type int[] */
    this.carriables = [];
}
/** Get the id's of the carriables currently in the bag
 *
 * @return {int[]} - The carriables in the bag
 */
Bag.prototype.getCarriables = function(){
    return this.carriables;
};
/** Set the carriables with a new array
 *
 * @param {int[]} carriablesArray - The new array of carriables
 */
Bag.prototype.setCarriables = function(carriablesArray){
    if(Array.isArray(carriablesArray)) this.carriables = carriablesArray;
};
/**
 * Use a carriable, by its ID.
 * This removes it from the bag
 *
 * @param {int} carriableId - The ID of the item to use
 * @throws {Error}          - When the given carriable is not in the bag
 */
Bag.prototype.useCarriable = function(carriableId){
    var i = this.carriables.indexOf(carriableId.toString());
    if(i > -1){
        this.carriables.splice(i, 1);
    }else{
        throw new Error("Carriable not in bag");
    }
};


/**
* Class represeneting a status for a user
*
* @constructor
* @param {Object} configObj - The database object for the status
*/
function Status(configObj){
    this.id = configObj.id;
    this.name = configObj.name;
    this.value = parseInt((configObj.healthy_min + configObj.healthy_max) / 2, 10);
    this.healthy_min = configObj.healthy_min;
    this.healthy_max = configObj.healthy_max;
    this.min = configObj.min;
    this.max = configObj.max;

}
/** Set the value of the status
 *
 * @param {int} newValue
 */
Status.prototype.setValue = function(newValue){
    this.value = newValue;
};
/** 
 * Adds or subtracts from the current status value.
 *
 * @param {int} addValue - Amount to change the value by. May be negative, to allow subtraction
 */
Status.prototype.addToValue = function(addValue){
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
};
/**
 * Get the multiplier for this status.
 * That is how much this status will effect changes in health
 *
 * @return {int} - The multiplier
 */
Status.prototype.getMultiplier = function(){
    var multiplier = 1,
        difference;

    if(this.value<this.healthy_min){
        difference = this.healthy_min-this.value;
        multiplier *= (difference / this.heathy_min);
    }else if(this.value>this.healthy_max){
        difference = this.value-this.healthy_max;
        multiplier *= (difference / this.healthy_max);
    }

    return multiplier;
};



/** Serialises this class into an object that can be sent to the client (via JSON)
 *
 * @return {Object}
 */
Status.prototype.getClientObject = function(){
    return {
        id : this.id,
        name : this.name,
        value : this.value,
        min : this.min,
        max : this.max
    };
};




/** Init function for the module
 * 
 * @param {Object} cfg - The server configoration
 * @param {Object} db  - The database object
 *
 * @return {Object.<string, function>} - Object with the module's functions
 */
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

            // Set up the hub event listeners for the comms module, bind them to the hub
            comms.setEventListeners(commsEventListeners, h);

            return h;
        }
    };
};
