(function(){
	'use strict';
	// TODO: Center in page, seems setting canvas-container margin: 0 auto will fix.
	// TODO: Look into no-scroll.
	// Body and main-content-area have margins and paddings to remove, also.

	/*
	Parameters:
		canvas_name, string
			Name of the canvas HTML element.
		images, object
			Object containing the background and other images to populate the canvas with, as well as their meta-data.
	Return:
		canvas, fabric.Canvas
			The FabricJS canvas element, scaled to the window with the background image applied.
	Functionality:
		Scales the canvas to suit the window size, scales and adds the background image.
	*/
	function initialise_canvas(cnvs, background)
	{
		var canvas	= new fabric.Canvas(cnvs);

		// Set ID and Canvas object to canvas element for later retrieval.
		// TODO: Pull ID out to config file/find some way of making it across-the-board.
		cnvs.id 	= 'canvas';
		cnvs.fabric = canvas;

		canvas.hoverCursor					= 'pointer';
		fabric.Object.prototype.selectable	= false;

		var background_img	= background.image;
		var img_w_to_h		= background_img.width / background_img.height;
		var screen_w_to_h	= window.innerWidth / window.innerHeight;

		// Scales the background image to fit the screen (will always fit within one screen without scrolling).
		if(img_w_to_h >= screen_w_to_h)
		{
			canvas.setWidth(window.innerWidth);
			var scaled_height	= (window.innerWidth / background_img.width) * background_img.height;
			canvas.setHeight(scaled_height);

			var top_offset		= (window.innerHeight - scaled_height) / 2;
		}
		else
		{
			canvas.setHeight(window.innerHeight);
			var scaled_width	= (window.innerHeight / background_img.height) * background_img.width;
			canvas.setWidth(scaled_width);

			var left_offset		= (window.innerWidth - scaled_width) / 2;
		};

		canvas.setBackgroundImage(background_img.src, canvas.renderAll.bind(canvas), {
			width:		canvas.width,
			height: 	canvas.height,
			originX:	'left',
			originY: 	'top'
		});

		return canvas;
	};

	/*
	Parameters:
		canvas, fabric.Canvas
			The FabricJS Canvas element.
		images, object
			Object containing the background and other images to populate the canvas with, as well as their meta-data.
	Return:
		none
	Functionality:
		Adds the items to the canvas, setting their attributes and locking them in place.
	*/
	function attach_items(canvas, background, items)
	{
		var background_img	= background.image;

		for(var i in items)
		{
			var item_element	= items[i].image;
			var item_instance	= new fabric.Image(item_element, {
				name:			items[i].slot,
				id: 			items[i].id,

				left:			items[i].left * canvas.width,
				top:			items[i].top * canvas.height,

				width:			item_element.width * (canvas.width / background_img.width),
				height:			item_element.height * (canvas.height / background_img.height),

				scaleX:			items[i].scale,
				scaleY:			items[i].scale,

				default_scale:	items[i].scale,
				select_scale:	items[i].select_scale,
				orig_left:		items[i].left * canvas.width,
				orig_top:		items[i].top * canvas.height
			});

			canvas.add(item_instance);
		};
	};

	/*
	Parameters:
		canvas, fabric.Canvas
			The FabricJS Canvas element.
	Return:
		none
	Functionality:
		Adds event listeners to scale the items on hover-over/move away, plus ones for clicking to launch menus.
	*/
	function attach_event_listeners(canvas)
	{
		// TODO: Add filter so it's only the objects we actually care about (i.e. menu items).
		canvas.on('mouse:over', function(i) {
			var x 			= i.target.getLeft();
			var y 			= i.target.getTop();

			var width		= i.target.getWidth() * i.target.getScaleX();
			var height		= i.target.getHeight() * i.target.getScaleY();

			var new_width	= i.target.getWidth() * i.target.select_scale;
			var new_height	= i.target.getHeight() * i.target.select_scale;

			var new_x		= x - (new_width - width) / 2;
			var new_y		= y - (new_height - height) / 2;

			i.target.setLeft(new_x);
			i.target.setTop(new_y);

			i.target.scale(i.target.select_scale);
			canvas.renderAll();
		});

		canvas.on('mouse:out', function(i) {
			i.target.setLeft(i.target.orig_left);
			i.target.setTop(i.target.orig_top);

			i.target.scale(i.target.default_scale);
			canvas.renderAll();
		});

		canvas.on('mouse:down', function(i) {
			if(typeof i.target !== 'undefined')
			{
				i.target.setLeft(i.target.orig_left);
				i.target.setTop(i.target.orig_top);
				i.target.scale(i.target.default_scale);
				canvas.renderAll();

				switch(i.target.name)
				{
					case 'stairs':
						hub.sleep();
						break;

					case 'trophy':
						hub.launchScores();
						break;

					case 'mirror':
						hub.launchAvatarCreation();
						break;

					case 'laptop':
						console.log('laptop clicked');
						break;

					case 'backpack':
						hub.launchBackpack();
						break;

					case 'paint':
						hub.launchHomeCustomisation();
						break;

					case 'path':
						hub.launchGameSelect();
						break;
				;}
			};
		});
	};

	window.draw			= {};
	window.draw.init	= function(cnvs, images)
	{
		var background	= images.background;
		var items		= images.items;

		var canvas	= initialise_canvas(cnvs, background);
		attach_items(canvas, background, items);
		// TODO: Pass in variables when they're defined/function complete.
		window.healthbar.draw();
		attach_event_listeners(canvas);
	};
})();