(function(){

    var assets = {
        images : [],
        audio : []
    },
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
            var loadingContainer = document.createElement("div");
                loadingBar = generateLoadingBar();
                loadingText = document.createElement("div");

            loadingContainer.className = "loading-container";

            loadingText.innerHTML = "Loading...";

            loadingContainer.appendChild(loadingText);
            loadingContainer.appendChild(loadingBar);
            container.appendChild(loadingContainer);

            // Get the list of images

            // Load all those images into memory



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
        }
    }




})();
