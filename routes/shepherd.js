const electron = require('electron'),
			app = electron.app,
			BrowserWindow = electron.BrowserWindow,
			path = require('path'),
			url = require('url'),
			os = require('os'),
			fsnode = require('fs'),
			fs = require('fs-extra'),
			mkdirp = require('mkdirp'),
			express = require('express'),
			exec = require('child_process').exec,
			md5 = require('md5'),
			pm2 = require('pm2');

Promise = require('bluebird');

const fixPath = require('fix-path');
var ps = require('ps-node'),
		setconf = require('../private/setconf.js'),
		shepherd = express.Router();

// IGUANA FILES AND CONFIG SETTINGS
var iguanaConfsDirSrc = path.join(__dirname, '../assets/deps/confs'),
		CorsProxyBin = path.join(__dirname, '../node_modules/corsproxy/bin/corsproxy');

// SETTING OS DIR TO RUN IGUANA FROM
// SETTING APP ICON FOR LINUX AND WINDOWS
if (os.platform() === 'darwin') {
	fixPath();
	var iguanaBin = path.join(__dirname, '../assets/bin/osx/iguana'),
			iguanaDir = process.env.HOME + '/Library/Application Support/iguana',
			iguanaConfsDir = iguanaDir + '/confs',
			komododBin = path.join(__dirname, '../assets/bin/osx/komodod'),
			komodocliBin = path.join(__dirname, '../assets/bin/osx/komodo-cli'),
			komodoDir = process.env.HOME + '/Library/Application Support/Komodo';
}

if (os.platform() === 'linux') {
	var iguanaBin = path.join(__dirname, '../assets/bin/linux64/iguana'),
			iguanaDir = process.env.HOME + '/.iguana',
			iguanaConfsDir = iguanaDir + '/confs',
			iguanaIcon = path.join(__dirname, '/assets/icons/iguana_app_icon_png/128x128.png'),
			komododBin = path.join(__dirname, '../assets/bin/linux64/komodod'),
			komodocliBin = path.join(__dirname, '../assets/bin/linux64/komodo-cli'),
			komodoDir = process.env.HOME + '/.komodo';
}

if (os.platform() === 'win32') {
	var iguanaBin = path.join(__dirname, '../assets/bin/win64/iguana.exe');
			iguanaBin = path.normalize(iguanaBin);
	var iguanaDir = process.env.APPDATA + '/iguana';
			iguanaDir = path.normalize(iguanaDir);
	var iguanaConfsDir = process.env.APPDATA + '/iguana/confs';
			iguanaConfsDir = path.normalize(iguanaConfsDir);
	var iguanaIcon = path.join(__dirname, '/assets/icons/iguana_app_icon.ico'),
			iguanaConfsDirSrc = path.normalize(iguanaConfsDirSrc);
}

shepherd.appConfig = {
  "edexGuiOnly": true,
  "iguanaGuiOnly": false,
  "manualIguanaStart": false,
  "skipBasiliskNetworkCheck": false,
  "host": "127.0.0.1",
  "iguanaAppPort": 17777,
  "iguanaCorePort": 7778,
  "maxDescriptors": {
  	"darwin": 90000,
  	"linux": 1000000
  }
};

console.log('iguana dir: ' + iguanaDir);
console.log('iguana bin: ' + iguanaBin);

// END IGUANA FILES AND CONFIG SETTINGS
shepherd.get('/', function(req, res, next) {
  res.send('Iguana app server');
});

shepherd.get('/appconf', function(req, res, next) {
	var obj = shepherd.loadLocalConfig();
	res.send(obj);
});

shepherd.loadLocalConfig = function() {
	if (fs.existsSync(iguanaDir + '/config.json')) {
		var localAppConfig = fs.readFileSync(iguanaDir + '/config.json', 'utf8');
	  console.log('app config set from local file');

	  // find diff between local and hardcoded configs
	  // append diff to local config
		var compareJSON = function(obj1, obj2) {
		  var result = {};

		  for (var i in obj1) {
		    if (!obj2.hasOwnProperty(i)) {
		      result[i] = obj1[i];
		    }
		  }

		  return result;
		};

		var compareConfigs = compareJSON(shepherd.appConfig, JSON.parse(localAppConfig));
		if (Object.keys(compareConfigs).length) {
			var newConfig = Object.assign(JSON.parse(localAppConfig), compareConfigs);
			
			console.log('config diff is found, updating local config');
			console.log('config diff:');
			console.log(compareConfigs);
			
			shepherd.saveLocalAppConf(newConfig);
		  return newConfig;
		} else {
		  return JSON.parse(localAppConfig);			
		}

	} else {
		console.log('local config file is not found!');
		shepherd.saveLocalAppConf(shepherd.appConfig);

		return shepherd.appConfig;
	}
};

