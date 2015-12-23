(function(){
		
	//Set up add cariable
	$.post("/superuser/get_all_statuses", {}, function(data){
		
		var addNewCarriableEffect = function(){
			var div = $('<div>').addClass("form-group").addClass("row");
			
			var selDiv = $("<div>").addClass("col-sm-7").appendTo(div);
			var sel = $('<select>').addClass("form-control").appendTo(selDiv);
			$(data).each(function(){
				sel.append($("<option>").attr('value', this.id).text(this.name));
			});
			
			var inputDiv = $("<div>").addClass("col-sm-3").appendTo(div);
			$('<input>').attr("type", "text").addClass("form-control").appendTo(inputDiv);
			
			var removeBtn = $("<button>").addClass("btn").addClass("btn-danger").attr("type", "button").appendTo(div);
			$("<span>").addClass("glyphicon").addClass("glyphicon-minus").appendTo(removeBtn);
			removeBtn.click(function(e){
				div.remove();
			});
			
			div.appendTo('#add_carriable_effects');
		};
		
		addNewCarriableEffect();
		$("#add_carriable_effect").click(addNewCarriableEffect);
	});
	
	$('#add_carriable_submit').click(function(e){
		e.preventDefault();
		
		var allEffects = [];
		
		$('#add_carriable_effects').children().each(function(index, element){
			var id = parseInt($(element).children(".col-sm-7").children("select").find(":selected").attr("value"));
			var val = parseInt($(element).children(".col-sm-3").children("input").val());
			
			allEffects.push({id : id, amount : val});
		});
		
		$('#add_carriable_remove').remove();
		$('<input>').attr('type', 'text').attr('name', 'effects').val(JSON.stringify(allEffects)).appendTo('#add_carriable');
		
		//console.log("here")
		$('#add_carriable').submit();
	});
	
	
	
})();