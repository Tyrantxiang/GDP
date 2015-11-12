(function(){
"use strict";


// The token used after auth
var token = null,
	socket = null,
	// The event listeners for the comms
	eventListeners = {};

function ajaz(url, verb, data, success, error, responseType, contentType){
	var xhr = new XMLHttpRequest();
	verb = very.toUpperCase();
	
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

	xhr.addEventListener("load", success);
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
	ajaz("/authenticate", POST,
		{ username : username, password : password },
		function(){
			setToken(this.response.token);
			cb();
		},
		function(){
			console.log("error");
			cb(true);
		}
	);
}

function createSocket(){
	var t = getToken();
	if(!t){
		throw new Error("Authentication required first");
	}

	socket = io.connect('/', {
		query: "token=" + t
	});

	// Bind the event listeners
	for(name in eventListeners){
		eventListeners[name].forEach(function(l){
			socket.on(name, l);
		});
	}
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
	socket.emit(name, data, cb);	
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





//USER MANAGEMENT - Ajax request
function validate_username(username, cb){
	postRequest(	'/user/validate_username',
					{username: username},
					cb	
				);
}

function validate_details(dob, illnesses, cb){
	postRequest(	'/user/validate_details',
					{dob: dob, illnesses: illnesses},
					cb
				);
}

function sign_up(username, password, dob, illnesses, cb){
	postRequest(	'/user/sign_up',
					{username: username, password: password, dob: dob, illnesses: illnesses},
					cb
				);
}

function change_user_details(username, password, dob, illnesses, cb){
	postRequest(	'/user/change_details',
					{username: username, password: password, dob: dob, illnesses: illnesses},
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

function get_item_info(option, cb){
	var valid_options = ['get_full_configs', 'get_text_first', 'inventory_first'];
	
	client_socket_call(	'get_item_info',
						{option_num: option, option_text: valid_options[option] || valid_options[0]},
						cb
					);
	
}

function update_equipped_items(items, cb){
	client_socket_call(	'update_eqipped_items',
						{items: items},
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

function set_bag(items, cb){
	client_socket_call(	'set_bag',
						{items: items},
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

function get_scores(option, id, cb){
	var valid_options = ['all_scores', 'scores_for_game', 'scores_for_user'];
	
	client_socket_call(	'get_scores',
						{option_num: option, option_text: valid_options[option] || valid_options[0], id: id},
						cb
					);
}





//MINIGAME
function set_score(cb){
	client_socket_call(	'set_score',
						{},
						cb
					);
}

function set_currency(value, cb){
	client_socket_call(	'set_currency',
						{value: value},
						cb
					);
}

function set_hp(value, cb){
	client_socket_call(	'set_hp',
						{value: value},
						cb
					);
}

function set_status(status, value, cb){
	client_socket_call(	'set_status',
						{status: status, value: value},
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
	ajaz : ajaz,

	setEventListener : setEventListener,
	clearEventListeners : clearEventListeners,


	user_management : {
		validate_username : validate_username,
		validate_details : validate_details,
		sign_up : sign_up,
		change_user_details : change_user_details,
		get_options : get_options,
		set_options : set_options
	},
	
	customise : {
		get_item_info : get_item_info,
		update_equipped_items : update_equipped_items
	},
	
	
	bag : {
		get_bag : get_bag,
		set_bag : set_bag
	},


	
	minigame : {
		list_minigames : list_minigames,
		launch_minigame : launch_minigame,
		get_scores : get_scores,
		set_score : set_score,
		set_currency : set_currency,
		set_hp : set_hp,
		set_status : set_status
	}
	
}

})();