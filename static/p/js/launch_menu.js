(function(){
	window.launch_menu = {
		load : function(){
			canvas.style.visibility = "hidden";

			var cont		= document.getElementById("main-content-area");

			var container	= document.createElement("div");
			var text		= document.createElement("div");
			container.id	= 'overlay';

			text.innerHTML = 'test';

			container.appendChild(text);
			cont.appendChild(container);

			text.addEventListener('click', function(){
    			container.style.visibility = (container.style.visibility == 'visible') ? 'hidden' : 'visible';
    			canvas.style.visibility = 'visible';
			});

			container.style.visibility = (container.style.visibility == 'visible') ? 'hidden' : 'visible';
		}
	};
})();