shepherd.post('/herd', function(req, res) {
	console.log('======= req.body =======');
	//console.log(req);
	console.log(req.body);
	//console.log(req.body.herd);
	//console.log(req.body.options);

	herder(req.body.herd, req.body.options);

	res.end('{ "msg": "success", "result": "result" }');
});

shepherd.post('/herdlist', function(req, res) {
	//console.log('======= req.body =======');
	//console.log(req);
	//console.log(req.body);
	console.log(req.body.herdname);
	//console.log(req.body.options);

	pm2.connect(true, function(err) {
	  if (err) throw err; // TODO: proper error handling
		pm2.describe(req.body.herdname, function(err, list) {
		  pm2.disconnect(); // disconnect after getting proc info list

		  if (err)
		  	throw err; // TODO: proper error handling

		  console.log(list[0].pm2_env.status) // print status of IGUANA proc
			console.log(list[0].pid) // print pid of IGUANA proc

			res.end('{ "herdname": ' + req.body.herdname + ', "status": ' + list[0].pm2_env.status + ', "pid": ' + list[0].pid + '}');
		 });
	});
});

shepherd.post('/slay', function(req, res) {
	console.log('======= req.body =======');
	//console.log(req);
	console.log(req.body);
	//console.log(req.body.slay);

	slayer(req.body.slay);
	res.end('{ "msg": "success", "result": "result" }');
});

shepherd.post('/setconf', function(req, res) {
	console.log('======= req.body =======');
	//console.log(req);
	console.log(req.body);
	//console.log(req.body.chain);

	setConf(req.body.chain);
	res.end('{ "msg": "success", "result": "result" }');
});

shepherd.post('/getconf', function(req, res) {
	console.log('======= req.body =======');
	//console.log(req);
	console.log(req.body);
	//console.log(req.body.chain);

	var confpath = getConf(req.body.chain);
	console.log('got conf path is:');
	console.log(confpath);
	res.end('{ "msg": "success", "result": "' + confpath + '" }');
});

function herder(flock, data) {
	//console.log(flock);
	//console.log(data);

	if (data == undefined) {
		data = 'none';
		console.log('it is undefined');
	}

	if (flock === 'iguana') {
		console.log('iguana flock selected...');
		console.log('selected data: ' + data);

		//Make sure iguana isn't running before starting new process, kill it dammit!
		// A simple pid lookup
		/*ps.lookup({
			command: 'iguana',
			//arguments: '--debug',
			}, function(err, resultList ) {
			if (err) {
				throw new Error( err );
			}
			resultList.forEach(function( process ){
				if( process ){
					console.log( 'PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );
					console.log(process.pid);
					// A simple pid lookup
					ps.kill( process.pid, function( err ) {
						if (err) {
							throw new Error( err );
						}
						else {
							console.log( 'Process %s has been killed!', process.pid );
						}
					});
				}
			});
		});*/

		// MAKE SURE IGUANA DIR IS THERE FOR USER
		mkdirp(iguanaDir, function(err) {
		if (err)
			console.error(err);
		else
			fs.readdir(iguanaDir, (err, files) => {
				files.forEach(file => {
					//console.log(file);
				});
			})
		});

		// COPY CONFS DIR WITH PEERS FILE TO IGUANA DIR, AND KEEP IT IN SYNC
		fs.copy(iguanaConfsDirSrc, iguanaConfsDir, function (err) {
			if (err)
				return console.error(err);

			console.log('confs files copied successfully at: ' + iguanaConfsDir);
		});

		pm2.connect(true,function(err) { //start up pm2 god
			if (err) {
				console.error(err);
				process.exit(2);
			}

			pm2.start({
				script: iguanaBin, // path to binary
				name: 'IGUANA',
				exec_mode : 'fork',
				cwd: iguanaDir, //set correct iguana directory
			}, function(err, apps) {
				pm2.disconnect(); // Disconnect from PM2
					if (err)
						throw err;
			});
		});
	}

	if (flock === 'komodod') {
		console.log('komodod flock selected...');
		console.log('selected data: ' + data);

		pm2.connect(true, function(err) { // start up pm2 god
			if (err) {
				console.error(err);
				process.exit(2);
			}

			pm2.start({
				script: komododBin, // path to binary
				name: data.ac_name, // REVS, USD, EUR etc.
				exec_mode : 'fork',
				cwd: komodoDir,
				args: data.ac_options,
				//args: ["-server", "-ac_name=USD", "-addnode=78.47.196.146"],  //separate the params with commas
			}, function(err, apps) {
				pm2.disconnect();   // Disconnect from PM2
					if (err)
						throw err;
			});
		});
	}

	if (flock === 'corsproxy') {
		console.log('corsproxy flock selected...');
		console.log('selected data: ' + data);

		pm2.connect(true,function(err) { //start up pm2 god
		if (err) {
			console.error(err);
			process.exit(2);
		}

		pm2.start({
			script: CorsProxyBin, // path to binary
			name: 'CORSPROXY', // REVS, USD, EUR etc.
			exec_mode : 'fork',
			cwd: iguanaDir,
		}, function(err, apps) {
			pm2.disconnect(); // Disconnect from PM2
				if (err)
					throw err;
			});
		});
	}
}

