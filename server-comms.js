"use strict";

/*
 * File to set up the socket communication and expose and API to send data to and from the server
 */


/* Class to communicate with a specific user, exposes functions to do this */
function Comms(socket){
    var userId = socket.userId;

    // Define these as properties for the prototype to use
    Object.defineProperties(this, {
        userId : { get: function () { return userId } },
        socket : { get: function () { return socket } }
    });

    this.listeners = {};
};

Comms.prototype.setEventListeners = function (funcs, thisValue){
    for(var name in funcs){
        this.addEventListener(name, funcs[name], thisValue);
    }
};
Comms.prototype.addEventListener = function (name, func, thisValue){
    if(thisValue){
        func = func.bind(thisValue);
    }
    this.socket.on(name, func);
    this.listeners[name] = func;
};
Comms.prototype.send = {
    notification : function (level, message){
        this.socket.emit("notification", {
            level : level,
            message : message
        });
    }
};





module.exports = function (server, auth, config, hub){
    var io = require("socket.io")(server);



    // Set the auth middleware
    io.use(auth.socket_middleware);

    io.on("connection", function (socket){
        console.log("      uid " + socket.userId + ": socket created");
        // On connection create a new Comms class and let that deal with creating bindings and sending data
        var h = hub.create(socket.userId, new Comms(socket));

        // Exit the hub on disconnect, so it can clean itself up gracefully
        socket.on("disconnect", function (){
            console.log("      uid " + socket.userId + ": socket disconnect");
            h.exit();
        });
		
    });


    return io;
};
