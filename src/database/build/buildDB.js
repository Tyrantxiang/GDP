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
	
	//BEGIN DATABASE INTERACTION
	
	//Start with settings up database and users
	sequelize.sync().then(function(){
		return sequelize.query('select 1 from pg_catalog.pg_database where datname=\'' + settings.database + '\'', {type: sequelize.QueryTypes.SELECT});
	}).then(function(result){
		var exists = !!result[0];
		
		//create database if not exists
		if(exists) return Promise.resolve();
		else return sequelize.query('CREATE DATABASE ' + settings.database);
	}).then(function(){
		//check if the user exists
		return sequelize.query('SELECT 1 FROM pg_roles WHERE rolname=\'' + settings.username +'\'', {type: sequelize.QueryTypes.SELECT});
	}).then(function(result){
		var exists = !!result[0];
		
		if(!exists){
			//CREATE USER
			var query = 'CREATE USER ' + settings.username + ' WITH PASSWORD \'' + settings.password + '\'';
			
			return sequelize.query(query).spread(function(results, metadata){
				return Promise.resolve();
			});
		}else{
			return Promise.resolve();
		}
	}).then(function(results){
		//GRANT CREATE ON DATABASE sgames TO suser;
		return sequelize.query('GRANT ALL PRIVILEGES ON DATABASE ' + settings.database + ' TO ' + settings.username);
	}).then(function(){
		//create the schema if not exists
		return sequelize.query('GRANT ALL PRIVILEGES ON DATABASE ' + settings.database + ' TO ' + settings.username);
	}).catch(function(error){
		console.log('Database setup error');
		console.log(error);
	}).then(function(){
		console.log('USER PORTION');
		
		//Now set up the tables
		var db = require('../model.js')(settings);
	
		return db.syncPromise.catch(function(){}).then(function(){
			return db.sequelize.query('CREATE SCHEMA IF NOT EXISTS ' + settings.schema);
		}).catch(function(){}).then(function(){
			return db.sequelize.sync({force:true});
		});
	}).then(function(){
		console.log('Database rebuilt');
	}).catch(function(error){
		console.log('Database schema error');
		console.log(error);
	}).then(function(){
		process.exit(0);
	});
	
	
	