function slayer(flock) {
	console.log(flock);

	pm2.delete(flock, function(err, ret) {
		//console.log(err);
		pm2.disconnect();
		console.log(ret);
	});
}

shepherd.saveLocalAppConf = function(appSettings) {
	var appConfFileName = iguanaDir + '/config.json';

	var FixFilePermissions = function() {
		return new Promise(function(resolve, reject) {
			var result = 'config.json file permissions updated to Read/Write';

			fsnode.chmodSync(appConfFileName, '0666');

			setTimeout(function() {
				console.log(result);
				resolve(result);
			}, 1000);
		});
	}

	var FsWrite = function() {
		return new Promise(function(resolve, reject) {
			var result = 'config.json write file is done'

			fs.writeFile(appConfFileName, 
									 JSON.stringify(appSettings)
									 .replace(/,/g, ',\n') // format json in human readable form
									 .replace(/:/g, ': ')
									 .replace(/{/g, '{\n')
									 .replace(/}/g, '\n}'), 'utf8', function(err) {
				if (err)
					return console.log(err);
			});

			fsnode.chmodSync(appConfFileName, '0666');
			setTimeout(function() {
				console.log(result);
				console.log('app conf.json file is created successfully at: ' + iguanaConfsDir);
				resolve(result);
			}, 2000);
		});
	}

	FsWrite()
	.then(FixFilePermissions()); // not really required now
}

