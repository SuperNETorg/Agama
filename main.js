// main proc for Agama
// this app spawns iguana in background in nontech-mode

const electron = require('electron'),
			app = electron.app,
			BrowserWindow = electron.BrowserWindow,
			path = require('path'),
			url = require('url'),
			os = require('os'),
			md5 = require('./routes/md5.js'),
			{ Menu } = require('electron'),
			portscanner = require('portscanner'),
			osPlatform = os.platform(),
			fixPath = require('fix-path');

var express = require('express'),
		bodyParser = require('body-parser'),
		fs = require('fs'),
		fsnode = require('fs'),
		fs = require('fs-extra'),
		numCPUs = require('os').cpus().length;

Promise = require('bluebird');

if (osPlatform === 'linux') {
	process.env.ELECTRON_RUN_AS_NODE = true;
}

// GUI APP settings and starting gui on address http://120.0.0.1:17777
var shepherd = require('./routes/shepherd');
var guiapp = express();
var appConfig = shepherd.loadLocalConfig(); // load app config

const nativeCoindList = shepherd.scanNativeCoindBins();
shepherd.setVar('nativeCoindList', nativeCoindList);

let localVersion;
let localVersionFile = shepherd.readVersionFile();

if (localVersionFile.indexOf('\r\n') > -1) {
  localVersion = localVersionFile.split('\r\n');
} else {
  localVersion = localVersionFile.split('\n');
}

const appBasicInfo = {
	name: 'Agama',
	version: localVersion[0],
};

app.setName(appBasicInfo.name);
app.setVersion(appBasicInfo.version);

shepherd.binFixRights();
shepherd.createAgamaDirs();

const appSessionHash = md5(Date.now().toString());

shepherd.writeLog(`app init ${appSessionHash}`);
shepherd.writeLog(`app info: ${appBasicInfo.name} ${appBasicInfo.version}`);
shepherd.writeLog('sys info:');
shepherd.writeLog(`totalmem_readable: ${formatBytes(os.totalmem())}`);
shepherd.writeLog(`arch: ${os.arch()}`);
shepherd.writeLog(`cpu: ${os.cpus()[0].model}`);
shepherd.writeLog(`cpu_cores: ${os.cpus().length}`);
shepherd.writeLog(`platform: ${osPlatform}`);
shepherd.writeLog(`os_release: ${os.release()}`);
shepherd.writeLog(`os_type: ${os.type()}`);

shepherd.log(`app init ${appSessionHash}`);
shepherd.log(`app info: ${appBasicInfo.name} ${appBasicInfo.version}`);
shepherd.log('sys info:');
shepherd.log(`totalmem_readable: ${formatBytes(os.totalmem())}`);
shepherd.log(`arch: ${os.arch()}`);
shepherd.log(`cpu: ${os.cpus()[0].model}`);
shepherd.log(`cpu_cores: ${os.cpus().length}`);
shepherd.log(`platform: ${osPlatform}`);
shepherd.log(`os_release: ${os.release()}`);
shepherd.log(`os_type: ${os.type()}`);

appConfig['daemonOutput'] = false; // shadow setting

let __defaultAppSettings = require('./routes/appConfig.js').config;
__defaultAppSettings['daemonOutput'] = false; // shadow setting
const _defaultAppSettings = __defaultAppSettings;

shepherd.log(`app started in ${(appConfig.dev ? 'dev mode' : ' user mode')}`);
shepherd.writeLog(`app started in ${(appConfig.dev ? 'dev mode' : ' user mode')}`);

shepherd.setConfKMD();
shepherd.setConfKMD('CHIPS');

guiapp.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', appConfig.dev ? '*' : 'http://127.0.0.1:3000');
	res.header('Access-Control-Allow-Headers', 'X-Requested-With');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
	next();
});

// preload.js
const _setImmediate = setImmediate;
const _clearImmediate = clearImmediate;

process.once('loaded', () => {
	global.setImmediate = _setImmediate;
	global.clearImmediate = _clearImmediate;

	if (osPlatform === 'darwin') {
		process.setFdLimit(appConfig.maxDescriptors.darwin);
		app.setAboutPanelOptions({
			applicationName: app.getName(),
			applicationVersion: `app.getVersion().replace('version=', '')}-beta`,
			copyright: 'Released under the MIT license',
			credits: 'SuperNET Team'
		})
	}
	if (osPlatform === 'linux') {
		process.setFdLimit(appConfig.maxDescriptors.linux);
	}
});

// silent errors
if (!appConfig.debug ||
		!appConfig.dev) {
	process.on('uncaughtException', (err) => {
	  shepherd.log(`${(new Date).toUTCString()} uncaughtException: ${err.message}`);
	  shepherd.log(err.stack);
	});
}

