(function(){
	window.launch_menu = {
		load : function(){
			var array_to_add	= [];

			// TODO: Fix naming/styling.
			$('#main-content-area').append('<div class="grey-box" id="test"></div>');
			$('#test').html('');

			// TODO: Do I need both of these?
			$('#test').append('<div id="test2"></div>');
			$('#test2').append('<div id="overlay" class="col-md-8 grey-box"></div>');

			$('#overlay').append('<div id="title_container" class="row"></div>');
			$('#overlay').append('<div id="available_container" class="row"></div>');
			$('#overlay').append('<div id="select_container" class="row"></div>');
			$('#overlay').append('<div id="button_container" class="row"></div>');

			$('#title_container').append('<div class="col-md-12">Pack your backpack!</div>');

			$('#available_container').append('<div id="backpack_available" class="col-md-12">Available items:</div>');

			$('#select_container').append('<div id="backpack_contents" class="col-md-6">Current contents:</div>');
			$('#select_container').append('<div id="backpack_addition" class="col-md-6">To add:</div>');
			
			$('#button_container').append('<button id="backpack_accept" class="col-md-6">Accept</button>');
			$('#button_container').append('<button id="backpack_cancel" class="col-md-6">Cancel</button>');

			window.comms.get_bag(function(data) {
				var	carriables	= data.carriables;
				for(var c in carriables)
				{
					window.comms.get_single_carriable(carriables[c], function(obj) {
						$('#backpack_contents').append('<div>' + obj.name + '</div>');
						array_to_add.push(obj.id);
					});
				};
			});

			window.comms.get_all_carriables(function(data) {
				for(var d in data)
				{
					// TODO: Add event listener to images, too.
					var id		= 'carriable_' + data[d].id;
					$('#backpack_available').append('<div id="' + id + '">' + data[d].name + '</div>');
					$('#backpack_available').append('<img class="packing_images" src="' + data[d].url + '">');

					$('#' + id).on('click', function(obj) {
						$('#backpack_addition').append('<div>' + obj.currentTarget.innerHTML + '</div>');
						array_to_add.push(obj.currentTarget.id.split('_')[1]);
					});
				};
			});

			$('#backpack_accept').on('click', function(obj) {
				$('#overlay').css('visibility', 'hidden');
				$('#canvas').css('visibility', 'visible');
				window.comms.set_bag(array_to_add, function() {});
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