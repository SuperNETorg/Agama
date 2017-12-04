#!/bin/bash
### Build script for Iguana application for Windows x64 platform.
### Created by mmaxian, 3/2017

[ -z $AGAMA_VERSION ] && echo "AGAMA_VERSION variable is not set." && exit 0
[ ! -d build ] && mkdir build

echo
echo "Build script for Iguana application for Windows x64 platform."
echo "Preparing electron package $AGAMA_VERSION"

electron-packager . --platform=win32 \
  --arch=ia32 \
  --icon=assets/icons/agama_app_icon.ico \
  --out=build/ \
  --buildVersion=$AGAMA_VERSION \
  --ignore=assets/bin/osx \
  --ignore=assets/bin/linux64 \
  --ignore=react/node_modules \
  --ignore=react/src \
  --ignore=react/www \
  --overwrite \
  --version-string.CompanyName="SuperNET" \
  --version-string.FileDescription="Agama" \
  --version-string.OriginalFilename="Agama" \
  --version-string.ProductName="Agama" \
  --version-string.InternalName="Agama" \
  --app-copyright="Copyright (C) 2017 SuperNET. All rights reserved."
