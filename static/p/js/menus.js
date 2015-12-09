(function(){
	// TODO: load_max should really be set somewhere and passed in, not defined here.
	// TODO: Should we have all the variables defined here?

	// Backpacking.
	var array_to_add	= [];
	var load			= 0;
	var load_max		= 10;

	// Minigame select.
	var selected_minigame;

	window.menu = {};

	window.menu.stairs = {
		load : function() {
			$.get('/views/sleep.html', function(data) {
				$('#menu-overlays').html(data);

				$('#fade-overlay').hide();
				$('#fade-overlay').fadeToggle(2000);
				setTimeout(function(e) {
					$('#fade-overlay').fadeToggle(2000);
				}, 3000);
			})
		}
	};

	window.menu.scores = {
		load : function(formatted_scores) {
			$.get('/views/scoreboard.html', function(data) {
				$('#menu-overlays').html(data);
				document.title	= 'Scoreboard';

				formatted_scores.forEach(function(formatted_score) {
					var container_div	= document.createElement('div'),
						title_div		= document.createElement('div');

					title_div.innerHTML	= formatted_score.name + ':';

					container_div.appendChild(title_div);

					formatted_score.scores.forEach(function(score) {
						container_div.appendChild(document.createElement('div')).innerHTML = score;
					});

					container_div.className	= 'col-md-4 col-centered dark-dark-grey-box-no-text';

					document.getElementById('scores').appendChild(container_div);
				});

				$('#score_close').on('click', function(obj) {
					$('#overlay').css('visibility', 'hidden');
				});

				$('#overlay').css('visibility', 'visible');
			});
		}
	};

	window.menu.game_select = {
		load : function(minigames) {
			$.get('/views/minigame_select.html', function(data) {
				$('#menu-overlays').html(data);
				document.title	= 'Select a minigame!';

				for(var m in minigames)
				{
					(function(minigame) {

						// TODO: Add image handling.

						var container_div	= document.createElement('div'),
							title_div		= document.createElement('div'),
							desc_div		= document.createElement('div');
							//img				= minigame.image.cloneNode();

						title_div.innerHTML	= minigame.name;
						desc_div.innerHTML	= minigame.description;

						// TODO: Either make a new CSS class, or genericise with carriables.
						//img.className		= 'packing_images';

						container_div.appendChild(title_div);
						//container_div.appendChild(img);
						container_div.appendChild(desc_div);

						container_div.className	= 'col-md-5 col-centered dark-dark-grey-box-no-text';

						container_div.addEventListener('click', function(obj) {
							selected_minigame	= minigame.id;

							prev_selection		= container_div.parentNode.querySelectorAll(".minigame-selection");
							if(prev_selection.length != 0)
							{
								prev_selection				= prev_selection[0];
								prev_selection.className	= 'col-md-5 col-centered dark-dark-grey-box-no-text';
							}

							container_div.className	= 'col-md-5 col-centered dark-dark-grey-box-no-text minigame-selection';
						});

						document.getElementById('minigames_available').appendChild(container_div);
					})(minigames[m]);
				};

				$('#minigame_accept').on('click', function(obj) {
					hub.launchGame(selected_minigame, function() {});

					$('#overlay').css('visibility', 'hidden');
				});

				$('#minigame_cancel').on('click', function(obj) {
					$('#overlay').css('visibility', 'hidden');
				});

				$('#overlay').css('visibility', 'visible');
			});
		}
	};

	window.menu.paint = {
		load : function(data) {
			console.log(data);

			// TODO: Pull ID out to config file/find some way of making it across-the-board.
			var canvas = document.getElementById('canvas').fabric;
			var canvas_height	= canvas.height;
			var canvas_width	= canvas.width;

			console.log(canvas);

			var mirror_top	= data.mirror.top;
			var mirror_left	= data.mirror.left;

			var tr = new fabric.Triangle({
				left: mirror_left * canvas_width,
				top: mirror_top * canvas_height,
				fill: 'red',
				width: 20,
				height: 20
			});

			canvas.add(tr);
			/*
			var rekt = new fabric.Rect({
				left: 0,
			  	top: 0,
			  	fill: 'red',
			  	width: 20,
			  	height: 20
			});

			canvas.add(rekt);
			*/
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
				document.title	= 'Pack your backpack';

				// Populate the potential carriables, and attach their event handlers.
				for(var c in carriables)
				{
					(function(carriable) {
						array_to_add[carriable.id]	= 0;

						var container_div	= document.createElement('div'),
							text_div		= document.createElement('div'),
							img				= carriable.image.cloneNode();

						text_div.innerHTML	= carriable.name;
						text_div.className	= 'row';

						img.className		= 'packing_images';

						container_div.appendChild(img);
						container_div.appendChild(text_div);

						container_div.className = 'col-md-2 col-centered';
						//container_div.className = 'col-md-5ths col-centered';

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
					load	= 0;

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
					load	= 0;
				});

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

			//container_div.className = 'col-md-5ths col-centered';
			container_div.className	= 'col-md-3 col-centered';

			container_div.addEventListener('click', function(obj) {
				remove_from_backpack(carriable, container_div);
			});

			$('#backpack_addition').append(container_div);

			var i	= array_to_add[carriable.id];
			i							= i + 1;
			array_to_add[carriable.id]	= i;

			load++;
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

		load--;
	}
})();