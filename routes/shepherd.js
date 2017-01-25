const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const os = require('os')
const fsnode = require('fs');
const fs = require('fs-extra');
const mkdirp = require('mkdirp');
const express = require('express');
const md5 = require('md5');
const pm2 = require('pm2');
Promise = require('bluebird');
const fixPath = require('fix-path');

var setconf = require("../private/setconf.js");

var shepherd = express.Router();


// IGUANA FILES AND CONFIG SETTINGS

var iguanaConfsDirSrc = path.join(__dirname, '../assets/deps/confs');
var CorsProxyBin = path.join(__dirname, '../node_modules/corsproxy/bin/corsproxy');

// SETTING OS DIR TO RUN IGUANA FROM
// SETTING APP ICON FOR LINUX AND WINDOWS
if (os.platform() === 'darwin') {
	fixPath();
	var iguanaBin = path.join(__dirname, '../assets/bin/osx/iguana');
	var iguanaDir = process.env.HOME + '/Library/Application Support/iguana';
	var iguanaConfsDir = iguanaDir + '/confs';
	var komododBin = path.join(__dirname, '../assets/bin/osx/komodod');
	var komodocliBin = path.join(__dirname, '../assets/bin/osx/komodo-cli');
	var komodoDir = process.env.HOME + '/Library/Application Support/Komodo';
}
if (os.platform() === 'linux') {
	var iguanaBin = path.join(__dirname, '../assets/bin/linux64/iguana');
	var iguanaDir = process.env.HOME + '/.iguana'
	var iguanaConfsDir = iguanaDir + '/confs';
	var iguanaIcon = path.join(__dirname, '/assets/icons/iguana_app_icon_png/128x128.png')
	var komododBin = path.join(__dirname, '../assets/bin/linux64/komodod');
	var komodocliBin = path.join(__dirname, '../assets/bin/linux64/komodo-cli');
	var komodoDir = process.env.HOME + '/.komodo'
}
if (os.platform() === 'win32') {
	var iguanaBin = path.join(__dirname, '../assets/bin/win64/iguana.exe'); iguanaBin = path.normalize(iguanaBin);
	var iguanaDir = process.env.APPDATA + '/iguana'; iguanaDir = path.normalize(iguanaDir)
	var iguanaConfsDir = process.env.APPDATA + '/iguana/confs'; iguanaConfsDir = path.normalize(iguanaConfsDir)
	var iguanaIcon = path.join(__dirname, '/assets/icons/iguana_app_icon.ico')
	iguanaConfsDirSrc = path.normalize(iguanaConfsDirSrc);
}

console.log(iguanaDir);
console.log(iguanaBin);

// END IGUANA FILES AND CONFIG SETTINGS




shepherd.get('/', function(req, res, next) {
  res.send('Hello World!')
})


shepherd.post('/herd', function(req, res) {
	console.log('======= req.body =======');
	//console.log(req);
	console.log(req.body);
	//console.log(req.body.herd);
	//console.log(req.body.options);

	herder(req.body.herd, req.body.options);

	res.end('{"msg": "success","result": "result"}');
	
});


shepherd.post('/slay', function(req, res) {
	console.log('======= req.body =======');
	//console.log(req);
	console.log(req.body);
	//console.log(req.body.slay);

	slayer(req.body.slay);

	res.end('{"msg": "success","result": "result"}');
	
});


shepherd.post('/setconf', function(req, res) {
	console.log('======= req.body =======');
	//console.log(req);
	console.log(req.body);
	//console.log(req.body.chain);

	setConf(req.body.chain);

	res.end('{"msg": "success","result": "result"}');
	
});

shepherd.post('/getconf', function(req, res) {
	console.log('======= req.body =======');
	//console.log(req);
	console.log(req.body);
	//console.log(req.body.chain);

	var confpath = getConf(req.body.chain);
	console.log('got conf path is:')
	console.log(confpath);

	res.end('{"msg": "success","result": "' + confpath + '"}');
	
});


