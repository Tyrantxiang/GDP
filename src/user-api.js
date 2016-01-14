"use strict";

/**
 * File implements the express routes for the user handling via a http RESTful API
 *
 * @module user-api
 */

var config;
function setConfig(cfg){
    if(!cfg && typeof cfg !== Object){
        throw new Error("Config object not defined");
    }
    config = cfg;
}
function getConfig(){
    return config;
}

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


/*
 * TODO:
 * All of the validation is to be replaced by the validate.js module 
 *
 */

/**
 * A callback to a validator function
 *
 * @callback validatorCallback
 * @param {Object}            result         
 * @param {boolean}           result.valid   - Whether the result is valid
 * @param {string|undefined}  result.message - Additional information
 */
/**
 * Is this call to a validation function successful?
 *
 * @param {Object} o - The object to check
 * @return {boolean} - Whether the object is a valid result
 */
function resultIsValid(o){
    return o.valid;
}


/**
 * Checks if a given username is valid (for signup, not login)
 *
 * @param {string}                            username - The username to check
 * @param {module:user-api~validatorCallback} cb       - The callback
 */
function isUsernameValid(username, cb){
    if(username && username !== ""){
        // More validation here
        if(!(/^[a-z0-9]+$/i.test(username))){
            cb({
                valid : false,
                message : "alphanumeric characters only"
            });
            return;
        }

        // Already in use
        db.checkUsernameExists(function(exists){
            var o = {
                valid : !exists
            };
            if(exists){
                o.message = "Username already exists";
            }
            cb(o);
        }, null, username);
    }else{
        cb({
            valid : false,
            message : "Username was not sent or is empty"
        });
    }
}

/**
 * Checks if a given date of birth is valid
 *
 * @param {Date}                              dob - The dob to check
 * @param {module:user-api~validatorCallback} cb  - The callback
 */
function isDobValid(dob, cb){
    // Must be at least x years old?
    if(!dob || isNaN(dob.getTime())){
        cb({
            valid : false,
            message : "invalid date"
        });
        return;
    }
    if(dob >= new Date(Date.now() - (1000 * 60 * 60 * 24 * 365 * 10))){
        cb({
            valid : false,
            message : "You must be at least 10 years old"
        });
        return;
    }

    cb({
        valid : true
    });
}

/**
 * Checks if a given password is valid
 *
 * @param {string}                            pw - The password to check
 * @param {module:user-api~validatorCallback} cb - The callback
 */
function isPasswordValid(pw, cb){
    cb({
        valid : (pw && pw.length >= 6)
    });
}




/**
 * The user api express route functions, these are run by express the defined route is run in app.js
 * 
 * @namespace routes
 */
var routes = {
    /** 
     * Lists all available conditions 
     *
     * @var
     * @type {express_route}
     */
    get_conditions_list : function (req, res){
        res.json(config.conditions.listAll());
    },

    /** 
     * Validates a username is avalible to sign up
     *
     * @var
     * @type {express_route}
     */
    validate_username : function(req, res){
        var username = req.body.username && req.body.username.trim();
        isUsernameValid(username, function(o){
            res.json(o);
        });
    },


    /** 
     * Validates a date of birth
     *
     * @var
     * @type {express_route}
     */
    validate_dob : function(req, res){
        var dob = req.body.dob && new Date(req.body.dob);
        isDobValid(dob, function(o){
            res.json(o);
        });
    },





    /** 
     * Sign up a user to the system, also validates
     *
     * @var
     * @type {express_route}
     */
    sign_up : function(req, res){
        var b = req.body,
            username = b.username && b.username.trim(),
            password = b.password,
            dob = b.dob && new Date(b.dob);


        var validations = [];

        isUsernameValid(username, function(o){
            validations.push(o);
            isPasswordValid(password, function(o){
                validations.push(o);
                isDobValid(dob, function(o){
                    validations.push(o);

                    var valid = validations.every(resultIsValid);
                    if(valid){
                        db.createUser(
                            // Pass
                            function(result){
								res.json({
									error : false,
                                    username : username,
                                    dob : dob
								});
                            },
                            // Fail
                            function(error){
                                res.status(400).json({
                                    error : error
                                });
                            },
                            { username : username, password : password, dob : dob }
                        );
                    }else{
                        res.status(400).json({
                            error : "some stuff not valid",
                            validations : validations
                        });
                    }


                });
            });
        });

    }

};




/**
 * Generates a set of user-api routes using the given config and database objects
 *
 * @param {module:config} cfg - A config object
 * @param {module:database} db - A database object

 * @return {module:user-api~routes} The user-api routes
 */
module.exports = function (cfg, db){
    setConfig(cfg);
    setDatabase(db);
    
    return routes;    
};
