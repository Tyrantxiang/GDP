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
	    hub = require("./hub.js")(config, db);


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
	app.get("/items/sprites/:item/:filename", config.items.serveFile);



	// Some user stuff, could probably be moved to a different file
	app.post("/user/validate_username", function(req, res){
		var username = req.body.username && req.body.username.trim();
		if(username && username !== ""){
			// More validation here

			// Already in use
			db.checkUsernameExists(function(exists){
				var o = {
					valid : !exists
				};
				if(exists){
					o.message = "Username already exists";
				}
				res.json(o);
			}, username);
		}else{
			res.json({
				valid : false,
				message : "Username was not sent or is empty"
			});
		}
	});

	app.post("/user/validate_details", function(req, res){
		var dob = req.body.dob && Date.parse(req.body.dob),
			condition = req.body.illnesses;

		// Validate
		if(!config.conditions.exists(condition)){
			res.json({
				valid : false,
				message : "Condition does not exist"
			});
			return;
		}

		// Validate the DOB
		// Must be at least x years old?
		if(dob < new Date(Date.now() - (100 * 60 * 60 * 24 * 365 * 10))){
			res.json({
				valid : false,
				message : "You must be at least 10 years old"
			});
			return;
		}

		res.json({
			valid : true
		});
	});


	// Set up Socket.io connection
	var comms = require("./server-comms.js")(server, auth, config, hub);
}


function dbFailure(){
	console.error("DB could not be inited");
}

