#!/bin/bash
./build.sh
[ -d kissideinst ] || mkdir kissideinst
rm -rf kissideinst/*
mkdir kissideinst/www
cp -R build/* kissideinst/www
mkdir kissideinst/apache2
cp -R apache2/* kissideinst/apache2
cp setup.sh kissideinst
cp LICENSE kissideinst
tar cvzf /tmp/kissideinst.tgz kissideinst
./tarinst.sh /tmp/kissideinst.tgz ../kissideinst.sh
rm /tmp/kissideinst.tgz


