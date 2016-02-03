(function(){
    "use strict";

    function latch(num, complete){
        return function(){
            if(!--num){
                complete();
            }
        };
    }

    function clamp(num, min, max){ // Keeps a given number in some bounds
        return Math.max(min, Math.min(num, max));
    };


    var info = [
        {
            location : 0,
            text : [

            ]
        },
        {
            location : 1000,
            text : [

            ]
        },
        {
            location : 2000,
            text : [

            ]
        },
        {
            location : 3000,
            text : [

            ]
        },
        {
            location : 3500,
            text : [

            ]
        },
        {
            location : 4000,
            text : [

            ],
            image : {
                asset : "er",
                w : 650,
                h : 250
            }
        },

        {
            location : 5500,
            text : [

            ]
        },
        {
            location : 6000,
            text : [

            ]
        },
        {
            location : 6500,
            text : [

            ]
        },
        {
            location : 7500,
            text : [

            ],
            image : {
                asset : "page_model",
                w : 800,
                h : 400
            }
        },
        {
            location : 9000,
            text : [

            ],
            image : {
                asset : "page_cvalid",
                w : 800,
                h : 400
            }
        }
    ];



    var animFrame;

    function run_extern(api, div, assetBaseURL, startHp, stats, bag){
        var canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d"),
            width = canvas.width = 1024,
            height = canvas.height = 800,
            a;

        div.appendChild(canvas);



        // Load all of the assets
        var assets = {
            background : "background.png",
            //left : "left.png",
            //right : "right.png",
            house : "house.png",
            rock : "rock.png",

            er : "er.png",

            page_index : "page_index.png",
            page_cvalid : "page_cvalid.png",
            page_model : "page_model.png",
            page_signup : "page_signup.png",
            page_login : "page_login.png",
            page_uploads : "page_uploads.png",
            page_uploaded : "page_uploaded.png",
            page_collect : "page_collect.png",

            route_testing : "route_testing.png",
            devtools : "devtools.png"
        };

        // Prepend assets directory to all the assets
        for(a in assets){
            assets[a] = api.getAssetURL(assets[a]);
        };

        // Load all of the assets into memory
        var l = latch(Object.keys(assets).length, run);

        function loadAsset(assets, a){
            var i = document.createElement("img");
            i.addEventListener("load", function(){
                assets[a] = this;
                l();
            });
            i.src = assets[a];
        }

        for(a in assets){
            loadAsset(assets, a);
        }



        function startLoop(){
            // Create the loop
            var reqAnimFrame = window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                (function(){
                    throw new Error("Game not supported in this browser/version: No support for rAF");
                })();
            var last = null;
            var cb = function(ts){
                var dt = Math.min(80, (ts - last))/1000;
                last = ts;
                // Do shizz
                if(cv.update(dt)){
                    cv.draw();
                }
                reqAnimFrame(cb);
            };
            animFrame = reqAnimFrame(function(ts){
                last = ts;
                cv.draw();
                cb(ts);
            });
        }


        var keysDown = {}; // The keys currently being pressed

        var keydown_func = function(e){
            var kc = e.keyCode;
            keysDown[kc] = true;
        },
        keyup_func = function(e){
            delete keysDown[(e % 1 === 0)?e:e.keyCode];
        }


        function run(){
            // Add avatar image
            assets.left = assets.right = api.getAvatarImage();
            // Attach event listeners for keys
            window.addEventListener("keydown", keydown_func);
            window.addEventListener("keyup", keyup_func);

            startLoop();
        }

        /*document.getElementById("move-right").addEventListener("mousedown", function(e){
            e.preventDefault();
            keysDown[39] = true;
        });
        document.getElementById("move-right").addEventListener("mouseup", function(e){
            e.preventDefault();
            delete keysDown[39];
        });

        document.getElementById("move-left").addEventListener("mousedown", function(e){
            e.preventDefault();
            keysDown[37] = true;
        });
        document.getElementById("move-left").addEventListener("mouseup", function(e){
            e.preventDefault();
            delete keysDown[37];
        });

        document.getElementById("move-right").addEventListener("touchstart", function(e){
            e.preventDefault();
            keysDown[39] = true;
        });
        document.getElementById("move-right").addEventListener("touchend", function(e){
            e.preventDefault();
            delete keysDown[39];
        });

        document.getElementById("move-left").addEventListener("touchstart", function(e){
            e.preventDefault();
            keysDown[37] = true;
        });
        document.getElementById("move-left").addEventListener("touchend", function(e){
            e.preventDefault();
            delete keysDown[37];
        });*/



        var cv = (function(){
            var direction = "right", // The direction the player is moving in (left or right)
                jump = false,
                up = 0,
                maxUp = 50,
                location = 0, // The location of us in the game currently (in px)
                minLoc = 0,
                maxLoc = 10000, // Location the CV ends
                speed = 800, // 100px/s
                health = startHp,
                finished = false;


            function finish(score){
                if(!finished){
                    finished = true;
                    cancelAnimationFrame(animFrame);
                    window.removeEventListener(keyup_func);
                    window.removeEventListener(keydown_func);
                    keysDown = [];
                    return api.finishGame(score, score / 10);
                }else{
                    return;
                }
            }


            function detectColision(){
                return true; // Dumb
            }


            function update(dt){
                if(location === maxLoc){
                    finish(1000);
                }

                var updated = false;
                // Check the player direction
                // RIGHT
                if(keysDown[39]){
                    direction = "right";
                    location = clamp(location + (speed * dt), minLoc, maxLoc);
                    updated = true;
                }
                // LEFT
                if(keysDown[37]){
                    direction = "left";
                    location = clamp(location - (speed * dt), minLoc, maxLoc);
                    updated = true;
                }

                // UP
                if(keysDown[38] && !jump){
                    jump = (up === 0);
                    updated = true;
                }

                if(jump && up >= maxUp){
                    jump = false;
                    updated = true;

                    // Check colision
                    if(detectColision()){
                        api.modifyHealth(-5, function(newHealth, avatarImage){
                            health = newHealth;
                            assets.left = assets.right = avatarImage;
                            if(health <= 0){
                                finish(0);
                            }
                        });
                    }
                }

                if(jump){
                    up = clamp(up + (500 * dt), 0, maxUp);
                    updated = true;
                }else{
                    if(up > 0){
                        up = clamp(up - (500 * dt), 0, maxUp);
                        updated = true;
                    }

                }


                return updated;
            }

            function draw(){
                ctx.save();
                ctx.clearRect(0,0, width, height); // Clear the screen (blank canvas)

                // Draw the background
                ctx.save();
                ctx.fillStyle = "#19c4ef";
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(assets.background, width - ((location/(maxLoc * 17)) * location), 0, width, height);
                ctx.restore();

                // Add the house if required
                var hLocation = -200;
                if((hLocation < location + width/2 + 200) && (hLocation > location - width/2 - 200)){
                    ctx.drawImage(assets.house, (hLocation - location) + width/2 - 200, 300, 500 - 200, height - 200 - 300);
                }


                ctx.save();
                ctx.fillStyle = "green";
                ctx.fillRect(0, height - 200, width, 200);
                ctx.restore();

                // Add rock if required
                var rLocation = maxLoc + 250;
                if((rLocation < location + width/2 + 200) && (rLocation > location - width/2 - 200)){
                    ctx.drawImage(assets.rock, (rLocation - location) + width/2 - 200, 0, 1000, height + 20);
                }



                // Draw in the descriptions for the 'CV'
                ctx.save();
                ctx.font = "32px sans-seriff";
                ctx.textBaseline = "top";
                info.forEach(function(b){
                    var l = b.location,
                        img = b.image,
                        rightCutoff = location + width/2 + 200,
                        leftCutoff = location - width/2 - 200;

                    if(img){
                        leftCutoff -= (50 + img.w);
                    }

                    if(l < rightCutoff && l > leftCutoff){

                        var loc = (l - location) + width/2 - 200;
                        ctx.fillStyle = "white";
                        ctx.fillRect(loc, 100, 400, 300);
                        ctx.strokeRect(loc, 100, 400, 300);
                        ctx.fillStyle = "black";
                        b.text.forEach(function(t, i){
                            ctx.fillText(t, loc + 5, 100  + (32 * (i)));
                        });

                        if(img){
                            ctx.drawImage(assets[img.asset], loc + 450, 100, img.w, img.h);
                        }
                    }
                });
                ctx.restore();




                // Draw the player
                var player = (direction === "right") ? assets.right : assets.left;
                ctx.drawImage(player, width/2 - 50, height - 175 - 170 - up, 171, 171);


                // DEBUG, write the location value to the top left hand corner
                /*ctx.save();
                ctx.font = "30px sans-serif";
                ctx.fillText(location, 30, 30);
                ctx.restore();*/

                var barLength = 500;
                ctx.save();
                ctx.fillStyle = "white";
                ctx.fillRect(30, 30, barLength, 50);
                ctx.fillStyle = "red";
                ctx.fillRect(30, 30, barLength * (health/100), 50);
                ctx.strokeStyle = "black";
                ctx.strokeRect(30, 30, barLength, 50);
                ctx.restore();


                ctx.restore();
            }



            return {
                update : update,
                draw : draw
            };
        })();



    };



    window.dummyGame = { run : run_extern };

})();
