echo "Build script for Iguana application for MacOS platform."
echo "Preparing electron package $VERSION" && \
electron-packager . --platform=darwin --arch=x64 \
  --icon=assets/icons/iguana_app_icon.icns \
  --out=build/ --buildVersion=VERSION_NUMBER_HERE \
  --ignore=assets/bin/win64 --ignore=assets/bin/linux64 --overwrite || \
echo "Did you call script with VERSION variable?"