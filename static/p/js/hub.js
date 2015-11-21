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
        draw;



    // Clear the window functions so games cannot use them
    function clearWindowFunctions(){
        delete window.comms;
        delete window.draw;
        delete window.hub;
    }

    function recoverWindowFunctions(){
        window.comms = comms;
        window.draw = draw;
        window.hub = hub;
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
        for(i in assets){
            if(assets.hasOwnProperty(i)){
                o[i] = getAssetsByType(i);
            }
        }

        return o;
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
            innerText.innerHTML = v + "%";
        };
        loadingBar.getProgress = function(){
            return value;
        };

        return loadingBar;
    }


    // The hub object
    var hub = {};

    hub.load = function(){
        // Show loading sign
        var loadingContainer = document.createElement("div"),
            loadingBar = generateLoadingBar(),
            loadingText = document.createElement("div");

        loadingContainer.className = "loading-container";

        loadingText.innerHTML = "Loading...";

        loadingContainer.appendChild(loadingText);
        loadingContainer.appendChild(loadingBar);
        container.appendChild(loadingContainer);

        // Open the socket connection
        comms.createSocket(function(){
            if(!initalFilesLoaded){
                // Get the list of images
                comms.get_hub_backgroud_image(function(background){
                    comms.get_user_equipped_items(function(items){

                        // How much do we load?
                        var toLoad = Object.keys(items).length + 1,
                            // How much have we loaded
                            loaded = 0,
                            // Is there an error?
                            error = false;

                        function fileLoaded(){
                            loaded++;
                            loadingBar.setProgress(loaded/toLoad * 100);

                            if(loaded === toLoad){
                                loadComplete();
                            }
                        }
                        function fail(){
                            error = true;
                            utils.addError("An image couldn't load");
                            utils.addError(this.src);
                        }

                        // Load the item images
                        for(var item in items){
                            (function(item){
                                var i = document.createElement("img");
                                i.addEventListener("load", function(){
                                    item.image = this;
                                    fileLoaded();
                                });
                                i.addEventListener("error", fail);
                                i.src = item.url;
                            })(items[item]);
                        };

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

                            comms.loadScriptFile("//cdnjs.cloudflare.com/ajax/libs/fabric.js/1.5.0/fabric.min.js", function(){
                                comms.loadScriptFile("/p/js/draw_canvas.js", function(){
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

                                    draw.init(hubCanvas, getAssetsByType("images"));
                                });
                            }, false);
                        }

                    });
                });

            }

        });
    };

    hub.launchGame = function(gameId){
        // Get the minigame info
        comms.launch_minigame(gameId, function(data){
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

            // Load the scripts into memory
            var latch = (function(num, complete){
                return function(){
                    num--;
                    if(num === 0){
                        complete();
                    }
                }
            })(data.scriptURLs.length, function(){
                container.removeChild(hubCanvasContainer);
                canvasContainer.appendChild(canvas);
                container.appendChild(canvasContainer);

                var e = window[data.entryObject];
                e.run.call(e, api, canvas, data.assetBaseURL);
            });

            data.scriptURLs.forEach(function(script){
                comms.loadScriptFile(script, latch, false);
            });


        });
    }

    hub.getAssetsByType = getAssetsByType;







    // Object for a Game API system
    function GameAPI(gameId, gameName, sessionId, canvas, canvasContainer, assetBaseURL, version){
        this.gameName = gameName;
        this.assetBaseURL = assetBaseURL;
        this.version = version;
        this.canvas = canvas;


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

                //return to hub here!
                container.removeChild(this.getCanvasContainer());
                container.appendChild(hubCanvasContainer);

                // Recover the window functions
                recoverWindowFunctions();
            }.bind(this));
        };

        proto.useItem = function(itemId, cb){
            comms.use_item(itemId, cb);
        };

        proto.modifyHealth = function(changeVal){
            comms.modify_hp_value(changeVal, cb);
        };

        proto.modifyStatus = function(statusName, changeVal){
            comms.set_status_value(statusName, changeVal, cb);
        };

        proto.getAvatarImage = function(){

        };

        proto.getAssetURL = function(asset){
            return this.assetBaseURL + "/" + asset;
        };

    })(GameAPI.prototype);



    window.hub = hub;
})();
