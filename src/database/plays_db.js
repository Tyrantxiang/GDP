'use strict';

/*
 * plays_db.js
 * 
 * Queries for the Plays database table
 *
 * @authors Joe Ringham
*/

var playsDB = {}
	, Plays = undefined
	, Users = undefined
	;

playsDB.createPlay = function(playObj) {	
	var play = Plays.build(playObj);
	return play.validate().then(function(isNotValid){
		if(isNotValid) throw new Error(isNotValid.message);
		else return play.save();
	});
}

//Gets the play entry that matches the given id
playsDB.readPlayById = function(id){
	return Plays.findById(id);
}

/*
 * Versatile function for getting scores, which can be shaped by providing filters, orders and limits
 * 
filterConds = {
	user_id : 1,
	game_id : null,
	time_range : {
		start: 1000,
		end : null
	}
} ======> WHERE user_id=1 AND start_time>=1000

orderBy = {
	column : "score",
	direction : "DESC"
} ======> ORDER BY score DESC

limit = 10
======> LIMIT 10
*/
playsDB.getScores = function(filterConds, orderBy, limit){
	var filter = {
		attributes : ['id', 'user_id', 'game_id', 'start_time', 'end_time', 'score', 'created'],
		include : [{
			model : Users,
			attributes : ['username']
		}]
	};
	
	if(orderBy && orderBy.column){
		orderBy.direction = orderBy.direction || 'DESC';
		filter.order = [[orderBy.column, orderBy.direction]]
	}
	if(limit){
		filter.limit = limit;
	}
	if(filterConds){
		filter.where = filterConds;
		delete filter.where.time_range;
		if(filterConds.time_range && filterConds.time_range.start_time){
			filter.where.start_time = {
				$gt : filterConds.time_range.start_time
			}
		}
		if(filterConds.time_range && filterConds.time_range.end_time){
			filter.where.end_time = {
				$lt : filterConds.time_range.end_time
			}
		}
	}
		
	return Plays.findAll(filter);
}

//Deletes the entry that matches the id
playsDB.deletePlay = function(id){
	return Plays.destroy({ where : { 'id' : id } });
}

module.exports = function(seq){
	Plays = seq.Plays;
	Users = seq.Users;
	
	return playsDB;
}