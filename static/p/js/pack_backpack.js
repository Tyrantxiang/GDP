(function(){
	window.menu = {};
	window.menu.launch_menu = {
		load : function(){
			// TODO: load_max should really be set somewhere and passed in, not defined here.
			var array_to_add	= [];
			var load			= 0;
			var load_max		= 10;

			// TODO: Pls Corin halp.
			/*
			$.get('/views/pack_backpack.html', function(data) {
				$('#main-content-area').append(data);
				document.title	= "Pack your backpack";
			});
			*/
			
			$('#main-content-area').append('<div class="grey-box" id="backpacking_overlay"></div>');
			$('#backpacking_overlay').html('');

			$('#backpacking_overlay').append('<div id="overlay" class="col-md-8 grey-box"></div>');

			$('#overlay').append('<div id="title_container" class="row"></div>');
			$('#overlay').append('<div id="available_container" class="row"></div>');
			$('#overlay').append('<div id="addition_container" class="row"></div>');
			$('#overlay').append('<div id="button_container" class="row"></div>');

			$('#title_container').append('<div class="col-md-12">Pack your backpack!</div>');

			$('#available_container').append('<div id="backpack_available_title" class="col-md-12">Available items:</div>');
			$('#available_container').append('<div id="backpack_available" class="col-md-12"></div>');

			$('#addition_container').append('<div id="backpack_addition_title" class="col-md-12">Packed Backpack:</div>');
			$('#addition_container').append('<div id="backpack_addition" class="col-md-12"></div>');
			
			$('#button_container').append('<button id="backpack_accept" class="col-md-6">Accept</button>');
			$('#button_container').append('<button id="backpack_cancel" class="col-md-6">Cancel</button>');

			window.comms.get_all_item_info(function(data) {
				console.log(data);
			});

			// Populate the potential carriables, and attach their event handlers.
			window.comms.get_all_carriables(function(data) {
				for(var d in data)
				{
					array_to_add[data[d].id]	= 0;

					var id		= 'potential_carriable_' + data[d].id;
					var img_id	= 'potential_carriable_img_' + data[d].id;

					$('#backpack_available').append('<div id="' + id + '">' + data[d].name + '</div>');
					$('#backpack_available').append('<img id="' + img_id + '" class="packing_images" src="' + data[d].url + '">');

					// TODO
					//hub.getCarriablesInBag()

					$('#backpack_available').on('click', '#' + id + ', #' + img_id, function(obj) {
						var carriable_id	= parseInt(obj.currentTarget.id.split('_').pop());

						if(load < load_max)
						{
							var i						= array_to_add[carriable_id];
							i							= i + 1;
							array_to_add[carriable_id]	= i;

							load						= load + 1;

							window.comms.get_single_carriable(carriable_id, function(obj) {
								console.log(carriable_id + ', ' + obj)
								id		= 'carriable_' + carriable_id;
								img_id	= 'carriable_img_' + carriable_id;

								$('#backpack_addition').append('<img id="' + img_id + '" class="packing_images" src="' + obj.url + '">');
							});
						}
						else
						{
							alert('You can only carry ' + load_max + ' items, please remove some if you want to make room for more.');
						};
					});
				};
			});

			window.comms.get_bag(function(data) {
				var	carriables	= data.carriables;
				for(var c in carriables)
				{
					// Display current bag contents.
					window.comms.get_single_carriable(carriables[c], function(obj) {
						var id		= 'carriable_' + obj.id;
						var img_id	= 'carriable_img_' + obj.id;

						$('#backpack_addition').append('<img id="' + img_id + '" class="packing_images" src="' + obj.url + '">');

						var i							= array_to_add[parseInt(obj.id)];
						i								= i + 1;
						array_to_add[parseInt(obj.id)]	= i;

						load	= load + 1;
					});
				};
			});

			// Delete from addition to bag on click.
			$('#backpack_addition').on('click', function(obj) {
				var id	= parseInt(obj.toElement.id.split('_').pop());

				var i				= array_to_add[id];
				i					= i - 1;
				array_to_add[id]	= i;

				$('#' + obj.toElement.id).remove();
			});

			$('#backpack_accept').on('click', function(obj) {
				$('#overlay').css('visibility', 'hidden');
				$('#canvas').css('visibility', 'visible');

				var set_array	= [];
				for(var a in array_to_add)
				{
					for(var i = 0; i < array_to_add[a]; i++)
					{
						set_array.push(a);
					};
				};
				window.comms.set_bag(set_array, function() {});
			});

			$('#backpack_cancel').on('click', function(obj) {
				$('#overlay').css('visibility', 'hidden');
				$('#canvas').css('visibility', 'visible');
			});

			$('#canvas').css('visibility', 'hidden');
			$('#overlay').css('visibility', 'visible');
		}
	};
})();