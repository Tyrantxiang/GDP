(function(){
"use strict";

var create_socket = function(){
	
	//POST to /authenticate to get the token, then use that to open the websocket
	$.post("/authenticate").done(function(data){
		socket = io.connect('http://localhost:3000', {
			query: "token=" + data.token
		});
	});
};

//SUPER USER
var add_bag_item = function(id, name, sprite, effects, cb){
	socket.emit(	'add_bag_item', 
					{id: id, 'name': name, 'sprite': sprite, 'effects': effects}, 
					cb
				);
};

var remove_bag_item = function(id, cb){
	socket.emit(	'remove_bag_item', 
					{'id': id},
					cb
				);
};

var add_status = function(id, name, min_val, max_val, healthy_min, healthy_max, isNumber, words, cb){
	socket.emit(	'add_status',
					{'id': id, 'name': name, 'min': min_val, 'max': max_val, 'healthy_min': healthy_min,
						'healthy_max': healthy_max, 'isNumber': isNumber, 'words': words},
					cb
	);
};

var remove_status = function(id, cb){
	socket.emit(	'remove_status',
					{'id': id},
					cb
	);
};

var add_condition = function(name, statuses, cb){
	socket.emit(	'add_condition',
					{name: name, statuses: statuses},
					cb
	);
};

var remove_condition = function(id, cb){
	socket.emit(	'remove_condition',
					{id: id},
					function(data){ cb(data)};
				);
};

var add_store_item = function(id, name, description, slot, price, sprite, cb){
	socket.emit(	'add_store_item',
					{id: id, name: name, description: description, slot: slot, price: price, sprite: sprite},
					cb;
	);
};

var remove_store_item = function(id, cb){
	socket.emit(	'remove_store_item',
					{id: id},
					cb
	);
};

var add_minigame = function(id, name, description, image, scripts, entry_point, cb){
	socket.emit(	'add_minigame',
					{id: id, name: name, description: description, image: image, scripts: scripts, entry_point: entry_point},
					cb
				);
};

var remove_minigame = function(id, cb){
	socket.emit(	'remove_minigame',
					{id: id},
					cb
				);
};

var add_inventory = function(id, cb){
	socket.emit(	'add_inventory',
					{id: id},
					cb
				);
};

var remove_inventory = function(id, cb){
	socket.emit(	'remove_inventory',
					{id:id},
					cb
				);
	
};

//USER MANAGEMENT
var login = function(username, password, cb){
	socket.emit(	'login',
					{username: username, password: password},
					cb
				);
};

var validate_username = function(username, cb){
	socket.emit(	'validate_username',
					{username: username},
					cb	
				);
};

var validate_details = function(dob, illnesses, cb){
	socket.emit(	'validate_details',
					{dob: dob, illnesses: illnesses},
					cb
				);
};

var sign_up = function(username, password, dob, illnesses, cb){
	socket.emit(	'sign_up',
					{username: username, password: password, dob: dob, illnesses: illnesses},
					cb
				);
};

var change_user_details = function(username, password, dob, illnesses, cb){
	socket.emit(	'change_user_details',
					{username: username, password: password, dob: dob, illnesses: illnesses},
					cb
			);
};

var logout = function(cb){
	socket.disconnect();
	cb();
}

var get_options = function(cb){
	socket.emit(	'get_options',
					{},
					cb
				);
};


var set_options = function(cb){
	socket.emit(	'set_options',
					{},
					cb
				);
};

//AVATAR AND HOUSE CUSTOMIZATION

var get_item_info = function(option, cb){
	var valid_options = ['get_full_configs', 'get_text_first', 'inventory_first'];
	
	socket.emit(	'get_item_info',
					{option_num: option, option_text: valid_options[option] || valid_options[0]},
					cb
				);
	
};

var update_equipped_items = function(items, cb){
	socket.emit(	'update_eqipped_items',
					{items: items},
					cb
				);
};

//BAG
var get_bag = function(cb){
	socket.emit(	'get_bag',
					{},
					cb
				);
};

var set_bag = function(items, cb){
	socket.emit(	'set_bag',
					{items: items},
					cb
				);
};

//MINIGAME SELECTION
var list_minigames = function(cb){
	socket.emit(	'list_minigames',
					{},
					cb
				);
	
};

var launch_minigame = function(id, cb){
	socket.emit(	'launch_minigame',
					{id: id},
					cb
					cb
				);
};

var get_scores = function(option, id, cb){
	var valid_options = ['all_scores', 'scores_for_game', 'scores_for_user'];
	
	socket.emit(	'get_scores',
					{option_num: option, option_text: valid_options[option] || valid_options[0], id: id},
					cb
				);
};

//MINIGAME
var set_score = function(cb){
	socket.emit(	'set_score',
					{},
					cb
				);
};

var set_currency = function(value, cb){
	socket.emit(	'set_currency',
					{value: value},
					cb
				);
};

var set_hp = function(value, cb){
	socket.emit(	'set_hp',
					{value: value},
					cb
				);
};

var set_status = function(status, value, cb){
	socket.emit(	'set_status',
					{status: status, value: value},
					cb
				);
};

///////////////////////////////////////////
var client_socket_call = function(name, data, cb){
	socket.emit(name, data, cb);	
}

window.comms = (function(){
	create_socket();
	
	var comms = {};
	
	comms.superuser = {};
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
	comms.superuser.remove_inventory = remove_inventory;
	
	comms.usermanagement = {};
	comms.usermanagement.login = login;
	comms.usermanagement.validate_username = validate_username;
	comms.usermanagement.validate_details = validate_details;
	comms.usermanagement.sign_up = sign_up;
	comms.usermanagement.change_user_details = change_user_details;
	comms.usermanagement.logout = logout;
	comms.usermanagement.get_options = get_options;
	comms.usermanagement.set_options = set_options;
	
	comms.customise = {};
	comms.customise.get_item_info = get_item_info;
	comms.customise.update_equipped_items = update_equipped_items;
	
	comms.bag = {};
	comms.bag.get_bag = get_bag;
	comms.bag.set_bag = set_bag;
	
	comms.minigame = {};
	comms.minigame.list_minigames = list_minigames;
	comms.minigame.launch_minigame = launch_minigame;
	comms.minigame.get_scores = get_scores;
	comms.minigame.set_score = set_score;
	comms.minigame.set_currency = set_currency;
	comms.minigame.set_hp = set_hp;
	comms.minigame.set_status = set_status;
	
	return comms;
})();

})();