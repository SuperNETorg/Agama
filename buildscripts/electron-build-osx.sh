#!/bin/bash
### Build script for Iguana application for MacOS platform.
### Created by mmaxian, 3/2017

[ -z $AGAMA_VERSION ] && echo "AGAMA_VERSION variable is not set." && exit 0

echo
echo =========================================
echo Step: Removing old binaries
cd build
rm -rvf artifacts.supernet.org
echo
echo Step: Cloning latest binaries for build
wget --recursive --no-parent https://artifacts.supernet.org/latest/osx/
cd ..
echo =========================================
echo

echo "Build script for Iguana application for MacOS platform."
echo "Preparing electron package $AGAMA_VERSION"

electron-packager . --platform=darwin --arch=x64 \
  --icon=assets/icons/iguana_app_icon.icns \
  --out=build/ --buildVersion=$AGAMA_VERSION \
  --ignore=build/artifacts.supernet.org/latest/windows \
  --ignore=build/artifacts.supernet.org/latest/linux \
  --overwrite