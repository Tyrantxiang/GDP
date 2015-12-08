(function(){
	
	$("#add_carriable_effect").click(function(e){
		var newSlot = document.createElement("INPUT");
		newSlot.type = "text";
		newSlot.name = "slot";
		
		console.log("here");
		
		$('#add_carriable').append(newSlot);
	});

})();