guiapp.use(bodyParser.json({ limit: '50mb' })); // support json encoded bodies
guiapp.use(bodyParser.urlencoded({
	limit: '50mb',
	extended: true,
})); // support encoded bodies

guiapp.get('/', function(req, res) {
	res.send('Agama app server');
});

const guipath = path.join(__dirname, '/gui');
guiapp.use('/gui', express.static(guipath));
guiapp.use('/shepherd', shepherd);

const server = require('http').createServer(guiapp);
const io = require('socket.io').listen(server);
let willQuitApp = false;
let mainWindow;
let loadingWindow;
let appCloseWindow;
let appSettingsWindow;
let closeAppAfterLoading = false;
let forceQuitApp = false;
const _zcashParamsExist = shepherd.zcashParamsExist();

module.exports = guiapp;
let agamaIcon;

if (os.platform() === 'linux') {
	agamaIcon = path.join(__dirname, '/assets/icons/agama_icons/128x128.png');
}
if (os.platform() === 'win32') {
	agamaIcon = path.join(__dirname, '/assets/icons/agama_app_icon.ico');
}

function createLoadingWindow() {
	mainWindow = null;

	// initialise window
	try {
		loadingWindow = new BrowserWindow({
			width: 500,
			height: 355,
			frame: false,
			icon: agamaIcon,
			show: false,
		});
	} catch(e) {}

	loadingWindow.setResizable(false);

	// check if agama is already running
	portscanner.checkPortStatus(appConfig.agamaPort, '127.0.0.1', function(error, status) {
		// Status is 'open' if currently in use or 'closed' if available
		if (status === 'closed') {
			server.listen(appConfig.agamaPort, function() {
				shepherd.log(`guiapp and sockets.io are listening on port ${appConfig.agamaPort}`);
				shepherd.writeLog(`guiapp and sockets.io are listening on port ${appConfig.agamaPort}`);
				// start sockets.io
				io.set('origins', appConfig.dev ? 'http://127.0.0.1:3000' : `http://127.0.0.1:${appConfig.agamaPort}`); // set origin

				/*io.on('connection', function(client) {
					shepherd.log('EDEX GUI is connected...');
					shepherd.writeLog('EDEX GUI is connected...');

					client.on('event', function(data) { // listen for client requests
						shepherd.log(data);
					});
					client.on('disconnect', function(data) {
						shepherd.log('EDEX GUI is disconnected');
					});
					client.on('join', function(data) {
						shepherd.log(data);
						client.emit('messages', 'Sockets server is listening');
					});
				});*/
			});
		} else {
			willQuitApp = true;
			server.listen(appConfig.agamaPort + 1, function() {
				shepherd.log(`guiapp and sockets.io are listening on port ${appConfig.agamaPort + 1}`);
				shepherd.writeLog(`guiapp and sockets.io are listening on port ${appConfig.agamaPort + 1}`);
			});
			loadingWindow.loadURL(`http://${appConfig.host}:${appConfig.agamaPort + 1}/gui/startup/agama-instance-error.html`);
			shepherd.log('another agama app is already running');
		}
	});

	shepherd.setIO(io); // pass sockets object to shepherd router
	shepherd.setVar('appBasicInfo', appBasicInfo);
	shepherd.setVar('appSessionHash', appSessionHash);

	loadingWindow.createWindow = createWindow; // expose createWindow to front-end scripts
	loadingWindow.appConfig = appConfig;
	loadingWindow.forseCloseApp = forseCloseApp;
	loadingWindow.createAppSettingsWindow = createAppSettingsWindow;
	loadingWindow.startKMDNative = shepherd.startKMDNative;
	loadingWindow.startSPV = shepherd.startSPV;

	// load our index.html (i.e. easyDEX GUI)
	loadingWindow.loadURL(`http://${appConfig.host}:${appConfig.agamaPort}/gui/startup`);
  loadingWindow.webContents.on('did-finish-load', function() {
    setTimeout(function() {
      loadingWindow.show();
    }, 40);
  });
	shepherd.writeLog('show loading window');

	// if window closed we kill iguana proc
	loadingWindow.on('hide', function() {
		// our app does not have multiwindow - so we dereference the window object instead of
		// putting them into an window_arr
		loadingWindow = null;
	});

  loadingWindow.on('close', (e) => {
  	if (!forseCloseApp) {
	    if (willQuitApp) {
	      /* the user tried to quit the app */
	      loadingWindow = null;
	    } else {
	      /* the user only tried to close the window */
	      closeAppAfterLoading = true;
	      e.preventDefault();
	    }
	  }
  });
}

