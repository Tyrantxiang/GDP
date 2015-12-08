"use strict";

/* File implements routes for the superuser handling via a http RESTful API
 */

var fs = require("fs");
var path = require("path");
 
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

function getRandomUnusedId(configObj){
	var newIdFound = false,
		newId = undefined;
	while(!newIdFound){
		var currentId = Math.floor(Math.random() * 32767);
		
		if(configObj.getConfig(currentId) === null){
			newId = currentId;
			newIdFound = true;
		}
	}
	return newId;
}

function createFiles(spriteLoc, newLoc, configObj, otherFiles){
	newLoc = __dirname + newLoc + "/";
	
	fs.mkdir(newLoc, function(err){
		fs.readFile(spriteLoc, function (err, data) {
			var newPath = newLoc + "sprite.png";
			fs.writeFile(newPath, data, function (err) {
			});
			
			fs.unlink(spriteLoc, function(err){});
		});
		
		fs.writeFile(newLoc + "config.json", JSON.stringify(configObj), function(err){
		});
		
		if(otherFiles){
			
		}
	});
}

function removeFiles(path){
	fs.unlink(path + "/config.json", function(err){
		fs.unlink(path + "/sprite.png", function(err){
			//fs.rmdir(path, function(err){});
		});
	});
}

/****** Route functions ******/
var routes = {
	
	add_bag_item : function(req, res){		
		var properties = ["name", "effects"];
		var valid = checkIsValid(properties, req.body);
		if(valid){
			var id = getRandomUnusedId(config.carriables);
			var obj = {};
			for(var i=0; i<properties.length; i++){
				obj[properties[i]] = req.body[properties[i]];
			}
			obj.id = id;
			
			createFiles(req.file.path, "/carriables/" + id.toString(), obj, undefined);

			res.json({"okay": "A OK!"});
		}else{
			returnInvalidMessage(res);
		}
	},

	remove_bag_item : function(req, res){
		var valid = checkIsValid(["id"], req.body);
		
		if(valid){
			var path = config.carriables.getConfig(req.body.id, "directory");
			
			removeFiles(path);
			
			res.json({"okay": "A OK!"});
		}else{
			returnInvalidMessage(res);
		}
	},

	add_status : function(req, res){
		var properties = ["name", "min_val", "max_val", "healthy_min", "healthy_max", "isNumber", "words"];
		var valid = checkIsValid(properties, req.body);
		if(valid){
			var id = getRandomUnusedId(config.statuses);
			var obj = {};
			for(var i=0; i<properties.length; i++){
				obj[properties[i]] = req.body[properties[i]];
			}
			obj.id = id;
			
			createFiles(req.file.path, "/statuses/" + id.toString(), obj, undefined);
		}else{
			returnInvalidMessage(res);
		}
	},

	remove_status : function(req, res){
		var valid = checkIsValid(["id"], req.body);
		if(valid){
			var path = config.statuses.getConfig(req.body.id, "directory");
			
			removeFiles(path);
			
			res.json({"okay": "A OK!"});
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
			var path = config.conditions.getConfig(req.body.id, "directory");
			
			removeFiles(path);
			
			res.json({"okay": "A OK!"});
		}else{
			returnInvalidMessage(res);
		}
	},

	add_store_item : function(req, res){
		var valid = checkIsValid(["name", "description", "slot", "price", "sprite"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res);
		}
	},

	remove_store_item : function(req, res){
		var valid = checkIsValid(["id"], req.body);
		if(valid){			
			var path = config.items.getConfig(req.body.id, "directory");
			
			removeFiles(path);
			
			res.json({"okay": "A OK!"});
		}else{
			returnInvalidMessage(res);
		}
	},
	/*
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
	}
	*/
};

module.exports = function (cfg, db){
    setConfig(cfg);
    setDatabase(db);
    
    return routes;    
};
