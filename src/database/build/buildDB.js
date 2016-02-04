'use strict';

/*
 * buildDB.js
 * 
 * Runs the build script on the database
 *
 * @authors Joe Ringham
*/

var config = require('../../config.js'),
	Sequelize = require('sequelize'),
	settings = config.database.getSettings(config.database.getDefaultSchema()),
	buildSettings = config.database.getSettings('build');
	
//run sequelize using the postgres user to set up other user
var connectionString = [
					'postgres://',
					buildSettings.username,
					':',
					buildSettings.password,
					'@',
					buildSettings.hostname,
					':',
					buildSettings.port,
					'/',
					buildSettings.database
				].join('');

var sequelize = new Sequelize(connectionString);

//List all queries
//Postgres user
var databaseExistQuery = 'select 1 from pg_catalog.pg_database where datname=\'' + settings.database + '\'',
	databaseCreateQuery = 'CREATE DATABASE ' + settings.database,
	userExistQuery = 'SELECT 1 FROM pg_roles WHERE rolname=\'' + settings.username +'\'',
	userCreateQuery = 'CREATE USER ' + settings.username + ' WITH PASSWORD \'' + settings.password + '\'',
	grantUserPrivilages = 'GRANT ALL PRIVILEGES ON DATABASE ' + settings.database + ' TO ' + settings.username,
	createSchema = 'CREATE SCHEMA IF NOT EXISTS ' + settings.schema;

//BEGIN DATABASE INTERACTION

//Start with settings up database and users
sequelize.sync().then(function(){
	return sequelize.query(databaseExistQuery, {type: sequelize.QueryTypes.SELECT});
}).then(function(result){
	var exists = !!result[0];
	
	//create database if not exists
	if(exists) return Promise.resolve();
	else return sequelize.query(databaseCreateQuery);
}).then(function(){
	//check if the user exists
	return sequelize.query(userExistQuery, {type: sequelize.QueryTypes.SELECT});
}).then(function(result){	
	if(!result[0]){
		//CREATE USER
		sequelize.query(userCreateQuery);
	}
	
	return Promise.resolve();
}).then(function(results){
	//GRANT ALL PRIVILEGES ON DATABASE sgames TO suser;
	return sequelize.query(grantUserPrivilages);
}).catch(function(error){
	console.log('Database setup error\n', error);
}).then(function(){
	console.log('USER PORTION');
	
	//Now set up the tables
	var db = require('../model.js')(settings);

	return db.syncPromise.catch(function(){}).then(function(){
		return db.sequelize.query(createSchema);
	}).catch(function(){}).then(function(){
		return db.sequelize.sync({force:true});
	});
}).then(function(){
	console.log('Database rebuilt');
}).catch(function(error){
	console.log('Database schema error\n', error);
}).finally(function(){
	process.exit(0);
});