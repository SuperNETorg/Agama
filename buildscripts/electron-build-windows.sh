#!/bin/bash
### Build script for Iguana application for Windows x64 platform.
### Created by mmaxian, 3/2017

[ -z $AGAMA_VERSION ] && echo "AGAMA_VERSION variable is not set." && exit 0

echo
echo =========================================
echo Step: Removing old binaries
rm -rvf artifacts.supernet.org
echo
echo Step: Cloning latest binaries for build
wget --recursive --no-parent -q https://artifacts.supernet.org/latest/windows/
find artifacts.supernet.org/latest/windows/ -exec ls -l {} \;
cd ..
echo =========================================
echo

echo "Build script for Iguana application for Windows x64 platform."
echo "Preparing electron package $AGAMA_VERSION"

electron-packager . --platform=win32 \
  --arch=ia32 \
  --icon=assets/icons/agama_app_icon.ico \
  --out=build \
  --buildVersion=$AGAMA_VERSION \
  --ignore=build/artifacts.supernet.org/latest/osx \
  --ignore=build/artifacts.supernet.org/latest/linux \
  --overwrite \
  --version-string.CompanyName="SuperNET" \
  --version-string.FileDescription="Agama" \
  --version-string.OriginalFilename="Agama" \
  --version-string.ProductName="Agama" \
  --version-string.InternalName="Agama" \
  --app-copyright="Copyright (C) 2017 SuperNET. All rights reserved."