(function(){
    "use strict";


    /** Implimentations of the Bag and Statuses, taken from the server hub.js ***/
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
        var i = this.carriables.indexOf(itemId);
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
    function base64ToImg(base64){
        var i = document.createElement("img");
        i.src = "data:image/png;base64," + base64;
        return i;
    }


    // Configs
    var carriables = {
        101 : {
            id: 101,
            name: "Apple",
            url : "api/carriables/apple/sprite.png",
            effects: [
                {
                    id: 1,
                    amount: 3
                },
                {
                    id: "hp",
                    amount: 10
                }
            ]
        },

        102 : {
            id: 102,
            name: "Insulin",
            url : "api/carriables/insulin/sprite.png",
            effects: [
                {
                  id: 1,
                  amount: -10
                }
            ]
        },

        103 : {
            id: 103,
            name: "Kidney Medicine",
            url : "api/carriables/kidneymedicine/sprite.png",
            effects: [
                {
                name: 3,
                amount: 20
                }
            ]
        }
    },

    statuses = {
        id: 1,
        name: "Blood Sugar",
        min: 0,
        max: 20,
        healthy_min: 7,
        healthy_max: 14,
        isNumber: true
    },


    defaultOptions = {
        startHp : 100,
        statuses : [1],
        avatarImage : base64ToImg("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NuusqGWuH5QIRVHcK2FAjBi2GWFYPoSZd//444+w2+2Ijo7WW85xHKphlJSUwGQy4YEHHgAR3aO3ptMhMjKSzjrrLCiKAofDgeJau96SmiVEIXfumM1mw08/Be7k7UBHGJYPefTRR7Nc+9RlZgZe1P/I+2vAzIiMjMS9994brE1BLzZv3lxM5DSEe95dq7ecFrn8wvMBOHfXmTZtmtjavo0Iw/IRzDzr448/dg9jT0s36C3Ji28KgYoK52jasGHDgnJksAXOu+KKKwA4m+NriwLzI33HgBj3NK2GTVfF1vZtIDDf3eBk9uHDhyHLMiIiItDNLOutx4sPVn0PZgYz4/XXX9dbjs8gotz//Oc/0DQNsizjk2836S2pRRISEuAaIJwxYwaYubvOkoIOYVg+gJljHnnkEQCAzWbDLRcO0FmRNyU2Ga5E1tjYWPTo0aOjRFcAgO7du2cOHz4cmqahoKBAbzktMnz4cPdGJO+88w569uxZPHLkSP7www+5AWFgJ0Hkg5wCzLwbQPc777wzduvWrcjLy4PD4YCqqqioqIAsO6Oqp2Zcg37hgdMB/O9vD2DDz84pLEuXLsWkSZM63PteXV3N3bp1g81mQ69evfCfPw/RW1KzXPrUp+5Il5khyzJUVYUsy+jWrRsSEhJw8cUXY968edlEFLj7wemEiLBOADOnFRQU8CuvvMKDBw/miIiILCKKfeONN7BlyxYUFxejtLQUFRUVUBQFqqrinEEDA8qsAGDn73shSRL69u2LiRMnztRbT3sQERFBffv2BRHh8OHDKLNoektqli5durjvG41Gd8TFzDh27Bi2bduGp556CmazOevWW2/lyspKFkvTNNLhfml9ATP/a+/evXNmzJiBdevWgZndHaaAMyk0MjISRASj0ejuaA8JCcHC64bprN6bMouGPz//CQBg1apVGD9+fId9z1evXs3jxo0DAKSmpuL16UN1VnRyNhyuwbJdeThy5AgqKyuhqiokSXL3yRER+vfvjy1btohFACEM6ziYuf6ss84yZ2dnux4DgHvN8xvGnoNhKV3Qxainytbz4JfZyM7ORlJSEg4dOrSnA40OHgcz705KSsoqKSmB3W7Hqken6i3plJm97jB+/vln92PPH8lLL70Uy5YtyyGiwFxgzQ8IwwLAzCYisr711lt82223QZIkd0R119RLMSEtVG+J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"),
        startBag : [101, 101, 102, 103],
        gameAssetUrl : "assets",
        finishGameFunction : function(score, currency){
            alert("Score was: " + score + " \nCurrency was: " + currency);
        }
    };


    function GameLauncher(options){
        // Fill in the passed in options with default ones
        options = options || {};
        for(var o in defaultOptions){
            if(!options[o]){
                options[o] = defaultOptions[o];
            }
        }
        this.options = options;

        this.bag = new Bag();
        this.bag.setCarriables(options.startBag);

        this.statuses = options.statuses.map(function(s){
            return new Status(s);
        });

        this.health = options.startHp;
        this.avatarImage = options.avatarImage;
    }


    GameLauncher.prototype.generateSymptoms = function(health, cb){
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

    //
    GameLauncher.prototype.modifyHealth = function(changeVal, cb){
        // Add the mutlipliers
        var multiplier = 1,
            value = changeVal;
        for(var stat in this.statuses){
            multiplier *= this.statuses[stat].getMultiplier();
        }
        
        //The multiplier makes bad health changes go up, and good health changes go down
        if(value < 0) value = Math.floor(value * multiplier);
        else value = Math.floor(value / multiplier);
        
        // Keep health between 100 and 0;
        this.health = Math.max(0, Math.min(100, this.health + value));

        this.generateSymptoms(this.health, function(symps){
            cb(this.health, this.avatarImage, symps);
        }.bind(this));
    };

    //
    GameLauncher.prototype.useCarriable = function(carriableId, cb){
        try {
            this.bag.useItem(carriableId);


            var cfg = carriables[carriableId];

            if(!cfg){
                throw new Error("Carraible not defined");
            }
        }catch(e){
            cb({
                err : e.message
            });
            return;
        }

        var effects = cfg.effects,
            t = this,
            l = latch(effects.length, function(){
                var o = {};
                // THIS WILL NEED TO INCLUDE THE NAME
                for(var status in this.statuses){
                    o[status] = t.statuses[status].value;
                }

                t.generateSymptoms(t.health, function(symps){
                    cb(
                        t.cloneBag(),
                        t.health,
                        o,
                        t.avatarImage,
                        symps
                    );
                });
            }.bind(this));

        effects.forEach(function(effect){
            if(effect.id === "hp"){
                this.modifyHealth(effect.amount, l);
            }else{
                this.modifyStatus(effect.id, effect.amount, l);
            }
        }, this);
    };

    //
    GameLauncher.prototype.modifyStatus = function(statusId, changeVal, cb){
        var status = this.statuses[statusId];
        if(status){
            status.addToValue(changeVal);

            cb(status.id, status.value);
        }else{
            cb({
                err : "User does not have that status"
            });
        }
    };

    GameLauncher.prototype.cloneStatuses = function(){
        var o = {};
        for(var si in this.statuses){
            var s = this.statuses[si];
            o[s.id] = {
                name : s.name,
                value : s.value
            };
        }
        return o;
    };

    GameLauncher.prototype.cloneBag = function(){
        var b = {};
        this.bag.getCarriables().forEach(function(c){
            if(carriables[c]){
                b[c] = carriables[c];
            }
        });

        return b;
    };

    // Launches a game
    GameLauncher.prototype.launchGame = function(entryObject, canvas){

        var assetBaseURL = this.options.gameAssetUrl;
        // Create the API object
        var api = new GameAPI(
            1, // Dummy
            "Test Game", // Dummy
            1, // Dummy
            canvas,
            null,
            assetBaseURL,
            1, // Dummy
            this // Not implemented normally, this allows the gameAPI to know which launcher to manipulate
        );




        // Assume the scripts are loaded
        entryObject.run.call(entryObject, api, canvas, assetBaseURL, this.health, this.cloneStatuses(), this.cloneBag());
    };

    
    
    // Object for a Game API system
    function GameAPI(gameId, gameName, sessionId, canvas, canvasContainer, assetBaseURL, version, launcher){
        this.gameName = gameName;
        this.assetBaseURL = assetBaseURL;
        this.version = version;
        this.canvas = canvas;

        this.launcher = launcher;

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
            this.launcher.options.finishGameFunction(score, currency);
        };

        proto.useCarriable = function(carriableId, cb){
            var t = this;
            this.launcher.useCarriable(carriableId, function(bag, health, statuses, avatarImage, symptoms){
                cb.call(t, bag, health, statuses, avatarImage, symptoms);
            });
        };

        proto.modifyHealth = function(changeVal, cb){
            var t = this;
            this.launcher.modifyHealth(changeVal, function(health, avatarImage, symptoms){
                cb.call(t, health, avatarImage, symptoms);
            });
        };

        proto.modifyStatus = function(statusId, changeVal, cb){
            var t = this;
            this.launcher.modifyStatus(statusId, changeVal, function(data){
                cb.call(t, data.id, data.newValue);
            });
        };

        proto.getAvatarImage = function(){
            return this.launcher.avatarImage;
        };

        proto.getAssetURL = function(asset){
            return this.assetBaseURL + "/" + asset;
        };

    })(GameAPI.prototype);



    window.GameLauncher = GameLauncher;
})();