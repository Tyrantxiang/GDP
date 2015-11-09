// Contains a fair few hacks to position canvas in the centre, and fit it to the screen.
// Assuming these will be taken out and done with CSS.

var canvas					= new fabric.Canvas('canvas');

var background_img			= document.getElementById('background');
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
	//canvas.setTop(top_offset);

	//var canvasNode = document.getElementById('canvas');
	//canvasNode.style.top	= top_offset + "px";
}
else
{
	canvas.setHeight(window.innerHeight);
	var scaled_width	= (window.innerHeight / background_img_height) * background_img_width;
	canvas.setWidth(scaled_width);

	var left_offset		= (window.innerWidth - scaled_width) / 2;
	//canvas.setLeft(left_offset)

	//var canvasNode	= document.getElementById('canvas');
	//canvasNode.style.left	= left_offset + "px";
}

// Sets the canvas dimensions equal to the larger of the image dimensions, scales the other.
/*
if(background_img_width >= background_img_height)
{
	canvas.setWidth(window.innerWidth);
	var temp		= (window.innerWidth / background_img_width) * background_img_height;
	canvas.setHeight(temp);
}
else
{
	canvas.setHeight(window.innerHeight);
	var temp		= (window.innerHeight / background_img_height) * background_img_width;
	canvas.setWidth(temp);
};
*/

canvas.setBackgroundImage('background.png', canvas.renderAll.bind(canvas), {
	width:		canvas.width,
	height: 	canvas.height,
	originX:	'left',
	originY: 	'top'  
});

// Do I need to have all images in the HTML to begin with?
var backpack_element	= document.getElementById('backpack');
var backpack_instance	= new fabric.Image(backpack_element, {
	name:			'backpack',

	left:			325,
	top:			285,
	scaleX:			0.8,
	scaleY:			0.8,

	default_scale:	0.8,
	select_scale:	1.2,
	orig_left:		325,
	orig_top:		285
});

var mirror_element		= document.getElementById('mirror');
var mirror_instance		= new fabric.Image(mirror_element, {
	name:			'mirror',

	left:			535,
	top:			145,
	scaleX:			0.65,
	scaleY:			0.65,

	default_scale:	0.65,
	select_scale:	0.9,
	orig_left:		535,
	orig_top:		145	 
});

/*
mirror_instance.on('selected', function() {
	window.alert('Mirror selected.');
});
*/

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