// This is a temp object to represent pre-loaded images (will deal with where scale etc. is added depending on pre-loader functionality).
var images	= JSON.parse('{"background": {"name": "background", "id": "background"}, "sprites": [{"name": "mirror", "id": "mirror", "left": "0.74", "top": "0.26", "scale": 0.75, "select_scale": 1}, {"name": "backpack", "id": "backpack", "left": 0.45, "top": 0.5, "scale": 0.75, "select_scale": 1.1}]}')

var canvas					= new fabric.Canvas('canvas');

var background_img			= document.getElementById(images.background.id);
var	background_img_width	= background_img.width;
var	background_img_height	= background_img.height;

var img_w_to_h				= background_img_width / background_img_height;
var screen_w_to_h			= window.innerWidth / window.innerHeight;

// Scales the background image to fit the screen (will always fit within one screen without scrolling).
if(img_w_to_h >= screen_w_to_h)
{
	canvas.setWidth(window.innerWidth);
	var scaled_height	= (window.innerWidth / background_img_width) * background_img_height;
	canvas.setHeight(scaled_height);

	var top_offset		= (window.innerHeight - scaled_height) / 2;
}
else
{
	canvas.setHeight(window.innerHeight);
	var scaled_width	= (window.innerHeight / background_img_height) * background_img_width;
	canvas.setWidth(scaled_width);

	var left_offset		= (window.innerWidth - scaled_width) / 2;
}

var blah = 'images/' + images.background.name + '.png';
//canvas.setBackgroundImage('images/background.png', canvas.renderAll.bind(canvas), {
canvas.setBackgroundImage(blah, canvas.renderAll.bind(canvas), {
	width:		canvas.width,
	height: 	canvas.height,
	originX:	'left',
	originY: 	'top'  
});

var mirror_element	= document.getElementById(images.sprites[0].id);
var mirror_instance	= new fabric.Image(mirror_element, {
	name:			images.sprites[0].name,

	left:			images.sprites[0].left * canvas.width,
	top:			images.sprites[0].top * canvas.height,
	scaleX:			images.sprites[0].scale,
	scaleY:			images.sprites[0].scale,

	default_scale:	images.sprites[0].scale,
	select_scale:	images.sprites[0].select_scale,
	orig_left:		images.sprites[0].left * canvas.width,
	orig_top:		images.sprites[0].top * canvas.height
});

var backpack_element	= document.getElementById(images.sprites[1].id);
var backpack_instance	= new fabric.Image(backpack_element, {
	name:			images.sprites[1].name,

	left:			images.sprites[1].left * canvas.width,
	top:			images.sprites[1].top * canvas.height,
	scaleX:			images.sprites[1].scale,
	scaleY:			images.sprites[1].scale,

	default_scale:	images.sprites[1].scale,
	select_scale:	images.sprites[1].select_scale,
	orig_left:		images.sprites[1].left * canvas.width,
	orig_top:		images.sprites[1].top * canvas.height
});

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
	// Non-ideal.
	// Way to deselect automatically?
	if(typeof i.target !== 'undefined')
	{
		//window.alert(i.target);
		window.alert('Selected ' + i.target.name + '.');
			i.target.setLeft(i.target.orig_left);
	i.target.setTop(i.target.orig_top);

	i.target.scale(i.target.default_scale);
	canvas.renderAll();
	};
})

canvas.add(backpack_instance);
canvas.add(mirror_instance);

for(i = 0; i < 2; i++)
{
	canvas.item(i).lockRotation		= true;
	canvas.item(i).lockScalingX		= canvas.item(i).lockScalingY	= true;
	canvas.item(i).lockMovementX	= canvas.item(i).lockMovementY	= true;
	canvas.item(i).hasControls		= canvas.item(i).hasBorders		= false;
}

canvas.hoverCursor = 'pointer';