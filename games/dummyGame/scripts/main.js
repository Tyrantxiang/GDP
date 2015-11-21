(function(){


	function run(api, canvas, assetsDir){

		// create a wrapper around native canvas element (with id="c")
		var canvas = new fabric.Canvas(canvas);

		var text = new fabric.Text('END GAME', {
			left: 25
			, top: 25
			, selectable: false
		});
		canvas.add(text);

		canvas.on('mouse:down', function(options) {
			if(options.target === text){
				api.finishGame();
			}
		});
	}


	window.dummyGame = {
		run : run
	};
})();