DROP SCHEMA IF EXISTS "{schema}" CASCADE;

CREATE SCHEMA "{schema}";

CREATE OR REPLACE FUNCTION "{schema}".update_modified_column()	
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified = now();
    RETURN NEW;	
END;
$$ language 'plpgsql';

-- users
CREATE TABLE "{schema}".users
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
	BEFORE UPDATE ON "{schema}".users
	FOR EACH ROW 
EXECUTE PROCEDURE "{schema}".update_modified_column();

-- sessions
CREATE TABLE "{schema}".sessions
( id				serial		NOT NULL
, user_id			integer 	NOT NULL REFERENCES "{schema}".users(id)
, start_time		timestamp	NOT NULL
, end_time			timestamp	NULL
, created 			timestamp   NOT NULL DEFAULT current_timestamp
, modified 			timestamp 	NOT NULL DEFAULT current_timestamp
, PRIMARY KEY(id)
);

CREATE TRIGGER update_session_modified_ts 
	BEFORE UPDATE ON "{schema}".sessions
	FOR EACH ROW 
EXECUTE PROCEDURE "{schema}".update_modified_column();

-- plays
CREATE TABLE "{schema}".plays
( id 				serial		NOT NULL
, user_id			integer 	NOT NULL REFERENCES "{schema}".users(id)
, game_id		  	text    	NOT NULL
, start_time		timestamp	NOT NULL
, end_time			timestamp	NOT NULL
, score				bigint		NOT NULL
, created			timestamp 	NOT NULL DEFAULT current_timestamp
, PRIMARY KEY(id)
);

-- conditions
CREATE TABLE "{schema}".user_conditions
( id				serial		NOT NULL
, user_id			integer 	NOT NULL REFERENCES "{schema}".users(id)
, condition_id 		text 		NOT NULL
, active			boolean		NOT NULL
, created			timestamp   NOT NULL DEFAULT current_timestamp
, PRIMARY KEY(id)
);

-- inventory
CREATE TABLE "{schema}".user_inventory
( id				serial		NOT NULL
, user_id			integer 	NOT NULL REFERENCES "{schema}".users(id)
, item_id	 		text 		NOT NULL
, active			boolean		NOT NULL
, created			timestamp   NOT NULL DEFAULT current_timestamp
, PRIMARY KEY(id)
);

-- equipped
CREATE TABLE "{schema}".user_equipped
( id 				serial 		NOT NULL
, user_id			integer 	NOT NULL REFERENCES "{schema}".users(id)
, created			timestamp   NOT NULL DEFAULT current_timestamp
, head 				text		NULL
, eyes				text		NULL
, skin				text		NULL
, shirt				text		NULL
, tree              text        NULL
, swing             text        NULL
, house             text        NULL
, garden            text        NULL
, stairs            text        NULL
, trophy            text        NULL
, mirror            text        NULL
, tv                text        NULL
, desk              text        NULL
, laptop            text        NULL
, sofa              text        NULL
, backpack          text        NULL
, paint             text        NULL
, path              text        NULL
, PRIMARY KEY(id)
);
