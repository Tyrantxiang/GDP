(function(){

	function run(api, canvas, assetBaseURL, startHp, statuses, bag){

		var changeableStatus = statuses[Object.keys(statuses)[0]]
		var health = startHp;
		var score = 0;
		var currency = 0;
		var currentBag = bag;

		// Handle keyboard controls
		// !!!!!!!!! document.?
		addEventListener("keypress", keyPressed, true);

		// Update values depending on key
		var keyPressed = function (e) {
			switch(e.keyCode){
				case(40) : // Player pressed down
					console.log("down");
					api.modifyHealth(-1, updateHealthAndAvatar);
					break;			
				case(38) : // Player pressed up
					console.log("up");
					api.modifyHealth(1, updateHealthAndAvatar);
					break;


				case(37) : // Player pressed left
					console.log("left");
					api.modifyStatus(changeableStatus.id, -1, updateStatus);
					break;
				case(39) : // Player pressed right
					console.log("right");
					api.modifyStatus(changeableStatus.id, 1, updateStatus);
					break;


				case(74) : // Player pressed j
					console.log("J");
					updateScore(-10);
					break;
				case(75) : // Player pressed k
					console.log("K");
					updateScore(10);
					break;

				case(78) : // Player pressed n
					console.log("N");
					updateCurrency(-10);
					break;
				case(77) : // Player pressed m
					console.log("M");
					updateCurrency(10);
					break;

				case(48) : // Player pressed 0
					numberPressed(0);
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

				case(70) : // Player pressed F
					console.log("F");
					api.finishGame(score, currency);
					break;
			}
		};

		var numberPressed = function(num){
			console.log(num);

			if(bag[num] == undefined){
				alert("NO ITEM IN THAT SLOT");
			} else {
				api.useCarriable(currentBag[num].id, updateCarriables);
				render();
			}
		}

		/*
		 *  Local value updating callbacks
		 */
		function updateHealthAndAvatar(newHealth, newAvatar){
			health = newHealth;
			//Do something with avatar
			render();
		}

		function updateStatus(statusId, newValue){
			statuses[statusId].value = newValue;
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

		function updateCarriables(newBag, health, newStatuses, avatarImage){
			updateHealthAndAvatar(health, avatarImage);
			statuses = newStatuses;
			currentBag = newBag;
			render();
		}

		/*
		 *	Draw the text!
		 */
		var render = function () {
			var ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.font = "32px serif";
			ctx.fillText("Dummy Game...", 10, 40);
			ctx.fillText("Use Keys:", 10, 80);

			ctx.font = "24px serif";
			ctx.fillText("UP/DOWN to change health", 10, 120);
			ctx.fillText("LEFT/RIGHT to change status: "+changeableStatus.name, 10, 150);
			ctx.fillText("J/K to change score", 10, 180);
			ctx.fillText("N/M to change currency", 10, 210);
			ctx.fillText("Numbers to use carriables", 10, 240);
			ctx.fillText("F to finish game", 10, 270);


			ctx.fillText("Health: "+health, 10, 350);
			ctx.fillText(changeableStatus.name+": "+changeableStatus.value, 10, 380);
			ctx.fillText("Score: "+score, 10, 410);
			ctx.fillText("Currency: "+currency, 10, 440);
			ctx.fillText("Carriables: "+makeBagString(), 10, 470);

			var makeBagString = function(){
				var arr = [];
				currentBag.forEach(function(b){
					arr.push(b.name);
				});

				return arr.join(', ');
			}

		};
	}

	window.dummyGame = {
		run : run
	};
})();