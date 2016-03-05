var ready = false;
var returnValues = {
	useCarriable : undefined,
	getCarriableInfo : undefined,
	modifyHealth : undefined,
	modifyStatus : undefined
}; 

function getReady(){
    return ready ? 1 : 0;
}

// Define 
function finishGameSync(score, currency){
	api.finishGame(score, curency);
}

function useCarriableSync(carriableId){
	ready = false;
	api.useCarriable(carriableId, function(obj){
		returnValues.useCarriable = obj;
		ready = true;
	});
}

function getCarriableInfoSync(carriableId){
	ready = false;
	api.getCarriableInfo(carriableId, function(obj){
		returnValues.getCarriableInfo = obj;
		ready = true;
	});
}

function modifyHealthSync(changeHealth){
	ready = false;
	api.modifyHealth(changeHealth, function(obj){
		returnValues.modifyHealth = { health : obj };
        ready = true;
	});
}

function modifyStatusSync(statusId, changeVal){
	ready = false;
	api.modifyStatus(statusId, function(obj){
		returnValues.modifyStatus = obj;
        ready = true;
	});
}

function getAvatarImageSync(){
	return api.getAvatarImage();
}

function getAssetURLSync(asset){
	return api.getAssetURL(asset);
}

function getValue(functionName, valueName){
	var value = returnValues[functionName][valueName];

	if(value) return value;
	else return undefined;
}

var api;
window.obj = {};
window.obj.run = function(a){
	api = a;
	// load html5 game

	var script = document.createElement("script");
    script.src = 'html5game/DiabetesGame2.js';

    var stag = document.getElementsByTagName('script')[0];
    stag.parentNode.insertBefore(script, stag);
}

window.finishGameSync = finishGameSync;
window.useCarriableSync = useCarriableSync;
window.getCarriableInfoSync = getCarriableInfoSync;
window.modifyHealthSync = modifyHealthSync;
window.modifyStatusSync = modifyStatusSync;
window.getAvatarImageSync = getAvatarImageSync;
window.getAssetURLSync = getAssetURLSync;