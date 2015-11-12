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
	, getErrorNameFromCode = require('./errorCodes.js')
	;

/*
 * Creates the connection string
 */
dbutils.validateServerSettings = function(pass, fail, settings){
	var credentials = 
		[ 
			settings.username
			, settings.password
			, settings.hostname
			, settings.database
			, settings.schema
		];

	//Checks all credentials are not undefined
	if( !credentials.every(isTrue) )
		return fail("Missing Parameters");
	

	function isTrue(c){
		return !!c;
	}

	pass();
}

/*
 * Creates the connection string
 */
dbutils.setConnectionString = function(pass, fail, creds) {
 	dbutils.connection_string = 
 		[ 
 			"postgres://"
			, creds['username']
			, ":"
			, creds['password']
			, "@"
			, creds['hostname']
			, "/"
			, creds['database']
		
		].join('');
	pass();
}


/*
 * Connect to the db and run a query
 */
dbutils.query = function(pass, fail, q) {
	if(!dbutils.connection_string)
		return fail("Database not initialised yet");
	
	pg.connect( dbutils.connection_string, runQuery );

	q.name = createPreparedStatementName(q.text);

	function runQuery(err, client, queryDone) {
		if(err) 
			return fail(err);
		
		client.query(q, function(err, results) {
			queryDone();
			if(err) {
				err.sql = q;
				return dbutils.sanitiseError(err, fail);
			} else {
				//console.log(q);
				pass(results);
			}
		});
	}
};

dbutils.create = function(pass, fail, tableName, valuesObj){
	delete valuesObj.id;

	dbutils.prepareCreateStrings(queryExecution, fail, valuesObj);

	function queryExecution(colNames, valNums, colVals){
		var preparedStatement = {
			text: 'INSERT INTO '+tableName+colNames+" VALUES"+valNums+" RETURNING id"
			, values: colVals
		}

		dbutils.query(resultsHandling, fail, preparedStatement);
	}

	function resultsHandling(results){
		pass({ id: results.rows[0].id });
	}
};

dbutils.read = function(pass, fail, tableName, columnsArr, filterConds, byString, limit){
	dbutils.prepareFilterString(queryExecution, fail, filterConds);

	function queryExecution(filterString, filterVals){
		var preparedStatement = {
			text: "SELECT "+(columnsArr.join(", "))+" FROM "+tableName+" "+filterString
			, values: filterVals
		}

		if(byString)
			preparedStatement.text += " "+byString;

		if(limit) {
			preparedStatement.values.push(limit);
			preparedStatement.text += " LIMIT $"+preparedStatement.values.length;
		}

		dbutils.query(resultsHandling, fail, preparedStatement);
	}

	function resultsHandling(results){
		pass(results.rows);
	}
}

dbutils.readSingle = function(pass, fail, tableName, columnsArr, filterConds, byString){
	dbutils.read(resultsHandling, fail, tableName, columnsArr, filterConds, byString, null);

	function resultsHandling(results){
		var row = results[0];

		if(!row)
			return fail({
				name: "ERR_NO_MATCHING_ENTRY"
				, message: "No entry in relation \""+tableName+"\" matching the given filters"
			});

		pass(row);
	}
}

dbutils.readById = function(pass, fail, tableName, columnsArr, idVal){
	dbutils.read(resultsHandling, fail, tableName, columnsArr, {"id": idVal}, null, null);

	function resultsHandling(results){
		var row = results[0];

		if(!row)
			return fail({
				name: "ERR_NO_MATCHING_ENTRY"
				, message: "No entry in relation \""+tableName+"\" with id ("+idVal+")."
			});

		pass(row);
	}
}

dbutils.readLatestActive = function(pass, fail, tableName, selectColumns, partitionColumns, filterConds){
	var innerTableName = "ranked"
		;

	//get the unique concatonation of select columns and the filterconds columns
	var neededColumns = selectColumns.concat(Object.keys(filterConds).filter(function (item) {
	    return selectColumns.indexOf(item) < 0;
	}));

	//Add time_rank to filter conds, and creates the WHERE string
	filterConds.time_rank = 1;
	dbutils.prepareFilterString(queryExecution, fail, filterConds, null, innerTableName);

	function queryExecution(filterString, filterVals){
		var sql = [
			"SELECT "+selectColumns.join(", ")
			, "FROM ( SELECT "+neededColumns.join(", ")
			, ", RANK() OVER (PARTITION BY "+partitionColumns.join(", ")+" ORDER BY created DESC) as time_rank"
			, "FROM "+tableName+") as "+innerTableName
			, filterString
		].join(" ");

		var preparedStatement = {
			text: sql
			, values : filterVals
		};

		dbutils.query(resultsHandling, fail, preparedStatement);
	}

	function resultsHandling(results){
		pass(results.rows);
	}
}

dbutils.update = function(pass, fail, tableName, valuesObj, filterConds){
	var setString = ""
		, setVals = []
		;

	dbutils.prepareUpdateString(filterStringCreation, fail, valuesObj);

	function filterStringCreation(str, vals, currentPlaceIndex){
		setString = str;
		setVals = vals;
		dbutils.prepareFilterString(queryExecution, fail, filterConds, currentPlaceIndex);
	}

	function queryExecution(filterString, filterVals){
		var preparedStatement = {
			text: "UPDATE "+tableName+" SET "+setString+" "+filterString
			, values: setVals.concat(filterVals)
		}

		dbutils.query(resultsHandling, fail, preparedStatement);
	}

	function resultsHandling(results){
		pass( {rowsUpdated: results.rowCount} );
	}
}

dbutils.updateById = function(pass, fail, tableName, valuesObj, idVal){
	dbutils.update(resultsHandling, fail, tableName, valuesObj, {"id": idVal});

	function resultsHandling(results){
		var row = results[0];

		if(results.rowsUpdated < 1)
			return fail({
				name: "ERR_NO_MATCHING_ENTRY"
				, message: "No entry in relation \""+tableName+"\" with id ("+idVal+")."
			});

		pass(results);
	}
}

dbutils.deleteById = function(pass, fail, tableName, idVal){
	var preparedStatement = {
		text: "DELETE FROM "+tableName+" WHERE id=$1"
		, values: [idVal]
	}

	dbutils.query(resultsHandling, fail, preparedStatement);

	function resultsHandling(results){
		pass( {rowsDeleted: results.rowCount} );
	}
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

dbutils.prepareFilterString = function(pass, fail, filterConds, placeIndex, prepend){
	var filterString = ""
		, filterArr = []
		, filterVals = []
		;

	if(!placeIndex)
		placeIndex = 1;

	if(!prepend) {
		prepend = "";
	} else {
		prepend += ".";
	}

	function addFilter(statement, val){
		filterArr.push(prepend+statement+placeIndex);
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

dbutils.sanitiseError = function(err, cb){
	var cleanErr = {}
		;		

	cleanErr.name = getErrorNameFromCode(err.code);
	cleanErr.code = err.code;
	cleanErr.message = err.message;
	cleanErr.detail = err.detail;
	cleanErr.sql = err.sql;

	cb(cleanErr);
}


/*
*	Prepared statement names have to be unique
*	This is my quick method of creating unique names for now
*/
function createPreparedStatementName(queryStr){
	var hash = 0;
    if (queryStr.length == 0) return hash;
    for (var i = 0; i < queryStr.length; i++) {
        var char = queryStr.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}


module.exports = dbutils;