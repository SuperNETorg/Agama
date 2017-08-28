// main proc for EasyDEX GUI
// this app spawns iguana in background in nontech-mode

const electron = require('electron'),
			app = electron.app,
			BrowserWindow = electron.BrowserWindow,
			path = require('path'),
			url = require('url'),
			os = require('os'),
			md5 = require('md5'),
			spawn = require('child_process').spawn,
			exec = require('child_process').exec,
			{ Menu } = require('electron'),
			portscanner = require('portscanner'),
			osPlatform = os.platform(),
			fixPath = require('fix-path');

var express = require('express'),
		bodyParser = require('body-parser'),
		fs = require('fs'),
		fsnode = require('fs'),
		fs = require('fs-extra'),
		mkdirp = require('mkdirp'),
		pm2 = require('pm2'),
		cluster = require('cluster'),
		numCPUs = require('os').cpus().length,
		ipc = require('electron').ipcMain;

Promise = require('bluebird');

if (osPlatform === 'linux') {
	process.env.ELECTRON_RUN_AS_NODE = true;
	// console.log(process.env);
}

// GUI APP settings and starting gui on address http://120.0.0.1:17777
var shepherd = require('./routes/shepherd');
var guiapp = express();

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
shepherd.createIguanaDirs();

const appSessionHash = md5(Date.now());

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

var appConfig = shepherd.loadLocalConfig(); // load app config
appConfig['daemonTest'] = false; // shadow setting

let __defaultAppSettings = require('./routes/appConfig.js').config;
__defaultAppSettings['daemonTest'] = false; // shadow setting
const _defaultAppSettings = __defaultAppSettings;

shepherd.writeLog(`app started in ${(appConfig.dev ? 'dev mode' : ' user mode')}`);

shepherd.setConfKMD();

if (appConfig.killIguanaOnStart) {
	shepherd.killRogueProcess('iguana');
}

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
			applicationVersion: app.getVersion(),
			copyright: 'Released under the MIT license',
			credits: 'SuperNET Team'
		})
	}
	if (osPlatform === 'linux') {
		process.setFdLimit(appConfig.maxDescriptors.linux);
	}
});

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
let iguanaIcon;

if (os.platform() === 'linux') {
	iguanaIcon = path.join(__dirname, '/assets/icons/agama_icons/128x128.png');
}
if (os.platform() === 'win32') {
	iguanaIcon = path.join(__dirname, '/assets/icons/agama_icons/agama_app_icon.ico');
}

function createLoadingWindow() {
	mainWindow = null;

	// initialise window
	try {
		loadingWindow = new BrowserWindow({
			width: 500,
			height: 335,
			frame: false,
			icon: iguanaIcon,
			show: false,
		});
	} catch(e) {}

	// check if agama is already running
	portscanner.checkPortStatus(appConfig.agamaPort, '127.0.0.1', function(error, status) {
		// Status is 'open' if currently in use or 'closed' if available
		if (status === 'closed') {
			server.listen(appConfig.agamaPort, function() {
				console.log(`guiapp and sockets.io are listening on port ${appConfig.agamaPort}`);
				shepherd.writeLog(`guiapp and sockets.io are listening on port ${appConfig.agamaPort}`);
				// start sockets.io
				io.set('origins', appConfig.dev ? 'http://127.0.0.1:3000' : `http://127.0.0.1:${appConfig.agamaPort}`); // set origin

				io.on('connection', function(client) {
					console.log('EDEX GUI is connected...');
					shepherd.writeLog('EDEX GUI is connected...');

					client.on('event', function(data) { // listen for client requests
						console.log(data);
					});
					client.on('disconnect', function(data) {
						console.log('EDEX GUI is disconnected');
					});
					client.on('join', function(data) {
						console.log(data);
						client.emit('messages', 'Sockets server is listening');
					});
				});
			});
		} else {
			willQuitApp = true;
			server.listen(appConfig.agamaPort + 1, function() {
				console.log(`guiapp and sockets.io are listening on port ${appConfig.agamaPort + 1}`);
				shepherd.writeLog(`guiapp and sockets.io are listening on port ${appConfig.agamaPort + 1}`);
			});
			loadingWindow.loadURL(`http://${appConfig.host}:${appConfig.agamaPort + 1}/gui/agama-instance-error.html`);
			console.log('another agama app is already running');
		}
	});

	shepherd.setIO(io); // pass sockets object to shepherd router
	shepherd.setVar('appBasicInfo', appBasicInfo);
	shepherd.setVar('appSessionHash', appSessionHash);

	loadingWindow.createWindow = createWindow; // expose createWindow to front-end scripts
	loadingWindow.appConfig = appConfig;
	loadingWindow.forseCloseApp = forseCloseApp;
	loadingWindow.createAppSettingsWindow = createAppSettingsWindow;

	// load our index.html (i.e. easyDEX GUI)
	loadingWindow.loadURL(`http://${appConfig.host}:${appConfig.agamaPort}/gui/`);
  loadingWindow.webContents.on('did-finish-load', function() {
    setTimeout(function() {
      loadingWindow.show();
    }, 40);
  });
	shepherd.writeLog('show loading window');

	// DEVTOOLS - only for dev purposes - ca333
	// loadingWindow.webContents.openDevTools()

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
		icon: iguanaIcon,
		show: false,
	});

	appCloseWindow.loadURL(`http://${appConfig.host}:${appConfig.agamaPort}/gui/app-closing.html`);

  appCloseWindow.webContents.on('did-finish-load', function() {
    setTimeout(function() {
      appCloseWindow.show();
    }, 40);
  });
}

