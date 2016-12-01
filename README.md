# Iguana Desktop App
Desktop App for SuperNET DAPPs

#### For Developers
You must have `node.js` and `npm` installed on your machine.

Clone Iguana Desktop App
```shell
git clone https://github.com/SuperNETorg/iguana.git
```

Please clone EasyDEX-GUI from github repo here.
```shell
mkdir gui
cd gui
git clone https://github.com/SuperNETorg/EasyDEX-GUI.git
```

Install Iguana App
```shell
cd iguana
npm install
```

Then start Iguana App
```shell
npm start
```


#### For end users
The instructions to make production build of Iguana App will be updated soon.

To make production ready app, install `electron-packager` and `electron-prebuilt` packages from npm
```shell
npm install electron-packager -g
npm install electron-prebuilt -g
```

Change directory to iguana and execute following command to build OSX App
```shell
cd iguana
electron-packager . --platform=darwin --arch=x64 --icon=assets/icons/komodo.icns --out=build/
```