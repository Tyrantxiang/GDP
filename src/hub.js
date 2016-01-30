"use strict";

/**
 * File to handle the buiness logic of the server side application
 * Each session has a hub object that deals with it's interaction with the application
 * and acts as a proxy for loading the minigames
 *
 * @module hub
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
 * @mixes module:hub~commsEventListeners
 * @param {int} userId  - The ID for the user this hub is associated with (see {@link Hub#userId})
 * @param {module:comms~Comms} comms - The {@link module:comms~Comms|Comms} object that created the Hub
 */
function Hub(userId, comms){
    if(!userId || !comms){
        throw new Error("UserId and comms must be defined");
    }

    var self = this;

    /** The ID for the user this hub is associated with */
    this.userId = userId;
    /** Further information about the user. Currently unused */
    this.user = null;

    /** The user's bag
     @type {module:hub~Bag} */
    this.bag = new Bag();

    /** Where the player currently resides, always starts in the hub
     @type {module:hub~Hub.locations} */
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
     @type Object.<int, module:hub~Status> */
    this.statuses = {};
    /** The user's current health */
    this.health = 100;

    /** The avatar image of the user, in base64 */
    this.avatarImage = null;

    /** The currently equipped items for the user */
    this.equipped = {};


    // Get the equppied items here
    db.getEquippedForUser(

        function(results){
            var meta = config.hub.getItemMetaData(),
                e = self.equipped,
                slot, r;

            for(slot in meta){
                r = results[slot]
                if(r && config.items.exists(results[slot])){
                    e[slot] = r;
                }else{
                    e[slot] = meta[slot].default;
                }
            }
        },
        function(){},
        userId
    );

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
                    statuses.forEach(function(status){
                        if(config.statuses.exists(status)){
                            var currentStatus = config.statuses.getConfig(status);
                            self.statuses[currentStatus.id] = new Status(currentStatus);
                        }
                    });
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
 * Gets the currently equipped items for this user
 *
 * @param {string} [type] - The type of items to get: "avatar" or "hub", if not present will return all
 * @return {Object} The config for a given item, including the slot's meta data
 */
Hub.prototype.getEquippedItems = function(type){
    var o = {},
        e = this.equipped,
        itemMetaData = config.hub.getItemMetaData(),
        slot;

    for(slot in e){
        let id = e[slot],
            md = itemMetaData[slot];

        if(!type || type === md.type){
            let itemConfig = config.items.getConfig(id),
                url = config.items.getSpriteURL(id),
                i = {};

            for(var a in md){
                i[a] = md[a];
            }
            for(var b in itemConfig){
                i[b] = itemConfig[b];
            }

            i.slot = slot;
            i.url = url;

            o[slot] = i;
        }
    }

    return o;
};

/**
 * Updates the equipped items for the user
 *
 * @todo Check that the item to equip is unlocked!!
 * @param {Object<string, int>} items - The items to update to
 * @param {function} cb - Callback with the results
 */
Hub.prototype.updateEquippedItems = function(items, cb){
    var newItems = {},
        e = this.equipped,
        h = this,
        i;

    for(i in e){
        if(items[i]){
            newItems[i] = items[i];
        }else{
            newItems[i] = e[i];
        }
    }

    // Add the user_id to the object for the database call
    newItems.user_id = this.userId;

    db.createUserEquipped(
        function(results){
            // Delete the user_id, as it is not an item!
            delete newItems.user_id;
            h.equipped = newItems;
            cb(newItems);
        },
        function(err){
            cb({err: err});
        },
        newItems
    );
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
 * Generates an avatar image using the given items.
 * Will not fill in item gaps with defaults
 *
 * @todo Fill in item gaps with defaults
 * @param {Object.<string, int>}    items - Map of the item type to it's item ID
 * @param {function}                cb    - Called when the image has been generated
 */
Hub.prototype.generateAvatarImage = function(items, cb){
    var urls = [],
        rootLocation = config.app.getRootDirectory(),
        itemMeta = config.hub.getAvatarItemMetaData(),

        // Default avatar items that cannot be customised
        healthImg = rootLocation + "avatar_items/health_healthy.png",
        mouth = rootLocation + "avatar_items/mouth_smile.png",
        eyes,




        // Order to overlay the images is given in itemMeta.zIndex
        slot, index, direc;


    for(slot in itemMeta){
        if(items[slot]){
            index = itemMeta[slot].zIndex;
            direc = config.items.getConfig(items[slot], "directory");
            direc += "/sprite.png";
            urls[index] = direc;
        }
    }



    // Adjust them to the health specific items
    if(this.health < 60){
        delete items.eyes;
        eyes = rootLocation + "avatar_items/eyes_tired.png";
        mouth = rootLocation + "avatar_items/mouth_sad.png";
    }
    if(this.health < 40){
        healthImg = rootLocation + "avatar_items/health_cold.png";
        mouth = rootLocation + "avatar_items/mouth_cold.png";
    }
    if(this.health < 20){
        healthImg = rootLocation + "avatar_items/health_nauseated.png";
        mouth = rootLocation + "avatar_items/mouth_nauseated.png";
    }






    // Generate
    urls.splice(1, 0, mouth);
    if(eyes) urls.splice(1, 0, eyes);
    urls.splice(1, 0, healthImg);

    cb(this.imgMaker(urls));
};

/**
 * Generates an avatar image using the user's equipt items and status.
 * Updates Hub#avatarImage with the new image as well as returning it
 *
 * @param {function} cb - Called when the image has been generated
 */
Hub.prototype.generateAvatarImageFromEquippedItems = function(cb){
    var h = this,
        items = this.getEquippedItems("avatar");


    for(var i in items){
        items[i] = items[i].id;
    }
    h.generateAvatarImage(items, function(img){
        h.avatarImage = img;
        cb(img);
    });
};


/**
 * Modify the current currency for the user by modify
 *
 * @todo Make a database function that modifies, not just sets
 * @param {int} modify  - The amount to adjust the user's currency by
 * @param {function} cb - Called on success or failure
 */
Hub.prototype.modifyCurrency = function(modify, cb){
    var userId = this.userId;

    db.readUserById(function(user){

        var newVal = parseInt(user.currency) + parseInt(modify);
        db.updateUserCurrency(
            function(){
                cb({
                    success: true,
                    currency: newVal
                });
            },
            function(err){
                cb({error: err});
            }, newVal, userId);

    }, function(err){
        cb({error: err});
    }, userId);
};


/**
 * Callback for the server comms functions, normally implimented in Socket.io and returns data to the client
 *
 * @callback module:hub~commsEventListeners~commsCallback
 * @param {Object} data - The data to be JSONified and returned to the client
 */

/**
 * Functions exposed to the server via the related {@link Comms} instance.
 * This are added to the prototype of {@link Hub} so all the this values for all functions
 * are the instance of hub.
 *
 * Functions are called by the {@link Comms} class
 *
 *  @mixin commsEventListeners
 */
var commsEventListeners = {

    /**
     * @todo Options are unused, here for completions sake. Can be implemented in future for
     * options such as colour blindness etc.
     *
     */
    get_options : function(data, fn){
        fn({});
    },
    /**
     * @todo Options are unused, here for completions sake. Can be implemented in future for
     * options such as colour blindness etc.
     *
     */
    set_options : function(data, fn){
        fn({});
    },

    /**
     * Gets information on all items
     *
     * @param {Object|null} data - The data passed from the client to the server
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_all_item_info : function(data, fn){
        fn(config.items.listAll().map(function(i){
            i.url = config.items.getSpriteURL(i.id);
            return i;
        }));
    },


    /**
     * Gets information on items of a given type
     *
     * @param {Object} data      - The data passed from the client to the server
     * @param {Object} data.type - The type to get items for
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_items_by_type : function(data, fn){
        var slots = config.hub.getItemSlots(data.type),
            items = {},
            l = latch(slots.length, function(){
                fn(items);
            });

        slots.forEach(function(slot){
            this.get_items_for_slot({ slot: slot }, function(is){
                if(Array.isArray(is)){
                    items[slot] = is;
                    l();
                }
            });
        }, this);
    },


    /**
     * Gets the names of all item slots
     *
     * @param {Object} data - The data passed from the client to the server
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_item_slot_names : function(data, fn){
        fn(config.hub.getItemSlots());
    },


    /**
     * Gets the names of all item slots for a given type
     *
     * @param {Object} data      - The data passed from the client to the server
     * @param {Object} data.type - The type to get items for ('hub' or 'avatar')
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_item_slot_names_by_type : function(data, fn){
        fn(config.hub.getItemSlots(data.type));
    },



    /**
     * Gets metadata for all item slots
     *
     * @param {Object} data - The data passed from the client to the server
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_item_meta_data : function(data, fn){
        fn(config.hub.getItemMetaData());
    },

    /**
     * Gets metadata for all item slots of a given type
     *
     * @param {Object} data      - The data passed from the client to the server
     * @param {Object} data.type - The type to get metadata for it's slots
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_item_meta_data_for_type : function(data, fn){
        fn(config.hub.getItemMetaData(data.type));
    },

    /**
     * Gets metadata on a given item slot
     *
     * @param {Object} data      - The data passed from the client to the server
     * @param {Object} data.slot - The slot to get metadata for
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_item_meta_data_for_slot : function(data, fn){
        fn(config.hub.getSingleItemSlotMetaData(data.slot));
    },

    /**
     * Gets information on a single items
     *
     * @param {Object} data    - The data passed from the client to the server
     * @param {int}    data.id - The item ID
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_single_item_info : function(data, fn){
        var obj = config.items.getConfig(data.id);
        if(obj){
            obj.url = config.items.getSpriteURL(data.id);
        }

        fn(obj);
    },

    /**
     * Gets all the items for a given slot
     *
     * @param {Object} data      - The data passed from the client to the server
     * @param {string} data.slot - The slot to get the items for
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
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

    /**
     * Gets the background image for the Hub
     *
     * @param {Object|null} data - The data passed from the client to the server
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_hub_backgroud_image : function(data, fn){
        fn(config.hub.getBackgroundImages());
    },

    /**
     * Gets the items this user has unlocked. Does NOT include items with a cost of zero
     *
     * @todo Should include items with a cost of zero
     * @param {Object|null} data - The data passed from the client to the server
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
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

    /**
     * Gets all the items the user has unlocked for a given slot
     *
     * @param {Object} data      - The data passed from the client to the server
     * @param {string} data.slot - The slot to get the items for
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
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

    /**
     * Gets the items this user currently has equipped
     *
     * @param {null} data - The data passed from the client to the server
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_user_equipped_items : function(data, fn){
        fn(this.getEquippedItems());
    },


    /**
     * Gets the items this user currently has equipped of a given type
     *
     * @param {Object} data - The data passed from the client to the server
     * @param {Object} data.type - The type to get metadata for it's slots
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_user_equipped_items_by_type : function(data, fn){
        fn(this.getEquippedItems(data.type));
    },

    /**
     * Updates the items this user has equipped
     *
     * @param {Object<string, int>} data - The data passed from the client to the server, mapping from the slot name to the item's ID
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    update_equipped_items : function(data, fn){
        var t = this;

        this.updateEquippedItems(data, function(results){
            if(results.err){
                fn(results);
                return;
            }

            t.generateAvatarImageFromEquippedItems(function(){
                fn({ avatarImage : t.avatarImage });
            });
        });
    },

    /**
     * Gets all the carriables in the users bag
     *
     * @param {Object|null} data - The data passed from the client to the server
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_bag : function(data, fn){
        fn(this.bag.getDetailedBag());
    },

    /**
     * Sets the bag contents to a given array (will replace all old carriables)
     *
     * @param {Object}     data            - The data passed from the client to the server
     * @param {Array<int>} data.carriables - Array of carriable IDs to update the bag to
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    set_bag : function(data, fn){
        this.bag.setCarriables(data.carriables);

        fn();
    },

    /**
     * Gets all available carriables
     *
     * @param {Object|null} data - The data passed from the client to the server
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_all_carriables : function(data, fn){
        fn(config.carriables.listAll().map(function(l){
            l.url = config.carriables.getSpriteURL(l.id);
            return l;
        }));
    },

    /**
     * Gets information on a single carriable
     *
     * @param {Object} data    - The data passed from the client to the server
     * @param {int}    data.id - The ID of the carriable to get information on
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_single_carriable : function(data, fn){
        fn(config.carriables.getConfig(data.id));
    },

    /**
     * "Uses" a carriable, thus applying it's effects and removing it from the bag
     *
     * @param {Object} data              - The data passed from the client to the server
     * @param {int}    data.carriable_id - The ID of the carriable to "use"
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
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
                h.generateAvatarImageFromEquippedItems(function(){

                    fn({
                        bag : h.bag.getDetailedBag(),
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
                    id: effect.id,
                    value: effect.amount
                }, l);
            }
        });
    },

    /**
     * Gets all available minigames
     *
     * @param {Object|null} data - The data passed from the client to the server
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    list_minigames : function(data, fn){
        fn(config.games.listAll());
    },

    /**
     * Launches a given minigame and returns the data needed to run it on the client
     *
     * @param {Object} data    - The data passed from the client to the server
     * @param {int}    data.id - The ID of the game to launch
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
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

    /**
     * Finishes the current minigame and saves the results to the database
     *
     * @param {Object} data          - The data passed from the client to the server
     * @param {int}    data.id       - The ID of the game to finish
     * @param {int}    data.score    - The score the user attained for this run
     * @param {int}    data.currency - The currency the user attained for this run
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
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
            /*db.readUserById(function(result){
                                db.updateUserCurrency(function(){}, function(){}, result.currency+data.currency, this.user_id);
                            },
                            function(){},
                            this.user_id
			);*/
            this.modifyCurrency(data.currency, function(){});

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

    /**
     * Finishes the current minigame and saves the results to the database
     *
     * @param {Object} data          - The data passed from the client to the server
     * @param {module:hub~commsEventListeners~commsCallback} fn
     * @todo Document
     */
    get_scores : function(data, fn){
		//['all_scores', 'all_scores_for_game', 'all_scores_for_user', 'all_scores_for_user_for_game'];
		
        var numOfScores = 3;

        if(data.option_num === 0){
			fn({'error': 'Not implemented'});
			return;
        }else if(data.option_num === 1){
            fn({'error': 'Not implemented'});
			return;
        }else if(data.option_num === 2){				
			var total = {}, userId = this.userId;
			var allMinigameIds = config.games.listAll().map(function(ele){
				return ele.id;
			});
			var miniGameLatch = latch(allMinigameIds.length, function(){
				fn(total);
			});
			
			allMinigameIds.forEach(function(ele){
				var filterConds = {user_id: userId, game_id: ele};
				
				db.getScores(function(results){
					total[ele] = results;
					miniGameLatch();
				}, function(err){ fn({err: "Error accessing database entries" }); }, filterConds, {column: "score", direction: "DESC"}, numOfScores)
			});			
        }else if(data.option_num === 3){
            var filterConds = {user_id: this.userId, game_id: data.game_id};
			
			db.getScores(function(results){
					fn(results);
			}, function(err){ fn({err: "Error accessing database entries" }); },
			filterConds, {column: "score", direction: "DESC"}, numOfScores);
			
        }else{
            fn({err: "Invalid score option selected"});
			return;
        }
    },

    /**
     * Modify the health of the user, using the status multipliers to effect the past in value
     *
     * @param {Object} data       - The data passed from the client to the server
     * @param {int}    data.value - The amount to modify the user's health by
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    modify_hp_value : function(data, fn){

        var value = data.value;

        var multiplierSum = 0;
        for(var s in this.statuses){
            if(this.statuses.hasOwnProperty(s)){
                var stat = this.statuses[s];
                multiplierSum += stat.getMultiplier();
            }
        }

        //The multiplier makes bad health changes go up, and good health changes go down
        var finalMultiplier = 1;
        if(value < 0){
            //increases multiplier so negative values get more negative
            finalMultiplier = 1 + multiplierSum;
        }  else if (value > 0){
            //decreases multiplier so positive values get less positive
            if(multiplierSum > 1){
                finalMultiplier = 0;
            } else {
                finalMultiplier = 1 - multiplierSum;
            }
        }

        value = Math.round( value * finalMultiplier );

        // Keep health between 100 and 0;
        var oldHealth = this.health;
        this.health = Math.max(0, Math.min(100, this.health + value));

        var h = this;

        this.newAvatarImageNeeded(oldHealth, this.health, function(newImageNeed){
            if(newImageNeed){
                h.generateAvatarImageFromEquippedItems(function(){
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

    /**
     * Modify the value of a status of the user
     *
     * @param {Object} data       - The data passed from the client to the server
     * @param {int}    data.id    - The ID of the status to modify
     * @param {int}    data.value - The amount to modify the user's health by
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    modify_status_value : function(data, fn){
        var status = this.statuses[data.id];
        if(status){
            status.addToValue(data.value);

            fn(status.getClientObject());
        }else{
            fn({
                err : "User does not have that status"
            });
        }
    },

    /**
     * Gets the health of the user
     *
     * @param {Object|null} data - The data passed from the client to the server
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_hp_value : function(data, fn){
        fn({
            health : this.health
        });
    },

    /**
     * Gets the information for a given status
     *
     * @param {Object} data    - The data passed from the client to the server
     * @param {int}    data.id - The ID of the status to get the information for
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
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

    /**
     * Gets the information for all statuses
     *
     * @param {Object|null} data - The data passed from the client to the server
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_all_status_values : function(data, fn){
        var statuses = {};
        for(var id in this.statuses){
            if(this.statuses.hasOwnProperty(id)){
                var status = this.statuses[id];
                statuses[status.id] = status.getClientObject();
            }
        }

        fn(statuses);
    },

    /**
     * Get the avatar image for the user OR an image from the given items (array of items)
     *
     * @param {Object|null}          data         - The data passed from the client to the server
     * @param {Object<string, int>}  [data.items] - Map of slot name to item ID to generate the avatar for
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_avatar : function(data, fn){
        if(data && data.items){
            this.generateAvatarImage(data.items, function(img){
                fn(img);
            });
        }else{
            this.generateAvatarImageFromEquippedItems(function(img){
                fn(img);
            });
        }
    },

    /**
     * Sets the haelth of the user to the given value, ignoring all status modifiers
     *
     * @param {Object} data       - The data passed from the client to the server
     * @param {int}    data.value - The amount to set the user's health to
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    set_hp_value : function(data, fn){
        this.health = data.newhp;

        // Keep health between 100 and 0;
        this.health = Math.max(0, Math.min(100, this.health));

        var h = this;

        this.generateAvatarImageFromEquippedItems(function(){

            fn({
                newhp: h.health,
                avatarImage: h.avatarImage
            });
        });
    },

    /**
     * Get the symtoms the user currently has
     *
     * @param {Object|null} data - The data passed from the client to the server
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_symptoms : function(data, fn){
        this.generateSymptoms(this.health, fn);
    },

    /**
     * Get the amount of currency a user has
     *
     * @param {Object|null} data - The data passed from the client to the server
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    get_currency : function(data, fn){
        db.readUserById(function(user){
            fn({currency: user.currency});
        }, function(err){
            fn({error: err});
        }, this.userId);
    },

    /**
     * Get the amount of currency a user has
     *
     * @param {Object|null} data - The data passed from the client to the server
     * @param {int}    data.item_id - The ID number of the item to unlock
     * @param {module:hub~commsEventListeners~commsCallback} fn
     */
    unlock_item : function(data, fn){
        var userId = this.userId,
            inventoryObj = {
                user_id: userId,
                item_id: data.item_id,
                active: true
            },

            item_price = config.items.getConfig(data.item_id).price;

        function doUnlock(){
            db.createUserInventory(function(obj){
                fn({success : true});
            }, function(err){
                fn({error: err});
            }, inventoryObj);
        }

        // TODO use modifyCurrency and adjust that so it cannot go below zero
        db.readUserById(function(user){

            if(item_price <= user.currency){

                db.readUserById(function(user){
                    db.updateUserCurrency(doUnlock, function(err){
                        fn({error: err});
                    }, user.currency-item_price, userId);
                }, function(err){
                    fn({error: err});
                }, userId);

            }else{
                fn({'error' : 'Not enough currency'});
            }

        }, function(err){
            fn({'error': err});
        }, userId);

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
/** Gets all the details of the carriables currently in the bag
 *
 * @return {Object[]} - The detailed carriables in the bag
 */
Bag.prototype.getDetailedBag = function(){
    return this.carriables.map(function(id){
       var c = config.carriables.getConfig(id);
       c.url = config.carriables.getSpriteURL(id);
       return c;
    });
};
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
    var value_difference,
        unhealthy_range;

    if(this.value<this.healthy_min){
        value_difference = this.healthy_min - this.value;
        unhealthy_range = this.healthy_min - this.min;
    }else if(this.value>this.healthy_max){
        value_difference = this.value - this.healthy_max;
        unhealthy_range = this.max - this.healthy_max;
    } else {
        return 0;
    }

    return (value_difference / unhealthy_range);
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




/**
 * Functions exposed by the hub module
 *
 * @namespace hub
 */
var exportFunctions = {
    /**
     * Sets the hub config object
     *
     * @memberof module:hub~hub
     * @function
     * @param {module:config} cfg - The new config
     */
    setConfig : setConfig,
    /**
     * Creates a new hub object and assigns the event listeners to the given comms object
     *
     * @memberof module:hub~hub
     * @function
     * @return {module:config} The current config object
     */
    getConfig : getConfig,
    /**
     * Sets the hub config object
     *
     * @memberof module:hub~hub
     * @function
     * @param {module:database} db - The new database object
     */
    setDatabase : setDatabase,
    /**
     * Creates a new hub object and assigns the event listeners to the given comms object
     *
     * @memberof module:hub~hub
     * @function
     * @return {module:database} The current database object
     */
    getDatabase : getDatabase,

    /**
     * Creates a new hub object and assigns the event listeners to the given comms object
     *
     * @memberof module:hub~hub
     * @param {int}                userId - The userId to assign the hub to
     * @param {module:comms~Comms} comms  - The comms object for this user
     * @return {module:hub~Hub} The created hub instance
     */
    create : function (userId, comms){
        var h = new Hub(userId, comms);

        // Set up the hub event listeners for the comms module, bind them to the hub
        comms.setEventListeners(commsEventListeners, h);

        return h;
    }
};

/**
 * Init function for the module. Returns the exposed functions of the module
 *
 * @param {module:config}   cfg - The server configoration
 * @param {module:database} db  - The database object
 * @return {module:hub~hub} - Object with the module's functions
 */
module.exports = function (cfg, db){
    setConfig(cfg);
    setDatabase(db);


    return exportFunctions;
};