// close app
function forseCloseApp() {
	forceQuitApp = true;
	app.quit();
}

function setDefaultAppSettings() {
	shepherd.saveLocalAppConf(_defaultAppSettings);
}

function updateAppSettings(_settings) {
	shepherd.saveLocalAppConf(_settings);
	appConfig = _settings;
}

app.on('ready', createLoadingWindow);

function createAppCloseWindow() {
	// initialise window
	appCloseWindow = new BrowserWindow({ // dirty hack to prevent main window flash on quit
		width: 500,
		height: 300,
		frame: false,
		icon: agamaIcon,
		show: false,
	});

	appCloseWindow.setResizable(false);

	appCloseWindow.loadURL(`http://${appConfig.host}:${appConfig.agamaPort}/gui/startup/app-closing.html`);

  appCloseWindow.webContents.on('did-finish-load', function() {
    setTimeout(function() {
      appCloseWindow.show();
    }, 40);
  });
}

function reloadSettingsWindow() {
	appSettingsWindow.loadURL(`http://${appConfig.host}:${appConfig.agamaPort}/gui/startup/app-settings.html`);
}

function createAppSettingsWindow() {
	// initialise window
	appSettingsWindow = new BrowserWindow({ // dirty hack to prevent main window flash on quit
		width: 750,
		height: 570,
		frame: false,
		icon: agamaIcon,
		show: false,
	});

	appSettingsWindow.setResizable(false);

	appSettingsWindow.appConfig = appConfig;
	appSettingsWindow.appConfigSchema = shepherd.appConfigSchema;
	appSettingsWindow.defaultAppSettings = _defaultAppSettings;
	appSettingsWindow.destroyAppSettingsWindow = destroyAppSettingsWindow;
	appSettingsWindow.reloadSettingsWindow = reloadSettingsWindow;
	appSettingsWindow.testLocation = shepherd.testLocation;
	appSettingsWindow.setDefaultAppSettings = setDefaultAppSettings;
	appSettingsWindow.updateAppSettings = updateAppSettings;
	appSettingsWindow.testBins = shepherd.testBins;
	appSettingsWindow.zcashParamsExist = _zcashParamsExist;
	appSettingsWindow.loadURL(`http://${appConfig.host}:${appConfig.agamaPort}/gui/startup/app-settings.html`);

  appSettingsWindow.webContents.on('did-finish-load', function() {
    setTimeout(function() {
      appSettingsWindow.show();
    }, 40);
  });
}

function destroyAppSettingsWindow() {
	appSettingsWindow.hide();
	appSettingsWindow = null;
}

