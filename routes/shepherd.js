const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const os = require('os')
var fs = require('fs');
var fs = require('fs-extra')
var mkdirp = require('mkdirp');

var pm2 = require('pm2');


// IGUANA FILES AND CONFIG SETTINGS

var iguanaConfsDirSrc = path.join(__dirname, '../assets/deps/confs');

// SETTING OS DIR TO RUN IGUANA FROM
// SETTING APP ICON FOR LINUX AND WINDOWS
if (os.platform() === 'darwin') {
	var iguanaBin = path.join(__dirname, '../assets/bin/osx/iguana');
	var iguanaDir = process.env.HOME + '/Library/Application Support/iguana';
	var iguanaConfsDir = iguanaDir + '/confs';
}
if (os.platform() === 'linux') {
	var iguanaBin = path.join(__dirname, '../assets/bin/linux64/iguana');
	var iguanaDir = process.env.HOME + '/.iguana'
	var iguanaConfsDir = iguanaDir + '/confs';
	var iguanaIcon = path.join(__dirname, '/assets/icons/iguana_app_icon_png/128x128.png')
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


var express = require('express');
var shepherd = express.Router();

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


function herder(flock, options) {
	//console.log(flock);
	//console.log(options);
	
	if (options == undefined) { options = 'none'; console.log('it is undefined'); }

	if (flock === 'iguana') {
		console.log('iguana flock selected...');
		console.log('selected options: '+options);

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
		console.log('selected options: '+options);
	}
}


function slayer(flock) {
	console.log(flock);

	pm2.delete('IGUANA', function(err, ret) {
		should(err).be.null()
		pm2.list(function(err, ret) {
			should(err).be.null()
			ret.length.should.eql(8);
			done();
		});
	});
}


module.exports = shepherd;