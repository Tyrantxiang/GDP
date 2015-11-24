(function(){
	window.launch_menu = {
		load : function(){
			var array_to_add	= [];
			// TODO: Import where load/loadmax is from.
			var load			= 0;
			var load_max		= 10;

			// TODO: Fix naming/styling.
			$('#main-content-area').append('<div class="grey-box" id="test"></div>');
			$('#test').html('');

			// TODO: Do I need both of these?
			$('#test').append('<div id="test2"></div>');
			$('#test2').append('<div id="overlay" class="col-md-8 grey-box"></div>');

			$('#overlay').append('<div id="title_container" class="row"></div>');
			$('#overlay').append('<div id="available_container" class="row"></div>');

			//$('#overlay').append('<div id="select_container" class="row"></div>');
			$('#overlay').append('<div id="addition_container" class="row"></div>');

			$('#overlay').append('<div id="button_container" class="row"></div>');

			$('#title_container').append('<div class="col-md-12">Pack your backpack!</div>');

			$('#available_container').append('<div id="backpack_available" class="col-md-12">Available items:</div>');

			//$('#select_container').append('<div id="backpack_contents" class="col-md-6">Current contents:</div>');
			//$('#select_container').append('<div id="backpack_addition" class="col-md-6">To add:</div>');
			$('#addition_container').append('<div id="backpack_addition_title" class="mol-md-12">Packed Backpack:</div>');
			$('#addition_container').append('<div id="backpack_addition" class="mol-md-12"></div>');
			
			$('#button_container').append('<button id="backpack_accept" class="col-md-6">Accept</button>');
			$('#button_container').append('<button id="backpack_cancel" class="col-md-6">Cancel</button>');

			// Populate the potential carriables, and attach their event handlers.
			window.comms.get_all_carriables(function(data) {
				for(var d in data)
				{
					// TESTING
					array_to_add[data[d].id]	= 0;

					var id		= 'potential_carriable_' + data[d].id;
					var img_id	= 'potential_carriable_img_' + data[d].id;

					$('#backpack_available').append('<div id="' + id + '">' + data[d].name + '</div>');
					$('#backpack_available').append('<img id="' + img_id + '" class="packing_images" src="' + data[d].url + '">');

					$('#backpack_available').on('click', '#' + id + ', #' + img_id, function(obj) {
						var carriable_id	= parseInt(obj.currentTarget.id.split('_').pop());

						// TESTING
						//array_to_add.push(carriable_id);

						if(load < load_max)
						{
							var i						= array_to_add[carriable_id];
							i							= i + 1;
							array_to_add[carriable_id]	= i;

							load						= load + 1;

							window.comms.get_single_carriable(carriable_id, function(obj) {

								id		= 'carriable_' + carriable_id;
								img_id	= 'carriable_img_' + carriable_id;

								//$('#backpack_addition').append('<div id="' + id + '">' + obj.name + '</div>');
								$('#backpack_addition').append('<img id="' + img_id + '" class="packing_images" src="' + obj.url + '">');
							});
						}
						else
						{
							alert('You can only carry ' + load_max + ' items, please remove some if you want to make room for more.');
						};
					});
					/*
					var id		= 'potential_carriable_' + data[d].id;
					var img_id	= 'potential_carriable_img_' + data[d].id;

					$('#backpack_available').append('<div id="' + id + '">' + data[d].name + '</div>');
					$('#backpack_available').append('<img id="' + img_id + '" class="packing_images" src="' + data[d].url + '">');

					// Add to bag on click.
					$('#backpack_available').on('click', '#' + id + ', #' + img_id, function(obj) {
						var carriable_id	= parseInt(obj.currentTarget.id.split('_').pop());

						array_to_add.push(carriable_id);
						window.comms.get_single_carriable(carriable_id, function(obj) {
							id		= 'added_carriable_' + carriable_id;
							img_id	= 'added_carriable_img_' + carriable_id;

							$('#backpack_addition').append('<div id="' + id + '">' + obj.name + '</div>');
							$('#backpack_addition').append('<img id="' + img_id + '" class="packing_images" src="' + obj.url + '">');

							// Delete from addition to bag on click.
							$('#backpack_addition').on('click', '#' + id + ', #' + img_id, function(obj) {
								index	= $.inArray(carriable_id, array_to_add);
								array_to_add.splice(index, 1);
								$('#' + id + ', #' + img_id).remove();
							})
						});
					});
					*/
				};

				// TESTING
				//console.log(array_to_add);
			});

			window.comms.get_bag(function(data) {
				var	carriables	= data.carriables;
				//console.log(data);
				for(var c in carriables)
				{
					// Display current bag contents.
					window.comms.get_single_carriable(carriables[c], function(obj) {
						//var id		= 'current_carriable_' + obj.id;
						//var img_id	= 'current_carriable_img_' + obj.id;
						var id		= 'carriable_' + obj.id;
						var img_id	= 'carriable_img_' + obj.id;

						//$('#backpack_contents').append('<div id="' + id + '">' + obj.name + '</div>');
						//$('#backpack_contents').append('<img id="' + img_id + '" class="packing_images" src="' + obj.url + '">');
						//$('#backpack_addition').append('<div id="' + id + '">' + obj.name + '</div>');
						$('#backpack_addition').append('<img id="' + img_id + '" class="packing_images" src="' + obj.url + '">');

						// TESTING
						//array_to_add.push(obj.id);
						
						var i							= array_to_add[parseInt(obj.id)];
						i								= i + 1;
						array_to_add[parseInt(obj.id)]	= i;

						load	= load + 1;

						// Delete from bag on click.
						/*
						$('#backpack_contents').on('click', '#' + id + ', #' + img_id, function(obj) {
							var carriable_id	= parseInt(obj.currentTarget.id.split('_').pop());

							var index	= $.inArray(carriable_id, array_to_add);
							array_to_add.splice(index, 1);
							$('#' + id + ', #' + img_id).remove();
						});
						*/
						/*
						$('#backpack_addition').on('click', '#' + id + ', #' + img_id, function(obj) {
							console.log(array_to_add);
							var carriable_id	= parseInt(obj.currentTarget.id.split('_').pop());

							var index	= $.inArray(carriable_id, array_to_add);
							array_to_add.splice(index, 1);
							console.log(array_to_add);
							$('#' + id + ', #' + img_id).remove();
						});*/
					});
				};
				//console.log(array_to_add);
			});

			// Delete from addition to bag on click.
			$('#backpack_addition').on('click', function(obj) {
				var id	= parseInt(obj.toElement.id.split('_').pop());

				var i				= array_to_add[id];
				i					= i - 1;
				array_to_add[id]	= i;

				$('#' + obj.toElement.id).remove();
			});

			// Delete from addition to bag on click.
			/*
			$('#backpack_addition').on('click', function(obj) {
				console.log(obj);
				var carriable_id	= parseInt(obj.currentTarget.id.split('_').pop());
				console.log(carriable_id);

				var index	= $.inArray(carriable_id, array_to_add);
				array_to_add.splice(index, 1);
				$('#potential_carriable_' + carriable_id + ', #potential_carriable_img_' + carriable_id).remove();
			});*/

			$('#backpack_accept').on('click', function(obj) {
				$('#overlay').css('visibility', 'hidden');
				$('#canvas').css('visibility', 'visible');

				// TESTING
				//window.comms.set_bag(array_to_add, function() {});
				var final_array	= [];
				for(var a in array_to_add)
				{
					for(var i = 0; i < array_to_add[a]; i++)
					{
						final_array.push(a);
						//console.log(a + ' ' + array_to_add[a]);
					};
				};
				window.comms.set_bag(final_array, function() {});
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