function createWindow(status) {
	if (appSettingsWindow) {
		destroyAppSettingsWindow();
	}

	if (status === 'open') {
		require(path.join(__dirname, 'private/mainmenu'));

		// initialise window
		mainWindow = new BrowserWindow({ // dirty hack to prevent main window flash on quit
			width: closeAppAfterLoading ? 1 : 1280,
			height: closeAppAfterLoading ? 1 : 800,
			icon: agamaIcon,
			show: false,
		});

		if (closeAppAfterLoading) {
			mainWindow = null;
			loadingWindow = null;
			pm2Exit();
		}

		const staticMenu = Menu.buildFromTemplate([ // if static
			{ role: 'copy' },
			{ type: 'separator' },
			{ role: 'selectall' },
		]);

		const editMenu = Menu.buildFromTemplate([ // if editable
			{ role: 'undo' },
			{ role: 'redo' },
			{ type: 'separator' },
			{ role: 'cut' },
			{ role: 'copy' },
			{ role: 'paste' },
			{ type: 'separator' },
			{ role: 'selectall' },
		]);

		// load our index.html (i.e. easyDEX GUI)
		shepherd.writeLog('show edex gui');
		mainWindow.appConfig = appConfig;
		mainWindow.appConfigSchema = shepherd.appConfigSchema;
		mainWindow.appBasicInfo = appBasicInfo;
		mainWindow.appSessionHash = appSessionHash;
		mainWindow.assetChainPorts = require('./routes/ports.js');
		mainWindow.zcashParamsExist = _zcashParamsExist;
		mainWindow.agamaIcon = agamaIcon;
		mainWindow.testLocation = shepherd.testLocation;
		mainWindow.kmdMainPassiveMode = shepherd.kmdMainPassiveMode;
		mainWindow.getAppRuntimeLog = shepherd.getAppRuntimeLog;
		mainWindow.nativeCoindList = nativeCoindList;
		mainWindow.zcashParamsDownloadLinks = shepherd.zcashParamsDownloadLinks;

		if (appConfig.dev) {
			mainWindow.loadURL('http://127.0.0.1:3000');
		} else {
			mainWindow.loadURL(`http://${appConfig.host}:${appConfig.agamaPort}/gui/EasyDEX-GUI/react/build`);
		}

	  mainWindow.webContents.on('did-finish-load', function() {
	    setTimeout(function() {
	      mainWindow.show();
	    }, 40);
	  });

		mainWindow.webContents.on('context-menu', (e, params) => { // context-menu returns params
			const { selectionText, isEditable } = params; // params obj

			if (isEditable) {
				editMenu.popup(mainWindow);
			} else if (selectionText && selectionText.trim() !== '') {
				staticMenu.popup(mainWindow);
			}
		});

		// DEVTOOLS - only for dev purposes - ca333
		// mainWindow.webContents.openDevTools()

		function appExit() {
			const CloseDaemons = function() {
				return new Promise(function(resolve, reject) {
					shepherd.log('Closing Main Window...');
					shepherd.writeLog('exiting app...');

					shepherd.quitKomodod(1000);

					const result = 'Closing daemons: done';

					shepherd.log(result);
					shepherd.writeLog(result);
					resolve(result);
				})
			}

			const HideMainWindow = function() {
				return new Promise(function(resolve, reject) {
					const result = 'Hiding Main Window: done';

					shepherd.log('Exiting App...');
					mainWindow = null;
					shepherd.log(result);
					resolve(result);
				});
			}

			const HideAppClosingWindow = function() {
				return new Promise(function(resolve, reject) {
					appCloseWindow = null;
					resolve(true);
				});
			}

			const QuitApp = function() {
				return new Promise(function(resolve, reject) {
					const result = 'Quiting App: done';

					app.quit();
					shepherd.log(result);
					resolve(result);
				});
			}

			const closeApp = function() {
				CloseDaemons()
				.then(HideMainWindow)
				.then(HideAppClosingWindow)
				.then(QuitApp);
			}

			let _appClosingInterval;

			if (!Object.keys(shepherd.coindInstanceRegistry).length) {
				closeApp();
			} else {
				createAppCloseWindow();
				shepherd.quitKomodod(1000);
				_appClosingInterval = setInterval(function() {
					if (!Object.keys(shepherd.coindInstanceRegistry).length) {
						closeApp();
					}
				}, 1000);
			}
		}

		// if window closed we kill iguana proc
		mainWindow.on('closed', function() {
			appExit();
		});
	}
}

app.on('window-all-closed', function() {
	//if (os.platform() !== 'win32') { ig.kill(); }
	// in osx apps stay active in menu bar until explictly closed or quitted by CMD Q
	// so we do not kill the app --> for the case user clicks again on the iguana icon
	// we open just a new window and respawn iguana proc
	/*if (process.platform !== 'darwin' || process.platform !== 'linux' || process.platform !== 'win32') {
		app.quit()
	}*/
})

// Emitted before the application starts closing its windows.
// Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('before-quit', function(event) {
	shepherd.log('before-quit');

	if (!forceQuitApp &&
			mainWindow === null &&
			loadingWindow != null) { // mainWindow not intitialised and loadingWindow not dereferenced
		// loading window is still open
		shepherd.log('before-quit prevented');
		shepherd.writeLog('quit app after loading is done');
		closeAppAfterLoading = true;
		// obsolete(?)
		let code = `$('#loading_status_text').html('Preparing to shutdown the wallet.<br/>Please wait while all daemons are closed...')`;
		loadingWindow.webContents.executeJavaScript(code);
		event.preventDefault();
	}
});

// Emitted when all windows have been closed and the application will quit.
// Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('will-quit', function(event) {
	if (!forceQuitApp &&
			mainWindow === null &&
			loadingWindow != null) {
		// loading window is still open
		shepherd.log('will-quit while loading window active');
		event.preventDefault();
	}
});

// Emitted when the application is quitting.
// Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('quit', function(event) {
	if (!forceQuitApp &&
			mainWindow === null &&
			loadingWindow != null) {
		shepherd.log('quit while loading window active');
		event.preventDefault();
	}
})

app.on('activate', function() {
	if (mainWindow === null) {}
});

app.commandLine.appendSwitch('ignore-certificate-errors'); // dirty hack

function formatBytes(bytes, decimals) {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1000;
	const dm = decimals + 1 || 3;
	const sizes = [
    'Bytes',
    'KB',
    'MB',
    'GB',
    'TB',
    'PB',
    'EB',
    'ZB',
    'YB'
  ];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}