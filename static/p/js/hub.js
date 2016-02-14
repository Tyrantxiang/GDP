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


    /**** The hub object: central object for the system ****/
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



    /* Simple implementation of a latch */
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



    /********************* Utility functions for the hub *************************/
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
    hub.getAssetsByType = getAssetsByType;

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





    /****** Hub loading functions *********/
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


    // Actual function that loads the ghub
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
            ['/assets/polyfills/rAF.js', false],
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
                                hub.avatarImage = base64ToImg(imgData);
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
                            }
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









    /****************** Carraible and bag functions **********************/


    // Getting carriables and those in the bag
    hub.getAllCarriables = function(cb){
        comms.get_all_carriables(function(data){
            var toKeep = [],
                needToLoad = data.filter(function(c){
                    toKeep.push(c.id);
                    return !hub.carriables[c.id];
                }),

                l = latch(needToLoad.length, function(){
                    // PURGE
                    for(var i in hub.carriables){
                        var carriable = hub.carriables[i].id,
                            index = toKeep.indexOf(carriable);
                        if(index < 0){
                            delete hub.carriables[i];
                        }
                    }

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
        comms.get_bag_ids(function(data){
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

    // Set the bag
    hub.setBag = function(carriables, cb){
        comms.set_bag(carriables, cb);
    };

    hub.cloneCarriableInfo = function(carriable){
        return cloneObject(carriable);
    };






    /*************** Health and status related functions ***************/

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
    };

    hub.modifyStatus = function(statusId, changeVal, cb){
        comms.modify_status_value(statusId, changeVal, function(data){
            if(!data.err){
                if(hub.statuses[data.id]){
                    hub.statuses[data.id].value = data.value;
                }
                cb(data.id, data.value);
            } else {
                console.error(data.err);
            }
        });
    };

    hub.cloneStatuses = function(){
        return cloneObject(hub.statuses);
    };










    /******************* High score functions ******************/

    hub.getHighScoresForAllGames = function(cb){
        comms.get_scores(2, null, null, cb);
    };

    hub.getHighScoresForGame = function(gameid, cb){
        comms.get_scores(3, null, gameid, cb);
    };







    /************** Item related functions **********************/

    //an array of ints, referring to item ids
    hub.getUserUnlockedItems = function(cb){
        comms.get_user_unlocked_items(cb);
    };

    /* Takes a slot to get the unlocked items for (in full form)
     * Or an array of slots to get the unlocked items for
     */
    hub.getUserUnlockedItemsForSlot = function(slot, cb){
        if(!slot){
            hub.getUserUnlockedItems(cb);
            return;
        }


        if(!Array.isArray(slot)){
            comms.get_user_unlocked_items_by_slot(slot, cb);
        }else{
            var obj = {},
                l = latch(slot.length, function(){
                    // Only return the arrays, as objects are errors
                    for(var s in obj){
                        if(!Array.isArray(obj[s])){
                            delete obj[s];
                        }
                    }
                    cb(obj);
                });

            slot.forEach(function(s){
                comms.get_user_unlocked_items_by_slot(s, function(a){
                    obj[s] = a;
                    l();
                });
            });
        }

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
                hub.avatarImage = base64ToImg(data.avatarImage);
            }
            cb(hub.avatarImage);
        });
    };

    hub.getEquippedHouseItems = function(cb){
        comms.get_user_equipped_items(function(data){
            var avatar = ["skin", "head", "shirt", "eyes"];
            for(var i=0; i<avatar.length; i++) delete data[avatar[i]];
            cb(data);
        });
    };


    // Get a avatar image from the given array
    hub.getAvatarImageFromItems = function(items, cb){
        comms.get_avatar(function(img){
            cb(base64ToImg(img));
        }, items);
    };




    /********* Menu launching functions *****************/

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
            menu.sleep.load();

            draw.healthbar.updateHealthSymptoms(hub.health, hub.symptoms);
            draw.update_avatar();
        });
    };

    // Gets all unlocked (hub) items and passes them to the customisation menu.
    hub.launchHomeCustomisation = function(cb) {
        comms.get_item_slot_names_by_type('hub', function(slots) {
            hub.getUserUnlockedItemsForSlot(slots, function(available) {
                hub.getEquippedHouseItems(function(equipped) {
                    menu.customise_hub.load(available, equipped);
                });
            });
        });
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

                for(var j = 0; j < padding; j++)
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

    // Fix the filtering.
    hub.launchShop = function() {
        // Gets all items and user unlocked items
        comms.get_all_item_info(function(all_items) {
            comms.get_user_unlocked_items(function(unlocked_items) {
                // Include no items that are priced at 0
                var not_free_items = all_items.filter(function(item) {
                    return item.price > 0;
                });

                // Return the difference between not_free_items and unlocked items
                var shop_items = not_free_items.filter(function(current){
                    return unlocked_items.filter(function(current_b){
                        return current_b == current.id;
                    }).length == 0
                });

                comms.get_currency(function(currency) {
                    menu.shop.load(shop_items, currency);
                });
            });
        });
    };












    /**************** Minigame related functions ******************/

    hub.getAllMinigames = function(cb){
        comms.list_minigames(cb);
    };

    hub.getGameInfo = function(gameid, cb){
        comms.get_minigame_info(gameid, cb);
    };

    // Launches a game
    hub.launchGame = function(gameId){
        // Get the minigame info
        comms.launch_minigame(gameId, function(data){
            comms.get_bag(function(bag){
                if(data.err){
                    window.utils.addError(data.err);
                    return;
                }


                // Create the iframe
                var frame = document.createElement("iframe");

                // Sandbox the frame
                frame.sandbox = "allow-scripts allow-pointer-lock";
                frame.className = "game-frame";
                frame.src = "/views/game_container.html";

                // Create a channel
                var channel = new MessageChannel(),
                // Create a new GameCoordinator
                    gc = new GameCoordinator(frame, channel),
                    mess = new GameMessenger(frame, channel, gc);

                // Remove the hub and replace with the iframe!
                container.removeChild(hubCanvasContainer);
                container.appendChild(frame);


                mess.init({
                    gameId : data.gameId,
                    sessionId : data.sessionId,
                    version : data.version,
                    scripts : data.scriptURLs,
                    entryObject : data.entryObject,
                    assetBaseURL : data.assetBaseURL,
                    avatarImage : hub.avatarImage.src,
                    health : hub.health,
                    statuses : hub.cloneStatuses(),
                    bag : bag
                });


            });
        });
    };


    // Finish a game
    hub.finishGame = function(coord, gameId, sessionId, score, currency){
        // Kill the channel
        coord.channel.port1.close();


        // Return to hub here!
        container.removeChild(coord.frame);
        container.appendChild(hubCanvasContainer);

        draw.healthbar.updateHealthSymptoms(hub.health, hub.symptoms);
        draw.healthbar.updateStatuses(hub.statuses);

        draw.update_avatar();

        // Send game data to the server
        comms.finish_minigame(gameId, score, currency, function(data){
            if(data && data.err){
                utils.addError(JSON.stringify(data.err));
            }else{
                // Print score here?
                utils.addSuccess("Congratulations!");
                utils.addSuccess("Score: " + score);
                utils.addSuccess("Currency earnt: " + currency);
            }
        });
    };






    /*************** Game related classes that communicate with the game's iFrame and the hub ****************/

    // Simple class to coordinate the game api and the hub
    function GameCoordinator(frame, channel){
        this.frame = frame;
        this.channel = channel;
    }
    // Add to the prototype
    GameCoordinator.prototype.finishGame = function(data){
        hub.finishGame(this, data.gameId, data.sessionId, data.score, data.currency);
    };

    GameCoordinator.prototype.useCarriable = function(data, cb){
        hub.useCarriable(data.carriableId, function(bag, health, statuses, avatarImage, symptoms){
            cb({
                bag : bag,
                health : health,
                statuses : statuses,
                avatarImage : avatarImage.src,
                symptoms : symptoms
            });
        });
    };

    GameCoordinator.prototype.getCarriableInfo = function(data, cb){
        hub.getCarriable(data.carriableId, function(carriable){
            cb({
                carriable : carriable
            });
        });
    };

    GameCoordinator.prototype.modifyHealth = function(data, cb){
        hub.modifyHealth(data.changeVal, function(health, avatarImage, symptoms){
            cb({
                health : health,
                avatarImage : avatarImage.src,
                symptoms : symptoms
            });
        });
    };

    GameCoordinator.prototype.modifyStatus = function(data, cb){
        hub.modifyStatus(data.statusId, data.changeVal, function(id, value){
            cb({
                id : id,
                value : value
            });
        });
    };

    // Assume we are always ready
    GameCoordinator.prototype.ready = function(data, cb){
        cb({ready : true});
    };



    // Interface to talk to the game
    function GameMessenger(frame, channel, coordinater, onReady){
        this.channel = channel
        this.port = channel.port1;
        this.coordinater = coordinater;
        this.frame = frame;

        this.ready = false;
        this.onReady = onReady;
    }

    GameMessenger.prototype.init = function(obj){
        this.initChannel().initHandshake(obj);
        return this;
    };

    GameMessenger.prototype.initHandshake = function(obj){
        var sendHandshake = function(){
            try{
                if(this.ready){
                    throw 0;
                }

                this.frame.contentWindow.postMessage(obj, '*', [this.channel.port2]);


                window.setTimeout(sendHandshake, 250);

            }catch(e){
                this.gameReady();
            }

        }.bind(this);

        window.setTimeout(sendHandshake, 250);

        return this;
    };


    GameMessenger.prototype.gameReady = function(){
        this.ready = true;
        this.onReady && this.onReady();
    };

    GameMessenger.prototype.initChannel = function(){
        var self = this;
        this.port.onmessage = function(e){
            var gc = self.coordinater,
                port = self.port,
                data = e.data,
                type = data.type,
                uid = data.uid,
                d = data.data,

                func = gc[type];

            if(func && typeof func === "function"){
                func.call(gc, d, function(response){
                    port.postMessage({
                        type : type,
                        uid : uid,
                        data : response
                    });
                });
            }
        };

        return this;
    };



    window.hub = hub;
})();