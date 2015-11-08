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
					function(data){ cb(data); }
				);
};

var remove_bag_item = function(id, cb){
	socket.emit(	'remove_bag_item', 
					{'id': id},
					function(data){ cb(data); }
				);
};

var add_status = function(id, name, min_val, max_val, healthy_min, healthy_max, isNumber, words, cb){
	socket.emit(	'add_status',
					{'id': id, 'name': name, 'min': min_val, 'max': max_val, 'healthy_min': healthy_min,
						'healthy_max': healthy_max, 'isNumber': isNumber, 'words': words},
					function(data){ cb(data); }
	);
};

var remove_status = function(id, cb){
	socket.emit(	'remove_status',
					{'id': id},
					function(data){ cb(data); }
	);
};

var add_condition = function(name, statuses, cb){
	socket.emit(	'add_condition',
					{name: name, statuses: statuses},
					function(data){ cb(data); }
	);
};

var remove_condition = function(id, cb){
	socket.emit(	'remove_condition',
					{id: id},
					function(data){ cb(data);
				);
};

var add_store_item = function(id, name, description, slot, price, sprite, cb){
	socket.emit(	'add_store_item',
					{id: id, name: name, description: description, slot: slot, price: price, sprite: sprite},
					function(data){ cb(data); };
	);
};

var remove_store_item = function(id, cb){
	socket.emit(	'remove_store_item',
					{id: id},
					function(data){ cb(data); }
	);
};

var add_minigame = function(id, name, description, image, scripts, entry_point, cb){
	socket.emit(	'add_minigame',
					{id: id, name: name, description: description, image: image, scripts: scripts, entry_point: entry_point},
					function(data){ cb(data); }
				);
};

var remove_minigame = function(id, cb){
	socket.emit(	'remove_minigame',
					{id: id},
					function(data){ cb(data); }
				);
};

var add_inventory = function(id, cb){
	socket.emit(	'add_inventory',
					{id: id},
					function(data){ cb(data); }
				);
};

var remove_inventory = function(id, cb){
	socket.emit(	'remove_inventory',
					{id:id},
					function(data){ cb(data); }
				);
	
};

//USER MANAGEMENT
var login = function(username, password, cb){
	socket.emit(	'login',
					{username: username, password: password},
					function(data){ cb(data); }
				);
};

var validate_username = function(username, cb){
	socket.emit(	'validate_username',
					{username: username},
					function(data){ cb(data); }	
				);
};

var validate_details = function(dob, illnesses, cb){
	socket.emit(	'validate_details',
					{dob: dob, illnesses: illnesses},
					function(data){ cb(data); }
				);
};

var sign_up = function(username, password, dob, illnesses, cb){
	socket.emit(	'sign_up',
					{username: username, password: password, dob: dob, illnesses: illnesses},
					function(data){ cb(data); }
				);
};

var change_user_details = function(username, password, dob, illnesses, cb){
	socket.emit(	'change_user_details',
					{username: username, password: password, dob: dob, illnesses: illnesses},
					function(data){ cb(data); }
			);
};

//TODO: Come back to this
var logout = function(cb){
	socket.emit(	'logout',
					{},
					function(data){
						
						
					}
				);
}

var get_options = function(cb){
	socket.emit(	'get_options',
					{},
					function(data){ cb(data); }
				);
};


var set_options = function(cb){
	socket.emit(	'set_options',
					{},
					function(data){ cb(data); }
				);
};

//AVATAR AND HOUSE CUSTOMIZATION

var get_item_info = function(option, cb){
	var valid_options = ['get_full_configs', 'get_text_first', 'inventory_first'];
	
	socket.emit(	'get_item_info',
					{option_num: option, option_text: valid_options[option] || valid_options[0]},
					function(data){ cb(data); }
				);
	
};

var update_equipped_items = function(items, cb){
	socket.emit(	'update_eqipped_items',
					{items: items},
					function(data){ cb(data); }
				);
};

//BAG
var get_bag = function(cb){
	socket.emit(	'get_bag',
					{},
					function(data){ cb(data); }
				);
};

var set_bag = function(items, cb){
	socket.emit(	'set_bag',
					{items: items},
					function(data){ cb(data); }
				);
};

//MINIGAME SELECTION
var list_minigames = function(cb){
	socket.emit(	'list_minigames',
					{},
					function(data){ cb(data); }
				);
	
};

var launch_minigame = function(id, cb){
	socket.emit(	'launch_minigame',
					{id: id},
					function(data){ cb(data); }
					function(data){ cb(data); }
				);
};

var get_scores = function(option, id, cb){
	var valid_options = ['all_scores', 'scores_for_game', 'scores_for_user'];
	
	socket.emit(	'get_scores',
					{option_num: option, option_text: valid_options[option] || valid_options[0], id: id},
					function(data){ cb(data); }
				);
};

//MINIGAME
var set_score = function(cb){
	socket.emit(	'set_score',
					{},
					function(data){ cb(data); }
				);
};

var set_currency = function(value, cb){
	socket.emit(	'set_currency',
					{value: value},
					function(data){ cb(data); }
				);
};

var set_hp = function(value, cb){
	socket.emit(	'set_hp',
					{value: value},
					function(data){ cb(data); }
				);
};

var set_status = function(status, value, cb){
	socket.emit(	'set_status',
					{status: status, value: value},
					function(data){ cb(data); }
				);
};

///////////////////////////////////////////
var client_socket_call = function(name, data, cb){
	socket.emit(name, data, function(data){ cb(data); });	
}