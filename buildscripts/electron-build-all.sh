#!/bin/bash
### Build script for Iguana application for Linux x32 and x64 platform.
### Created by mmaxian, 3/2017

[ -z $IGUANA_VERSION ] && echo "IGUANA_VERSION variable is not set." && exit 0

echo "Preparing electron package $IGUANA_VERSION for Linux." 
./buildscripts/electron-build-linux.sh
echo

echo "Preparing electron package $IGUANA_VERSION for Windows."  
./buildscripts/electron-build-win.sh 
echo

echo "Preparing electron package $IGUANA_VERSION for MacOS." 
./buildscripts/electron-build-osx.sh 
echo