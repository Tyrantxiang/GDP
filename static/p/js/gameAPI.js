'use strict';

var gameAPI = {
	finishGame : function(gameId, score, currency){
		comms.finish_minigame(gameId, score, currency, function(data){
			if(err){
				utils.setError(JSON.stringify(err));
			}

			//return to hub here!
		});
	},

	useItem : function(itemId, cb){
		comms.use_item(itemId, cb);
	},

	modifyHealth : function(changeVal){
		comms.modify_hp_value(changeVal, cb);
	},

	modifyStatus : function(statusName, changeVal){
		comms.set_status_value(statusName, changeVal, cb);
	},

	getAvatarImage : function(){

	}
}