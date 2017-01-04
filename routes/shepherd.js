const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const os = require('os')
var fs = require('fs');
var fs = require('fs-extra')
var mkdirp = require('mkdirp');
var express = require('express');
var pm2 = require('pm2');
Promise = require('bluebird');

var setconf = require("../private/setconf.js");

var shepherd = express.Router();


// IGUANA FILES AND CONFIG SETTINGS

var iguanaConfsDirSrc = path.join(__dirname, '../assets/deps/confs');

// SETTING OS DIR TO RUN IGUANA FROM
// SETTING APP ICON FOR LINUX AND WINDOWS
if (os.platform() === 'darwin') {
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


		pm2.connect(function(err) { //start up pm2 god
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

		pm2.connect(function(err) { //start up pm2 god
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

	setconf.status(DaemonConfPath, function(err, status) {
		console.log(status);
	});
}

module.exports = shepherd;