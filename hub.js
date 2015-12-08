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

function latch(num, complete){
    return function(){
        if(!--num){
            complete();
        }
    };
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

}
// Set the locations as "class constants"
Hub.locations = locations;


Hub.prototype.exit = function(){
    // Cleanup code when a client disconnects

    // Save session data in db
    var disconnectTime = new Date();

    db.endSession(function(){}, function(){}, disconnectTime.toISOString(), this.userId);
};

Hub.prototype.generateAvatarImage = function(fn){
    var urls = [],
        h = this;
		
	var healthImg = undefined;
    if(this.health < 10){
        healthImg = __dirname + "/avatar_items/unhealthy_0.png";
    }else{
        if(this.health < 30){
            healthImg = __dirname + "/avatar_items/unhealthy_1.png";
        }else{
            if(this.health < 50){
                healthImg = __dirname + "/avatar_items/unhealthy_2.png";
            }else{
                healthImg = __dirname + "/avatar_items/healthy.png";
            }
        }
	}
	var order = ["skin", "eyes", "shirt", "head"];

    // Equipt items could possibly be saved locally?
    this.get_user_equipped_items(
        {},
        function(data){			
			for(var i in order){
				var direc = config.items.getConfig(data[order[i]].id, "directory");
				direc += "/sprite.png";
				urls.push(direc);
			}
			
			urls.splice(1, 0, healthImg);
            
            var base64string = h.imgMaker(urls);			
            fn(base64string);
        });
};



// Define functions here
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
					
					//console.log(slot + " = " + results[slot]);
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
                t.generateAvatarImage(function(imageString){
                    fn({ avatarImage : imageString });
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
        var carriable_id = data.carriable_id,
            carriableCfg = config.carriables.getConfig(carriable_id),
            effects = carriableCfg.effects,
            h = this;

        // Check this item is actually being held
        try{
            this.bag.useItem(carriable_id);
        }catch(e){
            fn({
                err : "Item not in bag"
            });
            return;
        }


        // Apply the effects
        var l = latch(effects.length, function(){
            var o = {};
            // THIS WILL NEED TO INCLUDE THE NAME
            for(var status in h.statuses){
                o[status] = h.statuses[status].value;
            }

            // Generate the avatar image
            h.generateAvatarImage(function(imageString){
                fn({
                    bag : h.bag.getCarriables(),
                    newhp : h.health,
                    newStatuses : o,
                    avatarImage : imageString
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
        this.health = Math.max(0, Math.min(100, this.health + value));

        var h = this;
        
        this.generateAvatarImage(function(imageString){
            fn({
                newhp: h.health,
                avatarImage: imageString
            });
        });

    },

    modify_status_value : function(data, fn){
        var status = this.statuses[data.id];
        if(status){
            status.addToValue(data.value);

            fn({
                id : status.id,
                newValue : status.value
            });
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
            fn({
                id : status.id,
                name : status.name,
                value : status.value
            });
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
            statuses[id] = {
                id : id,
                name : status.name,
                value : status.value
            };
        }

        fn(statuses);
    },
	
	get_avatar : function(data, fn){
		this.generateAvatarImage(fn);
	},

	set_hp_value : function(data, fn){
		this.health = data.newhp;
		
		// Keep health between 100 and 0;
        this.health = Math.max(0, Math.min(100, this.health));
		
		var h = this;
		
		this.generateAvatarImage(function(imageString){
            fn({
                newhp: h.health,
                avatarImage: imageString
            });
        });
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




/* Class representing a 'bag', that is the carriables the player currently holds */
function Bag(){
    // Modelled as an array of carriables contained in the bag
    this.carriables = [];
}
Bag.prototype.getCarriables = function(){
    return this.carriables;
};
Bag.prototype.setCarriables = function(carriablesArray){
    if(Array.isArray(carriablesArray)) this.carriables = carriablesArray;
};
Bag.prototype.useItem = function(itemId){
    var i = this.carriables.indexOf(itemId.toString());
    if(i > -1){
        this.carriables.splice(i, 1);
    }else{
        throw new Error("Item not in bag");
    }
};


/* Class represeneting a status for the user */
function Status(configObj){
    this.id = configObj.id;
    this.name = configObj.name;
    this.value = parseInt((configObj.healthy_min + configObj.healthy_max) / 2, 10);
    this.healthy_min = configObj.healthy_min;
    this.healthy_max = configObj.healthy_max;
    this.min = configObj.min;
    this.max = configObj.max;

}
Status.prototype.setValue = function(newValue){
    this.value = newValue;
};
//the addValue may be negative, allow subtraction
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
