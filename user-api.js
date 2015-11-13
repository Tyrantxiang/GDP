"use strict";

/* File implements routes for the user handling via a http RESTful API
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





/****** Route functions ******/
var routes = {
    get_conditions_list : function (req, res){
        res.json(config.conditions.listAll());
    },


    validate_username : function(req, res){
        var username = req.body.username && req.body.username.trim();
        if(username && username !== ""){
            // More validation here
            if(!(/^[a-z0-9]+$/i.test(username))){
                res.json({
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
                res.json(o);
            }, null, username);
        }else{
            res.json({
                valid : false,
                message : "Username was not sent or is empty"
            });
        }
    },



    validate_details : function(req, res){
        var dob = req.body.dob && new Date(req.body.dob),
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
        if(isNaN(dob.getTime())){
            res.json({
                valid : false,
                message : "invalid date"
            });
            return;
        }
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
    }


};









module.exports = function (cfg, db){
    setConfig(cfg);
    setDatabase(db);
    
    return routes;    
};
