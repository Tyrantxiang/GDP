"use strict";

/**
 * The entry point to the application. Requires all the needed libraries and files, sets up the routes and starts the web server
 *
 * @file
 */


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
	    userapi = require("./user-api.js")(config, db),
		superuserapi = require("./superuser-api.js")(config, db);


	app.use(morgan("dev"));

	// Body parser middleware
	app.use(parser.json());
	app.use(parser.urlencoded({ extended : true }));

	// Set up the authentication middleware
	app.use([/*"/games",*/ "/p"], auth.express_middleware);
	app.use(["/superuser.html", "/assets/js/superuser.js"], auth.admin_token);
	
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
	
	//Superuser http API routes
	var superuserRoutes = [ 	"/add_bag_item", "/remove_bag_item", "/add_status", "/remove_status", "/add_condition",
					"/remove_condition", "/add_store_item", "/remove_store_item", "/add_minigame", "/remove_minigame"];

	db.createUser(console.log, console.log, { username : 'admin', password : 'changeme', dob : new Date(946684800000) });
	
	app.use(superuserRoutes, auth.admin_token);
	
	var multer = require("multer");
	var upload = multer({ dest: 'uploads/' });
	var superuserapi = require('./superuser-api.js')(config, db);
	app.post("/superuser/add_bag_item", upload.single('sprite'), superuserapi.routes.add_bag_item);
	app.post("/superuser/remove_bag_item", superuserapi.routes.remove_bag_item);
	app.post("/superuser/add_status", upload.single('sprite'), superuserapi.routes.add_status);
	
	for(var i in superuserapi.dataRoutes){
		if(superuserapi.dataRoutes.hasOwnProperty(i)){
			var str = "/superuser/"+i.toString();
			app.post(str, superuserapi.dataRoutes[i])
		}
	}
	
	// Set up Socket.io connection
	var comms = require("./server-comms.js")(server, auth, config, hub);
	
	console.log("INITIALISED");
}


function dbFailure(){
	console.error("DB could not be inited");
}

