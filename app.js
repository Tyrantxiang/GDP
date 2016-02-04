"use strict";

/**
 * The entry point to the application. Requires all the needed libraries and files, sets up the routes and starts the web server
 *
 * @file
 */

 /**
  * Node HTTP server object
  *
  * @external "http.Server"
  * @see {@link https://nodejs.org/api/http.html#http_class_http_server}
 */
 /** 
  *
  * @external express
  * @see {@link http://expressjs.com/en/4x/api.html}
  */
 /**
  * Express request object
  * @name external:express~req
  *
  * @see {@link http://expressjs.com/en/4x/api.html#req}
  */
  /**
  * Express response object
  * @name external:express~res
  *
  * @see {@link http://expressjs.com/en/4x/api.html#res}
  */
  /**
   * Express route function, a function that is used in an express route to serve content to the client
   *
   * @typedef {function} express_route
   * @param {external:express~req} req
   * @param {external:express~res} res
   */
   /**
   * Express middleware function, a function that can be called in the routing stack to augment the result
   *
   * @typedef {function} express_middleware
   * @param {external:express~req} req
   * @param {external:express~res} res
   * @param {function} next - The next middleware in the sequence
   */

   /**
    * Socket.io library
    * @external "socket.io"
    *
    * @see {@link http://socket.io/docs/server-api/}
    */
    /** 
     * A {@link external:"socket.io"|socket.io} socket object
     *
     * @name external:"socket.io"~socket
     *
     * @see {@link http://socket.io/docs/server-api/#socket}
     */
    /**
    * Socket.io middleware function, a function that is called before a socket is opened
    *
    * @typedef {function} socket_middleware
    * @param {external:"socket.io"~socket} socket
    * @param {function} next - The next middleware in the sequence
    */

var srcLoc = "src",
    path = require("path"),
    internalRequire = function(file){
        return require("./" + path.join(srcLoc, file));
    },
    config = internalRequire("config.js");

// Set up the database
internalRequire("database/database.js")
    .init(
        startApp,
        dbFailure,
        config.database.getSettings(
            config.database.getDefaultSchema()
        )
    );


function startApp(db){
    var express = require("express"),
        app = express(),
        port = process.env.PORT || config.app.getPort() || 3000,
        server = app.listen(port),


    // Other libary requires
        parser = require("body-parser"),
        morgan = require("morgan"),
        upload_multer = require("multer")({ dest: "uploads/" });



    // App requires
    var auth = internalRequire("auth.js")(db),
        hub = internalRequire("hub.js")(config, db),
        userapi = internalRequire("user-api.js")(config, db),
        superuserapi = internalRequire("superuser-api.js")(config, db);


    app.use(morgan("dev"));

    // Body parser middleware
    app.use(parser.json());
    app.use(parser.urlencoded({ extended : true }));

    // Set up the authentication middleware
    app.use([/*"/games",*/ "/p"], auth.express_middleware);
    
    // Set the static files to be served
    app.use("/", express.static("static"));


    // Routes
    app.get("/", function (req, res){
        res.sendFile(__dirname + "/static/index.html");
    });

    app.post("/authenticate", auth.authenticate);

    // Routes to serve semi static files
    app.get("/games/:game/:fileType/:filename", config.games.serveFile);
    app.get("/carriables/:carriable/:filename", config.carriables.serveFile);
    app.get("/items/:item/:filename", config.items.serveFile);

    // User http RESTful API routes
    app.get("/user/get_conditions_list", userapi.get_conditions_list);
    app.post("/user/validate_username", userapi.validate_username);
    app.post("/user/validate_dob", userapi.validate_dob);
    app.post("/user/sign_up", userapi.sign_up);
    
	//Create admin user
	db.checkUsernameExists('admin').then(function(exists){
		if(exists) return Promise.resolve();
		else return db.createUser({ username : 'admin', password : 'changeme', dob : new Date(946684800000) });
	}).then(function(a){
		if(a) console.log(a);
	}).catch(console.log);

	//Superuser http API routes
    // These require uploads, which needs to be the first middleware
    app.use(["/superuser/add_bag_item", "/superuser/add_store_item"], upload_multer.single("sprite"));

    // Add auth to the routes
    app.use("/superuser", auth.express_middleware, auth.admin_check);
    app.use(["/views/superuser-functions.html", "/assets/js/superuser.js"], auth.express_middleware, auth.admin_check);

    app.post("/superuser/add_bag_item", superuserapi.routes.add_bag_item);
    app.post("/superuser/remove_bag_item", superuserapi.routes.remove_bag_item);

    app.post("/superuser/add_status", superuserapi.routes.add_status);
    app.post("/superuser/remove_status", superuserapi.routes.remove_status);

    app.post("/superuser/add_condition", superuserapi.routes.add_condition);
    app.post("/superuser/remove_condition", superuserapi.routes.remove_condition);

    app.post("/superuser/add_store_item", superuserapi.routes.add_store_item);
    app.post("/superuser/remove_store_item", superuserapi.routes.remove_store_item);


    for(var i in superuserapi.dataRoutes){
        app.post(i, superuserapi.dataRoutes[i])
    }
    
    // Set up Socket.io connection
    var comms = internalRequire("server-comms.js")(server, auth, config, hub);
    
    console.log("INITIALISED");
}


function dbFailure(){
    console.error("DB could not be inited");
}