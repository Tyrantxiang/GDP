(function(){
"use strict";


/**
 *  Comms module
 * @module comms
 */

// The token used after auth
var token = null,
	socket = null,
	// The event listeners for the comms
	eventListeners = {};

/**
 * An AJAX success callback
 *
 * @callback ajaxSucess
 * @this {XMLHttpRequest}
 * @param {Object} data - The parsed JSON object
 */
/**
 * An AJAX success error callback
 *
 * @callback ajaxError
 * @this {XMLHttpRequest}
 */
/**
 * A generic abstraction over an XMLHttpRequest (ajax) object
 * @public
 * @param {string}      url                            - The URL to send the request to
 * @param {string}      verb                           - The http verb to use
 * @param {Object}      data                           - The data to send, must be a map if verb == GET
 * @param {ajaxSuccess} success                        - Function to call on success, will also be called on fail if error is ommitted
 * @param {ajaxError}   [error]                        - Function to call on error
 * @param {string}      [reponseType=json]             - The request type
 * @param {string}      [contentType=application/json] - The response content type
 * @return {XMLHttpRequest} The raw XMLHttpRequest object
 */
function ajaz(url, verb, data, success, error, responseType, contentType){
	var xhr = new XMLHttpRequest();
	verb = verb.toUpperCase();
	
	// Attach data to the get request
	if(verb === "GET"){
		dataStrings = [];
		for(var d in data){
			if(data.hasOwnProperty(d)){
				dataStrings.push(d + "=" + encodeURIComponent(data[d]));
			}
		}

		url += "?" + dataStrings.join("&");
		data = null;
	}else{
		data = JSON.stringify(data);
	}

	xhr.open(verb, url, true);

	xhr.addEventListener("load", function(){
		var r = this.response;
		if(typeof r === 'string' || r instanceof String){
			r = JSON.parse(r);
		}

		if(this.status === 200){
			success.call(this, r);
		}else{
			if(error){
				error.call(this);
			}else{
				success.call(this);
			}
		}
	});
	if(error){
		xhr.addEventListener("error", error);
	}else{
		xhr.addEventListener("error", success);
	}

	xhr.responseType = responseType || "json";
	xhr.setRequestHeader("Content-Type", contentType || "application/json");

	xhr.send(data);

	return xhr;
}

/**
 * Convinence function for making POST requests
 *
 * @param {string}      url  - The URL to send the request to
 * @param {Object}      data - The data to send
 * @param {ajaxSuccess} cb   - Function to call on when request as completed (success or fail)
 * @return {XMLHttpRequest} The raw XMLHttpRequest object
 */
function postRequest(url, data, cb){
	return ajaz(url, "POST", data, cb);
}



/**
 * Sets the authentication token for further requests. Not exposed by the module
 *
 * @param {string} token - The token to set
 */
function setToken(t){
	token = t;
}

/**
 * Gets the authentication token
 *
 * @return {string} The authentication token
 */
function getToken(){
	return token;
}

/**
 * Tokenises a GET request so it can be used for authed areas
 *
 * @param {string} path - The URL/path to tokenise
 * @return {string} The new, tokenised, URL
 */
function tokeniseGetRequest(path){
	return path + "?t=" + getToken();
}

/**
 * Loads a JavaScript file and adds it to the DOM, thus running the code
 *
 * @param {string} url       - The URL to fetch the script file
 * @param {function} cb      - Called when the script has loaded
 * @param {boolean} tokenise - Whether or not to tokenise the request (required for authentcated scripts)
 */
function loadScriptFile(url, cb, tokenise){
	if(tokenise !== false){
		url = tokeniseGetRequest(url);
	}


    var script = document.createElement("script");
    if(cb){
    	script.addEventListener("load", cb);
    }
    script.src = url;

    var stag = document.getElementsByTagName('script')[0];
    stag.parentNode.insertBefore(script, stag);
}


/**
 * Add an event listener to all future sockets. NOTE: will NOT apply the listener to the current socket
 *
 * @todo Make it add the listener to the current socket
 * @param {string} name   - The name of the event listener
 * @param {function} func - The function to bind to the listener
 */
function setEventListener(name, func){
	if(!eventListeners[name]){
		eventListeners[name] = [];
	}

	eventListeners[name].push(func);
}

/**
 * Clear all current socket event listeners
 *
 * @param {string} name   - The name of the event listener
 * @param {function} func - The function to bind to the listener
 */
function clearEventListeners(name){
	if(name){
		delete eventListeners[name];
	}else{
		eventListeners = {};
	}
}

/**
 * Authenticate callback
 *
 * @callback authenticateCallback
 * @param {Object}  result
 * @param {boolean} authenticated - Whether the user has been successfully authenticated
 */
/**
 * Authenticate a user using username and password, setting the token on success
 *
 * @param {string} username
 * @param {string} password
 * @param {authenticateCallback} cb - Called once authentication has been successfully attempted
 */
function authenticate(username, password, cb){
	ajaz("/authenticate", "POST",
		{ username : username, password : password },
		function(){
			setToken(this.response.token);
			cb({
				authenticated : true
			});
		},
		function(){
			cb({
				authenticated : false
			});
		}
	);
}

/**
 * Opens a socket connection to the server
 *
 * @todo Fire callback on socket failing to open
 * @param {function} [cb] - Called when the socket has been successfully opened
 */
function createSocket(cb){
	var t = getToken();
	if(!t){
		throw new Error("Authentication required first");
	}

	// Autodetection
	socket = io.connect({
		query: "token=" + t
	});

	// Error handler - not authententicated
	socket.on("error", function(data){
		console.error(data);
		if(data === "not authorized"){
			socket.close();
		}
	});

	// Connection success!
	socket.on("connect", function(){
		console.log("connected");

		// Bind the event listeners
		for(var name in eventListeners){
			eventListeners[name].forEach(function(l){
				socket.on(name, l);
			});
		}

		cb && cb();
	});
}

/**
 * Logs the user out, disconnecting the socket and deleting the token
 *
 * @param {function} [cb] - Called on successful logout
 */
function logout(cb){
	socket.disconnect();
	token = null;
	socket = null;
	cb && cb();
}

/**
 * Returns whether the user is authenticated.
 * This function just checks if there is a token in memory, this does not mean the token is valid.
 * For a better check use socketOpen, as this will tell you if socket functions are usable
 *
 * @return {boolean} Whether the user is authenticated
 */
function authenticated(){
	return !!token;
}

/**
 * Returns whether there is a socket open for this session
 *
 * @return {boolean} Whether a socket is open
 */
function socketOpen(){
	return !!socket;
}


var emptyFunction = function(){},
	emptyObject = {};
/**
 * Generic abstraction over the socket.io interface.
 * Sends data over the socket to a specific event (server function)
 *
 * @param {string} name   - The name of the endpoint to call server side
 * @param {Object} data   - The data to send with the request
 * @param {function} [cb] - Called when the server responds, with the response data
 */
function client_socket_call(name, data, cb){
	socket.emit(name, data || emptyObject, cb || emptyFunction);
}


/**
 * Exposed functions for the communications on the client
 *
 * @namespace
 *
 * @borrows module:comms~authenticate
 */
window.comms = {

	// Functions from the inner members
	authenticate : authenticate,
	authenticated : authenticated,
	createSocket : createSocket,
	socketOpen : socketOpen,

	logout : logout,

	getToken : getToken,
	tokeniseGetRequest : tokeniseGetRequest,
	loadScriptFile : loadScriptFile,
	ajaz : ajaz,

	setEventListener : setEventListener,
	clearEventListeners : clearEventListeners,


	/** Something */
	get_hub_backgroud_image : function(cb){
		client_socket_call(	'get_hub_backgroud_image',
							{},
							cb
						);
	},

	get_hp_value : function(cb){
		client_socket_call(	'get_hp_value',
							{},
							cb
						);
	},

	get_status_value : function(statusId, cb){
		client_socket_call(	'get_status_value',
							{id: statusId},
							cb
						);
	},

	get_all_status_values : function(cb){
		client_socket_call(	'get_all_status_values',
							{},
							cb
						);
	},


//USER MANAGEMENT - Ajax request
	get_conditions_list : function(cb){
		postRequest(	'/user/get_conditions_list',
						null,
						cb	
					);
	},

	validate_username : function(username, cb){
		postRequest(	'/user/validate_username',
						{username: username},
						cb	
					);
	},

	validate_dob : function(dob, cb){
		postRequest(	'/user/validate_dob',
						{dob: dob},
						cb
					);
	},

	validate_conditions : function(dob, cb){
		postRequest(	'/user/validate_conditions',
						{conditions: conditions},
						cb
					);
	},

	sign_up : function(username, password, dob, cb){
		postRequest(	'/user/sign_up',
						{username: username, password: password, dob: dob},
						cb
					);
	},

	add_conditions : function(conditions, cb){
		postRequest(	'/user/validate_conditions',
						{conditions: conditions},
						cb
					);
	},

	change_user_details : function(username, password, dob, conditions, cb){
		postRequest(	'/user/change_details',
						{username: username, password: password, dob: dob, conditions: conditions},
						cb
				);
	},

	// USER MANAGEMENT - Socket requests
	get_options : function(cb){
		client_socket_call(	'get_options',
							{},
							cb
						);
	},

	set_options : function(cb){
		client_socket_call(	'set_options',
							{},
							cb
						);
	},

	//AVATAR AND HOUSE CUSTOMIZATION
	get_all_item_info : function(cb){	
		client_socket_call(	'get_all_item_info',
							{},
							cb
						);
		
	},

	get_single_item_info : function(id, cb){
			client_socket_call(	'get_single_item_info',
							{id: id},
							cb
						);
	},

	get_items_for_slot : function(slot, cb){
			client_socket_call(	'get_items_for_slot',
							{slot: slot},
							cb
						);
	},

	get_user_unlocked_items : function(cb){
		client_socket_call( 'get_user_unlocked_items',
							{},
							cb
						);
	},

	get_user_unlocked_items_by_slot : function(slot, cb){
		client_socket_call( 'get_user_unlocked_items_by_slot',
							{slot : slot},
							cb
						);
	},

	get_user_equipped_items : function(cb){
		client_socket_call( 'get_user_equipped_items',
							{},
							cb
						);
	},

	update_equipped_items : function(items, cb){
		client_socket_call(	'update_equipped_items',
							items,
							cb
						);
	},
	
	get_avatar : function(cb, items){
		client_socket_call( 'get_avatar',
							{items: items},
							cb
						);
	},

	//BAG
	get_bag : function(cb){
		client_socket_call(	'get_bag',
							{},
							cb
						);
	},

	set_bag : function(carriables, cb){
		client_socket_call(	'set_bag',
							{carriables: carriables},
							cb
						);
	},

	get_all_carriables : function(cb){
		client_socket_call(	'get_all_carriables',
							{},
							cb
						);
	},

	get_single_carriable : function(id, cb){
		client_socket_call( 'get_single_carriable',
							{"id": id},
							cb
						);
	},

	//MINIGAME SELECTION
	list_minigames : function(cb){
		client_socket_call(	'list_minigames',
							{},
							cb
						);
		
	},
	
	get_minigame_info : function(gameid, cb){
		this.list_minigames(function(data){
			var dtwo = data.filter(function(a){
				return a.id === gameid;
			});
			
			cb(dtwo[0]);
		});
	},

	launch_minigame : function(id, cb){
		client_socket_call(	'launch_minigame',
							{id: id},
							cb
					);
	},

	finish_minigame : function(id, score, currency, cb){
		client_socket_call( 'finish_minigame',
							{gameId: id, score: score, currency: currency},
							cb	
					);
	},

	get_scores : function(optionnum, user_id, game_id, cb){
		var valid_options = ['all_scores', 'all_scores_for_game', 'all_scores_for_user', 'all_scores_for_user_for_game'];
		
		client_socket_call(	'get_scores',
							{option_num: optionnum, option_text: valid_options[optionnum] || valid_options[0], user_id: user_id, game_id: game_id},
							cb
						);
	},

	//MINIGAME
	modify_hp_value : function(value, cb){
		client_socket_call( 'modify_hp_value',
							{value: value},
							cb
						);
	},

	modify_status_value : function(status_name, value, cb){
		client_socket_call(	'modify_status_value',
							{"status_name": status_name, value: value},
							cb
						);
	},

	use_carriable : function(carriable_id, cb){
		client_socket_call(	'use_carriable',
							{carriable_id: carriable_id},
							cb
						);
	},
	
	set_hp_value : function(newhp, cb){
		client_socket_call( 'set_hp_value',
							{"newhp" : newhp},
							cb	
						);
	},

	get_symptoms : function(cb){
		client_socket_call(	'get_symptoms',
							{},
							cb
						);
	}
};

})();
