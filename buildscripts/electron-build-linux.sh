#!/bin/bash
### Build script for Iguana application for Linux x64 platform.
### Created by mmaxian, 3/2017

[ -z $AGAMA_VERSION ] && echo "AGAMA_VERSION variable is not set." && exit 0

echo
echo =========================================
echo Step: Removing old binaries
rm -rvf artifacts.supernet.org
echo
echo Step: Cloning latest binaries for build
wget --recursive --no-parent -q https://artifacts.supernet.org/latest/linux/
find artifacts.supernet.org -exec ls -l {} \;
cd ..
echo =========================================
echo

echo "Build script for Iguana application for Linux x64 platform."
echo "Preparing electron package $AGAMA_VERSION" 

electron-packager . --platform=linux --arch=x64 \
  --icon=assets/icons/iguana_app_icon_png/128x128.png \
  --out=build/ --buildVersion=$AGAMA_VERSION \
  --ignore=build/artifacts.supernet.org/latest/windows \
  --ignore=build/artifacts.supernet.org/latest/osx \
  --overwrite 