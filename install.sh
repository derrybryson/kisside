#!/bin/bash
INSTDIR="/usr/share/kisside"
WWWDIR="$INSTDIR/www"
DATAFILE="data/kiss.sqlite"
SCHEMAFILE="data/schema.sql"
PASSWDFILE="accesspw"
UPLOADTMPDIR="/usr/lib/kisside/tmp"

set -e
echo "Building KISSIDE..."
./generate.py build > build.log 2>&1

echo "Installing files..."
install -d -m 0755 $INSTDIR $WWWDIR $UPLOADTMPDIR
chown www-data:www-data $UPLOADTMPDIR
pushd build > /dev/null
rm $DATAFILE
rm api/config.php
cp -r . $WWWDIR
popd > /dev/null
cp LICENSE $INSTDIR

if [ ! -f $WWWDIR/api/config.php ] ; then
  cp $WWWDIR/api/config.php.default $WWWDIR/api/config.php 
fi

if [ ! -f $WWWDIR/$DATAFILE ] ; then
  sqlite3 $WWWDIR/$DATAFILE < $WWWDIR/$SCHEMAFILE
  echo
  echo "KISSIDE Administrator Account"
  read -e -p "Administrator Username: " adminuser
  read -e -s -p "Administrator Password: " adminpasswd
  echo "Adding admin user..."
  pushd $WWWDIR/api > /dev/null
  php adduser.php "$adminuser" "$adminpasswd"
  popd > /dev/null
fi
chown -R www-data:www-data $WWWDIR/data

if [ ! -f $INSTDIR/$PASSWDFILE ] ; then
  echo
  echo "HTTP Authentication"
  read -e -p "Username: " authusername
  read -e -s -p "Password: " authpassword
  htpasswd -c -b -B $INSTDIR/$PASSWDFILE "$authusername" "$authpassword"
fi

if [ ! -f /etc/apache2/conf-available/kisside.conf ] ; then
  install -m 0644 apache2/kisside.conf /etc/apache2/conf-available
  ln -s /etc/apache2/conf-available/kisside.conf /etc/apache2/conf-enabled
fi

echo 
echo "Installation complete"
echo
echo "You must restart Apache before KISSIDE will be availble at:"
echo
echo "  http://yourhost.com/kisside"
