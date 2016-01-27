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



    var init = false;
    function initHandle(e){
        if(!init){
            init = true;

            var sourceWindow = e.source,
                windowOrigin = e.origin || e.originalEvent.origin; // For chrome

            var d = e.data;

            loadScripts(d.scripts, windowOrigin, function(){
                launch(sourceWindow, windowOrigin, d);
            });
        }
    }

    function loadScripts(scripts, windowOrigin, cb){
        var l = latch(scripts.length, cb),
            stag = document.getElementsByTagName('script')[0];


        scripts.forEach(function(url){
            var script = document.createElement("script");
            script.addEventListener("load", l);
            script.src = windowOrigin + "/" + url;

            stag.parentNode.insertBefore(script, stag);
        });
    }


    function launch(sourceWindow, windowOrigin, data){
        var div = document.getElementById("game-container"),
            // Create the dispatcher
            disp = new Dispatcher(sourceWindow, windowOrigin);

        // Add and remove events
        window.removeEventListener("message", initHandle);
        window.addEventListener("message", function(e){
            disp.dispatch(e.data);
        });

        // Confirm we are ready
        disp.sendMessage("ready");

        var api = new GameAPI(disp, data.gameId, data.sessionId, div, data.version),
            eo = window[data.entryObject];

        // Just in case they lose track of it!
        window.getGameAPI = function(){
            return api;
        };

        eo.run.call(eo, api, div, data.assetBaseURL, data.health, data.statuses, data.bag);
    }


    

    function GameAPI(dispatcher, gameId, sessionId, baseAssetURL, div, version){
        this.gameId = gameId;
        this.sessionId = sessionId;
        this.baseAssetURL = baseAssetURL;
        this.div = div;
        this.version = version;

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
                cb.call(self, d.bag, d.health, d.statuses, d.avatarImage, d.symptoms);
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
                cb.call(self, d.health, d.avatarImage, d.symptoms);
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


        this.getAvatarImage = function(cb){
            dispatcher.sendMessage("modifyStatus", {},
                function(d){
                    cb.call(self, d.avatarImage);
                }
            );
        };


        this.getAssetURL = function(asset){
            return dispatcher.windowOrigin + "/" + baseAssetURL + "/" + asset;
        };
    }



    function Dispatcher(sourceWindow, windowOrigin){
        this.sourceWindow = sourceWindow;
        this.windowOrigin = windowOrigin;

        this.callbacks = {};
    }
    (function(p){
        p.generateUID = function(){
            var uid;
            do {
                uid = Math.floor(Math.random() * 24000);
            } while (this.callbacks[uid]);

            return uid;
        };


        p.sendMessage = function(type, data, cb){
            var uid = this.generateUID();

            if(cb){
                this.callbacks[uid] = cb;
            }

            this.sourceWindow.postMessage({
                type : type,
                uid : uid,
                data : data
            }, this.windowOrigin);
        };


        p.dispatch = function(data){
            var uid = data.uid,
                cb = this.callbacks[uid];

            if(cb){
                delete data.uid;
                delete this.callbacks[uid];

                cb(data);
            }
        };


    }(Dispatcher.prototype));




    // Activate init handle
    window.addEventListener("message", initHandle);

})();
