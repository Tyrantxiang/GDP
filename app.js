"use strict";


var config = require("./config.js");

// Set up the database
require("./database/database.js").init(startApp, dbFailure, config.database.getSettings(config.database.getDefaultSchema()));


function startApp(db){
    var express = require("express"),
	    app = express(),
	    port = process.env.PORT || config.app.getPort() || 3000,
	    server = app.listen(port),


	// Other libary requires
	    parser = require("body-parser"),
	    morgan = require("morgan");



	// App requires
	var auth = require("./auth.js")(db),
	    hub = require("./hub.js")(config, db),
	    userapi = require("./user-api.js")(config, db);


	app.use(morgan("dev"));

	// Body parser middleware
	app.use(parser.json());
	app.use(parser.urlencoded({ extended : true }));

	// Set up the authentication middleware
	app.use(["/games", "/p"], auth.express_middleware);


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


	// Set up Socket.io connection
	var comms = require("./server-comms.js")(server, auth, config, hub);
	
	console.log("INITIALISED");
}


function dbFailure(){
	console.error("DB could not be inited");
}

