(function(){
	"use strict";

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
		xhr.setRequestHeader("Content-Type", contentType || "application/json");

		xhr.send(data);

		return xhr;
	}

	function postRequest(url, data, cb){
		ajaz("/superuser/" + url, "POST", data, cb);
	}

	window.superuser = {
		
		add_bag_item : function(id, name, sprite, effects, cb){
			postRequest(	'add_bag_item', 
							{id: id, 'name': name, 'sprite': sprite, 'effects': effects}, 
							cb
						);
		},

		remove_bag_item : function(id, cb){
			postRequest(	'remove_bag_item', 
							{'id': id},
							cb
						);
		},

		add_status : function(id, name, min_val, max_val, healthy_min, healthy_max, isNumber, words, cb){
			postRequest(	'add_status',
							{'id': id, 'name': name, 'min': min_val, 'max': max_val, 'healthy_min': healthy_min,
								'healthy_max': healthy_max, 'isNumber': isNumber, 'words': words},
							cb
			);
		},

		remove_status : function(id, cb){
			postRequest(	'remove_status',
							{'id': id},
							cb
			);
		},

		add_condition : function(name, statuses, cb){
			postRequest(	'add_condition',
							{name: name, statuses: statuses},
							cb
			);
		},

		remove_condition : function(id, cb){
			postRequest(	'remove_condition',
							{id: id},
							function(data){ cb(data)}
						);
		},

		add_store_item : function(id, name, description, slot, price, sprite, cb){
			postRequest(	'add_store_item',
							{id: id, name: name, description: description, slot: slot, price: price, sprite: sprite},
							cb;
			);
		},

		remove_store_item : function(id, cb){
			postRequest(	'remove_store_item',
							{id: id},
							cb
			);
		},

		add_minigame : function(id, name, description, img, scripts, entry_point, cb){
			postRequest(	'add_minigame',
							{id: id, name: name, description: description, "image": img, scripts: scripts, entry_point: entry_point},
							cb
						);
		},

		remove_minigame : function(id, cb){
			postRequest(	'remove_minigame',
							{id: id},
							cb
						);
		},

		add_inventory : function(id, cb){
			postRequest(	'add_inventory',
							{id: id},
							cb
						);
		},

		remove_inventory : function(id, cb){
			postRequest(	'remove_inventory',
							{id:id},
							cb
						);
		}
	}
})();