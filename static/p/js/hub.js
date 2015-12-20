(function(){
    'use strict';

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
        container = document.getElementById('main-content-area'),
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


    // Clones an arbitrary object
    function cloneObject(obj){
        var o = {}, i;
        for(i in obj){
            if(obj.hasOwnProperty(i)){
                o[i] = obj[i];
            }
        }
        return o;
    }


    // Gets a clone of an assets object (eg images, audio), given by type
    function getAssetsByType(type){
        var t = assets[type];
        if(!t){
            return undefined;
        }

        return cloneObject(t);
    }

    function getCloneOfAssets(){
        var o = {}, i;
        for(i in assets){
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

        symptoms : [],

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
            ['//cdnjs.cloudflare.com/ajax/libs/fabric.js/1.5.0/fabric.min.js', false],
            ['/p/js/draw_canvas.js', true],
            ['/p/js/avatar.js', true],
            ['/p/js/menus.js', true]
        ];

        // TODO: Handle if login is clicked multiple times, prevent loading multiple hubs, i.e. .html() first.
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
                                hub.avatarImage = new Image();
                                hub.avatarImage.src = "data:image/png;base64," + imgData;
                            });
                            comms.get_symptoms(function(symps){
                                hub.symptoms = symps;
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
                                    hubCanvasContainer.className = "hub-canvas-container";
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

                                    draw.init(hubCanvas, getAssetsByType("images"))
                                        .healthbar.init(hub.health, hub.statuses, hub.symptoms);

                                    document.body.className = "hub";

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
                }),

                l = latch(needToLoad.length, function(){
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
                    cb(
                        hub.cloneCarriableInfo(hub.carriables[id])
                    );
                } else {
                    cb(null);
                }
            });
        }
    };

    // Set the bag
    hub.setBag = function(carriables, cb){
        comms.set_bag(carriables, cb);
    };


    //Status modification functions
    //TODO: Joe
    hub.getHealth = function(cb){
        comms.get_hp_value(function(data){
            hub.health = data.health;
            cb && cb(hub.health);
        });
    };

    //TODO: Joe
    hub.modifyHealth = function(changeVal, cb){
        comms.modify_hp_value(changeVal, function(data) {
            comms.get_symptoms(function(symps){
                hub.health = data.newhp;
                hub.symptoms = symps;
                if(data.avatarImage){
                    hub.avatarImage = base64ToImg(data.avatarImage);
                }
                cb(hub.health, hub.avatarImage, hub.symptoms);
            });
        });
    };

    //TODO: Joe
    hub.setAbsoluteHealth = function(value, cb){
        comms.set_hp_value(value, function(data) {
            comms.get_symptoms(function(symps){
                hub.health = data.newhp;
                hub.symptoms = symps;
                if(data.avatarImage){
                    hub.avatarImage = base64ToImg(data.avatarImage);
                }
                cb(hub.health, hub.avatarImage, hub.symptoms);
            });
        });
    }

    //TODO: Joe
    hub.useCarriable = function(carriableId, cb){
        comms.use_carriable(carriableId, function(data){
            if(!data.err){
                comms.get_symptoms(function(symps){
                    hub.symptoms = symps;
                    hub.health = data.newhp;
                    hub.statuses = data.newStatuses;
                    if(data.avatarImage){
                        hub.avatarImage = base64ToImg(data.avatarImage);
                    }
                    cb(data.bag, hub.health, hub.cloneStatuses(), hub.avatarImage, hub.symptoms);
                });
            }else{
                cb({
                    err : data.err
                });
            }
        });
    };

    //TODO: Joe
    hub.modifyStatus = function(statusId, changeVal, cb){
        comms.modify_status_value(statusId, changeVal, function(data){
            if(!data.err){
                if(hub.statuses[data.id]){
                    hub.statuses[data.id].value = data.newValue;
                }
                cb(data.id, data.newValue);
            }
        });
    };

    hub.getAllMinigames = function(cb){
        comms.list_minigames(cb);
    };

    hub.getHighScoresForAllGames = function(cb){
        comms.get_scores(2, null, null, cb);
    };

    hub.getHighScoresForGame = function(gameid, cb){
        comms.get_scores(3, null, gameid, cb)
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
            if(data.avatarImage){
                hub.avatarImage = new Image();
                hub.avatarImage.src = "data:image/png;base64," + data.avatarImage;
            }
            cb(hub.avatarImage);
        });
    }

    hub.getEquippedHouseItems = function(cb){
        comms.get_user_equipped_items(function(data){
            var avatar = ["skin", "head", "shirt", "eyes"];
            for(var i=0; i<avatar.length; i++) delete data[avatar[i]];
            cb(data);
        });
    }

    hub.getGameInfo = function(gameid, cb){
        comms.get_minigame_info(gameid, cb);
    }


    hub.cloneStatuses = function(){
        return cloneObject(hub.statuses);
    };

    hub.cloneCarriableInfo = function(carriable){
        return cloneObject(carriable);
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
        draw.update_avatar();
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

            draw.healthbar.updateHealthSymptoms(hub.health, hub.symptoms);
            draw.update_avatar();
        });
    };

    hub.launchHomeCustomisation = function(cb) {
        hub.getEquippedHouseItems(function(data) {
            menu.paint.load(data);
        });
        /*
        hub.getUserUnlockedItems(function(data) {
            console.log("UNLOCKED: ");
            console.log(data);
            comms.get_user_equipped_items(function(d) {
                console.log("EQUIPPED: ");
                console.log(d);
                menu.paint.load();
            })
        });
        */
    };

    // Launches high score screen.
    hub.launchScores = function(cb) {
        hub.getHighScoresForAllGames(function(raw_scores) {

            var processed_scores    = [];
            var keys                = Object.keys(raw_scores);
            var l                   = latch(keys.length, function() {
                menu.scores.load(processed_scores);
            });

            keys.forEach(function(key) {
                var score_array = [];
                var iterate_no;
                var padding;

                // TODO: 3 should be pulled out to a config file somewhere.
                if(raw_scores[key].length >= 3)
                {
                    iterate_no  = 3;
                    padding     = 0;
                }
                else
                {
                    iterate_no  = raw_scores[key].length;
                    padding     = 3 - iterate_no;
                }

                for(var i = 0; i < iterate_no; i++)
                {
                    score_array.push(raw_scores[key][i].score);
                }

                for(var i = 0; i < padding; i++)
                {
                    score_array.push('-');
                }

                hub.getGameInfo(parseInt(key), function(game_info) {
                    var formatted_score    = {
                        id:     game_info.id,
                        name:   game_info.name,
                        img:    game_info.image,
                        scores: score_array
                    };

                    processed_scores.push(formatted_score);
                    l();
                });
            });
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

                var newBag = [];

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
                        newBag.push(carriable);
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

                draw.healthbar.updateHealthSymptoms(hub.health, hub.symptoms);
                draw.healthbar.updateStatuses(hub.statuses);

                draw.update_avatar();
            }.bind(this));
        };

        proto.useCarriable = function(carriableId, cb){
            var t = this;
            hub.useCarriable(carriableId, function(bag, health, statuses, avatarImage, symptoms){
                cb.call(t, bag, health, statuses, avatarImage, symptoms);
            });
        };

        proto.modifyHealth = function(changeVal, cb){
            var t = this;
            hub.modifyHealth(changeVal, function(health, avatarImage, symptoms){
                cb.call(t, health, avatarImage, symptoms);
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