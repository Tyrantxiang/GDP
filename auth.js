"use strict";

/* Authentication module contains the methods to handle login, auth and user handling */

var jwt = require('jsonwebtoken'),
    secret = "trisha is bob";


function authenticate(req, res){
    var username, password;
    if(req.body.username && req.body.password){
        username = req.body.username;
        password = req.body.password;
    }else{
        // Fail here
    }

    // Verify and get userId here
    (function(userId){
        // Generate web token
        var token = jwt.sign({ userId : userId }, secret, { expiresIn : 60 * 60 });
        res.send(token);
    })(1);

}

function express_middleware(req, res, next){
    // Try and get the token from the query string first
    var token = req.query.token || req.query.t;
    console.log("HERE");
    // See if that worked
    if(!token){
        // Try and get it from the body
        token = req.body.token || req.body.t;

        if(!token){
            // Fail here
            next();
            return;
        }
    }


    // Attempt to verify token
    jwt.verify(token, secret, function(err, decoded){
        if(err){
            // Fail here
        }
        req.userId = decoded.userId;
        next();
    });
}

function socket_middleware(socket, next){
    var token = socket.request.token;
    if(!token){
        // Fail here
        next(new Error('not authorized'));
    }

    // Attempt to verify token
    jwt.verify(token, secret, function(err, decoded){
        if(err){
            next(new Error('not authorized'));
        }
        socket.userId = decoded.userId;
        next();
    });
}

module.exports = {
    authenticate : authenticate,
    express_middleware : express_middleware,
    socket_middleware : socket_middleware
};

