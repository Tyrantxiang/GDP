(function(){
	window.launch_menu = {
		load : function(){
			var array_to_add	= [];

			// Change test back to overlay in the two lines below once done testing.
			$('#main-content-area').append('<div class="grey-box" id="test"></div>');
			$('#test').html('');

			$('#test').append('<div id="test2"></div>');
			$('#test').append('<div id="overlay" class="col-md-8 grey-box">.col-md-8</div>');

//			$('#test').append('<div id="test2" class="row"><div>');

//			$('#test2').append('<div id="overlay" class="col-md-8"></div>')
			$('#overlay').append('<div id="title_container" class="row"></div>');
			$('#title_container').append('<div class="col-md-12">Pack your backpack!</div>');
//			$('#overlay').append('<div class="col-md-12">Pack your backpack!</div>');
			$('#overlay').append('<div id="available_container" class="row"></div>');
			$('#overlay').append('<div id="select_container" class="row"></div>');

//			$('#overlay').append('<div id="backpack_contents">Current contents:</div>');
			$('#available_container').append('<div id="backpack_available" class="col-md-12">Available items:</div>');
			$('#select_container').append('<div id="backpack_contents" class="col-md-6">Current contents:</div>');
			$('#select_container').append('<div id="backpack_addition" class="col-md-6">To add:</div>');
			$('#overlay').append('<div id="button_container" class="row"></div>');
			$('#button_container').append('<button id="backpack_accept" class="col-md-6">Accept</button>');
			$('#button_container').append('<button id="backpack_cancel" class="col-md-6">Cancel</button>');
//			$('#overlay').append('<div id="backpack_available">Available items:</div>');
//			$('#overlay').append('<div id="backpack_addition">To add:</div>');
//			$('#overlay').append('<button id="backpack_accept">Accept</button>');
//			$('#overlay').append('<button id="backpack_cancel">Cancel</button>');

			window.comms.get_bag(function(data) {
				// TODO: Call the individual items from ID.
				console.log(data);
				for(var d in data)
				{
					$('#backpack_contents').append('<div>' + data[d].name + '</div>');
				};
			});

			window.comms.get_all_carriables(function(data) {
				for(var d in data)
				{
					var id	= 'carriable_' + data[d].id;
					$('#backpack_available').append('<div id=' + id + '>' + data[d].name + '</div>');
					$('#' + id).on('click', function(obj) {
						$('#backpack_addition').append('<div>' + obj.currentTarget.innerHTML + '</div>');
						array_to_add.push(obj.currentTarget.id.split('_')[1]);
						//console.log(array_to_add);
					});

					// TODO: Fix sprite insertion (source appears to be wrong).
					$('#backpack_available').append('<img src="' + data[d].sprite + '">');
				};
			});

			$('#backpack_accept').on('click', function(obj) {
				$('#overlay').css('visibility', 'hidden');
				$('#canvas').css('visibility', 'visible');
				// Fix tomorrow, what is this meant to take?
				console.log(array_to_add);
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