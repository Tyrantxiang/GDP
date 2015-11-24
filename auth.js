"use strict";

/* Authentication module contains the methods to handle login, auth and user handling */

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



function generateToken(userId){
    /* To make sure we don't send the userId (for db reasons) maybe we should encrypt the
     * user ID here (with AES?)
     */
    return jwt.sign({ userId : userId }, secret, { expiresIn : 60 * 60 * 24 });
}

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

module.exports = function(db){
    setDatabase(db);

    return {
        authenticate : authenticate,
        express_middleware : express_middleware,
        socket_middleware : socket_middleware,
        setDatabase : setDatabase,
        getDatabase : getDatabase
    };
};

