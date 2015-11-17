(function(){
    "use strict";

    var assets = {
        images : [],
        audio : []
    },
        initalFilesLoaded = false,
        canvas,
        container = document.getElementById("main-content-area");


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

    
    window.hub = {
        load : function(){
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
                // Get the list of images
                comms.get_hub_backgroud_image(function(background){
                    comms.get_user_equipped_items(function(items){
                        // For now we will set these manually
                        items = [
                            {
                                "id": 1,
                                "slot": "MIRROR",
                                "url": "/assets/img/hub/mirror.png",
                                "left": "0.74", "top": "0.26", "scale": 1, "select_scale": 1.5
                            },
                            {
                                "id": 2,
                                "slot": "BACKPACK",
                                "url": "/assets/img/hub/backpack.png",
                                "left": 0.45, "top": 0.51, "scale": 1, "select_scale": 1.5
                            }
                        ];

                        // How much do we load?
                        var toLoad = items.length,
                            loaded = 0,
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

                        items.forEach(function(item){
                            var i = document.createElement("img");
                            i.addEventListener("load", function(){
                                item.image = this;
                                fileLoaded();
                            });
                            i.addEventListener("error", fail);
                            i.src = item.url;
                        });
                        var i = document.createElement("img");
                        i.addEventListener("load", function(){
                            background.image = this;
                            fileLoaded();
                        });
                        i.addEventListener("error", fail);
                        i.src = background.url;
                        

                        function loadComplete(){
                            comms.loadScriptFile("/assets/libs/fabric.js", function(){
                                comms.loadScriptFile("/p/js/draw_canvas.js", function(){
                                    canvas = document.createElement("canvas");
                                    canvas.id = "canvas";

                                    try{
                                        container.removeChild(loadingContainer);
                                    }catch(e){}
                                    container.appendChild(canvas);

                                    initalFilesLoaded = true;

                                    window.draw.init(background, items);
                                });
                            }, false);
                        }

                    });
                });

                // Load all those images into memory

                /*

                // TEMP LOADING FUNCTION
                var p = 0, i = 0;
                while(p <= 100){
                    (function(p, i){
                        window.setTimeout(function(){
                            loadingBar.setProgress(p);
                        }, i * 100);
                    })(p, i);
                    p = p + 10;
                    i++;
                }

                window.setTimeout(function(){
                    // Load in the hub script
                    canvas = document.createElement("canvas");
                    canvas.id = "canvas";

                    // Temp add the images into the dom
                    var i = ["background", "backpack", "mirror"];
                        els = i.map(function(ii){
                            var e = document.createElement("img");
                                e.src = comms.tokeniseGetRequest("/p/images/" + ii +".png");
                                e.id = ii;
                                e.style.display = "none";
                            return e;
                        });

                    container.removeChild(loadingContainer);

                    container.appendChild(canvas);
                    els.forEach(container.appendChild.bind(container));


                    comms.loadScriptFile("/p/js/fabric.js", function(){
                        comms.loadScriptFile("/p/js/draw_canvas.js");
                    });

                }, ++i * 100);
        */
            });
        }
    }




})();
