// main proc for EasyDEX GUI
// this app spawns iguana in background in nontech-mode

const electron = require('electron'),
			app = electron.app,
			BrowserWindow = electron.BrowserWindow,
			path = require('path'),
			url = require('url'),
			os = require('os'),
			spawn = require('child_process').spawn,
			exec = require('child_process').exec,
			{ Menu } = require('electron'),
			fixPath = require('fix-path');

var express = require('express'),
		bodyParser = require('body-parser'),
		fs = require('fs'),
		fsnode = require('fs'),
		fs = require('fs-extra'),
		mkdirp = require('mkdirp'),
		pm2 = require('pm2'),
		cluster = require('cluster'),
		numCPUs = require('os').cpus().length;

Promise = require('bluebird');

app.setName('Agama');
app.setVersion('0.1.6.2e-beta');

if (os.platform() === 'linux') {
	process.env.ELECTRON_RUN_AS_NODE = true;
	console.log(process.env);
}

// GUI APP settings and starting gui on address http://120.0.0.1:17777
var shepherd = require('./routes/shepherd'),
		guiapp = express(),
		appConfig = shepherd.loadLocalConfig(); // load app config

if (appConfig.killIguanaOnStart) {
	var iguanaGrep;
	if (os.platform() === 'darwin') {
		iguanaGrep = "ps -p $(ps -A | grep -m1 iguana | awk '{print $1}')";
	}
	if (os.platform() === 'linux') {
		iguanaGrep = 'ps -p $(pidof iguana)';
	}
	if (os.platform() === 'win32') {
		iguanaGrep = 'tasklist';
	}
	exec(iguanaGrep, function(error, stdout, stderr) {
		if (stdout.indexOf('iguana') > -1) {
			console.log('found another iguana process(es)');
			var pkillCmd = os.platform() === 'win32' ? 'taskkill /f /im iguana.exe' : 'pkill iguana';

			exec(pkillCmd, function(error, stdout, stderr) {
				console.log(pkillCmd + ' is issued');
				if (error !== null) {
					console.log(pkillCmd + 'exec error: ' + error);
				};
			});
		}

		if (error !== null) {
			console.log(iguanaGrep + ' exec error: ' + error);
		};
	});
}

guiapp.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', appConfig.dev ? '*' : 'http://127.0.0.1:' + appConfig.iguanaAppPort);
	res.header('Access-Control-Allow-Headers', 'X-Requested-With');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS'); // TODO: limit allowed methods
	next();
});

// preload.js
const _setImmediate = setImmediate,
			_clearImmediate = clearImmediate;

process.once('loaded', () => {
	global.setImmediate = _setImmediate;
	global.clearImmediate = _clearImmediate;

	if (os.platform() === 'darwin') {
		process.setFdLimit(appConfig.maxDescriptors.darwin);
		app.setAboutPanelOptions({
			applicationName: app.getName(),
			applicationVersion: app.getVersion(),
			copyright: 'Released under the MIT license',
			credits: 'SuperNET Team'
		})
	}
	if (os.platform() === 'linux') {
		process.setFdLimit(appConfig.maxDescriptors.linux);
	}
});

guiapp.use(bodyParser.json({ limit: '50mb' })); // support json encoded bodies
guiapp.use(bodyParser.urlencoded({
	limit: '50mb',
	extended: true
})); // support encoded bodies

guiapp.get('/', function (req, res) {
	res.send('Iguana app server');
});

var guipath = path.join(__dirname, '/gui');
guiapp.use('/gui', express.static(guipath));
guiapp.use('/shepherd', shepherd);

var server = require('http').createServer(guiapp),
		io = require('socket.io').listen(server);

server.listen(appConfig.iguanaAppPort, function() {
	console.log('guiapp and sockets.io are listening on port ' + appConfig.iguanaAppPort + '!');
});

io.set('origins', 'http://127.0.0.1:' + appConfig.iguanaAppPort); // set origin