function reloadSettingsWindow() {
	appSettingsWindow.loadURL(`http://${appConfig.host}:${appConfig.agamaPort}/gui/app-settings.html`);
}

function createAppSettingsWindow() {
	// initialise window
	appSettingsWindow = new BrowserWindow({ // dirty hack to prevent main window flash on quit
		width: 750,
		height: 800,
		frame: false,
		icon: iguanaIcon,
		show: false,
	});

	appSettingsWindow.appConfig = appConfig;
	appSettingsWindow.appConfigSchema = shepherd.appConfigSchema;
	appSettingsWindow.defaultAppSettings = _defaultAppSettings;
	appSettingsWindow.destroyAppSettingsWindow = destroyAppSettingsWindow;
	appSettingsWindow.reloadSettingsWindow = reloadSettingsWindow;
	appSettingsWindow.testLocation = shepherd.testLocation;
	appSettingsWindow.setDefaultAppSettings = setDefaultAppSettings;
	appSettingsWindow.updateAppSettings = updateAppSettings;
	appSettingsWindow.loadURL(`http://${appConfig.host}:${appConfig.agamaPort}/gui/app-settings.html`);

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
			icon: iguanaIcon,
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
		if (appConfig.edexGuiOnly) {
			if (appConfig.v2) {
				shepherd.writeLog('show edex gui');
				mainWindow.appConfig = appConfig;
				mainWindow.appConfigSchema = shepherd.appConfigSchema;
				mainWindow.appBasicInfo = appBasicInfo;
				mainWindow.appSessionHash = appSessionHash;
				mainWindow.assetChainPorts = require('./routes/ports.js');
				mainWindow.zcashParamsExist = _zcashParamsExist;
				mainWindow.iguanaIcon = iguanaIcon;
				mainWindow.testLocation = shepherd.testLocation;

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
			} else {
				shepherd.writeLog('show edex gui');
				mainWindow.loadURL(`http://${appConfig.host}:${appConfig.agamaPort}/gui/EasyDEX-GUI/`);
			}
		} else {
			mainWindow.loadURL(`http://${appConfig.host}:${appConfig.agamaPort}/gui/main.html`);
		}

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

		function pm2Exit() {
			const ConnectToPm2 = function() {
				return new Promise(function(resolve, reject) {
					console.log('Closing Main Window...');
					shepherd.writeLog('exiting app...');

					shepherd.dumpCacheBeforeExit();
					shepherd.quitKomodod();

					pm2.connect(true, function(err) {
						console.log('connecting to pm2...');
						shepherd.writeLog('connecting to pm2...');

						if (err) {
							console.log(err);
						}
					});

					const result = 'Connecting To Pm2: done';

					console.log(result);
					shepherd.writeLog(result);
					resolve(result);
				})
			}

			const KillPm2 = function() {
				return new Promise(function(resolve, reject) {
					console.log('killing to pm2...');
					shepherd.writeLog('killing to pm2...');

					pm2.killDaemon(function(err) {
						pm2.disconnect();
						console.log('killed to pm2...');
						shepherd.writeLog('killed to pm2...');

						if (err)
							throw err;
					});

					const result = 'Killing Pm2: done';

					setTimeout(function() {
						console.log(result);
						shepherd.writeLog(result);

						resolve(result);
					}, 2000);
				})
			}

			const HideMainWindow = function() {
				return new Promise(function(resolve, reject) {
					const result = 'Hiding Main Window: done';

					console.log('Exiting App...');
					mainWindow = null;
					console.log(result);
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

					KillPm2(); // required for normal app quit in iguana-less mode
					app.quit();
					console.log(result);
					resolve(result);
				});
			}

			const closeApp = function() {
				ConnectToPm2()
				.then(function(result) {
					return KillPm2();
				})
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
			pm2Exit();
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
	console.log('before-quit');
	if (!forceQuitApp && mainWindow === null && loadingWindow != null) { // mainWindow not intitialised and loadingWindow not dereferenced
		// loading window is still open
		console.log('before-quit prevented');
		shepherd.writeLog('quit app after loading is done');
		closeAppAfterLoading = true;
		let code = `$('#loading_status_text').html('Preparing to shutdown the wallet.<br/>Please wait while all daemons are closed...')`;
		loadingWindow.webContents.executeJavaScript(code);
		event.preventDefault();
	}
});

// Emitted when all windows have been closed and the application will quit.
// Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('will-quit', function(event) {
	if (!forceQuitApp && mainWindow === null && loadingWindow != null) {
		// loading window is still open
		console.log('will-quit while loading window active');
		event.preventDefault();
	}
});

// Emitted when the application is quitting.
// Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('quit', function(event) {
	if (!forceQuitApp && mainWindow === null && loadingWindow != null) {
		console.log('quit while loading window active');
		event.preventDefault();
	}
})

app.on('activate', function() {
	if (mainWindow === null) {
		// createWindow('open');
	}
});

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