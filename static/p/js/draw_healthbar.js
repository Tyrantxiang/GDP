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

	draw : function(health, statuses, symptoms){
		hb.canvas = document.getElementById('canvas').fabric;

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

window.healthbar = hb;