io.on('connection', function(client) {
	console.log('EDEX GUI is connected...');

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

shepherd.setIO(io); // pass sockets object to shepherd router

module.exports = guiapp;
// END GUI App Settings

//require('./assets/js/iguana.js'); //below code shall be separated into asset js for public version
/*
// SELECTING IGUANA BUILD TO RUN AS PER OS DETECTED BY DESKTOP APP
var iguanaOSX = path.join(__dirname, '/assets/bin/osx/iguana');
var iguanaLinux = path.join(__dirname, '/assets/bin/linux64/iguana');
var iguanaWin = path.join(__dirname, '/assets/bin/win64/iguana.exe'); iguanaWin = path.normalize(iguanaWin);
var iguanaConfsDirSrc = path.join(__dirname, '/assets/deps/confs');

// SETTING OS DIR TO RUN IGUANA FROM
// SETTING APP ICON FOR LINUX AND WINDOWS
if (os.platform() === 'darwin') {
	var iguanaDir = process.env.HOME + '/Library/Application Support/iguana';
	var iguanaConfsDir = iguanaDir + '/confs';
}
if (os.platform() === 'linux') {
	var iguanaDir = process.env.HOME + '/.iguana'
	var iguanaConfsDir = iguanaDir + '/confs';
	var iguanaIcon = path.join(__dirname, '/assets/icons/iguana_app_icon_png/128x128.png')
}
if (os.platform() === 'win32') {
	var iguanaDir = process.env.APPDATA + '/iguana'; iguanaDir = path.normalize(iguanaDir)
	var iguanaConfsDir = process.env.APPDATA + '/iguana/confs'; iguanaConfsDir = path.normalize(iguanaConfsDir)
	var iguanaIcon = path.join(__dirname, '/assets/icons/iguana_app_icon.ico')
	iguanaConfsDirSrc = path.normalize(iguanaConfsDirSrc);
}
*/

if (os.platform() === 'linux') {
	var iguanaIcon = path.join(__dirname, '/assets/icons/agama_icons/128x128.png');
}
if (os.platform() === 'win32') {
	var iguanaIcon = path.join(__dirname, '/assets/icons/agama_icons/agama_app_icon.ico');
}

//console.log(iguanaDir);
/*
// MAKE SURE IGUANA DIR IS THERE FOR USER
mkdirp(iguanaDir, function (err) {
	if (err)
		console.error(err)
	else
		fs.readdir(iguanaDir, (err, files) => {
			files.forEach(file => {
				//console.log(file);
			});
		})
});

// COPY CONFS DIR WITH PEERS FILE TO IGUANA DIR, AND KEEP IT IN SYNC
fs.copy(iguanaConfsDirSrc, iguanaConfsDir, function (err) {
	if (err) return console.error(err)
	console.log('confs files copied successfully at: '+ iguanaConfsDir )
})
*/

let mainWindow;
let loadingWindow;
let willQuitApp = false;
let closeAppAfterLoading = false;

function createLoadingWindow() {
	mainWindow = null;

	// initialise window
	loadingWindow = new BrowserWindow({
		width: 500,
		height: 300,
		frame: false,
		icon: iguanaIcon
	});

	loadingWindow.createWindow = createWindow; // expose createWindow to front-end scripts

	// load our index.html (i.e. easyDEX GUI)
	loadingWindow.loadURL('http://' + appConfig.host + ':' + appConfig.iguanaAppPort + '/gui/');

	// DEVTOOLS - only for dev purposes - ca333
	//loadingWindow.webContents.openDevTools()

	// if window closed we kill iguana proc
	loadingWindow.on('hide', function () {
		// our app does not have multiwindow - so we dereference the window object instead of
		// putting them into an window_arr
		loadingWindow = null;
	});

  loadingWindow.on('close', (e) => {
    if (willQuitApp) {
      /* the user tried to quit the app */
      loadingWindow = null;
    } else {
      /* the user only tried to close the window */
      closeAppAfterLoading = true;
      e.preventDefault();
    }
  });

	//ca333 todo - add os detector to use correct binary - so we can use the same bundle on ALL OS platforms
	/*if (os.platform() === 'win32') {
		process.chdir(iguanaDir);
		//exec(iguanaWin, {cwd: iguanaDir}); //specify binary in startup
		ig = spawn(iguanaWin);
	}
	if (os.platform() === 'linux') {
		process.chdir(iguanaDir);
		ig = spawn(iguanaLinux);
		//corsproxy_process = spawn('corsproxy');
	}
	if (os.platform() === 'darwin') {
		//process.chdir(iguanaDir);
		//ig = spawn(iguanaOSX);
		//corsproxy_process = spawn('corsproxy');
	}*/

	//if (os.platform() !== 'win32') { ig.stderr.on( 'error: ', data => { console.log( `stderr: ${data}` ); }); }
}

app.on('ready', createLoadingWindow);

function createWindow (status) {
	if ( status === 'open') {
		require(path.join(__dirname, 'private/mainmenu'));

		// initialise window
		mainWindow = new BrowserWindow({ // dirty hack to prevent main window flash on quit
			width: closeAppAfterLoading ? 1 : 1280,
			height: closeAppAfterLoading ? 1 : 800,
			icon: iguanaIcon
		});

		if (closeAppAfterLoading) {
			mainWindow = null;
			loadingWindow = null;
			pm2Exit();
		}

		const staticMenu = Menu.buildFromTemplate([ //if static
			{ role: 'copy' },
			{ type: 'separator' },
			{ role: 'selectall' },
		]);

		const editMenu = Menu.buildFromTemplate([ //if editable
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
			mainWindow.loadURL('http://' + appConfig.host + ':' + appConfig.iguanaAppPort + '/gui/EasyDEX-GUI/');
		} else {
			mainWindow.loadURL('http://' + appConfig.host + ':' + appConfig.iguanaAppPort + '/gui/main.html');
		}

		mainWindow.webContents.on('context-menu', (e, params) => { //context-menu returns params
			const { selectionText, isEditable } = params; //params obj

			if (isEditable) {
				editMenu.popup(mainWindow);
			} else if (selectionText && selectionText.trim() !== '') {
				staticMenu.popup(mainWindow);
			}
		});

		// DEVTOOLS - only for dev purposes - ca333
		//mainWindow.webContents.openDevTools()

		function pm2Exit() {
			var ConnectToPm2 = function() {
				return new Promise(function(resolve, reject) {
					console.log('Closing Main Window...');

					pm2.connect(true, function(err) {
						console.log('connecting to pm2...');

						if (err) {
							console.log(err);
						}
					});

					var result = 'Connecting To Pm2: done';

					console.log(result);
					resolve(result);
				})
			}

			var KillPm2 = function() {
				return new Promise(function(resolve, reject) {
					console.log('killing to pm2...');

					pm2.killDaemon(function(err) {
						pm2.disconnect();
						console.log('killed to pm2...');

						if (err)
							throw err;
					});

					var result = 'Killing Pm2: done';

					setTimeout(function() {
						console.log(result);

						resolve(result);
					}, 2000)
				})
			}

			var HideMainWindow = function() {
				return new Promise(function(resolve, reject) {
					console.log('Exiting App...');
					mainWindow = null;

					var result = 'Hiding Main Window: done';
					console.log(result);
					resolve(result);
				});
			}

			var QuitApp = function() {
				return new Promise(function(resolve, reject) {
					app.quit();
					var result = 'Quiting App: done';
					console.log(result);
					resolve(result);
				});
			}

			ConnectToPm2()
			.then(function(result) {
				return KillPm2();
			})
			.then(HideMainWindow)
			.then(QuitApp);
		}

		// if window closed we kill iguana proc
		mainWindow.on('closed', function () {
			pm2Exit();
		});
	}
}

app.on('window-all-closed', function () {
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
app.on('before-quit', function (event) {
	console.log('before-quit');
	if (mainWindow === null && loadingWindow != null) { // mainWindow not intitialised and loadingWindow not dereferenced
		// loading window is still open
		console.log('before-quit prevented');
		closeAppAfterLoading = true;
		let code = `$('#loading_status_text').html('Preparing to shutdown the wallet.<br/>Please wait while all daemons are closed...')`;
		loadingWindow.webContents.executeJavaScript(code);
		event.preventDefault();
	}
});

// Emitted when all windows have been closed and the application will quit.
// Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('will-quit', function (event) {
	if (mainWindow === null && loadingWindow != null) {
		// loading window is still open
		console.log('will-quit while loading window active');
		event.preventDefault();
	}
});

// Emitted when the application is quitting.
// Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('quit', function (event) {
	if (mainWindow === null && loadingWindow != null) {
		console.log('quit while loading window active');
		event.preventDefault();
	}
})

app.on('activate', function () {
	if (mainWindow === null) {
		// createWindow('open');
	}
});