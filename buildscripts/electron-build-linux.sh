#!/bin/bash
### Build script for Iguana application for Linux x32 and x64 platform.
### Created by mmaxian, 3/2017

[ -z $IGUANA_VERSION ] && echo "IGUANA_VERSION variable is not set." && exit 0

echo "Build script for Iguana application for Linux x32 and x64 platform."
echo "Preparing electron package $IGUANA_VERSION" && \ 
electron-packager . --platform=linux --arch=x32 \
  --icon=assets/icons/iguana_app_icon_png/128x128.png \
  --out=build/ --buildVersion=$IGUANA_VERSION \
  --ignore=assets/bin/win64 --ignore=assets/bin/osx --overwrite && \
electron-packager . --platform=linux --arch=x64 \
  --icon=assets/icons/iguana_app_icon_png/128x128.png \
  --out=build/ --buildVersion=$IGUANA_VERSION \
  --ignore=assets/bin/win64 --ignore=assets/bin/osx --overwrite || \
echo "PROBLEM: Did you call script with IGUANA_VERSION variable?"