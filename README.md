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

To build the production ready app, install `electron-packager` and `electron-prebuilt` packages from npm
```shell
npm install electron-packager -g
npm install electron-prebuilt -g
```

#### **Build the Wallet-App**
Refer to the original [electron-packager](https://github.com/electron-userland/electron-packager) repository for more detailed information.

##### Linux
Change directory to iguana and execute the following command to build the Linux app
```shell
cd iguana
electron-packager . --platform=linux --arch=x64 --out=build/
```
change architecture build parameter to ```--arch=x32``` for 32 bit build

##### OSX
Change directory to iguana and execute the following command to build the OSX app
```shell
cd iguana
electron-packager . --platform=darwin --arch=x64 --icon=assets/icons/iguana_app_icon.icns --out=build/
```

##### Windows
Change directory to iguana and execute the following command to build the Windows app
```shell
dir iguana
electron-packager . --platform=win32 --arch=x64 --icon=assets/icons/iguana_app_icon.ico --out=build/
```
change architecture build parameter to ```--arch=x64``` for 64 bit build


## Troubleshooting Instructions

### Windows DLL issues
On Windows it's noticed iguana.exe complains about `VCRUNTIME140D.DLL` and `ucrtbased.dll` file.

Please see **windeps** directory and README file for instructions to install the required DLL files on Windows, and then try again running Iguana App.