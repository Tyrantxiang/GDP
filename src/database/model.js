var Sequelize = require("sequelize");

module.exports = function(settings){

var connectionString = [
						'postgres://',
						settings.username,
						':',
						settings.password,
						'@',
						settings.hostname,
						':',
						settings.port,
						'/',
						settings.database
					].join('');

var sequelize = new Sequelize(connectionString, {
	logging: false,
	define : {
			timestamps : true,
			freezeTableName : true,
			schema : settings.schema,
			searchPath : settings.schema,
			createdAt : 'created',
			updatedAt : 'modified',
			paranoid : true
	}
});

var Users = sequelize.define('users', {
	id : {
		type : Sequelize.INTEGER,
		allowNull : false,
		primaryKey: true,
		autoIncrement: true
	}, username : {
		type : Sequelize.STRING,
		unique : true,
		allowNull : false,
		validate : {
			isAlphanumeric : true,
			len : [1, 25]
		}
	}, saltedpw : {
		type : Sequelize.STRING,
		allowNull : false
	}, dob : {
		type : Sequelize.DATE,
		allowNull : false,
		validate : {
			isDate : true,
			//isBefore : new Date(Date.now - (1000 * 60 * 60 * 24 * 365 * 10)) //older or equal to than 10 years
			//isAfter : new Date(Date.now - (1000 * 60 * 60 * 24 * 365 * 18)) //younger than 18 years
		}
	}
});

var Sessions = sequelize.define('sessions', {
	id : {
		type : Sequelize.INTEGER,
		allowNull : false,
		primaryKey: true,
		autoIncrement: true
	}, user_id : {
		type : Sequelize.INTEGER,
		allowNull : false
	}, start_time : {
		type : Sequelize.DATE,
		allowNull : false
	}, end_time : {
		type : Sequelize.DATE,
		allowNull : true
	}
}, {
	validate : {
		endTimeAfterStartTime : function(){
			if(this.end_time){
				if(new Date(this.start_time).getTime() > new Date(this.end_time).getTime()){
					throw new Error('Start time is after end time!');
				}
			}
		}
	}
});

var Plays = sequelize.define('plays', {
	id : {
		type : Sequelize.INTEGER,
		allowNull : false,
		primaryKey: true,
		autoIncrement: true
	}, user_id : {
		type : Sequelize.INTEGER,
		allowNull : false
	}, game_id : {
		type : Sequelize.INTEGER,
		allowNull : false,
	}, start_time : {
		type : Sequelize.DATE,
		allowNull : false
	}, end_time : {
		type : Sequelize.DATE,
		allowNull : true
	}, score : {
		type : Sequelize.INTEGER,
		allowNull : false,
		validate : {
			isInt : true
		}
	}
}, {
	validate : {
		endTimeAfterStartTime : function(){
			if(this.end_time){
				if(new Date(this.start_time).getTime() > new Date(this.end_time).getTime()){
					throw new Error('Start time is after end time!');
				}
			}
		}
	}
});

var UserConditions = sequelize.define('user_conditions', {
	id : {
		type : Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	}, user_id : {
		type : Sequelize.INTEGER,
		allowNull : false
	}, condition_id : {
		type : Sequelize.INTEGER,
		allowNull : false
	}, active : {
		type : Sequelize.BOOLEAN,
		allowNull : false
	}
});

var UserInventory = sequelize.define('user_inventory', {
	id : {
		type : Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	}, user_id : {
		type : Sequelize.INTEGER,
		allowNull : false
	}, item_id : {
		type : Sequelize.INTEGER,
		allowNull : false
	}, active : {
		type : Sequelize.BOOLEAN,
		allowNull : false
	}
});

var UserEquipped = sequelize.define('user_equipped', {
	id : {
		type : Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	}, user_id : {
		type : Sequelize.INTEGER,
		allowNull : false
	}, head : {
		type : Sequelize.STRING,
		allowNull : true
	}, eyes : {
		type : Sequelize.STRING,
		allowNull : true
	}, skin : {
		type : Sequelize.STRING,
		allowNull : true
	}, shirt : {
		type : Sequelize.STRING,
		allowNull : true
	}, trousers : {
		type : Sequelize.STRING,
		allowNull : true
	}, tree : {
		type : Sequelize.STRING,
		allowNull : true
	}, swing : {
		type : Sequelize.STRING,
		allowNull : true
	}, house : {
		type : Sequelize.STRING,
		allowNull : true
	}, garden : {
		type : Sequelize.STRING,
		allowNull : true
	}, stairs : {
		type : Sequelize.STRING,
		allowNull : true
	}, trophy : {
		type : Sequelize.STRING,
		allowNull : true
	}, mirror : {
		type : Sequelize.STRING,
		allowNull : true
	}, tv : {
		type : Sequelize.STRING,
		allowNull : true
	}, desk : {
		type : Sequelize.STRING,
		allowNull : true
	}, laptop : {
		type : Sequelize.STRING,
		allowNull : true
	}, sofa : {
		type : Sequelize.STRING,
		allowNull : true
	}, backpack : {
		type : Sequelize.STRING,
		allowNull : true
	}, paint : {
		type : Sequelize.STRING,
		allowNull : true
	}, path : {
		type : Sequelize.STRING,
		allowNull : true
	}
});

var UserCurrency = sequelize.define('user_currency', {
	id : {
		type : Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	}, user_id : {
		type : Sequelize.INTEGER,
		allowNull : false
	}, currency : {
		type : Sequelize.INTEGER,
		allowNull : false,
		validate : {
			isInt : true,
			min : 0
		}
	}
});

Sessions.belongsTo(Users, {foreignKey: 'user_id', targetKey: 'id'});
Users.hasMany(Sessions, {foreignKey : 'user_id'});

Plays.belongsTo(Users, {foreignKey: 'user_id', targetKey: 'id'});
Users.hasMany(Plays, {foreignKey : 'user_id'});

UserConditions.belongsTo(Users, {foreignKey: 'user_id', targetKey: 'id'});
Users.hasMany(UserConditions, {foreignKey : 'user_id'});

UserInventory.belongsTo(Users, {foreignKey: 'user_id', targetKey: 'id'});
Users.hasMany(UserInventory, {foreignKey : 'user_id'});

UserEquipped.belongsTo(Users, {foreignKey: 'user_id', targetKey: 'id'});
Users.hasMany(UserEquipped, {foreignKey : 'user_id'});

UserCurrency.belongsTo(Users, {foreignKey: 'user_id', targetKey: 'id'});
Users.hasMany(UserCurrency, {foreignKey : 'user_id'});

var syncPromise = sequelize.sync({ force : false });

var returnValue = {
	Users : Users,
	Sessions : Sessions,
	Plays : Plays,
	UserConditions : UserConditions,
	UserInventory : UserInventory,
	UserEquipped : UserEquipped,
	UserCurrency : UserCurrency,
	sequelize : sequelize,
	syncPromise : syncPromise
};

return returnValue;

};