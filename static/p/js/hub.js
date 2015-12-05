(function(){
    "use strict";

    var assets = {
            images : {},
            audio : {}
        },
        // Whether we have loaded already
        initalFilesLoaded = false,
        // Hub canvas container
        hubCanvasContainer,
        // The hub canvas
        hubCanvas,
        // The content area to put the canvas
        container = document.getElementById("main-content-area"),
        // The local comms object
        comms = window.comms,
        // Local draw object
        draw,
        // Local menu object
        menu;


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
    utils.latch = latch;

    // Clear the window functions so games cannot use them
    function clearWindowFunctions(){
        delete window.comms;
        delete window.draw;
        delete window.hub;
        delete window.menu;
    }

    function recoverWindowFunctions(){
        window.comms = comms;
        window.draw = draw;
        window.hub = hub;
        window.menu = menu;
    }


    // Gets a clone of an assets object (eg images, audio), given by type
    function getAssetsByType(type){
        var t = assets[type];
        if(!t){
            return undefined;
        }

        var o = {};
        for(var i in t){
            if(t.hasOwnProperty(i)){
                o[i] = t[i];
            }
        }

        return o;
    }

    function getCloneOfAssets(){
        var o = {};
        for(var i in assets){
            if(assets.hasOwnProperty(i)){
                o[i] = getAssetsByType(i);
            }
        }

        return o;
    }

    // Convert base64 to Img object
    function base64ToImg(base64){
        var i = document.createElement("img");
        i.src = "data:image/png;base64," + base64;
        return i;
    }


    // Creates the DOM bootstrap loading bar
    function generateLoadingBar(){
        var value = 0;

        var loadingBar = document.createElement("div");
            loadingBar.className = "progress";

        var innerBar = document.createElement("div");
            innerBar.className = "progress-bar progress-bar-striped active";

        var innerText = document.createElement("span");
            innerText.innerHTML = "0%";

        innerBar.appendChild(innerText);
        loadingBar.appendChild(innerBar);
        loadingBar.setProgress = function(v){
            value = v;
            innerBar.style.width = v + "%";
            innerText.innerHTML = Math.floor(v) + "%";
        };
        loadingBar.getProgress = function(){
            return value;
        };

        return loadingBar;
    }


    // The hub object
    var hub = {
        // The current health
        health : 100,
        // The users statuses
        statuses : {},

        // All carriables
        carriables : {},
		
		avatarImage : undefined


    };

    hub.load = function(cb){
        // Show loading sign
        var loadingContainer = document.createElement("div"),
            loadingBar = generateLoadingBar(),
            loadingText = document.createElement("div");

        loadingContainer.className = "loading-container";

        loadingText.innerHTML = "Loading...";

        loadingContainer.appendChild(loadingText);
        loadingContainer.appendChild(loadingBar);
        container.appendChild(loadingContainer);

        // Scripts to load
        var scripts = [
            ["//cdnjs.cloudflare.com/ajax/libs/fabric.js/1.5.0/fabric.min.js", false],
            ["/p/js/draw_canvas.js", true],
            ["/p/js/avatar.js", true],
            ["/p/js/menus.js", true]
        ];

        // Open the socket connection
        comms.createSocket(function(){
            if(!initalFilesLoaded){
                // Get the list of images
                comms.get_hub_backgroud_image(function(background){
                    comms.get_user_equipped_items(function(items){
                        comms.get_all_status_values(function(statuses){

                            // First add the statuses to hub.statuses
                            hub.statuses = statuses;
							
							comms.get_avatar(function(imgData){
									hub.avatarImage = base64ToImg(imgData);
							});

                            // How much do we load?
                            var imagesToLoad = Object.keys(items).length + 1,
                                // All including scripts
                                toLoad = imagesToLoad + scripts.length,
                                // How much have we loaded
                                loaded = 0,
                                // Is there an error?
                                error = false;

                            function fileLoaded(){
                                loaded++;
                                loadingBar.setProgress(loaded/toLoad * 100);

                                if(loaded === imagesToLoad){
                                    loadComplete();
                                }
                            }
                            function fail(){
                                error = true;
                                utils.addError("An image couldn't load");
                                utils.addError(this.src);
                            }



                            function imageLoader(item){
                                var i = document.createElement("img");
                                i.addEventListener("load", function(){
                                    item.image = this;
                                    fileLoaded();
                                });
                                i.addEventListener("error", fail);
                                i.src = item.url;
                            };
                            // Load the item images
                            for(var item in items){
                                imageLoader(items[item]);
                            }

                            // Load the background image
                            var i = document.createElement("img");
                            i.addEventListener("load", function(){
                                background.image = this;
                                fileLoaded();
                            });
                            i.addEventListener("error", fail);
                            i.src = background.url;


                            function loadComplete(){
                                // Add to the images object
                                assets.images.background = background;
                                assets.images.items = items;


                                // Load all the script files
                                 var lscripts = latch(scripts.length, function(){
                                    // Remove loading bar and load the canvas
                                    hubCanvasContainer = document.createElement("div");
                                    hubCanvas = document.createElement("canvas");

                                    try{
                                        container.removeChild(loadingContainer);
                                    }catch(e){}

                                    hubCanvasContainer.appendChild(hubCanvas);

                                    container.appendChild(hubCanvasContainer);

                                    initalFilesLoaded = true;

                                    // Pull the window instances of draw and comms
                                    comms = window.comms;
                                    draw = window.draw;
                                    menu = window.menu;

                                    draw.init(hubCanvas, getAssetsByType("images"));

                                    if(cb){
                                        cb.call(hub);
                                    }
                                });

                                scripts.forEach(function(script){
                                    comms.loadScriptFile(script[0], function(){
                                        loaded++;
                                        loadingBar.setProgress(loaded/toLoad * 100);
                                        lscripts();
                                    }, script[1]);
                                });
                            }

                        });
                    });
                });

            }

        });
    };



    // Getting carriables and those in the bag
    hub.getAllCarriables = function(cb){
        comms.get_all_carriables(function(data){
            var needToLoad = data.filter(function(c){
                    return !hub.carriables[c.id];
                });
            if(needToLoad.length > 0){
                var l = latch(needToLoad.length, function(){
                    cb(hub.carriables);
                });

                needToLoad.forEach(function(c){
                    var i = document.createElement("img");
                    i.addEventListener("load", function(){
                        c.image = this;
                        hub.carriables[c.id] = c;
                        l();
                    });
                    i.addEventListener("error", function(){
                        utils.addError(this.src);
                    });
                    i.src = c.url;
                });
            }else{
                cb(hub.carriables);
            }
        });
    };

    hub.getCarriablesInBag = function(cb){
        comms.get_bag(function(data){
            cb(data);
        });
    };

    hub.getCarriablesAndBag = function(cb){
        var o = {},
            l = latch(2, function(){
                cb(o);
            });
        hub.getAllCarriables(function(carriables){
            o.carriables = carriables;
            l();
        });
        hub.getCarriablesInBag(function(bag){
            o.bag = bag;
            l();
        });
    };

    hub.getCarriable = function(id, cb){
        if(hub.carriables[id]){
            cb(hub.carriables[id]);
        } else {
            hub.getAllCarriables(function(){
                if(hub.carriables[id]){
                    cb(hub.carriables[id]);
                } else {
                    cb(null);
                }
            });
        }
    };

    // Set the bag
    hub.setBag = function(carriables, cb){
        comms.set_bag(carriables, function(){
            cb && cb();
        });
    };


    // Status modification functions
    hub.getHealth = function(cb){
        comms.get_hp_value(function(data){
            hub.health = data.health;
            cb && cb(hub.health);
        });
    };

    hub.modifyHealth = function(changeVal, cb){
        comms.modify_hp_value(changeVal, function(data) {
            hub.health = data.newhp;
            hub.avatarImage = base64ToImg(data.avatarImage);
            cb(hub.health, hub.avatarImage);
        });
    };
	
	hub.setAbsoluteHealth = function(value, cb){
		comms.set_hp_value(value, function(data) {
            hub.health = data.newhp;
            hub.avatarImage = base64ToImg(data.avatarImage);
            cb(hub.health, hub.avatarImage);
        });
	}

    hub.useCarriable = function(carriableId, cb){
        comms.use_carriable(carriableId, function(data){
            if(!data.err){
                hub.health = data.newhp;
                hub.statuses = data.newStatuses;
                hub.avatarImage = base64ToImg(data.avatarImage);
                cb(data.bag, hub.health, hub.statuses, hub.avatarImage);
            }else{
                cb({
                    err : data.err
                });
            }
        });
    };

    hub.modifyStatus = function(statusId, changeVal, cb){
        comms.modify_status_value(statusId, changeVal, function(data){
            if(!data.err){
                if(hub.statuses[data.id]){
                    hub.statuses[data.id] = data.newValue;
                }
                cb(data.id, data.newValue);
            }
        });
    };

	hub.getAllMinigames = function(cb){
		comms.list_minigames(cb);
	};
	
	hub.getHighScoresForAllGames = function(cb){
		comms.get_scores(2, null, null);
	};
	
	hub.getHighScoresForGame = function(gameid, cb){
		comms.get_scores(3, null, gameid)
	};
	
	//an array of ints, referring to item ids
	hub.getUserUnlockedItems = function(cb){
		comms.get_user_unlocked_items(cb);
	};

    // Get information on an item
    hub.getItemInfo = function(id, cb){
        comms.get_single_item_info(id, cb);
    };
	
	hub.getAllItems = function(cb){
		comms.get_all_item_info(cb);
	};

    hub.updateEquiptItems = function(obj, cb){
        comms.update_equipped_items(obj, function(data){
            cb(base64ToImg(data.avatarImage));
        });
    }
	


    hub.cloneStatuses = function(){
        var o = {};
        for(var s in hub.statuses){
            o[s] = hub.statuses[s];
        }
        return o;
    };
	


    hub.launchAvatarCreation = function(){
        container.removeChild(hubCanvasContainer);
        document.getElementById("avatar-creation-overlay").style.display = "block";
        document.body.style.backgroundColor = "#90C695";
        hub.avatarCreationLoader();
    };

    hub.closeAvatarCreation = function(){
        document.getElementById("avatar-creation-overlay").style.display = "none";
        document.body.style.backgroundColor = "transparent";
        container.appendChild(hubCanvasContainer);
    };


    // Lauches the backpacking menu.
    hub.launchBackpack = function(cb) {
        hub.getCarriablesAndBag(function(data) {
            menu.backpack.load(data.carriables, data.bag);
        });
    };


    // Sleep, resetting health.
    hub.sleep = function(cb) {
        hub.setAbsoluteHealth(100, function() {
            menu.stairs.load();
        });
    };

    hub.launchHomeCustomisation = function(cb) {
        comms.get_user_unlocked_items(function(data) {
            console.log("UNLOCKED: ");
            console.log(data);
            comms.get_user_equipped_items(function(d) {
                console.log("EQUIPPED: ");
                console.log(d);
                menu.paint.load();
            })
        });
    };

    // Launches game selector.
    hub.launchGameSelect = function(cb) {
        hub.getAllMinigames(function(data) {
            menu.game_select.load(data);
        });
    };

    // Launches a game
    hub.launchGame = function(gameId){
        // Get the minigame info
        comms.launch_minigame(gameId, function(data){
            hub.getCarriablesInBag(function(bag){
                if(data.err){
                    window.utils.addError(data.err);
                    return;
                }

                // Create a new canvas for the game
                var canvas = document.createElement("canvas"),
                    canvasContainer = document.createElement("div"),

                    // Create the API object
                    api = new GameAPI(
                        data.gameId,
                        data.name,
                        data.sessionId,
                        canvas,
                        canvasContainer,
                        data.assetBaseURL,
                        data.version
                    );


                // Remove window functions
                clearWindowFunctions();

                var newBag = {};

                var lcarriables = latch(bag.length, function(){
                    // Load the scripts into memory
                    var lscripts = latch(data.scriptURLs.length, function(){
                        container.removeChild(hubCanvasContainer);
                        canvasContainer.appendChild(canvas);
                        container.appendChild(canvasContainer);

                        var e = window[data.entryObject];
                        e.run.call(e, api, canvas, data.assetBaseURL, hub.health, hub.cloneStatuses(), newBag);
                    });

                    data.scriptURLs.forEach(function(script){
                        comms.loadScriptFile(script, lscripts, false);
                    });
                });

                bag.forEach(function(c){
                    hub.getCarriable(c, function(carriable){
                        newBag[c] = carriable;
                        lcarriables();
                    });
                });
            });
        });
    };

    hub.getAssetsByType = getAssetsByType;







    // Object for a Game API system
    function GameAPI(gameId, gameName, sessionId, canvas, canvasContainer, assetBaseURL, version){
        this.gameName = gameName;
        this.assetBaseURL = assetBaseURL;
        this.version = version;
        this.canvas = canvas;

        var listeners = [];

        this.addKeyListener = function(eventType, func){
            var allowedEvents = ["keypress", "keydown", "keyup"];

            if(allowedEvents.indexOf(eventType) > -1){
                listeners.push({"type": "key", "eventType": eventType, "func": func});
                window.addEventListener(eventType, func, false);
            } else {
                console.err("Event "+eventType+" is not allowed for key listener!");
            }
        };

        this.addMouseListener = function(eventType, func){
            var allowedEvents = ["mousedown", "mouseup", "mouseover", "mouseout", "mousemove", "click", "contextmenu", "dblclick"];

            if(allowedEvents.indexOf(eventType) > -1){
                listeners.push({"type": "mouse", "eventType": eventType, "func": func});
                this.canvas.addEventListener(eventType, func, false);
            } else {
                console.err("Event "+eventType+" is not allowed for mouse listener!");
            }
        };

        this.removeAllListeners = function(){
            listeners.forEach(function(l){
                if(l.type == "key"){
                    window.removeEventListener(l.eventType, l.func);
                } else if(l.type == "mouse"){
                    this.canvas.removeEventListener(l.eventType, l.func);
                }
            });
        };

        this.getGameId = function(){
            return gameId;
        };
        this.getSessionId = function(){
            return sessionId;
        };
        this.getCanvasContainer = function(){
            return canvasContainer;
        };
    }
    // Add to the prototype
    (function(proto){
        proto.finishGame = function(score, currency){
            comms.finish_minigame(this.getGameId(), score, currency, function(data){
                if(data && data.err){
                    utils.addError(JSON.stringify(data.err));
                }

                this.removeAllListeners();

                //return to hub here!
                container.removeChild(this.getCanvasContainer());
                container.appendChild(hubCanvasContainer);

                // Recover the window functions
                recoverWindowFunctions();
            }.bind(this));
        };

        proto.useCarriable = function(carriableId, cb){
            var t = this;
            hub.useCarriable(carriableId, function(bag, health, statuses, avatarImage){
                cb.call(t, bag, health, statuses, avatarImage);
            });
        };

        proto.modifyHealth = function(changeVal, cb){
            var t = this;
            hub.modifyHealth(changeVal, function(health, avatarImage){
                cb.call(t, health, avatarImage);
            });
        };

        proto.modifyStatus = function(statusId, changeVal, cb){
            var t = this;
            hub.modifyStatus(statusId, changeVal, function(data){
                cb.call(t, data.id, data.newValue);
            });
        };

        proto.getAvatarImage = function(){
            return hub.avatarImage;
        };

        proto.getAssetURL = function(asset){
            return this.assetBaseURL + "/" + asset;
        };

    })(GameAPI.prototype);



    window.hub = hub;
})();