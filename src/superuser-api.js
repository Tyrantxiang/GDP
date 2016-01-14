"use strict";

/**
 * Module that stores the configuration for all aspects of the system
 * Deals with system properties (port, pg database info, etc)
 * Scans the filesystem for new games and returns the file paths and assets when a game is requested
 *
 * @module superuser-api
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

/**
 * Checks if a given object has specified properties defined
 *
 * @param {array} arrNames - the property names to check exist
 * @param {Object} objToTest - the object to test if has the property names defined
 * @return {string} a comma separated string of all the undefined properties
 */
function checkIsValid(arrNames, objToTest){
	var invalid = [];
	
	for(var i=0; i<arrNames.length; i++){
		if(objToTest[arrNames[i]] === undefined) invalid.push(arrNames[i]);
	}
	
	return invalid.join(", ");
}

/**
 * Returns an error message to the client
 *
 * @param {Object} res - the res object from the express_route
 * @param {string} message - the error message to send back to the client
 */
function sendError(res, message){
	res.status(400).json({"error" : message});
}

/**
 * Gets an used ID number for a given config type
 *
 * @param {Object} configObj - the relevant config.js sub-object (e.g. config.carriables)
 * @return {integer} the unused integer to use as the id for the new config
 */
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

/**
 * Writes config file and sprite file to relevant location
 *
 * @param {string} 	spriteLoc 	- the location to write the sprite file to
 * @param {string} 	newLoc 		- the location to write the config.json file to
 * @param {Object} 	configObj 	- the object to turn into json and write to config.json
 * @param {array} 	otherFiles 	- the paths of other files to move on the filesystem
 */
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

/**
 * Checks if a given input is valid JSON
 *
 * @param {string} str - The input to check is a JSON string
 * @return {boolean} Whether the input parameter is valid JSON
 */
function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * Removes specified files and folders from the filesystem
 *
 * @param {string} path - The folder path to delete
 */
function removeFiles(path){
	fs.unlink(path + "/config.json", function(err){
		fs.unlink(path + "/sprite.png", function(err){
			//TODO: Fix config.js to not freeze when deleting empty folder
			//fs.rmdir(path, function(err){});
		});
	});
}

/**
 * Create a route function and handles sending error messages if the correct
 * form components are missing
 *
 * @param {array} properties - An array of property names to check are present
 * @param {function} cb - The callback
 * @return {function} The express_route function that is used
 */
function createRoute(properties, cb){
	return function(req, res){
		var invalid = checkIsValid(properties, req.body);
		if(!invalid){
			cb(req, res);
		}else{
			sendError(res, "Request body not valid - missing: " + invalid);
		}
	}
} 

/****** Route functions ******/
/**
 * Contains functions that server as endpoints for form submissions
 *
 * @namespace routes
 * @memberof module:superuser-api
 */
var routes = {
	
	/**
     * Add a carriable configuration for use in game
     * 
     * @memberof module:superuser-api.routes
	 *
	 * @var
     * @type {express_route}
     */
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
			sendError(res, "effects invalid");
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
	
	/**
     * Remove a carriable configuration from use in game
     * 
     * @memberof module:superuser-api.routes
	 *
	 * @var
     * @type {express_route}
     */
	remove_bag_item : createRoute(["id"], function(req, res){
		var path = config.carriables.getConfig(req.body.id, "directory");
		
		removeFiles(path);
		
		res.status(200).json({"okay": "A OK!"});
	}),

	/**
     * Add a new status configuration for use in game (bloodsugar, etc)
     * 
     * @memberof module:superuser-api.routes
	 *
	 * @var
     * @type {express_route}
     */
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

	/**
     * Remove a status configuration from use in game
     * 
     * @memberof module:superuser-api.routes
	 *
	 * @var
     * @type {express_route}
     */
	remove_status : createRoute(["id"], function(req, res){
		var path = config.statuses.getConfig(req.body.id, "directory");
		
		removeFiles(path);
		
		res.json({"okay": "A OK!"});
	}),

	/**
     * Add a condition configuration for use in game (diabetes, renal failure, etc)
     * 
     * @memberof module:superuser-api.routes
	 *
	 * @var
     * @type {express_route}
     */
	add_condition : createRoute(["name", "statuses"], function(req, res){
		
	}),

	/**
     * Remove a condition configuration for use in game
     * 
     * @memberof module:superuser-api.routes
	 *
	 * @var
     * @type {express_route}
     */
	remove_condition : createRoute(["id"], function(req, res){
		var path = config.conditions.getConfig(req.body.id, "directory");
		
		removeFiles(path);
		
		res.json({"okay": "A OK!"});
	}),

	/**
     * Add a store item (non-carriable) configuration for use in game
     * 
     * @memberof module:superuser-api.routes
	 *
	 * @var
     * @type {express_route}
     */
	add_store_item : createRoute(["name", "description", "slot", "price", "sprite"], function(req, res){
		
	}),

	/**
     * Remove a store item (non-carriable) configuration for use in game
     * 
     * @memberof module:superuser-api.routes
	 *
	 * @var
     * @type {express_route}
     */
	remove_store_item : createRoute(["id"], function(req, res){		
		var path = config.items.getConfig(req.body.id, "directory");
		
		removeFiles(path);
		
		res.json({"okay": "A OK!"});
	}),
	
	/**
     * Add a minigame configuration for use in game
     * 
     * @memberof module:superuser-api.routes
	 *
	 * @var
     * @type {express_route}
     */
	add_minigame : createRoute(["id", "name", "description", "img", "scripts", "entry_point"], function(req, res){
		
	}),

	/**
     * Remove a minigame configuration for use in game
     * 
     * @memberof module:superuser-api.routes
	 *
	 * @var
     * @type {express_route}
     */
	remove_minigame : createRoute(["id"], function(req, res){
		
	})
};

/**
 * Contains functions that serve as endpoints for data generation to embed on in the client
 *
 * @namespace dataRoutes
 * @memberof module:superuser-api
 */
var dataRoutes = {
	/**
     * Returns all status config objects
     * 
     * @memberof module:superuser-api.dataRoutes
	 *
	 * @var
     * @type {express_route}
     */
	get_all_statuses : function(req, res){
		res.status(200).json(config.statuses.listAll());
	},
	
	/**
     * Returns all carriable config objects
     * 
     * @memberof module:superuser-api.dataRoutes
	 *
	 * @var
     * @type {express_route}
     */
	get_all_carriables : function(req, res){
		var allitems = config.carriables.listAll().map(item => {
			item.url = config.carriables.getSpriteURL(item.id);
			delete item.effects;
			return item;
		});
		
		res.status(200).json(allitems);
	},
	
	/**
     * Returns all condition config objects
     * 
     * @memberof module:superuser-api.dataRoutes
	 *
	 * @var
     * @type {express_route}
     */
	get_all_conditions : function(req, res){
		res.status(200).json(config.conditions.listAll());
	},
	
	/**
     * Returns a list of all item slots
     * 
     * @memberof module:superuser-api.dataRoutes
	 *
	 * @var
     * @type {express_route}
     */
	get_item_slots : function(req, res){
		res.status(200).json(config.hub.getItemSlots());
	},
	
	/**
     * Returns all items config objects for a given slot
     * 
     * @memberof module:superuser-api.dataRoutes
	 *
	 * @var
     * @type {express_route}
     */
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
