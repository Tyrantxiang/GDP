(function(){
	
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
			sel.val(sel.children().first().attr("value"));
			
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
		
		$('#add_carriable').submit();
	});
})();	
	
(function(){
	$.post("/superuser/get_all_carriables", {}, function(data){		
		var selectForm = $('<select>').addClass('form-control').attr('id', 'remove_carriable_name').attr('name', 'id');
		$(data).each(function(){
			selectForm.append($("<option>").attr('value', this.id).text(this.name));
		});
		
		selectForm.val(selectForm.children().first().attr("value"));
		
		var getSprite = function(){
			var id = $(selectForm).children('option:selected').first().attr("value");
			var url = data.filter(function(ele){
				return ele.id.toString()===id;
			})[0].url;
			
			var sprite = new Image();
			sprite.onload = function(){
				var maxPreviewDimension = 75;
				if($(sprite).width() > $(sprite).height()) { 
					$(sprite).css('width',maxPreviewDimension+'px');
					$(sprite).css('height','auto');
				} else {
					$(sprite).css('height',maxPreviewDimension+'px');
					$(sprite).css('width','auto');
				}
				
				$('#remove_carriable_label').empty();
				$('#remove_carriable_label').append(sprite);
			};
			sprite.src = url;
		};	
		
		getSprite();
		selectForm.change(getSprite);
		$('#remove_carriable_div').append(selectForm);
	});
})();
	
(function(){
	$.post("/superuser/get_all_statuses", {}, function(data){
		var selectForm = $('<select>').addClass('form-control').attr('id', 'remove_status_select').attr('name', 'id');
		$(data).each(function(){
			selectForm.append($("<option>").attr('value', this.id).text(this.name));
		});
		
		selectForm.val(selectForm.children().first().attr("value"));
		
		$('#remove_status_div').append(selectForm);
	});
})();

(function(){
	$.post("/superuser/get_all_statuses", {}, function(data){
		
		var add_condition_statuses = function(){
			var div = $('<div>').addClass("form-group");
			
			var selDiv = $("<div>").addClass("col-sm-10").appendTo(div);
			var sel = $('<select>').addClass("form-control").appendTo(selDiv);
			$(data).each(function(){
				sel.append($("<option>").attr('value', this.id).text(this.name));
			});
			sel.val(sel.children().first().attr("value"));
			
			var removeBtn = $("<button>").addClass("btn").addClass("btn-danger").attr("type", "button").appendTo(div);
			$("<span>").addClass("glyphicon").addClass("glyphicon-minus").appendTo(removeBtn);
			removeBtn.click(function(e){
				div.remove();
			});			
			
			div.appendTo('#add_condition_statuses');
		};
		
		add_condition_statuses();
		$("#add_condition_stat").click(add_condition_statuses);
	});
	
	$('#add_condition_submit').click(function(e){
		var statuses = [];
		$('#add_condition_statuses').children().map(function(){
			return $(this).children().first().children().first();
		}).each(function(){
			statuses.push(parseInt(this.val()));
		});
		
		$('#add_condition_statuses').remove();
		$('<input>').attr('type', 'text').attr('name', 'effects').val(JSON.stringify(statuses)).appendTo('#add_condition');
		
	});
})();

(function(){
	$.post("/superuser/get_all_conditions", {}, function(data){	
		var selectForm = $('#remove_condition_select');
		$(data).each(function(){
			$(selectForm).append($("<option>").attr('value', this.id).text(this.name));
		});
		
		$(selectForm).val($(selectForm).children().first().attr("value"));
		
	});
})();

(function(){
	$.post("/superuser/get_item_slots", {}, function(data){	
		var selectForm = $('#add_store_item_slot');
		$(data).each(function(){
			$(selectForm).append($("<option>").attr('value', this).text(this));
		});
		
		$(selectForm).val($(selectForm).children().first().attr("value"));
	});
})();

(function(){
	$.post("/superuser/get_item_slots", {}, function(data){	
		var selectForm = $('#remove_store_item_slot');
		$(data).each(function(){
			$(selectForm).append($("<option>").attr('value', this).text(this));
		});
		
		$(selectForm).val($(selectForm).children().first().attr("value"));
		
		var changeFunc = function(e){
			$.post("/superuser/get_items_for_slot", {"slot": $(selectForm).val()}, function(data){
				$("#remove_store_item_item").empty();
				
				$(data).each(function(){
					$("#remove_store_item_item").append($("<option>").attr('value', this.id).text(this.name));
				});
				
				$("#remove_store_item_item").val($("#remove_store_item_item").children().first().attr("value"));
			});
		};
		
		changeFunc();
		$(selectForm).change(changeFunc);
	});
})();

})();