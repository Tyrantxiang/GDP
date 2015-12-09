(function(){
	'use strict';
	// TODO: Look into no-scroll -> $("body").css('overflow', 'hidden');
	// Remove the 'if'-hack for event listeners.
	// Body and main-content-area have margins and paddings to remove, also.
	// Remove initialise_canvas' reliance on background.
	// Fix select-box/hover cursor.

	// Closure variables that can be accessed in draw functions
	var canvas, // The fabric canvas that we are drawing on
		canvasEl; // The raw canvas element

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
	// TODO: Rewrite this reliance on backpack, make better scaling for pages.
	function initialise_canvas(cnvs, background)
	{
		canvasEl = cnvs;
		canvas	= new fabric.Canvas(cnvs);


		// TODO: Not sure if this is working anymore.
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
		/*
		canvas.setBackgroundImage(background_img.src, canvas.renderAll.bind(canvas), {
			width:		canvas.width,
			height: 	canvas.height,
			originX:	'left',
			originY: 	'top'
		});*/

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
	function attach_items(background, items)
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
	function attach_event_listeners()
	{
		// TODO: Add filter so it's only the objects we actually care about (i.e. menu items).
		canvas.on('mouse:over', function(i) {
			if(i.target.name === 'stairs' ||
				i.target.name === 'trophy' ||
				i.target.name === 'mirror' ||
				i.target.name === 'laptop' ||
				i.target.name === 'backpack' ||
				i.target.name === 'paint' ||
				i.target.name === 'path')
			{
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
			}
		});

		canvas.on('mouse:out', function(i) {
			if(i.target.name === 'stairs' ||
				i.target.name === 'trophy' ||
				i.target.name === 'mirror' ||
				i.target.name === 'laptop' ||
				i.target.name === 'backpack' ||
				i.target.name === 'paint' ||
				i.target.name === 'path')
			{
				i.target.setLeft(i.target.orig_left);
				i.target.setTop(i.target.orig_top);

				i.target.scale(i.target.default_scale);
				canvas.renderAll();
			}
		});

		canvas.on('mouse:down', function(i)
		{
			if(i.target.name === 'stairs' ||
				i.target.name === 'trophy' ||
				i.target.name === 'mirror' ||
				i.target.name === 'laptop' ||
				i.target.name === 'backpack' ||
				i.target.name === 'paint' ||
				i.target.name === 'path')
			{
				i.target.setLeft(i.target.orig_left);
				i.target.setTop(i.target.orig_top);
				i.target.scale(i.target.default_scale);
				canvas.renderAll();

				// TODO: Remove once background properly dealt with.
				//document.getElementById('sky-overlay').style.visibility	= 'hidden';

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
				}
			}
			else if(i.target.name === hb.mouseoverGroupName)
			{
				console.log("hb click");
				hb.toggleVisiblity();
				canvas.renderAll();
			}
		});
	};

	/****************** Healthbar code *******************/
	var hb = {
		//Fabric canvas object
		canvas : undefined,

		currHealth : undefined,
		currSymptoms : undefined,
		currStatuses : undefined,

		mouseoverGroup : undefined,
		mouseoverGroupName : "mouseoverGroup",

		fontSize : undefined,

		barborderVals : {},
		barborder : undefined,

		barVals : {},
		bar : undefined,

		symptomborderVals : {},
		symptomborder : undefined,

		symptomVals : {},
		symptom : undefined,

		statuslistborderVals : {},
		statuslistborder : undefined,

		//statuslistVals : [],
		statuslist : [],

		init : function(health, statuses, symptoms){
			hb.canvas = canvas;

			hb.fontSize = hb.canvas.height * (1/30); //30 lines in canvas

			/*
			 * Border rectangle around health bar
			*/
			hb.barborderVals.width  		= hb.canvas.width*0.25;
			hb.barborderVals.height 		= hb.canvas.height*0.0625;
			hb.barborderVals.left			= hb.canvas.width  - (hb.barborderVals.width*1.1);
			hb.barborderVals.top			= hb.canvas.height - (hb.barborderVals.height*1.5);
			hb.barborderVals.fill			= "black";
			hb.barborderVals.opacity		= 0.75;
			hb.barborderVals.stroke 		= "white";
			hb.barborderVals.strokeWidth	= 3;

			hb.barborderVals.name = hb.mouseoverGroupName;

			hb.barborder = new fabric.Rect(hb.barborderVals);

			/*
			 * Health bar itself
			*/
			hb.barVals.xscaler  = 0.9,
			hb.barVals.xpadding = ( 1-hb.barVals.xscaler )/2,
			hb.barVals.yscaler  = 0.7,
			hb.barVals.ypadding = ( 1-hb.barVals.yscaler )/1.45;

			hb.barVals.width  	= hb.barborderVals.width  * hb.barVals.xscaler;
			hb.barVals.height 	= hb.barborderVals.height * hb.barVals.yscaler;
			hb.barVals.left		= hb.barborderVals.left   + (hb.barborderVals.width  * hb.barVals.xpadding);
			hb.barVals.top		= hb.barborderVals.top    + (hb.barborderVals.height * hb.barVals.ypadding);

			hb.barVals.name = hb.mouseoverGroupName;

			hb.bar = new fabric.Rect(hb.barVals);
			//Changes bar to represent current hp val
			changeHealth(health);

			/*
			 * Symptom border
			*/
			hb.symptomborderVals.width  		= hb.barborderVals.width;
			hb.symptomborderVals.height 		= hb.fontSize * 1.5;
			hb.symptomborderVals.left			= hb.barborderVals.left;
			hb.symptomborderVals.top			= hb.barborderVals.top - hb.symptomborderVals.height;
			hb.symptomborderVals.fill			= hb.barborderVals.fill;
			hb.symptomborderVals.opacity		= hb.barborderVals.opacity;
			hb.symptomborderVals.stroke 		= hb.barborderVals.stroke;
			hb.symptomborderVals.strokeWidth	= hb.barborderVals.strokeWidth;

			hb.symptomborderVals.name = hb.mouseoverGroupName;

			hb.symptomborder = new fabric.Rect(hb.symptomborderVals);

			/*
			 * Symptom text
			*/
			hb.symptomVals.startText 	= "";
			hb.symptomVals.fill 		= "white";
			hb.symptomVals.fontSize  	= hb.fontSize;
			hb.symptomVals.left 		= hb.barVals.left;
			hb.symptomVals.top 			= hb.symptomborderVals.top + (hb.symptomborderVals.height * hb.barVals.ypadding);

			hb.symptomVals.name = hb.mouseoverGroupName;

			//No text at first, set straight after
			hb.symptom = new fabric.Text("", hb.symptomVals);
			changeSymptom(symptoms);

			/*
			 * Statuses border
			*/
			hb.statuslistborderVals.width  		= hb.barborderVals.width;
			hb.statuslistborderVals.padScale	= 0.1;
			hb.statuslistborderVals.padHeight   = hb.fontSize * statuses.length * hb.statuslistborderVals.padScale;
			hb.statuslistborderVals.height 		= hb.fontSize * statuses.length + (hb.statuslistborderVals.padHeight * (statuses.length+1));
			hb.statuslistborderVals.left		= hb.barborderVals.left;
			hb.statuslistborderVals.top			= hb.symptomborderVals.top - hb.statuslistborderVals.height;
			hb.statuslistborderVals.fill		= hb.barborderVals.fill;
			hb.statuslistborderVals.opacity		= hb.barborderVals.opacity;
			hb.statuslistborderVals.stroke 		= hb.barborderVals.stroke;
			hb.statuslistborderVals.strokeWidth	= hb.barborderVals.strokeWidth;

			hb.statuslistborderVals.name = hb.mouseoverGroupName;

			hb.statuslistborderVals.visible = false;

			hb.statuslistborder = new fabric.Rect(hb.statuslistborderVals);

			/*
			 * Statuses text
			*/
			for(var i in statuses){
				var numOfPads = parseInt(i) + 1;

				var textVals = {};
				textVals.fill 		= "white";
				textVals.fontSize  	= hb.fontSize;
				textVals.left 		= hb.barVals.left;
				textVals.top 		= hb.statuslistborderVals.top + (hb.statuslistborderVals.padHeight * numOfPads) + (hb.fontSize*i);

				textVals.name = hb.mouseoverGroupName;

				textVals.visible = false;
				//Will set text after
				var statusText = new fabric.Text("", textVals);

				hb.statuslist.push(statusText);
			};
			changeStatuses(statuses);


			//Adding all to canvas
			hb.canvas.add(hb.barborder);
			hb.canvas.add(hb.bar);
			hb.canvas.add(hb.symptomborder);
			hb.canvas.add(hb.symptom);
			hb.canvas.add(hb.statuslistborder);
			hb.statuslist.forEach(function(s){
				hb.canvas.add(s);
			});

			hb.canvas.renderAll();

			//var hbElements = hb.statuslist;
			//hbElements.splice(hbElements.length-1, 0, hb.statuslistborder, hb.symptomborder, hb.symptom, hb.barborder, hb.bar);
			//hb.mouseoverGroup = new fabric.Group(hbElements, {
			//	name : hb.mouseoverGroupName,
			//	top  : hb.symptomborderVals.top,
			//	left : hb.symptomborderVals.left
			//});

			/*
			hb.canvas.on('mouse:over', function(i){
				if(i.target.name === "mouseoverGroup"){
					setStatusesVisiblity(true);
				}
			});

			hb.canvas.on('mouse:out', function(i){
				if(i.target.name === "mouseoverGroup"){
					setStatusesVisiblity(false);
				}
			});
			*/
		},

		updateHealthSymptoms : function(health, symptoms){
			changeHealth(health);
			changeSymptom(symptoms);
			hb.canvas.renderAll();
		},

		updateStatuses : function(statuses){
			changeStatuses(statuses);
			hb.canvas.renderAll();
		},

		setStatusesVisiblity : function(isVisible){
			hb.statuslistborder.set({visible: isVisible});
			hb.statuslist.forEach(function(s){
				s.set({visible:isVisible});
			});

		},

		toggleVisiblity : function(){
			var newVis = !hb.statuslistborder.get("visible");

			hb.statuslistborder.set({visible: newVis});
			hb.statuslist.forEach(function(s){
				s.set({visible: newVis});
			});

		}
	};

	function changeHealth(health){
		hb.health = health;
		var fillColour;
		switch(true){
			case (health < 20):
				fillColour = "red";
				break;
			case (health < 40):
				fillColour = "orange";
				break;
			case (health < 60):
				fillColour = "yellow";
				break;
			default:
				fillColour = "rgb(63,255,0)";
				break;
		}
		hb.bar.set({
			width: hb.barVals.width * health/100,
			fill : fillColour
		});

		hb.currHealth = health;
	}

	function changeSymptom(symptoms){
		var symp = symptoms[symptoms.length-1] || "healthy";

		var str = (hb.symptomVals.startText + symp).toUpperCase();
		hb.symptom.setText(str);

		hb.currSymptoms = symptoms;
	}

	function changeStatuses(statuses){
		//if(statuses.length != hb.statuslist.length){
		//	hb.currStatuses = statuses;
		//	hb.draw(hb.currHealth, statuses, hb.currSymptoms);
		//} else {
			for(var i in statuses){
				var statusString = statuses[i].name+": "+statuses[i].value;
				statuslist[i].setText(statusString);
			}
			hb.currStatuses = statuses;
		//}
	}


	/*********** End healthbar functions ******************/

	// TODO: Pull out reliance on canvas once pulled.
	function add_avatar()
	{
		var avatar_image	= hub.avatarImage;

		// TODO: Scaling should be based upon canvas size.
		var avatar_instance	= new fabric.Image(avatar_image, {
			name:	'avatar',

			left:	0.5 * canvas.width,
			top:	0.45 * canvas.height,

			scaleX:	0.5,
			scaleY:	0.5
		});

		canvas.add(avatar_instance);

		canvas.renderAll();
	};

	window.draw			= {};
	window.draw.init	= function(cnvs, images)
	{
		var background	= images.background;
		var items		= images.items;

		initialise_canvas(cnvs, background);
		attach_items(background, items);
		attach_event_listeners();
		add_avatar();

		window.draw.healthbar = hb;

		// TODO: Uncomment once we can safely lock scrolling.
		//$("body").css('overflow', 'hidden');

		return window.draw;
	};

	// TODO: Pull out reliance on canvas once pulled.
	window.draw.update_avatar	= function()
	{
		var canvas_items	= canvas.getObjects();

		var avatar			= canvas_items.filter(function(i) {
			if('name' in i && i.name === 'avatar')
			{
				return true
			}
			else
			{
				return false
			}
		});

		avatar				= avatar[0].getElement();
		avatar.setAttribute('src', hub.avatarImage.src);
	};
})();