"use strict";


var config = require("./config.js"),
    express = require("express"),
    app = express(),
    port = process.env.PORT || config.app.getPort() || 3000,
    server = app.listen(port),


// Other libary requires
    parser = require("body-parser"),
    morgan = require("morgan");


// App requires
var auth = require("./auth.js"),
    hub = require("./hub.js")(config);


app.use(morgan("dev"));

// Body parser middleware
app.use(parser.json());
app.use(parser.urlencoded({ extended : true }));

// Set up the authentication middleware
app.use(["/games", "/static/p"], auth.express_middleware);


// Set the static files to be served
app.use("/static", express.static("static"));


// Routes
app.get("/", function (req, res){
    res.sendFile(__dirname + "/static/index.html");
});

app.post("/authenticate", auth.authenticate);

// Routes to serve semi static files
app.get("/games/:game/:fileType/:filename", config.games.serveFile);
app.get("/items/sprites/:item/:filename", config.items.serveFile);


// Set up Socket.io connection
var comms = require("./server-comms.js")(server, auth, config, hub);
