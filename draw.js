"use strict";

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
//function initialise_canvas(canvas_name, images)
function initialise_canvas(cnvs, background)
{
	//var canvas			= new fabric.Canvas(canvas_name);
	var canvas			= new fabric.Canvas(cnvs);
	canvas.hoverCursor	= 'pointer';

	// TODO: This will be gotten from the images item itself, rather than getElem.
	//var background_img	= document.getElementById(images.background.id);
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
	Adds the sprites to the canvas, setting their attributes and locking them in place.
*/
//function attach_sprites(canvas, images)
function attach_sprites(canvas, background, sprites)
{
	// TODO: This will be gotten from the images item itself, rather than getElem.
	//var background_img	= document.getElementById(images.background.id);
	var background_img	= background.image;

	//for(var i = 0; i < images.sprites.length; i++)
	for(var i = 0; i < sprites.length; i++)
	{
		// TODO: This will be gotten from the images item itself, rather than getElem.
		var sprite_element	= document.getElementById(images.sprites[i].id);
		var sprite_instance	= new fabric.Image(sprite_element, {
			name:			images.sprites[i].name,

			left:			images.sprites[i].left * canvas.width,
			top:			images.sprites[i].top * canvas.height,

			width:			sprite_element.width * (canvas.width / background_img.width),
			height:			sprite_element.height * (canvas.height / background_img.height),

			scaleX:			images.sprites[i].scale,
			scaleY:			images.sprites[i].scale,

			default_scale:	images.sprites[i].scale,
			select_scale:	images.sprites[i].select_scale,
			orig_left:		images.sprites[i].left * canvas.width,
			orig_top:		images.sprites[i].top * canvas.height
		});

		canvas.add(sprite_instance);

		canvas.item(i).lockRotation		= true;
		canvas.item(i).lockScalingX		= canvas.item(i).lockScalingY	= true;
		canvas.item(i).lockMovementX	= canvas.item(i).lockMovementY	= true;
		canvas.item(i).hasControls		= canvas.item(i).hasBorders		= false;
	};
};

/*
Parameters:
	canvas, fabric.Canvas
		The FabricJS Canvas element.
Return:
	none
Functionality:
	Adds event listeners to scale the sprites on hover-over/move away, plus ones for clicking to launch menus.
*/
function attach_event_listeners(canvas)
{
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
		// TODO: Non-ideal.
		if(typeof i.target !== 'undefined')
		{
			//window.alert('Selected ' + i.target.name + '.');
			utils.addSuccess;
			i.target.setLeft(i.target.orig_left);
			i.target.setTop(i.target.orig_top);
			i.target.scale(i.target.default_scale);
			canvas.renderAll();
		};
	});
};

var images;
var canvas;
function init(canvas_name, imgs)
{
	images	= imgs;
	canvas	= initialise_canvas(canvas_name, images);
	// Would then call the two attach functions after (not technically required on init, depending on definition).
};

// TODO: This was how it was run individually, delete once integrated properly.
/*
// This is a temp object to represent pre-loaded images (will deal with where scale etc. is added depending on pre-loader functionality).
var images	= JSON.parse('{"background": {"name": "background", "id": "background"}, "sprites": [{"name": "mirror", "id": "mirror", "left": "0.74", "top": "0.26", "scale": 1, "select_scale": 1.5}, {"name": "backpack", "id": "backpack", "left": 0.45, "top": 0.51, "scale": 1, "select_scale": 1.5}]}')
var canvas	= initialise_canvas('canvas', images);
attach_sprites(canvas, images);
attach_event_listeners(canvas);
*/

window.draw			= {};
//window.draw.init	= function(cnvs, background, sprites)
window.draw.init	= function(cnvs, images)
{
	background	= images.background;
	sprites		= images.sprites;
	
	var canvas	= initialise_canvas(cnvs, background);
	attach_sprites(canvas, background, sprites);
	attach_event_listeners(canvas);
};