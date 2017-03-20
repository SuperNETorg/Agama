echo "Build script for Iguana application for Linux platform."
echo "Preparing electron package $VERSION" && \
electron-packager . --platform=linux --arch=x64 \
  --icon=assets/icons/iguana_app_icon_png/128x128.png \
  --out=build/ --buildVersion=$VERSION \
  --ignore=assets/bin/win64 --ignore=assets/bin/osx --overwrite || \
echo "Did you call script with VERSION variable?"