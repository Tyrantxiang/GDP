(function(){
	window.launch_menu = {
		load : function(){
			canvas.style.visibility = "hidden";

			var array = [];

			var cont		= document.getElementById("main-content-area");
			var container	= document.createElement("div");
			container.id	= 'overlay';

			var title			= document.createElement("div");
			title.innerHTML 	= 'Pack your backpack!';

			var current			= document.createElement("div");
			current.innerHTML 	= 'Current contents:';
			//window.comms.get_bag(function() {});

			var available		= document.createElement("div");
			available.innerHTML = 'Available items:';
			window.comms.get_all_carriables(function(data) {
				for(var d in data)
				{
					elem = document.createElement("div");
					elem.innerHTML = data[d].name;
					elem.addEventListener('click', function(){
						el = document.createElement("div");
						el.innerHTML = data[d].name;
						to_add.appendChild(el);
						array.push(data[d].id);
					});
					available.appendChild(elem);
				};
			});

			var to_add			= document.createElement("div");
			to_add.innerHTML 	= 'To add:';

			/*
			// Ignore for now, will revisit when comes to properly styling this.
			var test = document.createElement("button");
			test.class = "btn btn-primary";
			var test2 = document.createElement("span");
			test2.class = "glyphicon-ok";

			test.appendChild(test2);
			*/

			var accept			= document.createElement("button");
			accept.innerHTML 	= 'Accept';

			var cancel			= document.createElement("button");
			cancel.innerHTML 	= 'Cancel';


			container.appendChild(title);

			container.appendChild(current);
			container.appendChild(available);
			container.appendChild(to_add);
			container.appendChild(accept);
			container.appendChild(cancel);
			//container.appendChild(test);

			cont.appendChild(container);

			accept.addEventListener('click', function(){
    			container.style.visibility = (container.style.visibility == 'visible') ? 'hidden' : 'visible';
    			canvas.style.visibility = 'visible';
    			console.log('accepted');
			});

			cancel.addEventListener('click', function(){
    			container.style.visibility = (container.style.visibility == 'visible') ? 'hidden' : 'visible';
    			canvas.style.visibility = 'visible';
    			console.log('cancelled');
			});

			window.comms.get_bag(function(data) {
				console.log(data);
			});

			/*
			window.comms.get_bag(function(data) {
				for(var d in data)
				{

				};
			});
			*/

			/*
			window.comms.get_single_carriable(101, function(data) {
				console.log('hi2');
				console.log(data);
			})
			*/

			/*
			window.comms.get_single_item_info(501, function(obj) {
				console.log('hi2');
				console.log(obj);
			});
			*/

			container.style.visibility = (container.style.visibility == 'visible') ? 'hidden' : 'visible';
		}
	};
})();