# DabVault Desktop App
Desktop App for SuperNET DAPPs

#### For Developers
You must have `node.js` and `npm` installed on your machine.

Clone DabVault Desktop App with DabVault-GUI submodule
```
git clone --recursive https://github.com/dabsolutions/DabVault.git
cd DabVault/gui/EasyDEX-GUI && git checkout master && cd ../../
=======
1) git clone https://github.com/supernetorg/agama --recursive --branch pkg_automation_electrum --single-branch
with this command you git clone agama - but explicitly just the pkg_automation_electrum branch (therefore --single-branch) which we also use for the release packages.
2) cd agama && cd gui/EasyDEX-GUI/
3) git checkout electrum && git pull origin electrum
4) npm install && npm install webpack
5) ./binary_artifacts.sh
6) npm start in projects' root folder
7) cd gui/EasyDEX-GUI/react/src
8) npm start
8) toggle dev and debug options in settings
9) restart the app
10) sync komodod and/or asset chains

You're ready to dev
```

Install & Run Dabvault
```
npm install
npm start
```

### Important dev notes

#### Sockets.io
In dev mode backend is configured to send/receive messages from/to http://127.0.0.1:3000 address. If you open it as http://localhost:3000 sockets server will reject any messages.

#### Coin daemon binaries
Run binary_artifacts.sh from under agama folder you cloned previously. The script will fetch

#### For end users
The instructions to make production build of DabVault App will be updated soon.

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
electron-packager . --platform=linux --arch=x64 --icon=assets/icons/agama_icons/128x128.png --out=build/ --buildVersion=VERSION_NUMBER_HERE --ignore=assets/bin/win64 --ignore=assets/bin/osx --overwrite
```
change architecture build parameter to ```--arch=x32``` for 32 bit build

##### OSX
Change directory to iguana and execute the following command to build the OSX app
```shell
cd iguana
electron-packager . --platform=darwin --arch=x64 --icon=assets/icons/agama_icons/agama_app_icon.icns --out=build/ --buildVersion=VERSION_NUMBER_HERE --ignore=assets/bin/win64 --ignore=assets/bin/linux64 --overwrite
```

##### Windows
Change directory to iguana and execute the following command to build the Windows app
```shell
dir iguana
electron-packager . --platform=win32 --arch=x64 --icon=assets/icons/agama_icons/agama_app_icon.ico --out=build/ --buildVersion=VERSION_NUMBER_HERE --ignore=assets/bin/osx --ignore=assets/bin/linux64 --overwrite

# If generating 32bit desktop package
electron-packager . --platform=win32 --arch=ia32 --icon=assets/icons/agama_icons/agama_app_icon.ico --out=build/ --buildVersion=VERSION_NUMBER_HERE --ignore=assets/bin/osx --ignore=assets/bin/linux64 --overwrite

# To build both x64 and x86 desktop package
electron-packager . --platform=win32 --arch=all --icon=assets/icons/agama_icons/agama_app_icon.ico --out=build/ --buildVersion=VERSION_NUMBER_HERE --ignore=assets/bin/osx --ignore=assets/bin/linux64 --overwrite
```
change architecture build parameter to ```--arch=x64``` for 64 bit build


## Troubleshooting Instructions

### Windows DLL issues
On Windows it's noticed iguana.exe complains about `VCRUNTIME140D.DLL` and `ucrtbased.dll` file.

Please see **windeps** directory and README file for instructions to install the required DLL files on Windows, and then try again running DabVault App.
