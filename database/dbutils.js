'use strict';

/*
 * dbutils.js
 * 
 * Initialises, connects and sends queries to the PostgreSQL database
 *
 * @authors Joe Ringham
*/

var pg = require('pg')
	, dbutils = { connection_string : null }
	;

/*
 * Connect to the db and run a query
 */
dbutils.query = function(pass, fail, q) {
	console.log(q.text);
	console.log(q.values.join(", "));
	pass();		
/*
	if(!dbutils.connection_string)
		return fail("Database not initialised yet");
	
	pg.connect( dbutils.connection_string, runQuery );

	function runQuery(err, client, queryDone) {
		if(err) 
			return fail(err);
		
		client.query(q, function(err, results) {
			queryDone();
			if(err) {
				err.sql = q;
				return fail(err);
			}
		
			pass(results);
		});
	}
*/
};

dbutils.create = function(pass, fail, tableName, valuesObj){
	delete valuesObj.id;

	dbutils.prepareCreateStrings(preparationPass, fail, valuesObj);

	function preparationPass(colNames, valNums, colVals){
		var preparedStatement = {
			name: 'insert_'+tableName,
			text: 'INSERT INTO '+tableName+colNames+" VALUES"+valNums+" RETURNING id",
			values: colVals
		}

		dbutils.query(pass, fail, preparedStatement);
	}
};

dbutils.read = function(pass, fail, tableName, columnsArr, filterConds, byString, limit){
	dbutils.createFilterString(filterCreationPass, fail, filterConds);

	function filterCreationPass(filterString, filterVals){
		var preparedStatement = {
			name: 'read_'+tableName+"FILTER"+filterString+"LIMIT"+limit,
			text: "SELECT "+(columnsArr.join(", "))+" FROM "+tableName+" "+filterString,
			values: filterVals
		}

		if(byString)
			preparedStatement.text += " "+byString;

		if(limit)
			preparedStatement.text += " LIMIT "+limit;

		dbutils.query(pass, fail, preparedStatement);
	}
}

dbutils.readSingle = function(pass, fail, tableName, columnsArr, filterConds, byString){
	dbutils.read(pass, fail, tableName, columnsArr, filterConds, byString, null);
}

dbutils.readById = function(pass, fail, tableName, columnsArr, idVal){
	dbutils.read(pass, fail, tableName, columnsArr, {"id": idVal}, null, null);
}

dbutils.update = function(pass, fail, tableName, valuesObj, filterConds){
	dbutils.prepareUpdateStrings(setValsCreationPass, fail, valuesObj);

	function setValsCreationPass(setString, setVals, currentPlaceIndex){
		dbutils.createFilterString(filterCreationPass, fail, filterConds, currentPlaceIndex);
	}

	function filterCreationPass(filterString, filterVals){
		var preparedStatement = {
			name: 'updateById_'+tableName+setString,
			text: "UPDATE "+tableName+" SET "+setString+filterString,
			values: setVals.concat(filterVals)
		}

		dbutils.query(pass, fail, preparedStatement);
	}
}

dbutils.updateById = function(pass, fail, tableName, valuesObj, idVal){
	dbutils.update(pass, fail, tableName, valuesObj, {"id": id});
}

dbutils.deleteById = function(pass, fail, tableName, idVal){
	var preparedStatement = {
		name: 'deleteById_'+tableName,
		text: "DELETE FROM "+tableName+" WHERE id=$1",
		values: [idVal]
	}

	dbutils.query(pass, fail, preparedStatement);
}


//Function used for creating column name and value list strings from objects
//i.e. {"a": 10, "b": 20} --> will return a function with these args --> "(a, b)", "($1, $2)", [10, 20]
dbutils.prepareCreateStrings = function(pass, fail, obj){
	var colNames = "(",
		valNums = "(",
		colVals = [],
		loopIndex = 1;
	for(var name in obj){
		if(obj.hasOwnProperty(name)){
			if(loopIndex === 1){
				colNames += name;
				valNums += "$"+loopIndex;
			} else {
				colNames += ", "+name;
				valNums += ", $"+loopIndex;
			}
			colVals.push(obj[name]);
			loopIndex++;
		}
	}

	colNames += ')';
	valNums += ')';

	pass(colNames, valNums, colVals);
}

dbutils.prepareUpdateString = function(pass, fail, obj){
	var setString = "",
		setVals = [],
		loopIndex = 1;

	for(var name in obj){
		if(obj.hasOwnProperty(name)){
			if(loopIndex !== 1)
				setString += ", ";

			setString += (name+"=$"+loopIndex);

			setVals.push(obj[name]);
			loopIndex++;
		}
	}

	pass(setString, setVals, loopIndex);
}

dbutils.createFilterString = function(pass, fail, filterConds, placeIndex){
	var filterString = ""
		, filterArr = []
		, filterVals = []
		;

	if(!placeIndex)
		placeIndex = 1;

	function addFilter(statement, val){
		filterArr.push(statement+placeIndex);
		filterVals.push(val);
		placeIndex++;
	}

	for(var cond in filterConds){
		if(cond == "time_range"){

			if(filterConds[cond].start)
				addFilter("start_time >= $", filterConds[cond].start);

			if(filterConds[cond].end)
				addFilter("start_time <= $", filterConds[cond].end);
		
		} else {
			addFilter(cond+"=$", filterConds[cond]);
		}
	}

	if(filterArr.length > 0)
		filterString = "WHERE "+filterArr.join(" AND ");

	pass(filterString, filterVals);
}


module.exports = dbutils;