function herder(flock, data) {
	//console.log(flock);
	//console.log(data);
	
	if (data == undefined) { data = 'none'; console.log('it is undefined'); }

	if (flock === 'iguana') {
		console.log('iguana flock selected...');
		console.log('selected data: '+data);

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


		pm2.connect(true,function(err) { //start up pm2 god
		if (err) {
			console.error(err);
			process.exit(2);
		}

		pm2.start({
			script    : iguanaBin,         // path to binary
			name: 'IGUANA',
			exec_mode : 'fork',
			cwd: iguanaDir, //set correct iguana directory
		}, function(err, apps) {
			pm2.disconnect();   // Disconnect from PM2
				if (err) throw err
			});
		});
	}

	if (flock === 'komodod') {
		console.log('komodod flock selected...');
		console.log('selected data: '+data);

		pm2.connect(true,function(err) { //start up pm2 god
		if (err) {
			console.error(err);
			process.exit(2);
		}

		pm2.start({
			script: komododBin,         // path to binary
			name: data.ac_name,			//REVS, USD, EUR etc.
			exec_mode : 'fork',
			cwd: komodoDir,
			args: data.ac_options,
			//args: ["-server", "-ac_name=USD", "-addnode=78.47.196.146"],  //separate the params with commas
		}, function(err, apps) {
			pm2.disconnect();   // Disconnect from PM2
				if (err) throw err
			});
		});
	}

	if (flock === 'corsproxy') {
		console.log('corsproxy flock selected...');
		console.log('selected data: '+data);

		pm2.connect(true,function(err) { //start up pm2 god
		if (err) {
			console.error(err);
			process.exit(2);
		}

		pm2.start({
			script: CorsProxyBin,         // path to binary
			name: 'CORSPROXY',			//REVS, USD, EUR etc.
			exec_mode : 'fork',
			cwd: iguanaDir,
		}, function(err, apps) {
			pm2.disconnect();   // Disconnect from PM2
				if (err) throw err
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

function setConf(flock) {
	console.log(flock);

	if (os.platform() === 'darwin') {
		var komodoDir = process.env.HOME + '/Library/Application Support/Komodo';
		var ZcashDir = process.env.HOME + '/Library/Application Support/Zcash';
	}
	if (os.platform() === 'linux') {
		var komodoDir = process.env.HOME + '/.komodo'
		var ZcashDir = process.env.HOME + '/.zcash'
	}


	switch (flock) {
		case 'komodod': var DaemonConfPath = komodoDir + '/komodo.conf';
		break;
		case 'zcashd': var DaemonConfPath = ZcashDir + '/zcash.conf';
		break;
		default: var DaemonConfPath = komodoDir + '/' + flock + '/' + flock + '.conf';
	}

	console.log(DaemonConfPath);
	
	var CheckFileExists = function() {

		return new Promise(function(resolve, reject) {
			var result = 'Check Conf file exists is done'

			fs.ensureFile(DaemonConfPath, function (err) {
				console.log(err) // => null
			})
			
			setTimeout(function() {
				console.log(result)
				resolve(result);
			}, 2000)
		})
	}

	var FixFilePermissions = function() {

		return new Promise(function(resolve, reject) {
			var result = 'Conf file permissions updated to Read/Write'

			fsnode.chmodSync(DaemonConfPath, '0666');
			
			setTimeout(function() {
				console.log(result)
				resolve(result);
			}, 1000)
		})
	}

	var RemoveLines = function() {

		return new Promise(function(resolve, reject) {
			var result = 'RemoveLines is done'

			fs.readFile(DaemonConfPath, 'utf8', function (err,data) {
				if (err) {
					return console.log(err);
				}
				var rmlines = data.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, "\n");
				fs.writeFile(DaemonConfPath, rmlines, 'utf8', function (err) {
					if (err) return console.log(err);
				});
			});

			fsnode.chmodSync(DaemonConfPath, '0666');
			setTimeout(function() {
				console.log(result)
				resolve(result);
			}, 2000)
		})
	}

	var CheckConf = function() {

		return new Promise(function(resolve, reject) {
			var result = 'CheckConf is done'

			setconf.status(DaemonConfPath, function(err, status) {
				//console.log(status[0]);
				//console.log(status[0].rpcuser);
				var rpcuser = function() {

					return new Promise(function(resolve, reject) {
						var result = 'checking rpcuser...'
						
						if(status[0].hasOwnProperty('rpcuser')){
							console.log('rpcuser: OK');
						}
						else {
							console.log('rpcuser: NOT FOUND')
							var randomstring = md5(Math.random()*Math.random()*999);

							fs.appendFile(DaemonConfPath, '\nrpcuser=user'+randomstring.substring(0,16), (err) => {
								if (err) throw err;
								console.log('rpcuser: ADDED')
							});
						}

						//console.log(result)
						resolve(result);
					})
				}

				var rpcpass = function() {

					return new Promise(function(resolve, reject) {
						var result = 'checking rpcpass...'

						if(status[0].hasOwnProperty('rpcpass')){
							console.log('rpcpass: OK');
						}
						else {
							console.log('rpcpass: NOT FOUND')
							var randomstring = md5(Math.random()*Math.random()*999);

							fs.appendFile(DaemonConfPath, '\nrpcpass='+randomstring+'\nrpcpassword='+randomstring, (err) => {
								if (err) throw err;
								console.log('rpcpass: ADDED')
							});
						}

						//console.log(result)
						resolve(result);
						})
					}

				var server = function() {

					return new Promise(function(resolve, reject) {
						var result = 'checking server...'

						if(status[0].hasOwnProperty('server')){
							console.log('server: OK');
						}
						else {
							console.log('server: NOT FOUND')
							fs.appendFile(DaemonConfPath, '\nserver=1', (err) => {
								if (err) throw err;
								console.log('server: ADDED')
							});
						}
						
						//console.log(result)
						resolve(result);
						})
					}

				var addnode = function() {

					return new Promise(function(resolve, reject) {
						var result = 'checking addnode...'

						if(status[0].hasOwnProperty('addnode')){
							console.log('addnode: OK');
						}
						else {
							console.log('addnode: NOT FOUND')
							fs.appendFile(DaemonConfPath, '\naddnode=78.47.196.146\naddnode=5.9.102.210\naddnode=178.63.69.164\naddnode=88.198.65.74\naddnode=5.9.122.241\naddnode=144.76.94.3', (err) => {
								if (err) throw err;
								console.log('addnode: ADDED')
							});
						}
						
						//console.log(result)
						resolve(result);
						})
					}

				rpcuser()
				.then(function(result) { 
					return rpcpass();
				})
				.then(server)
				.then(addnode)
			});
			setTimeout(function() {
				console.log(result)
				resolve(result);
			}, 2000)
		})
	}

	var MakeConfReadOnly = function() {

		return new Promise(function(resolve, reject) {
			var result = 'Conf file permissions updated to Read Only'

			fsnode.chmodSync(DaemonConfPath, '0400');
			
			setTimeout(function() {
				console.log(result)
				resolve(result);
			}, 1000)
		})
	}

	CheckFileExists()
	.then(function(result) { 
		return FixFilePermissions();
	})
	.then(RemoveLines)
	.then(CheckConf)
	.then(MakeConfReadOnly)
}


function getConf(flock) {
	console.log(flock);

	if (os.platform() === 'darwin') {
		var komodoDir = process.env.HOME + '/Library/Application Support/Komodo';
		var ZcashDir = process.env.HOME + '/Library/Application Support/Zcash';
	}
	if (os.platform() === 'linux') {
		var komodoDir = process.env.HOME + '/.komodo'
		var ZcashDir = process.env.HOME + '/.zcash'
	}


	switch (flock) {
		case 'komodod': var DaemonConfPath = komodoDir;
		break;
		case 'zcashd': var DaemonConfPath = ZcashDir;
		break;
		default: var DaemonConfPath = komodoDir + '/' + flock;
	}

	console.log(DaemonConfPath);
	return DaemonConfPath
}

module.exports = shepherd;