var Sequelize = require("sequelize");

module.exports = function(resync){	

var sequelize = new Sequelize('postgres://suser:UUmtEAstuwsy4Bhs@127.0.0.1:5432/sgames', {
	logging: false,
	define : {
			timestamps : true,
			freezeTableName : true,
			schema : "sschema",
			createdAt : "created",
			updatedAt : "modified",
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
		allowNull : false
	}, saltedpw : {
		type : Sequelize.STRING,
		allowNull : false
	}, dob : {
		type : Sequelize.DATE,
		allowNull : false
	}, currency : {
		type : Sequelize.INTEGER,
		allowNull : false,
		defaultValue : 0
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
		allowNull : false
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

var returnValue = {
	Users : Users,
	Sessions : Sessions,
	Plays : Plays,
	UserConditions : UserConditions,
	UserInventory : UserInventory,
	UserEquipped : UserEquipped,
	sequelize : sequelize
};

sequelize.sync({ force : !!resync }).then(function(){
	if(!!resync){
		console.log("Database rebuilt");
		process.exit(0);
	}
});

return returnValue;

};