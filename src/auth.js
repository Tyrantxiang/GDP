"use strict";

/**
 * Authentication module contains the methods to handle login, auth and user handling
 *
 * @module auth
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


/**
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

/**
 * An express route function that authenticates a username and password against the database.
 * Returns a jwt to the client for the session on success and an error on failure
 *
 * @var
 *
 * @type {express_route}
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

/**
 * Function to generate express authentication middleware, which only will pass with a given user.
 * If undefined is used all users will pass
 *
 * @param {string|undefined} name - The name to set up authentication for. Undefined will check against all namespaces
 * @return {module:auth~express_middleware} - The authentication route set up to only allow through the person defined
 */
function generateExpressMiddleware(name){
    /**
     * Express middleware that verifies a token before passing on to the next function for the route
     * Will send a response early if the token isn't present or invalid
     *
     * @var
     * @alias module:auth~express_middleware
     * @type {express_middleware}
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
			
			if(!name){
				next();
			}else{
				db.readUserByName(function(user){
					console.log("here");
					console.log(user.id===decoded.userId);
					if(user.id===decoded.userId){
						next();
					}else{
						res.status(403).json({ error : true, message : "Unauthorized" });
					}
				}, function(err){
					res.status(403).json({ error : true, message : err });
				}, name);
			}
		});
	}
    return express_middleware;
}

/**
 * Socket.io middleware that is run when a socket is opened.
 * Authenticates that token is passed in and is valid.
 * Will open the socket on success and return an error on failure.
 *
 * @var
 *
 * @type {socket_middleware}
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

/**
 * Functions exposed by the auth module
 *
 * @namespace auth
 *
 * @borrows module:auth~express_middleware as admin_token
 * @borrows module:auth~authenticate as authenticate
 * @borrows module:auth~express_middleware as express_middleware
 * @borrows module:auth~socket_middleware as socket_middleware
 * @borrows module:auth~getDatabase as getDatabase
 * @borrows module:auth~setDatabase as setDatabase
 */
var exportFunctions = {
	admin_token : express_middleware('admin'),
    authenticate : authenticate,
    express_middleware : express_middleware(),
    socket_middleware : socket_middleware,
    setDatabase : setDatabase,
    getDatabase : getDatabase
};

/** 
 * Init function for the module. Returns the exposed functions of the module
 * 
 * @param {module:database} db  - The database object
 * @return {module:auth~auth} - Object with the module's functions
 */
module.exports = function(db){
    setDatabase(db);
	
    return exportFunctions;
};

