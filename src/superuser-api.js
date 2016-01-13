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

var db;
function setDatabase(database){
    if(!database){
        throw new Error("Database object not defined");
    }
    db = database;
}

function checkIsValid(arrNames, objToTest){
	var invalid = [];
	
	for(var i=0; i<arrNames.length; i++){
		if(objToTest[arrNames[i]] === undefined) invalid.push(arrNames[i]);
	}
	
	return invalid.join(", ");
}

function returnInvalidMessage(res, message){
	res.status(400).json({
		"error" : "Request body not valid - missing: " + message
	});
}

function getRandomUnusedId(configObj){
	var newId = undefined;
	while(!newId){
		var currentId = Math.floor(Math.random() * 32767);
		
		if(configObj.getConfig(currentId) === null){
			newId = currentId;
		}
	}
	return newId;
}

function createFiles(spriteLoc, newLoc, configObj, otherFiles){
	newLoc = config.app.getRootDirectory() + newLoc + "/";
	
	fs.mkdir(newLoc, function(err){
		fs.readFile(spriteLoc, function (err, data) {
			var newPath = newLoc + "sprite.png";
			fs.writeFile(newPath, data, err => {});
			
			fs.unlink(spriteLoc, err => {});
		});
		
		fs.writeFile(newLoc + "config.json", JSON.stringify(configObj), err => {});
		
		if(otherFiles){
			
		}
	});
}

function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function removeFiles(path){
	fs.unlink(path + "/config.json", function(err){
		fs.unlink(path + "/sprite.png", function(err){
			//fs.rmdir(path, function(err){});
		});
	});
}

function createRoute(properties, cb){
	return function(req, res){
		var invalid = checkIsValid(properties, req.body);
		if(!invalid){
			cb(req, res);
		}else{
			returnInvalidMessage(res, invalid);
		}
	}
} 

/****** Route functions ******/
var routes = {
	
	add_bag_item : createRoute(["name", "effects"], function(req, res){
		function checkEffectsAreValid(arr){
			if(isJsonString(arr)) arr = JSON.parse(arr);
			var valid = arr.constructor===Array;
			valid = valid && arr.every(ele => (typeof ele === "object") && ele.id && ele.amount);
			valid = valid && arr.every(ele => (typeof ele.id==="number") && (typeof ele.amount==="number"))
			return valid;
		};
		
		var properties = ["name", "effects"];
		
		req.body.effects = JSON.parse(req.body.effects);
		if(!checkEffectsAreValid(req.body.effects)){
			returnInvalidMessage(res, "effects invalid");
			return;
		}
		
		var obj = {};
		for(var i=0; i<properties.length; i++){
			obj[properties[i]] = req.body[properties[i]];
		}
		obj.id = getRandomUnusedId(config.carriables);;
		
		createFiles(req.file.path, "/carriables/" + obj.id.toString(), obj, undefined);

		res.status(200).json({"okay": "A OK!"});
	}),
	
	remove_bag_item : createRoute(["id"], function(req, res){
		var path = config.carriables.getConfig(req.body.id, "directory");
		
		removeFiles(path);
		
		res.status(200).json({"okay": "A OK!"});
	}),

	add_status : createRoute(["name", "min_val", "max_val", "healthy_min", "healthy_max", "isNumber", "words"], function(req, res){
		var properties = ["name", "min_val", "max_val", "healthy_min", "healthy_max", "isNumber", "words"];
		var id = getRandomUnusedId(config.statuses);
		var obj = {};
		for(var i=0; i<properties.length; i++){
			obj[properties[i]] = req.body[properties[i]];
		}
		obj.id = id;
		
		createFiles(req.file.path, "/statuses/" + id.toString(), obj, undefined);
	}),

	remove_status : createRoute(["id"], function(req, res){
		var path = config.statuses.getConfig(req.body.id, "directory");
		
		removeFiles(path);
		
		res.json({"okay": "A OK!"});
	}),

	add_condition : createRoute(["name", "statuses"], function(req, res){
		
	}),

	remove_condition : createRoute(["id"], function(req, res){
		var path = config.conditions.getConfig(req.body.id, "directory");
		
		removeFiles(path);
		
		res.json({"okay": "A OK!"});
	}),

	add_store_item : createRoute(["name", "description", "slot", "price", "sprite"], function(req, res){
		
	}),

	remove_store_item : createRoute(["id"], function(req, res){		
		var path = config.items.getConfig(req.body.id, "directory");
		
		removeFiles(path);
		
		res.json({"okay": "A OK!"});
	})
	
	/*
	add_minigame : createRoute(["id", "name", "description", "img", "scripts", "entry_point"], function(req, res){
		
	}),

	remove_minigame : createRoute(["id"], function(req, res){
		
	})
	*/
};

var dataRoutes = {
	get_all_statuses : function(req, res){
		res.status(200).json(config.statuses.listAll());
	},
	
	get_all_carriables : function(req, res){
		var allitems = config.carriables.listAll().map(item => {
			item.url = config.carriables.getSpriteURL(item.id);
			delete item.effects;
			return item;
		});
		
		res.status(200).json(allitems);
	},
	
	get_all_conditions : function(req, res){
		res.status(200).json(config.conditions.listAll());
	},
	
	get_item_slots : function(req, res){
		res.status(200).json(config.hub.getItemSlots());
	},
	
	get_items_for_slot : function(req, res){
		if(config.hub.getItemSlots().indexOf(req.body.slot) > -1)
			res.status(200).json(config.items.listItemsForSlot(req.body.slot));
		else
			res.status(400).json({"success": false});
	}
	
};

module.exports = function (cfg, db){
    setConfig(cfg);
    setDatabase(db);
	
    //set each route to be under /superuser
	var newDataRoutes = {};
	Object.keys(dataRoutes).forEach(function(key){
		var newRoute = "/superuser/" + key.toString();
		newDataRoutes[newRoute] = dataRoutes[key];
	});
	
    return {
		routes : routes,
		dataRoutes : newDataRoutes
	}
};
