echo "Build script for Iguana application for Windows platform."
echo "Preparing electron package $VERSION" && \
electron-packager . --platform=win32 --arch=all 
  --icon=assets/icons/iguana_app_icon.ico 
  --out=build/ --buildVersion=VERSION_NUMBER_HERE 
  --ignore=assets/bin/osx --ignore=assets/bin/linux64 --overwrite || \
echo "Did you call script with VERSION variable?"