"use strict";

/**
 * Authentication module contains the methods to handle login, auth and user handling
 *
 * @file
 */

var jwt = require("jsonwebtoken"),
    secret = "trisha is bob";



var db;
function setDatabase(database){
    if(!database){
        throw new Error("Database object not defined");
    }
    db = database;
}
function getDatabase(){
    return db;
}

var adminId = -1;
function setAdminId(){
	db.readUserByName(function(user){adminId = user.id;}, function(){adminId = -1;}, 'admin');
}

/*
 * Generate a JSON Web Token (jwt)
 *
 * @param {int} userId - The ID of the user to generate the token for
 * @return {string} - The JSON Web Token 
 */
function generateToken(userId){
    /* To make sure we don't send the userId (for db reasons) maybe we should encrypt the
     * user ID here (with AES?)
     */
    return jwt.sign({ userId : userId }, secret, { expiresIn : 60 * 60 * 24 });
}

/*
 * An express route function that authenticates a username and password against the database.
 * Returns a jwt to the client for the session on success and an error on failure
 */
function authenticate(req, res){
    var username, password,

        authenticated = function(user){
            // Generate web token
            var token = generateToken(user.id);
            console.log("     uid " + user.id + " authenticated");
            res.json({
                token : token
            });
        },
        failed = function(error){
            res.status(401).json({
                error : true,
                message : "invalid username or password"
            });
        };

    if(req.body.username && req.body.password){
        username = req.body.username.trim();
        password = req.body.password;

        // Authenticate and get userId
        db.authenticateUser(authenticated, failed, username, password);

    }else{
        failed();
    }
}

/*
 * Express middleware that verifies a token before possing on to the next function for the route
 * Will send a response early if the token isn't present or invalid
 */
function express_middleware(req, res, next){
    // Try and get the token from the query string first
    var token = req.query.token || req.query.t;
    
    // See if that worked
    if(!token){
        // Try and get it from the body
        token = req.body.token || req.body.t;

        if(!token){
            // Fail here
            res.status(403).json({ error : true, message : "unauthorised" });
            return;
        }
    }


    // Attempt to verify token
    jwt.verify(token, secret, function(err, decoded){
        if(err){
            res.status(403).json({ error : true, message : "unauthorised" });
            return;
        }

        req.userId = decoded.userId;
        next();
    });
}

/*
 * Socket.io middleware that is run when a socket is opened.
 * Authenticates that token is passed in and is valid.
 * Will open the socket on success and return an error on failure.
 */
function socket_middleware(socket, next){
    //console.log(socket.request);
    var token = socket.request._query.token;
    if(!token){
        // Fail here
        next(new Error('not authorized'));
    }

    // Attempt to verify token
    jwt.verify(token, secret, function(err, decoded){
        if(err){
            next(new Error('not authorized'));
            return;
        }

        socket.userId = decoded.userId;
        next();
    });
}

function admin_authenticate(req, res, next){
	var username = req.body.username,
		password = req.body.password;
	
	function fail(msg){
		res.status(400).json({"success": false, "message": msg});
	};
	
	if(!(username && password)){
		fail("username or password missing");
	}else if(username !== "admin"){
		fail("invalid username or password");
	}else{		
		// Authenticate and get userId
		function pass(){
			next();
		};
		db.authenticateUser(pass, fail, username, password);
	}
}

function admin_token(req, res, next){
	var	token = req.query.token || req.body.token;
	
	function fail(msg){
		res.status(400).json({"success": false, "message": msg});
	};
	
	if(token){
		jwt.verify(token, secret, function(err, decoded){
			if(err){
				fail('Not authorized');
				return;
			}
			
			if(decoded.userId === adminId){
				next();
			}else{
				next(new Error('Invalid token'));
			}
			
		});
	}else{
		fail('Token not supplied');
	}
}

module.exports = function(db){
    setDatabase(db);
	setAdminId();

    return {
		admin_token : admin_token,
		admin_authenticate : admin_authenticate,
        authenticate : authenticate,
        express_middleware : express_middleware,
        socket_middleware : socket_middleware,
        setDatabase : setDatabase,
        getDatabase : getDatabase
    };
};

