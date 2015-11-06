#!/bin/bash
# change working directory to location of the script
cd "$(dirname "$0")"

#Arguments check
if [ $# -ne 1 ];
then
  echo "./rebuildDB.sh <env_name>"
  exit -78
fi

env_name=$1
ini_location='./.server_settings'

echo "INI file: "$ini_location
printf "\n**************************\n\n"

echo "Retrieving values from ini file"
. ./read_ini.sh
read_ini $ini_location $env_name

ini_prefix="INI__"$env_name"__"
lastval=""
getvar() {
  local varvar=$ini_prefix$1
  lastval=${!varvar}
}
getvar "hostname"
hostname=$lastval
getvar "username"
username=$lastval
getvar "password"
password=$lastval
getvar "database"
database=$lastval
getvar "schema"
schema=$lastval

echo "INI file values:"
echo -e "hostname  \"$hostname\""
echo -e "username  \"$username\""
echo -e "password  HIDDEN"
echo -e "database  \"$database\""
echo -e "schema    \"$schema\""


printf "\n**************************\n\n"

echo -e "Creating Build Script\n"

#Copies the skeleton into the new file
#Forces the overwrite when the file already exists
cp -f ./schema.sql ./build.sql

#Replaces all {schema} to be wanted schema
sed -i -e "s/{schema}/${schema}/g" ./build.sql

echo $?

echo -e "\nBuild Script Created"

printf "\n**************************\n\n"

echo "Running build script on schema:"
export PGPASSWORD=${password}
psql -q -h ${hostname} -U ${username} -d ${database} -c '\i ./build.sql'
export PGPASSWORD=foo

printf "\n**************************\n\n"

echo "Tidying up"
rm ./build.sql

printf "\n**************************\n\n"

echo "Done"
