var readyValues = {
	useCarriableSync : false,
	getCarriableInfoSync : false,
	modifyHealthSync : false,
	modifyStatusSync : false
}


var returnValues = {
	useCarriableSync : {},
	getCarriableInfoSync : {},
	modifyHealthSync : {},
	modifyStatusSync : {}
};

// Define 
function finishGameSync(score, currency){
	api.finishGame(score, curency);
}

function useCarriableSync(carriableId){
	readyValues.useCarriableSync = false;
	api.useCarriable(carriableId, function(obj){
		returnValues.useCarriableSync = obj;
		readyValues.useCarriableSync = true;
	});
}

function getCarriableInfoSync(carriableId){
	readyValues.getCarriableInfoSync = false;
	api.getCarriableInfo(carriableId, function(obj){
		returnValues.getCarriableInfoSync = obj;
		readyValues.getCarriableInfoSync = true;
	});
}

function modifyHealthSync(changeHealth){
	readyValues.modifyHealthSync = false;
	api.modifyHealth(changeHealth, function(obj){
		returnValues.modifyHealthSync = obj;
		readyValues.modifyHealthSync = true;
	});
}

function modifyStatusSync(statusId, changeVal){
	readyValues.modifyStatusSync = false;
	api.modifyStatus(statusId, function(obj){
		returnValues.modifyStatusSync = obj;
		readyValues.modifyStatusSync = true;
	});
}

function getAvatarImageSync(){
	return api.getAvatarImage();
}

function getAssetURLSync(asset){
	return api.getAssetURL(asset);
}

function getValue(functionName, valueName, subvalueName){
	var value;

	if(!functionName)
		value = undefined;
	else if(!valueName)
		value = returnValues[functionName];
	else if(!subvalueName)
		value = returnValues[functionName][valueName];
	else
		value = returnValues[fuctionName][valueName][subvalueName];

	return value;
}

function getReady(functionName){
	var ready = readyValues[functionName];

	return !!ready ? 1 : 0;
}

var api;
window.obj = {};
window.obj.run = function(a, div, assetBaseURL, health, statuses, bag){
	api = a;
	// load html5 game
	var canvas = document.createElement("canvas");
	canvas.id = "canvas";
	canvas.width = "640";
	canvas.height = "480";
	div.appendChild(canvas);

	var script = document.createElement("script");
	script.addEventListener("load", function(){
		var mm = window.onload;
		window.onload = undefined;
		_k._l[0]._m[0] = null;
		var tt = _lT1;
		_lT1 = function(){
			var a = tt();
			_w9 = assetBaseURL;
			return a;
		}
		mm();
	});
    script.src = a.getAssetURL('DiabetesGame2.js');

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