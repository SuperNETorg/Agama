#!/bin/bash
### Build script for Iguana application for Windows x64 platform.
### Created by mmaxian, 3/2017

[ -z $AGAMA_VERSION ] && echo "AGAMA_VERSION variable is not set." && exit 0
[ ! -d build ] && mkdir build

echo
echo "Build script for Iguana application for Windows x64 platform."
echo "Preparing electron package $AGAMA_VERSION" 

electron-packager . --platform=win32 --arch=ia32 \
  --icon=assets/icons/iguana_app_icon.ico \
  --out=build/ --buildVersion=$AGAMA_VERSION \
  --ignore=assets/artifacts.supernet.org/latest/osx \
  --ignore=assets/artifacts.supernet.org/latest/linux \
  --overwrite 
