cd gui/EasyDEX-GUI/react
echo "building gui..."
rm -rf ./build
mkdir build
mkdir build/assets
cp -R src/assets build/
./node_modules/.bin/webpack --config ./webpack.prod.config.js
cd ../../../
echo "copy patch files"
rm -rf ./patch.zip
rm -rf ./patch
mkdir patch
mkdir patch/gui
mkdir patch/gui/EasyDEX-GUI
cp -R gui/EasyDEX-GUI/react/build patch/gui/EasyDEX-GUI/react
cp -R gui/EasyDEX-GUI/assets patch/gui/EasyDEX-GUI
cp gui/index.html patch/gui/index.html
cp ./main.js patch
cp ./version patch
cp -R routes patch/routes
cp -R private patch/private
echo "package patch.zip"
cd patch
zip -r patch.zip gui routes private main.js version
cd ../
cp patch/patch.zip ./
rm -rf patch
echo "patch.zip is ready"