DROP SCHEMA IF EXISTS "sschema" CASCADE;

CREATE SCHEMA "sschema";

CREATE OR REPLACE FUNCTION "sschema".update_modified_column()	
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified = now();
    RETURN NEW;	
END;
$$ language 'plpgsql';

-- users
CREATE TABLE "sschema".users
( id 				serial		NOT NULL
, username		  	text    	NOT NULL UNIQUE
, saltedpw		 	text    	NOT NULL
, dob			  	date    	NOT NULL
, currency			bigint		NOT NULL DEFAULT 0
, created 			timestamp   NOT NULL DEFAULT current_timestamp
, modified			timestamp 	NOT NULL DEFAULT current_timestamp
, PRIMARY KEY(id)
);

CREATE TRIGGER update_user_modified_ts 
	BEFORE UPDATE ON "sschema".users
	FOR EACH ROW 
EXECUTE PROCEDURE "sschema".update_modified_column();

-- sessions
CREATE TABLE "sschema".sessions
( id				serial		NOT NULL
, user_id			integer 	NOT NULL REFERENCES "sschema".users(id)
, start_time		timestamp	NOT NULL
, end_time			timestamp	NULL
, created 			timestamp   NOT NULL DEFAULT current_timestamp
, modified 			timestamp 	NOT NULL DEFAULT current_timestamp
, PRIMARY KEY(id)
);

CREATE TRIGGER update_session_modified_ts 
	BEFORE UPDATE ON "sschema".sessions
	FOR EACH ROW 
EXECUTE PROCEDURE "sschema".update_modified_column();

-- plays
CREATE TABLE "sschema".plays
( id 				serial		NOT NULL
, user_id			integer 	NOT NULL REFERENCES "sschema".users(id)
, game_id		  	text    	NOT NULL
, start_time		timestamp	NOT NULL
, end_time			timestamp	NOT NULL
, score				bigint		NOT NULL
, created			timestamp 	NOT NULL DEFAULT current_timestamp
, PRIMARY KEY(id)
);

-- conditions
CREATE TABLE "sschema".user_conditions
( id				serial		NOT NULL
, user_id			integer 	NOT NULL REFERENCES "sschema".users(id)
, condition_id 		text 		NOT NULL
, active			boolean		NOT NULL
, created			timestamp   NOT NULL DEFAULT current_timestamp
, PRIMARY KEY(id)
);

-- inventory
CREATE TABLE "sschema".user_inventory
( id				serial		NOT NULL
, user_id			integer 	NOT NULL REFERENCES "sschema".users(id)
, item_id	 		text 		NOT NULL
, active			boolean		NOT NULL
, created			timestamp   NOT NULL DEFAULT current_timestamp
, PRIMARY KEY(id)
);

-- equipped
CREATE TABLE "sschema".user_equipped
( id 				serial 		NOT NULL
, user_id			integer 	NOT NULL REFERENCES "sschema".users(id)
, created			timestamp   NOT NULL DEFAULT current_timestamp
, head 				text		NULL
, eyes				text		NULL
, skin				text		NULL
, shirt				text		NULL
, PRIMARY KEY(id)
);