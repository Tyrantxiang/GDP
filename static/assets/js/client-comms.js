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
	if(t) cb(authenticated : true});

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

function client_socket_call(name, data, cb){
	socket.emit(name, data, cb || function(){});	
}


/**** I am removing superuser commands for now, these are likely to be done via a web interface and so will use ajax
//SUPER USER
function add_bag_item(id, name, sprite, effects, cb){
	client_socket_call(	'add_bag_item', 
						{id: id, 'name': name, 'sprite': sprite, 'effects': effects}, 
						cb
					);
}

function remove_bag_item(id, cb){
	client_socket_call(	'remove_bag_item', 
						{'id': id},
						cb
					);
}

function add_status(id, name, min_val, max_val, healthy_min, healthy_max, isNumber, words, cb){
	client_socket_call(	'add_status',
						{'id': id, 'name': name, 'min': min_val, 'max': max_val, 'healthy_min': healthy_min,
							'healthy_max': healthy_max, 'isNumber': isNumber, 'words': words},
						cb
	);
}

function remove_status(id, cb){
	client_socket_call(	'remove_status',
						{'id': id},
						cb
		);
}

function add_condition(name, statuses, cb){
	client_socket_call(	'add_condition',
						{name: name, statuses: statuses},
						cb
		);
}

function remove_condition(id, cb){
	client_socket_call(	'remove_condition',
						{id: id},
						function(data){ cb(data)}
					);
}

function add_store_item(id, name, description, slot, price, sprite, cb){
	client_socket_call(	'add_store_item',
						{id: id, name: name, description: description, slot: slot, price: price, sprite: sprite},
						cb;
		);
}

function remove_store_item(id, cb){
	client_socket_call(	'remove_store_item',
						{id: id},
						cb
		);
}

function add_minigame(id, name, description, image, scripts, entry_point, cb){
	client_socket_call(	'add_minigame',
						{id: id, name: name, description: description, image: image, scripts: scripts, entry_point: entry_point},
						cb
					);
}

function remove_minigame(id, cb){
	client_socket_call(	'remove_minigame',
						{id: id},
						cb
					);
}

function add_inventory(id, cb){
	client_socket_call(	'add_inventory',
						{id: id},
						cb
					);
}

function remove_inventory(id, cb){
	client_socket_call(	'remove_inventory',
						{id:id},
						cb
					);
	
}
******/



function get_hub_backgroud_image(cb){
	client_socket_call(	'get_hub_backgroud_image',
						{},
						cb
					);
}


//USER MANAGEMENT - Ajax request
function get_conditions_list(cb){
	postRequest(	'/user/get_conditions_list',
					null,
					cb	
				);
}

function validate_username(username, cb){
	postRequest(	'/user/validate_username',
					{username: username},
					cb	
				);
}

function validate_dob(dob, cb){
	postRequest(	'/user/validate_dob',
					{dob: dob},
					cb
				);
}

function validate_conditions(dob, cb){
	postRequest(	'/user/validate_conditions',
					{conditions: conditions},
					cb
				);
}

function sign_up(username, password, dob, cb){
	postRequest(	'/user/sign_up',
					{username: username, password: password, dob: dob},
					cb
				);
}

function add_conditions(conditions, cb){
	postRequest(	'/user/validate_conditions',
					{conditions: conditions},
					cb
				);
}

function change_user_details(username, password, dob, conditions, cb){
	postRequest(	'/user/change_details',
					{username: username, password: password, dob: dob, conditions: conditions},
					cb
			);
}

// USER MANAGEMENT - Socket requests
function get_options(cb){
	client_socket_call(	'get_options',
						{},
						cb
					);
}

function set_options(cb){
	client_socket_call(	'set_options',
						{},
						cb
					);
}

//AVATAR AND HOUSE CUSTOMIZATION
function get_all_item_info(cb){	
	client_socket_call(	'get_all_item_info',
						{},
						cb
					);
	
}

function get_single_item_info(id, cb){
		client_socket_call(	'get_single_item_info',
						{id: id},
						cb
					);
}

function get_user_unlocked_items(cb){
	client_socket_call( 'get_user_unlocked_items',
						{},
						cb
					);
}

function get_user_equipped_items(cb){
	client_socket_call( 'get_user_equipped_items',
						{},
						cb
					);
}

function update_equipped_items(items, cb){
	client_socket_call(	'update_eqipped_items',
						items,
						cb
					);
}

//BAG
function get_bag(cb){
	client_socket_call(	'get_bag',
						{},
						cb
					);
}

function set_bag(carriables, cb){
	client_socket_call(	'set_bag',
						{carriables: carriables},
						cb
					);
}

//MINIGAME SELECTION
function list_minigames(cb){
	client_socket_call(	'list_minigames',
						{},
						cb
					);
	
}

function launch_minigame(id, cb){
	client_socket_call(	'launch_minigame',
						{id: id},
						cb
				);
}

function finish_minigame(id, score, currency, cb){
	client_socket_call( 'finish_minigame',
						{gameId: id, score: score, currency: currency},
						cb	
				);
}

function get_scores(optionnum, user_id, game_id, cb){
	var valid_options = ['all_scores', 'all_scores_for_game', 'all_scores_for_user', 'all_scores_for_user_for_game'];
	
	client_socket_call(	'get_scores',
						{option_num: optionnum, option_text: valid_options[optionnum] || valid_options[0], user_id: user_id, game_id: game_id},
						cb
					);
}

//MINIGAME
function modify_hp_value(value, cb){
	client_socket_call( 'set_hp_value',
						{value: value},
						cb
					);
}

function modify_status_value(status_name, value, cb){
	client_socket_call(	'set_status',
						{"status_name": status_name, value: value},
						cb
					);
}

function use_carriable(carriable_id, cb){
	client_socket_call(	'use_carriable',
						{carriable_id: carriable_id},
						cb
					);
}



///////////////////////////////////////////


/*comms.superuser = {}
comms.superuser.add_bag_item = add_bag_item;
comms.superuser.remove_bag_item = remove_bag_item;
comms.superuser.add_status = add_status;
comms.superuser.remove_status = remove_status;
comms.superuser.add_condition = remove_condition;
comms.superuser.remove_condition = remove_condition;
comms.superuser.add_store_item = add_store_item;
comms.superuser.remove_store_item = remove_store_item;
comms.superuser.add_minigame = add_minigame;
comms.superuser.remove_minigame = remove_minigame;
comms.superuser.add_inventory = add_inventory;
comms.superuser.remove_inventory = remove_inventory;*/

window.comms = {

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

	get_hub_backgroud_image : get_hub_backgroud_image,


	// User management
	get_conditions_list : get_conditions_list,
	validate_username : validate_username,
	validate_dob : validate_dob,
	validate_conditions : validate_conditions,
	sign_up : sign_up,
	change_user_details : change_user_details,
	get_options : get_options,
	set_options : set_options,


	// Items
	get_all_item_info : get_all_item_info,
	get_single_item_info : get_single_item_info,
	get_user_equipped_items : get_user_equipped_items,
	update_equipped_items : update_equipped_items,

	
	// Bag / carriables
	get_bag : get_bag,
	set_bag : set_bag,
	use_carriable : use_carriable,


	// In game
	list_minigames : list_minigames,
	launch_minigame : launch_minigame,
	get_scores : get_scores,
	modify_hp_value : modify_hp_value,
	modify_status_value : modify_status_value

	
}

})();
