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
}

var remove_bag_item = function(id, cb){
	socket.emit(	'remove_bag_item', 
					{'id': id},
					function(data){ cb(data); }
				);
}

var add_status = function(id, name, min_val, max_val, healthy_min, healthy_max, isNumber, words, cb){
	socket.emit(	'add_status',
					{'id': id, 'name': name, 'min': min_val, 'max': max_val, 'healthy_min': healthy_min,
						'healthy_max': healthy_max, 'isNumber': isNumber, 'words': words},
					function(data){ cb(data); }
	);
}

var remove_status = function(id, cb){
	socket.emit(	'remove_status',
					{'id': id},
					function(data){ cb(data); }
	);
}

var add_condition = function(name, statuses, cb){
	socket.emit(	'add_condition',
					{name: name, statuses: statuses},
					function(data){ cb(data); }
	);
}

var remove_condition = function(id, cb){
	socket.emit(	'remove_condition',
					{id: id},
					function(data){ cb(data);
				);
}

var add_store_item = function(id, name, description, slot, price, sprite, cb){
	socket.emit(	'add_store_item',
					{id: id, name: name, description: description, slot: slot, price: price, sprite: sprite},
					function(data){ cb(data); };
	);
}

var remove_store_item = function(id, cb){
	socket.emit(	'remove_store_item',
					{id: id},
					function(data){ cb(data); }
	);
}

var add_minigame = function(id, name, description, image, scripts, entry_point, cb){
	socket.emit(	'add_minigame',
					{id: id, name: name, description: description, image: image, scripts: scripts, entry_point: entry_point},
					function(data){ cb(data); }
				);
}

var remove_minigame = function(id, cb){
	socket.emit(	'remove_minigame',
					{id: id},
					function(data){ cb(data); }
				);
}

var add_inventory = function(id, cb){
	socket.emit(	'add_inventory',
					{id: id},
					function(data){ cb(data); }
				);
}

var remove_inventory = function(id, cb){
	socket.emit(	'remove_inventory',
					{id:id},
					function(data){ cb(data); }
				);
	
}


///////////////////////////////////////////
var client_socket_call = function(name, data, cb){
	socket.emit(name, data, function(data){ cb(data); });	
}