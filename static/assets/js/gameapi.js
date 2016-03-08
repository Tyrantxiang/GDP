(function(){
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
    // Convert base64 to Img object
    // Does not require the prefix, as this will already be present
    function base64ToImg(base64){
        var i = document.createElement("img");
        i.src = base64;
        return i;
    }


    var init = false;
    function initHandle(e){
        if(!init){
            init = true;

            var sourceWindow = e.source,
                windowOrigin = e.origin || e.originalEvent.origin, // For chrome
                port = e.ports[0],

                d = e.data;

            loadScripts(d.scripts, windowOrigin, function(){
                launch(port, windowOrigin, d);
            });
        }
    }

    function loadScripts(scripts, windowOrigin, cb){
        var l = latch(scripts.length, cb),
            stag = document.getElementsByTagName('script')[0];


        scripts.forEach(function(url){
            var script = document.createElement("script");
            script.addEventListener("load", l);

            // Check if link is relative or absolute
            var u;
            if(url.substr(0,2) === "//" || url.substr(0,4) === "http"){
                u = url;
            }else{
                u = windowOrigin + url;
            }
            script.src = u;

            stag.parentNode.insertBefore(script, stag);
        });
    }


    function launch(port, windowOrigin, data){
        var div = document.getElementById("game-container"),
            // Create the dispatcher
            disp = new Dispatcher(port, windowOrigin);

        // Add and remove events
        window.removeEventListener("message", initHandle);

        port.onmessage = function(e){
            disp.dispatch(e.data);
        };

        // Confirm we are ready
        disp.sendMessage("ready", null, function(){
            var bu = windowOrigin + data.assetBaseURL,
                api = new GameAPI(disp, data.gameId, data.sessionId, base64ToImg(data.avatarImage), bu, div, data.version),
                eo = window[data.entryObject];

            // Just in case they lose track of it!
            window.getGameAPI = function(){
                return api;
            };

            window.focus();

            eo.run.call(eo, api, div, bu, data.health, data.statuses, data.bag);
        });
    }


    

    function GameAPI(dispatcher, gameId, sessionId, avatarImage, baseAssetURL, div, version){
        this.gameId = gameId;
        this.sessionId = sessionId;
        this.baseAssetURL = baseAssetURL;
        this.div = div;
        this.version = version;

        this.avatarImage = avatarImage;

        var self = this;

        this.finishGame = function(score, currency){
            dispatcher.sendMessage("finishGame", {
                gameId : gameId,
                sessionId : sessionId,
                score : score,
                currency : currency
            });
        };

        this.useCarriable = function(carriableId, cb){
            dispatcher.sendMessage("useCarriable", {
                carriableId : carriableId 
            },
            function(d){
                if(self.avatarImage.src !== d.avatarImage){
                    self.avatarImage = base64ToImg(d.avatarImage);
                }
                cb.call(self, d.bag, d.health, d.statuses, this.avatarImage, d.symptoms);
            });
        };


        this.getCarriableInfo = function(carriableId, cb){
            dispatcher.sendMessage("getCarriable", {
                carriableId : carriableId
            },
            function(d){
                cb.call(self, d.carriable);
            });
        };

        this.modifyHealth = function(changeVal, cb){
            dispatcher.sendMessage("modifyHealth", {
                changeVal : changeVal
            },
            function(d){
                if(self.avatarImage.src !== d.avatarImage){
                    self.avatarImage = base64ToImg(d.avatarImage);
                }
                cb.call(self, d.health, self.avatarImage, d.symptoms);
            });
        };


        this.modifyStatus = function(statusId, changeVal, cb){
            dispatcher.sendMessage("modifyStatus", {
                statusId : statusId,
                changeVal : changeVal
            },
            function(d){
                cb.call(self, d.id, d.value);
            });
        };

        this.getAvatarImage = function(){
            return this.avatarImage;
        };

        this.getAssetURL = function(asset){
            return baseAssetURL + asset;
        };
    }



    function Dispatcher(port, windowOrigin){
        this.port = port;
        this.windowOrigin = windowOrigin;

        this.callbacks = [];
    }
    (function(p){
        p.generateUID = function(){
            return this.callbacks.length;
        };


        p.sendMessage = function(type, data, cb){
            var uid = this.generateUID();

            if(cb){
                this.callbacks[uid] = cb;
            }

            this.port.postMessage({
                type : type,
                uid : uid,
                data : data
            });
        };


        p.dispatch = function(data){
            var uid = data.uid,
                d = data.data,
                cb = this.callbacks[uid];

            if(cb){
                this.callbacks[uid] = null; // Remove callback to clear from memory
                                            // Do not delete, so as to prevent the array from becoming sparse
                                            // and negating optimisations
                cb(d);
            }
        };


    }(Dispatcher.prototype));




    // Activate init handle
    window.addEventListener("message", initHandle);

})();
