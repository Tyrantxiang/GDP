window.healthbar = {
	draw : function(health, statuses){
		var canvas = document.getElementById('canvas').fabric;

		var canvas_height = canvas.height;
		var canvas_width = canvas.width;

		var healthbar_height = canvas_height/8;
		var healthbar_width = canvas_width/4;

		var rekt = new fabric.Rect({
			left : (canvas_width - healthbar_width),
			top : (canvas_height - healthbar_height),
			fill : 'red',
			width : healthbar_width*0.75,
			height : healthbar_height*0.75
		});

		canvas.add(rekt);
	},
}
