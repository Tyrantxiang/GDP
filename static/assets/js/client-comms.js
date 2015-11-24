(function(){
"use strict";


// The token used after auth
var token = null,
	socket = null,
	// The event listeners for the comms
	eventListeners = {};

function ajaz(url, verb, data, success, error, responseType, contentType){
	var xhr = new XMLHttpRequest();
	verb = verb.toUpperCase();
	
	// Attach data to the get request
	if(verb === "GET"){
		dataStrings = [];
		for(d in data){
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
		if(this.status === 200){
			success.call(this, this.response);
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
	xhr.setRequestHeader("Content-Type", contentType || "application/json")

	xhr.send(data);

	return xhr;
}

function postRequest(url, data, cb){
	ajaz(url, "POST", data, cb);
}



// NOT EXPOSED
function setToken(t){
	token = t;
}

function getToken(){
	return token;
}

function tokeniseGetRequest(path){
	return path + "?t=" + getToken();
}

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



function setEventListener(name, func){
	if(!eventListeners[name]){
		eventListeners[name] = [];
	}

	eventListeners[name].push(func);
}

function clearEventListeners(name){
	if(name){
		delete eventListeners[name];
	}else{
		eventListeners = {};
	}
}

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
		for(name in eventListeners){
			eventListeners[name].forEach(function(l){
				socket.on(name, l);
			});
		}

		cb();
	});
}


function logout(cb){
	socket.disconnect();
	token = null;
	socket = null;
	cb();
}

function authenticated(){
	return !!token;
}

function socketOpen(){
	return !!socket;
}

var emptyFunction = function(){};
function client_socket_call(name, data, cb){
	socket.emit(name, data, cb || emptyFunction);
}


window.comms = {

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

	get_user_unlocked_items : function(cb){
		client_socket_call( 'get_user_unlocked_items',
							{},
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
		client_socket_call(	'update_eqipped_items',
							items,
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



	// Additional functions
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


}

})();
