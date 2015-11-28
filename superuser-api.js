"use strict";

/* File implements routes for the superuser handling via a http RESTful API
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

function checkIsValid(arrNames, objToTest){
	var valid = Object.keys(objToTest).length === arrNames.length;
	for(var i=0; i<arrNames.length; i++){
		valid = valid && (objToTest[arrNames[i]] !== undefined);
	}
	return valid;
}

function returnInvalidMessage(res){
	res.status(400).json({
		"error" : "Request body not valid - missing, extra or undefined components"
	});
}

/****** Route functions ******/
var routes = {
	
	add_bag_item : function(req, res){
		var valid = checkIsValid(["name", "sprite", "effects"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res);
		}
	},

	remove_bag_item : function(req, res){
		var valid = checkIsValid(["id"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res);
		}
	},

	add_status : function(req, res){
		var valid = checkIsValid(["id", "name", "min_val", "max_val", "healthy_min", "healthy_max", "isNumber", "words"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res);
		}
	},

	remove_status : function(req, res){
		var valid = checkIsValid(["id"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res);
		}
	},

	add_condition : function(req, res){
		var valid = checkIsValid(["name", "statuses"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res);
		}
	},

	remove_condition : function(req, res){
		var valid = checkIsValid(["id"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res);
		}
	},

	add_store_item : function(req, res){
		var valid = checkIsValid(["id", "name", "description", "slot", "price", "sprite"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res);
		}
	},

	remove_store_item : function(req, res){
		var valid = checkIsValid(["id"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res);
		}
	},

	add_minigame : function(req, res){
		var valid = checkIsValid(["id", "name", "description", "img", "scripts", "entry_point"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res);
		}
	},

	remove_minigame : function(req, res){
		var valid = checkIsValid(["id"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res);
		}
	},

	add_inventory : function(req, res){
		var valid = checkIsValid(["id"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res);
		}
	},

	remove_inventory : function(req, res){
		var valid = checkIsValid(["id"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res);
		}
	},
	
	
	
	
	
	
    get_conditions_list : function (req, res){
        res.json(config.conditions.listAll());
    },


    validate_username : function(req, res){
        var username = req.body.username && req.body.username.trim();
        isUsernameValid(username, function(o){
            res.json(o);
        });
    },

    validate_dob : function(req, res){
        var dob = req.body.dob && new Date(req.body.dob);
        isDobValid(dob, function(o){
            res.json(o);
        });
    },

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
                            function(id){
								db.readUserByName(function(results){
									var dbres = setUpDefaultItems(results.id);
									console.log(dbres);
									if(dbres[0]){
										res.json({
											error : false    
										});
									}else{
										console.log("HERE2");
										res.status(400).json({
											error : dbres[1]
										});
									}
								}, function(error){
									res.status(400).json({
										error : error
									});
								}, username);
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

module.exports = function (cfg, db){
    setConfig(cfg);
    setDatabase(db);
    
    return routes;    
};
