"use strict";

/**
 * Module to set up the socket communication and expose and API to send data to and from the server
 *
 * @module comms
 */


/**
 * Class to communicate with a specific user, exposes functions to do this.
 *
 * @constructor
 * @param {external:"socket.io"~socket} socket - The socket.io Socket object for the connection
 */
function Comms(socket){
    var userId = socket.userId;

    // Define these as properties for the prototype to use
    Object.defineProperties(this, {
        userId : { get: function () { return userId; } },
        socket : { get: function () { return socket; } }
    });

    this.listeners = {};
}

/**
 * Adds event listners to this socket connection
 *
 * @param {Object<string, function>} funcs     - Map of the name of the listener to the function to call
 * @param {Object}                   thisValue - The value to bind this to when the listener is fired
 */
Comms.prototype.setEventListeners = function (funcs, thisValue){
    for(var name in funcs){
        this.addEventListener(name, funcs[name], thisValue);
    }
};
/**
 * Adds an event listner to this socket connection
 *
 * @param {string}   name      - The name of the event to watch
 * @param {function} func      - The function to call when the event is triggered
 * @param {Object}   thisValue - The value to bind this to when the listener is fired
 */
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


/**
 * Initialises the Socket.io module and begins listening for socket requests
 *
 * @param {external:"http.Server"} server - The web server to listen for requests on
 * @param {module:auth~auth}       auth   - The authentication object
 * @param {module:config}          config - The config.js object
 * @param {module:hub~hub}         hub    - The hub object
 * @return {external:"socket.io"~socket} The initialised socket.io socket object
 */
module.exports = function (server, auth, config, hub){
    var io = require("socket.io")(server);

    // record players online     key:value  ==>  socket.userId: socket
    // By clouds8
    var sockets = {};

    function connect_middleware(socket, next){
        console.log("      uid " + socket.userId + ": socket created");
        // On connection create a new Comms class and let that deal with creating bindings and sending data
        hub.create(socket.userId, new Comms(socket), function(h){
            if(h.error){
                next(new Error("Could not create hub"));
                return;
            }

            socket.hub = h;

            // Exit the hub on disconnect, so it can clean itself up gracefully
            socket.on("disconnect", function (){
                console.log("      uid " + socket.userId + ": socket disconnect");
                h.exit();
            });

            next();
        });

    }



    // Set the auth middleware
    // io.use(auth.socket_middleware);

    // Setup middleware (bit of a hack)
    // io.use(connect_middleware);


    /**
     * move the connect_middleware and auth.socket_middleware to io.on("connection")
     *By clouds8
     *
     * @param  {[type]} "connection" [description]
     * @param  {[type]} deal with connection
     * @return {[type]}              [description]
     */
    io.on("connection", function (socket){
      var auth_socket_middleware = new Promise(function(resolve, reject) {
          auth.socket_middleware(socket, function (err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          })
        });

        auth_socket_middleware
        .then(function () {
          if(socket.userId) {
              sockets[socket.userId] = socket;
              // console.log('show the sockets alive:')
              // console.log(sockets);
          }

          socket.on("disconnect", function(){
              console.log("user " + socket.userId + "  left");
              delete sockets[socket.userId];
          });
        })
        .then(function () {
          connect_middleware(socket, function (err) {
            if (err) {
              throw err;
            } else {
                return;
            }
          });
        })
        .catch(
          function (err) {
            console.error(err);
          }
        )
    });


    return io;
};
