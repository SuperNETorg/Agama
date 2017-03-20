echo "Build script for Iguana application for MacOS platform."
echo "Preparing electron package $IGUANA_VERSION" && \
electron-packager . --platform=darwin --arch=x64 \
  --icon=assets/icons/iguana_app_icon.icns \
  --out=build/ --buildVersion=$IGUANA_VERSION \
  --ignore=assets/bin/win64 --ignore=assets/bin/linux64 --overwrite || \
echo "PROBLEM: Did you call script with IGUANA_VERSION variable?"