function setConf(flock) {
	console.log(flock);

	if (os.platform() === 'darwin') {
		var komodoDir = process.env.HOME + '/Library/Application Support/Komodo',
				ZcashDir = process.env.HOME + '/Library/Application Support/Zcash';
	}

	if (os.platform() === 'linux') {
		var komodoDir = process.env.HOME + '/.komodo',
				ZcashDir = process.env.HOME + '/.zcash';
	}

	switch (flock) {
		case 'komodod':
			var DaemonConfPath = komodoDir + '/komodo.conf';
			break;
		case 'zcashd':
			var DaemonConfPath = ZcashDir + '/zcash.conf';
			break;
		default:
			var DaemonConfPath = komodoDir + '/' + flock + '/' + flock + '.conf';
	}

	console.log(DaemonConfPath);

	var CheckFileExists = function() {
		return new Promise(function(resolve, reject) {
			var result = 'Check Conf file exists is done'

			fs.ensureFile(DaemonConfPath, function(err) {
				console.log(err); // => null
			});

			setTimeout(function() {
				console.log(result);
				resolve(result);
			}, 2000);
		});
	}

	var FixFilePermissions = function() {
		return new Promise(function(resolve, reject) {
			var result = 'Conf file permissions updated to Read/Write';

			fsnode.chmodSync(DaemonConfPath, '0666');

			setTimeout(function() {
				console.log(result);
				resolve(result);
			}, 1000);
		});
	}

	var RemoveLines = function() {
		return new Promise(function(resolve, reject) {
			var result = 'RemoveLines is done'

			fs.readFile(DaemonConfPath, 'utf8', function(err, data) {
				if (err) {
					return console.log(err);
				}

				var rmlines = data.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n');

				fs.writeFile(DaemonConfPath, rmlines, 'utf8', function(err) {
					if (err)
						return console.log(err);
				});
			});

			fsnode.chmodSync(DaemonConfPath, '0666');
			setTimeout(function() {
				console.log(result);
				resolve(result);
			}, 2000);
		});
	}

	var CheckConf = function() {
		return new Promise(function(resolve, reject) {
			var result = 'CheckConf is done';

			setconf.status(DaemonConfPath, function(err, status) {
				//console.log(status[0]);
				//console.log(status[0].rpcuser);
				var rpcuser = function() {
					return new Promise(function(resolve, reject) {
						var result = 'checking rpcuser...';

						if (status[0].hasOwnProperty('rpcuser')) {
							console.log('rpcuser: OK');
						} else {
							console.log('rpcuser: NOT FOUND');
							var randomstring = md5(Math.random() * Math.random() * 999);

							fs.appendFile(DaemonConfPath, '\nrpcuser=user' + randomstring.substring(0, 16), (err) => {
								if (err)
									throw err;
								console.log('rpcuser: ADDED');
							});
						}

						//console.log(result)
						resolve(result);
					});
				}

				var rpcpass = function() {
					return new Promise(function(resolve, reject) {
						var result = 'checking rpcpass...';

						if (status[0].hasOwnProperty('rpcpass')) {
							console.log('rpcpass: OK');
						} else {
							console.log('rpcpass: NOT FOUND');
							var randomstring = md5(Math.random() * Math.random() * 999);

							fs.appendFile(DaemonConfPath, '\nrpcpass=' + randomstring +
																						'\nrpcpassword=' + randomstring, (err) => {
								if (err)
									throw err;
								console.log('rpcpass: ADDED');
							});
						}

						//console.log(result)
						resolve(result);
					});
				}

				var server = function() {
					return new Promise(function(resolve, reject) {
						var result = 'checking server...';

						if (status[0].hasOwnProperty('server')) {
							console.log('server: OK');
						} else {
							console.log('server: NOT FOUND');
							fs.appendFile(DaemonConfPath, '\nserver=1', (err) => {
								if (err)
									throw err;
								console.log('server: ADDED');
							});
						}

						//console.log(result)
						resolve(result);
					});
				}

				var addnode = function() {
					return new Promise(function(resolve, reject) {
						var result = 'checking addnode...';

						if(status[0].hasOwnProperty('addnode')) {
							console.log('addnode: OK');
						} else {
							console.log('addnode: NOT FOUND')
							fs.appendFile(DaemonConfPath,
														'\naddnode=78.47.196.146' +
														'\naddnode=5.9.102.210' +
														'\naddnode=178.63.69.164' +
														'\naddnode=88.198.65.74' +
														'\naddnode=5.9.122.241' +
														'\naddnode=144.76.94.3',
														(err) => {
								if (err)
									throw err;
								console.log('addnode: ADDED');
							});
						}

						//console.log(result)
						resolve(result);
					});
				}

				rpcuser()
				.then(function(result) {
					return rpcpass();
				})
				.then(server)
				.then(addnode)
			});

			setTimeout(function() {
				console.log(result);
				resolve(result);
			}, 2000);
		});
	}

	var MakeConfReadOnly = function() {
		return new Promise(function(resolve, reject) {
			var result = 'Conf file permissions updated to Read Only';

			fsnode.chmodSync(DaemonConfPath, '0400');

			setTimeout(function() {
				console.log(result);
				resolve(result);
			}, 1000);
		});
	}

	CheckFileExists()
	.then(function(result) {
		return FixFilePermissions();
	})
	.then(RemoveLines)
	.then(CheckConf)
	.then(MakeConfReadOnly);
}

function getConf(flock) {
	console.log(flock);

	if (os.platform() === 'darwin') {
		var komodoDir = process.env.HOME + '/Library/Application Support/Komodo',
				ZcashDir = process.env.HOME + '/Library/Application Support/Zcash';
	}

	if (os.platform() === 'linux') {
		var komodoDir = process.env.HOME + '/.komodo',
				ZcashDir = process.env.HOME + '/.zcash';
	}

	switch (flock) {
		case 'komodod':
			var DaemonConfPath = komodoDir;
		break;
		case 'zcashd':
			var DaemonConfPath = ZcashDir;
		break;
		default:
			var DaemonConfPath = komodoDir + '/' + flock;
	}

	console.log(DaemonConfPath);
	return DaemonConfPath;
}

module.exports = shepherd;