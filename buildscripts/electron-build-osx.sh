#!/bin/bash
### Build script for Iguana application for MacOS platform.
### Created by mmaxian, 3/2017

[ -z $IGUANA_VERSION ] && echo "IGUANA_VERSION variable is not set." && exit 0

echo "Build script for Iguana application for MacOS platform."
echo "Preparing electron package $IGUANA_VERSION"
electron-packager . --platform=darwin --arch=x64 \
  --icon=assets/icons/iguana_app_icon.icns \
  --out=build/ --buildVersion=$IGUANA_VERSION \
  --ignore=assets/bin/win64 --ignore=assets/bin/linux64 --overwrite