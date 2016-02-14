(function(){

	var api;
	var canvas;
	var statuses;
	var changeableStatus;
	var health;
	var score;
	var currency;
	var currentBag;


	function run(a, div, assetBaseURL, startHp, stats, bag){
		// Create the canvas
		var can = document.createElement("canvas");
		div.appendChild(can);

		api = a;
		canvas = can;
		can.width="1000";
		can.height="600";

		health = undefined;
		symptom = undefined;
		healthColour = undefined;
		//TODO: ask about passing symptoms into this??
		setHealth(startHp, null);

		statuses = stats;
		changeableStatus = statuses[Object.keys(statuses)[0]];
		statusColour = undefined;
		setStatus(changeableStatus.id, changeableStatus.value);

		score = 0;
		currency = 0;
		currentBag = bag;

		defaultColour = "white";

		// Handle keyboard controls
		window.addEventListener("keydown", keyPressed);

		render();

	}

	// Update values depending on key
	var keyPressed = function (e) {
		switch(e.keyCode){
			case(40) : // Player pressed down
				//console.log("down");
				api.modifyHealth(-5, updateHealthAndAvatar);
				break;			
			case(38) : // Player pressed up
				//console.log("up");
				api.modifyHealth(5, updateHealthAndAvatar);
				break;

			case(37) : // Player pressed left
				//console.log("left");
				if(changeableStatus)
					api.modifyStatus(changeableStatus.id, -1, updateStatus);
				break;
			case(39) : // Player pressed right
				//console.log("right");
				if(changeableStatus)
					api.modifyStatus(changeableStatus.id, 1, updateStatus);
				break;

			case(74) : // Player pressed j
				//console.log("J");
				updateScore(-10);
				break;
			case(75) : // Player pressed k
				//console.log("K");
				updateScore(10);
				break;

			case(78) : // Player pressed n
				//console.log("N");
				updateCurrency(-10);
				break;
			case(77) : // Player pressed m
				//console.log("M");
				updateCurrency(10);
				break;

			case(49) : // Player pressed 1
				numberPressed(1);
				break;
			case(50) : // Player pressed 2
				numberPressed(2);
				break;
			case(51) : // Player pressed 3
				numberPressed(3);
				break;
			case(52) : // Player pressed 4
				numberPressed(4);
				break;
			case(53) : // Player pressed 5
				numberPressed(5);
				break;
			case(54) : // Player pressed 6
				numberPressed(6);
				break;
			case(55) : // Player pressed 7
				numberPressed(7);
				break;
			case(56) : // Player pressed 8
				numberPressed(8);
				break;
			case(57) : // Player pressed 9
				numberPressed(9);
				break;
			case(48) : // Player pressed 0
				numberPressed(10);
				break;

			case(70) : // Player pressed F
				//console.log("F");
				finishGame();
				break;
		}
	};

	var finishGame = function(){
		//window.removeEventListener("keydown", keyPressed);
		api.finishGame(score, currency);
	}

	var numberPressed = function(num){
		//console.log(num);
		var key = Object.keys(currentBag)[num-1];

		if(currentBag[key] == undefined){
			alert("NO ITEM IN THAT SLOT");
		} else {
			api.useCarriable(currentBag[key].id, updateCarriables);
			render();
		}
	}
	
	function base64ToImg(base64){
        var i = document.createElement("img");
        i.src = "data:image/png;base64," + base64;
        return i;
    }

	/*
	 *  Local value updating callbacks
	 */
	function setHealth(newHealth, newSymps){
		health = newHealth;
		switch(true){
			case (health < 20):
				healthColour = 'red';
				break;
			case (health < 40):
				healthColour = 'orange';
				break;
			case (health < 60):
				healthColour = 'yellow';
				break;
			default:
				healthColour = 'rgb(63,255,0)';
				break;
		}

		symptom = ((newSymps && newSymps[0]) || "healthy").toUpperCase();
	}
	function updateHealthAndAvatar(newHealth, newAvatar, newSymps){
		setHealth(newHealth, newSymps);
		render();
	}

	function setStatus(statusId, newValue){
		var stat = statuses[statusId];
		console.log(stat);
		stat.value = newValue;
		if(newValue < stat.healthy_min || newValue > stat.healthy_max){
			statusColour = 'red';
		} else {
			statusColour = 'rgb(63,255,0)';
		}
	}
	function updateStatus(statusId, newValue){
		setStatus(statusId, newValue);
		render();
	}

	function updateScore(changeVal){
		score += changeVal;
		render();
	}

	function updateCurrency(changeVal){
		currency += changeVal;
		render();
	}

	function updateCarriables(newBag, newHp, newStatuses, avatarImage, newSymps){
		updateHealthAndAvatar(newHp, avatarImage, newSymps);
		for(var i in newStatuses){
			statuses[i].value = newStatuses[i].value;
		}
		currentBag = newBag;
		render();
	}

	/*
	 *	Draw the text!
	 */
	var render = function () {
		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);


		ctx.fillStyle = "#000000";
		ctx.fillRect(0,0,(canvas.width-300),canvas.height);

		ctx.font = "32px serif";
		ctx.fillStyle = defaultColour;
		ctx.fillText("Dummy Game...", 10, 40);
		ctx.fillText("Use Keys:", 10, 80);

		ctx.font = "24px serif";
		ctx.fillText("UP/DOWN to change health by 5", 10, 120);
		if(changeableStatus)
			ctx.fillText("LEFT/RIGHT to change status by 1: "+changeableStatus.name, 10, 150);
		ctx.fillText("J/K to change score", 10, 180);
		ctx.fillText("N/M to change currency", 10, 210);
		ctx.fillText("Numbers to use carriables", 10, 240);
		ctx.fillText("F to finish game", 10, 270);

		ctx.fillStyle = healthColour;
		ctx.fillText("HEALTH: "+health, 10, 350);
		if(changeableStatus)
			ctx.fillStyle = statusColour;
			ctx.fillText(changeableStatus.name+": "+changeableStatus.value, 10, 380);

		ctx.fillStyle = healthColour;
		ctx.fillText("Symptom: "+symptom, 10, 410);
		ctx.fillStyle = defaultColour;
		ctx.fillText("Score: "+score, 10, 440);
		ctx.fillText("Currency: "+currency, 10, 470);
		ctx.fillText("Carriables: "+makeBagString(), 10, 500);

		ctx.drawImage(api.getAvatarImage(),canvas.width-300,0);
	};

	var makeBagString = function(){
		var arr = []
			index = 1;
		for(var c in currentBag){
			arr.push("("+index+")"+currentBag[c].name);
			index++;
		}

		if(arr.length > 0) {
			return arr.join(', ');
		} else {
			return "NO ITEMS";
		}
	}

	window.dummyGame = {
		run : run
	};
})();