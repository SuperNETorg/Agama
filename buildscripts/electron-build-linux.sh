#!/bin/bash
### Build script for Iguana application for Linux x64 platform.
### Created by mmaxian, 3/2017

[ -z $AGAMA_VERSION ] && echo "AGAMA_VERSION variable is not set." && exit 0
[ ! -d build ] && mkdir build

echo
echo "Build script for Iguana application for Linux x64 platform."
echo "Preparing electron package $AGAMA_VERSION"

electron-packager . --platform=linux --arch=x64 \
  --icon=assets/icons/agama_icons/128x128.png \
  --out=build/ \
  --buildVersion=$AGAMA_VERSION \
  --ignore=assets/bin/win64 \
  --ignore=assets/bin/osx \
  --ignore=react/node_modules \
  --ignore=react/src \
  --ignore=react/www \
  --overwrite
