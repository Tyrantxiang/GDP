(function(){
	// TODO: load_max should really be set somewhere and passed in, not defined here.
	var array_to_add	= [];
	var load			= 0;
	var load_max		= 10;

	window.menu = {};

	window.menu.stairs = {
		load : function() {
			console.log('hello');
			$.get('/views/sleep.html', function(data) {
				$('#menu-overlays').html(data);

				$('#fade-overlay').hide();
				$('#fade-overlay').fadeToggle(2000);
				$('#fade-overlay').fadeToggle(2000);
			})
		}
	};

	window.menu.backpack = {
		load : function(carriables, backpack){

			// 'backpack' is a list of IDs, replaces with the actual objects.
			var temp_backpack	= [];
			for(var b in backpack)
			{
				var id	= backpack[b];
				temp_backpack.push(carriables[id]);
			}
			backpack	= temp_backpack;

			$.get('/views/pack_backpack.html', function(data) {
				$('#menu-overlays').html(data);
				document.title	= "Pack your backpack";

				// Populate the potential carriables, and attach their event handlers.
				for(var c in carriables)
				{
					(function(carriable) {
						array_to_add[carriable.id]	= 0;

						var container_div	= document.createElement('div'),
							text_div		= document.createElement('div'),
							img				= carriable.image.cloneNode();

						text_div.innerHTML	= carriable.name;


						img.className	= 'packing_images';

						container_div.appendChild(text_div);
						container_div.appendChild(img);

						container_div.addEventListener('click', function(obj) {
							add_to_backpack(carriable);
						});

						document.getElementById('backpack_available').appendChild(container_div);
					})(carriables[c]);
				};

				for(var b in backpack)
				{
					(function(backpack_item) {
						add_to_backpack(backpack_item);
					})(backpack[b]);
				};

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

					hub.setBag(set_array, function() {});
				});

				$('#backpack_cancel').on('click', function(obj) {
					$('#overlay').css('visibility', 'hidden');
					$('#canvas').css('visibility', 'visible');
				});

				$('#canvas').css('visibility', 'hidden');
				$('#overlay').css('visibility', 'visible');
			});
		}
	};

	function add_to_backpack(carriable)
	{
		if(load < load_max) {
			var container_div	= document.createElement('div'),
				img				= carriable.image.cloneNode();

			img.className		= 'packing_images';

			container_div.appendChild(img);

			container_div.addEventListener('click', function(obj) {
				remove_from_backpack(carriable, container_div);
			});

			$('#backpack_addition').append(container_div);

			var i	= array_to_add[carriable.id];
			i							= i + 1;
			array_to_add[carriable.id]	= i;

			load						= load + 1;
		}
		else
		{
			alert('You can only carry ' + load_max + ' items, please remove some if you want to make room for more.');
		}
	}

	function remove_from_backpack(carriable, carriable_div)
	{
		carriable_div.parentNode.removeChild(carriable_div);

		var i						= array_to_add[carriable.id];
		i							= i - 1;
		array_to_add[carriable.id]	= i;

		load						= load - 1;
	}
})();