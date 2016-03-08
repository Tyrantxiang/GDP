comms.getRequest("/canvas-demo/init_data", null, function(data) {
    var background			= data.images.background,
    	items				= data.images.items,
    	canvas_el			= document.createElement("canvas"),
    	original_item_srcs	= {};

	function latch(num, complete){
        if(num < 1){
            complete();
        }

        return function(){
            if(!--num){
                complete();
            }
        };
    }

    var latch_size	= Object.keys(items).length + 1;

    // Background + items.
	var l	= latch(latch_size, function() {
		window.draw.initialise_canvas(canvas_el).attach_items(background, items).event_mouse_over().event_mouse_out();

		canvas_el	= window.draw.get_canvas_el();
		// TODO: Remove background hardcoding.
		canvas_el.style.backgroundImage		= "url('/assets/img/hub/test_background.png')";
		canvas_el.style.backgroundSize		= '100% 100%';
		canvas_el.style.backgroundRepeat	= 'no-repeat';
		document.getElementById("canvas").appendChild(canvas_el);
		document.getElementById("canvas").style.position	= 'absolute';
	});

	var i = document.createElement("img");
	i.addEventListener("load", function() {
		background.image	= this;
		l();
	});
	i.src	= background.url;

	function image_loader(item)
	{
		var i	= document.createElement("img");
		i.addEventListener("load", function() {
			item.image	= this;
			l();
		});
		i.src	= item.url;
	}

	for(var item in items)
	{
		image_loader(items[item]);
		original_item_srcs[item]	= items[item].url;
	}

	Object.keys(items).sort().forEach(function(key, index)
	{
		var option	= document.createElement("option");
		option.text	= key;
		document.getElementById("menu_select").add(option);

	});

	function overwrite_image(canvas, slot_name, image_src)
	{
		var canvas_objects	= canvas.getObjects();
		for(var co in canvas_objects)
		{
			(function(canvas_object)
			{
				if(canvas_object.name == slot_name)
				{
					canvas_object._element.src	= image_src;
				}
			})(canvas_objects[co]);
		}
		canvas.renderAll();
	}

	document.getElementById("menu_upload_button").addEventListener("click", function() {
		var canvas			= canvas_el.fabric,
			selection		= document.getElementById("menu_select").value,
			upload_img		= document.getElementById("menu_input");

		if('files' in upload_img)
		{
			if(upload_img.files.length != 1)
			{
				window.alert('Please select a single file.');
			}
			else
			{
				var file	= upload_img.files[0],
					reader	= new FileReader(),
					url;

				reader.addEventListener("load", function() {
					overwrite_image(canvas, selection, reader.result)
				}, false);
				reader.readAsDataURL(file);
			}
		}
		else
		{
			window.alert('Please select a file first.');
		}
	});

	document.getElementById("menu_default_button").addEventListener("click", function() {
		var canvas			= canvas_el.fabric,
			selection		= document.getElementById("menu_select").value;

		overwrite_image(canvas, selection, original_item_srcs[selection]);
	});

	function border_toggle(canvas, slot_name, bool)
	{
		var canvas_objects	= canvas.getObjects();
		for(var co in canvas_objects)
		{
			(function(canvas_object)
			{
				if(canvas_object.name == slot_name)
				{
					canvas_object.set({
						borderColor: 'black'
					})
					canvas_object.hasControls	= false;
					canvas_object.set('active', bool);
				}
			})(canvas_objects[co]);
		}
		canvas.renderAll();
	}

	document.getElementById("menu_border_button_on").addEventListener("click", function() {
		var canvas			= canvas_el.fabric,
			selection		= document.getElementById("menu_select").value;

		border_toggle(canvas, selection, true);
	});

	document.getElementById("menu_border_button_off").addEventListener("click", function() {
		var canvas			= canvas_el.fabric,
			selection		= document.getElementById("menu_select").value;

		border_toggle(canvas, selection, false);
	});
});