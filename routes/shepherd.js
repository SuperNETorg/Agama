const electron = require('electron'),
      app = electron.app,
      BrowserWindow = electron.BrowserWindow,
      path = require('path'),
      url = require('url'),
      os = require('os'),
      fsnode = require('fs'),
      fs = require('fs-extra'),
     	_fs = require('graceful-fs'),
      mkdirp = require('mkdirp'),
      express = require('express'),
      exec = require('child_process').exec,
      spawn = require('child_process').spawn,
      md5 = require('md5'),
      pm2 = require('pm2'),
      request = require('request'),
      async = require('async');

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

			zcashdBin = '/Applications/ZCashSwingWalletUI.app/Contents/MacOS/zcashd',
			zcashcliBin = '/Applications/ZCashSwingWalletUI.app/Contents/MacOS/zcash-cli',
			zcashDir = process.env.HOME + '/Library/Application Support/Zcash';
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
			iguanaDir = process.env.APPDATA + '/iguana';
			iguanaDir = path.normalize(iguanaDir);
			iguanaConfsDir = process.env.APPDATA + '/iguana/confs';
			iguanaConfsDir = path.normalize(iguanaConfsDir);
			iguanaIcon = path.join(__dirname, '/assets/icons/iguana_app_icon.ico'),
			iguanaConfsDirSrc = path.normalize(iguanaConfsDirSrc);

			komododBin = path.join(__dirname, '../assets/bin/win64/komodod.exe'),
			komododBin = path.normalize(komododBin),
			komodocliBin = path.join(__dirname, '../assets/bin/win64/komodo-cli.exe'),
			komodocliBin = path.normalize(komodocliBin),
			komodoDir = process.env.APPDATA + '/Komodo',
			komodoDir = path.normalize(komodoDir);
}

shepherd.appConfig = {
  "edexGuiOnly": true,
  "iguanaGuiOnly": false,
  "manualIguanaStart": false,
  "skipBasiliskNetworkCheck": false,
  "minNotaries": 50,
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
console.log('--------------------------')
console.log('iguana dir: ' + komododBin);
console.log('iguana bin: ' + komodoDir);

// END IGUANA FILES AND CONFIG SETTINGS
shepherd.get('/', function(req, res, next) {
  res.send('Iguana app server');
});

shepherd.get('/appconf', function(req, res, next) {
  var obj = shepherd.loadLocalConfig();
  res.send(obj);
});

shepherd.get('/sysinfo', function(req, res, next) {
  var obj = shepherd.SystemInfo();
  res.send(obj);
});

shepherd.get('/socket-test', function(req, res, next) {
	res.send('Sockets test');
  shepherd.io.emit('messages', { 'message': 'legacy of grewal' });
});

// expose sockets obj
shepherd.setIO = function(io) {
	shepherd.io = io;
};

/*
 *	type: GET
 *	params: pubkey
 */
shepherd.get('/cache', function(req, res, next) {
	var pubkey = req.query.pubkey;

	if (pubkey) {
	  if (fs.existsSync(iguanaDir + '/shepherd/cache-' + pubkey + '.json')) {
			fs.readFile(iguanaDir + '/shepherd/cache-' + pubkey + '.json', 'utf8', function (err, data) {
			  if (err) {
			    var errorObj = {
			      'msg': 'error',
			      'result': err
			    };

			    res.end(JSON.stringify(errorObj));
			  } else {
			  	var parsedJSON = 'JSON parse error';

			  	try {
			  		parsedJSON = JSON.parse(data);
			  	} catch (e) {
			  		console.log('JSON parse error');
			  	}

			    var successObj = {
			      'msg': 'success',
			      'result': parsedJSON
			    };

			  	res.end(JSON.stringify(successObj));
			  }
			});
		} else {
	    var errorObj = {
	      'msg': 'error',
	      'result': 'no file with handle ' + pubkey
	    };

	    res.end(JSON.stringify(errorObj));
		}
	} else {
    var errorObj = {
      'msg': 'error',
      'result': 'no pubkey provided'
    };

    res.end(JSON.stringify(errorObj));
	}
});

/*
 *	type: GET
 *	params: filename
 */
shepherd.get('/groom', function(req, res, next) {
	var _filename = req.query.filename;

	if (_filename) {
	  if (fs.existsSync(iguanaDir + '/shepherd/cache-' + _filename + '.json')) {
			fs.readFile(iguanaDir + '/shepherd/cache-' + _filename + '.json', 'utf8', function (err, data) {
			  if (err) {
			    var errorObj = {
			      'msg': 'error',
			      'result': err
			    };

			    res.end(JSON.stringify(errorObj));
			  } else {
			    var successObj = {
			      'msg': 'success',
			      'result': data ? JSON.parse(data) : ''
			    };

			  	res.end(JSON.stringify(successObj));
			  }
			});
		} else {
	    var errorObj = {
	      'msg': 'error',
	      'result': 'no file with name ' + _filename
	    };

	    res.end(JSON.stringify(errorObj));
		}
	} else {
    var errorObj = {
      'msg': 'error',
      'result': 'no file name provided'
    };

    res.end(JSON.stringify(errorObj));
	}
});

/*
 *	type: DELETE
 *	params: filename
 */
shepherd.delete('/groom', function(req, res, next) {
	var _filename = req.body.filename;

	if (_filename) {
	  if (fs.existsSync(iguanaDir + '/shepherd/cache-' + _filename + '.json')) {
	  	fs.unlink(iguanaDir + '/shepherd/cache-' + _filename + '.json', function(err) {
			  if (err) {
			    var errorObj = {
			      'msg': 'error',
			      'result': err
			    };

			    res.end(JSON.stringify(errorObj));
			  } else {
			    var successObj = {
			      'msg': 'success',
			      'result': 'deleted'
			    };

			  	res.end(JSON.stringify(successObj));
			  }
	  	});
		} else {
	    var errorObj = {
	      'msg': 'error',
	      'result': 'no file with name ' + _filename
	    };

	    res.end(JSON.stringify(errorObj));
		}
	} else {
    var errorObj = {
      'msg': 'error',
      'result': 'no file name provided'
    };

    res.end(JSON.stringify(errorObj));
	}
});

/*
 *	type: POST
 *	params: filename, payload
 */
shepherd.post('/groom', function(req, res) {
  var _filename = req.body.filename,
      _payload = req.body.payload;

	if (_filename) {
		if (!_payload) {
	    var errorObj = {
	      'msg': 'error',
	      'result': 'no payload provided'
	    };

	    res.end(JSON.stringify(errorObj));
		} else {
			fs.writeFile(iguanaDir + '/shepherd/cache-' + _filename + '.json', _payload, function (err) {
			  if (err) {
			    var errorObj = {
			      'msg': 'error',
			      'result': err
			    };

			    res.end(JSON.stringify(errorObj));
			  } else {
			    var successObj = {
			      'msg': 'success',
			      'result': 'done'
			    };

			  	res.end(JSON.stringify(successObj));
			  }
			});
		}
	} else {
    var errorObj = {
      'msg': 'error',
      'result': 'no file name provided'
    };

    res.end(JSON.stringify(errorObj));
	}
});

var cacheCallInProgress = false,
		cacheGlobLifetime = 300; // sec

// TODO: reset calls' states on new /cache call start
/*
 *	type: GET
 *	params: userpass, pubkey, skip
 */
shepherd.get('/cache-all', function(req, res, next) {
	if (req.query.pubkey && !fs.existsSync(iguanaDir + '/shepherd/cache-' + req.query.pubkey + '.json')) {
		cacheCallInProgress = false;
	}

  if (!cacheCallInProgress) {
    cacheCallInProgress = true;

    var sessionKey = req.query.userpass,
		    pubkey = req.query.pubkey,
		    skipTimeout = req.query.skip,
		    _obj = {
		      'msg': 'error',
		      'result': 'error'
		    },
		    outObj = {
		      basilisk: {}
		    },
		    writeCache = function() {
		      fs.writeFile(iguanaDir + '/shepherd/cache-' + pubkey + '.json', JSON.stringify(outObj), function(err) {
		        if (err) {
		          return console.log(err);
		        }

		        console.log('file ' + iguanaDir + '/shepherd/cache-' + pubkey + '.json is updated');
		      });
		    },
		    callStack = {},
		    checkCallStack = function() {
		    	var total = 0;

		      for (var coin in callStack) {
		      	total =+ callStack[coin];
		      }

		    	if (total / Object.keys(callStack).length === 1) {
		    		cacheCallInProgress = false;
				    shepherd.io.emit('messages', {
				  		'message': {
				    		'shepherd': {
				    			'method': 'cache-all',
				    			'status': 'done',
				    			'resp': 'success'
				    		}
				    	}
				    });
		    	}
		    },
		    checkTimestamp = function(dateToCheck) {
			    var currentEpochTime = new Date(Date.now()) / 1000,
			    		secondsElapsed = Number(currentEpochTime) - Number(dateToCheck / 1000);

			    return Math.floor(secondsElapsed);
		    },
		    internalError = false;

		if (!sessionKey) {
	    var errorObj = {
	      'msg': 'error',
	      'result': 'no session key provided'
	    };

	    res.end(JSON.stringify(errorObj));
	    internalError = true;
	  }

		if (!pubkey) {
	    var errorObj = {
	      'msg': 'error',
	      'result': 'no pubkey provided'
	    };

	    res.end(JSON.stringify(errorObj));
	    internalError = true;
	  }

    if (!internalError) {
	    console.log('cache-all call started');
	    shepherd.io.emit('messages', {
    		'message': {
	    		'shepherd': {
	    			'method': 'cache-all',
	    			'status': 'in progress'
	    		}
	    	}
	    });
	    res.end(JSON.stringify({
	      'msg': 'success',
	      'result': 'call is initiated'
	    }));

	    shepherd.io.emit('messages', {
    		'message': {
	    		'shepherd': {
	    			'method': 'cache-all',
	    			'status': 'in progress',
	    			'iguanaAPI': {
	    				'method': 'allcoins',
	    				'status': 'in progress'
	    			}
	    		}
	    	}
	    });
	    request({
	      url: 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/InstantDEX/allcoins?userpass=' + sessionKey,
	      method: 'GET'
	    }, function (error, response, body) {
	      if (response && response.statusCode && response.statusCode === 200) {
			    shepherd.io.emit('messages', {
		    		'message': {
			    		'shepherd': {
			    			'method': 'cache-all',
			    			'status': 'in progress',
			    			'iguanaAPI': {
			    				'method': 'allcoins',
			    				'status': 'done',
			    				'resp': body
			    			}
			    		}
			    	}
			    });
	        body = JSON.parse(body);
	        // basilisk coins
	        if (body.basilisk && body.basilisk.length) {
	          // get coin addresses
	          async.each(body.basilisk, function(coin) {
	          	callStack[coin] = 1;
	          });

	          async.each(body.basilisk, function(coin) {
	            outObj.basilisk[coin] = {};
	            writeCache();

					    shepherd.io.emit('messages', {
				    		'message': {
					    		'shepherd': {
					    			'method': 'cache-all',
					    			'status': 'in progress',
					    			'iguanaAPI': {
					    				'method': 'getaddressesbyaccount',
					    				'coin': coin,
					    				'status': 'in progress'
					    			}
					    		}
					    	}
					    });
	            request({
	              url: 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/bitcoinrpc/getaddressesbyaccount?userpass=' + sessionKey + '&coin=' + coin + '&account=*',
	              method: 'GET'
	            }, function (error, response, body) {
	              if (response && response.statusCode && response.statusCode === 200) {
							    shepherd.io.emit('messages', {
						    		'message': {
							    		'shepherd': {
							    			'method': 'cache-all',
							    			'status': 'in progress',
							    			'iguanaAPI': {
							    				'method': 'getaddressesbyaccount',
							    				'coin': coin,
							    				'status': 'done',
							    				'resp': body
							    			}
							    		}
							    	}
							    });
	                outObj.basilisk[coin].addresses = JSON.parse(body).result;
	                writeCache();
	                var addrCount = outObj.basilisk[coin].addresses ? outObj.basilisk[coin].addresses.length : 0;
	                callStack[coin] = callStack[coin] + addrCount * (coin === 'BTC' || coin === 'SYS' ? 2 : 4);
	                console.log(coin + ' stack len ' + callStack[coin]);

	                async.each(outObj.basilisk[coin].addresses, function(address) {
	                  var dexUrls = {
	                    'listunspent': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/listunspent?userpass=' + sessionKey + '&symbol=' + coin + '&address=' + address,
	                    'listtransactions': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/listtransactions?userpass=' + sessionKey + '&count=100&skip=0&symbol=' + coin + '&address=' + address,
	                    'getbalance': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/getbalance?userpass=' + sessionKey + '&symbol=' + coin + '&address=' + address,
	                    'refresh': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/basilisk/refresh?userpass=' + sessionKey + '&timeout=600000&symbol=' + coin + '&address=' + address
	                  };
	                  if (coin === 'BTC' || coin === 'SYS') {
	                    delete dexUrls.refresh;
	                    delete dexUrls.getbalance;
	                  }
	                  //console.log(JSON.stringify(dexUrls));
	                  console.log(coin + ' address ' + address);
	                  outObj.basilisk[coin][address] = {};
	                  writeCache();

							      // set current call status
							      async.forEachOf(dexUrls, function(dexUrl, key) {
							      	if (!outObj.basilisk[coin][address][key]) {
							      		outObj.basilisk[coin][address][key] = {};
							      		outObj.basilisk[coin][address][key].status = 'waiting';
							      	} else {
							      		outObj.basilisk[coin][address][key].status = 'waiting';
							      	}
							      });
							      writeCache();

							      async.forEachOf(dexUrls, function(dexUrl, key) {
							      	var tooEarly = false;
							      	if (outObj.basilisk[coin][address][key] &&
							      			outObj.basilisk[coin][address][key].timestamp &&
							      			checkTimestamp(outObj.basilisk[coin][address][key].timestamp) < cacheGlobLifetime) {
							      		tooEarly = true;
							      		outObj.basilisk[coin][address][key].status = 'done';
										    shepherd.io.emit('messages', {
									    		'message': {
										    		'shepherd': {
										    			'method': 'cache-all',
										    			'status': 'in progress',
										    			'iguanaAPI': {
										    				'method': key,
										    				'coin': coin,
										    				'address': address,
										    				'status': 'done',
										    				'resp': 'too early'
										    			}
										    		}
										    	}
										    });
							      	}
							      	tooEarly = skipTimeout ? false : tooEarly;
							        if (!tooEarly) {
										    shepherd.io.emit('messages', {
									    		'message': {
										    		'shepherd': {
										    			'method': 'cache-all',
										    			'status': 'in progress',
										    			'iguanaAPI': {
										    				'method': key,
										    				'coin': coin,
										    				'address': address,
										    				'status': 'in progress'
										    			}
										    		}
										    	}
										    });
				        				outObj.basilisk[coin][address][key].status = 'in progress';
								        request({
								          url: dexUrl,
								          method: 'GET'
								        }, function (error, response, body) {
								          if (response && response.statusCode && response.statusCode === 200) {
												    shepherd.io.emit('messages', {
											    		'message': {
												    		'shepherd': {
												    			'method': 'cache-all',
												    			'status': 'in progress',
												    			'iguanaAPI': {
												    				'method': key,
												    				'coin': coin,
												    				'address': address,
												    				'status': 'done',
												    				'resp': body
												    			}
												    		}
												    	}
												    });
							              outObj.basilisk[coin][address][key] = {};
							              outObj.basilisk[coin][address][key].data = JSON.parse(body);
								            outObj.basilisk[coin][address][key].timestamp = Date.now(); // add timestamp
								            outObj.basilisk[coin][address][key].status = 'done';
								            console.log(dexUrl);
								            console.log(body);
								            callStack[coin]--;
								            console.log(coin + ' _stack len ' + callStack[coin]);
								            checkCallStack();

								            writeCache();
								          }
								        });
							        } else {
							        	console.log(key + ' is fresh, check back in ' + (cacheGlobLifetime - checkTimestamp(outObj.basilisk[coin][address][key].timestamp)) + 's');
							          callStack[coin]--;
							          console.log(coin + ' _stack len ' + callStack[coin]);
							          checkCallStack();
							        }
							      });
	                });
	              } else {
	                // TODO: error
	              }
	            });
	          });
	        } else {
	          // TODO: error
	        }
	      } else {
	        // TODO: error
	      }
	    });
	  } else {
	    shepherd.io.emit('messages', {
	  		'message': {
	    		'shepherd': {
	    			'method': 'cache-all',
	    			'status': 'done',
	    			'resp': 'internal error'
	    		}
	    	}
	    });
	  	cacheCallInProgress = false;
	  }
  } else {
    res.end(JSON.stringify({
      'msg': 'error',
      'result': 'another call is in progress already'
    }));
  }
});

/*
 *	type: GET
 *	params: userpass, pubkey, coin, address, skip
 */
shepherd.get('/cache-one', function(req, res, next) {
	if (req.query.pubkey && !fs.existsSync(iguanaDir + '/shepherd/cache-' + req.query.pubkey + '.json')) {
		cacheCallInProgress = false;
	}

  if (!cacheCallInProgress) {
  	// TODO: add check to allow only one cache call/sequence in progress
  	cacheCallInProgress = true;
	  var sessionKey = req.query.userpass,
	  		coin = req.query.coin,
	  		address = req.query.address,
	  		pubkey = req.query.pubkey,
	  		skipTimeout = req.query.skip,
	  		callsArray = req.query.calls.split(':'),
			  errorObj = {
			    'msg': 'error',
			    'result': 'error'
			  },
			  outObj = {},
			  pubkey,
			  writeCache = function(timeStamp) {
			  	if (timeStamp) {
			  		outObj.timestamp = timeStamp;
			  	}

			    fs.writeFile(iguanaDir + '/shepherd/cache-' + pubkey + '.json', JSON.stringify(outObj), function(err) {
			      if (err) {
			        return console.log(err);
			      }

			      console.log('file ' + iguanaDir + '/shepherd/cache-' + pubkey + '.json is updated');
			      if (timeStamp) {
			      	console.log('file ' + iguanaDir + '/shepherd/cache-' + pubkey + '.json is timestamped');
			    	}
			    });
			  },
		    callStack = {},
		    checkCallStack = function() {
		    	var total = 0;

		      for (var coin in callStack) {
		      	total =+ callStack[coin];
		      }

		    	if (total / Object.keys(callStack).length === 1) {
		    		cacheCallInProgress = false;
				    shepherd.io.emit('messages', {
				  		'message': {
				    		'shepherd': {
				    			'method': 'cache-one',
				    			'status': 'done',
				    			'resp': 'success'
				    		}
				    	}
				    });
		    		// add timestamp to cache file
		    		// writeCache(Date.now());
		    	}
		    },
		    checkTimestamp = function(dateToCheck) {
			    var currentEpochTime = new Date(Date.now()) / 1000,
			    		secondsElapsed = Number(currentEpochTime) - Number(dateToCheck / 1000);

			    return Math.floor(secondsElapsed);
		    },
		    internalError = false;

		callStack[coin] = 1;
		console.log(callsArray);

		if (!sessionKey) {
	    var errorObj = {
	      'msg': 'error',
	      'result': 'no session key provided'
	    };

	    res.end(JSON.stringify(errorObj));
	    internalError = true;
	  }

		if (!pubkey) {
	    var errorObj = {
	      'msg': 'error',
	      'result': 'no pubkey provided'
	    };

	    res.end(JSON.stringify(errorObj));
	    internalError = true;
	  }

    console.log('cache-one call started');

	  if (fs.existsSync(iguanaDir + '/shepherd/cache-' + pubkey + '.json')) {
			var _file = fs.readFileSync(iguanaDir + '/shepherd/cache-' + pubkey + '.json', 'utf8');
			outObj = _file ? JSON.parse(_file) : {};

			if (!outObj || !outObj.basilisk) {
				console.log('no local basilisk info');
				outObj['basilisk'] = {};
				outObj['basilisk'][coin] = {};
			} else {
				if (!outObj['basilisk'][coin]) {
					console.log('no local coin info');
					outObj['basilisk'][coin] = {};
				}
			}
		} else {
			outObj['basilisk'] = {};
			outObj['basilisk'][coin] = {};
		}

    res.end(JSON.stringify({
      'msg': 'success',
      'result': 'call is initiated'
    }));

    if (!internalError) {
	    shepherd.io.emit('messages', {
	  		'message': {
	    		'shepherd': {
	    			'method': 'cache-one',
	    			'status': 'in progress'
	    		}
	    	}
	    });
			// update all available coin addresses
			if (!address) {
		    shepherd.io.emit('messages', {
	    		'message': {
		    		'shepherd': {
		    			'method': 'cache-one',
		    			'status': 'in progress',
		    			'iguanaAPI': {
		    				'method': 'getaddressesbyaccount',
		    				'coin': coin,
		    				'status': 'in progress'
		    			}
		    		}
		    	}
		    });
	      request({
	        url: 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/bitcoinrpc/getaddressesbyaccount?userpass=' + sessionKey + '&coin=' + coin + '&account=*',
	        method: 'GET'
	      }, function (error, response, body) {
	        if (response && response.statusCode && response.statusCode === 200) {
				    shepherd.io.emit('messages', {
			    		'message': {
				    		'shepherd': {
				    			'method': 'cache-one',
				    			'status': 'in progress',
				    			'iguanaAPI': {
				    				'method': 'getaddressesbyaccount',
				    				'coin': coin,
				    				'status': 'done',
				    				'resp': body
				    			}
				    		}
				    	}
				    });
	          outObj.basilisk[coin].addresses = JSON.parse(body).result;
	          console.log(JSON.parse(body).result);
	          writeCache();
	          var addrCount = outObj.basilisk[coin].addresses ? outObj.basilisk[coin].addresses.length : 0;
	          callStack[coin] = callStack[coin] + addrCount * (coin === 'BTC' || coin === 'SYS' ? callsArray.length - 2 : callsArray.length);
	          console.log(coin + ' stack len ' + callStack[coin]);

	          async.each(outObj.basilisk[coin].addresses, function(address) {
	            var dexUrls = {
	              'listunspent': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/listunspent?userpass=' + sessionKey + '&symbol=' + coin + '&address=' + address,
	              'listtransactions': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/listtransactions?userpass=' + sessionKey + '&count=100&skip=0&symbol=' + coin + '&address=' + address,
	              'getbalance': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/getbalance?userpass=' + sessionKey + '&symbol=' + coin + '&address=' + address,
	              'refresh': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/basilisk/refresh?userpass=' + sessionKey + '&timeout=600000&symbol=' + coin + '&address=' + address
	            },
	            _dexUrls = {};

	            for (var a = 0; a < callsArray.length; a++) {
	            	_dexUrls[callsArray[a]] = dexUrls[callsArray[a]];
	            }
	            if (coin === 'BTC' || coin === 'SYS') {
	              delete _dexUrls.refresh;
	              delete _dexUrls.getbalance;
	            }
	            //console.log(JSON.stringify(dexUrls));
	            console.log(coin + ' address ' + address);
				      if (!outObj.basilisk[coin][address]) {
				      	outObj.basilisk[coin][address] = {};
				      	writeCache();
				      }

				      // set current call status
				      async.forEachOf(_dexUrls, function(dexUrl, key) {
				      	if (!outObj.basilisk[coin][address][key]) {
				      		outObj.basilisk[coin][address][key] = {};
				      		outObj.basilisk[coin][address][key].status = 'waiting';
				      	} else {
				      		outObj.basilisk[coin][address][key].status = 'waiting';
				      	}
				      });
				      writeCache();

	            async.forEachOf(_dexUrls, function(dexUrl, key) {
	            	var tooEarly = false;
	            	if (outObj.basilisk[coin][address][key] &&
	            			outObj.basilisk[coin][address][key].timestamp &&
	            			checkTimestamp(outObj.basilisk[coin][address][key].timestamp) < cacheGlobLifetime) {
	            		tooEarly = true;
				      		outObj.basilisk[coin][address][key].status = 'done';
							    shepherd.io.emit('messages', {
						    		'message': {
							    		'shepherd': {
							    			'method': 'cache-one',
							    			'status': 'in progress',
							    			'iguanaAPI': {
							    				'method': key,
							    				'coin': coin,
							    				'address': address,
							    				'status': 'done',
							    				'resp': 'too early'
							    			}
							    		}
							    	}
							    });
	            	}
	            	tooEarly = skipTimeout ? false : tooEarly;
	              if (!tooEarly) {
							    shepherd.io.emit('messages', {
						    		'message': {
							    		'shepherd': {
							    			'method': 'cache-one',
							    			'status': 'in progress',
							    			'iguanaAPI': {
							    				'method': key,
							    				'coin': coin,
							    				'address': address,
							    				'status': 'in progress'
							    			}
							    		}
							    	}
							    });
	        				outObj.basilisk[coin][address][key].status = 'in progress';
		              request({
		                url: dexUrl,
		                method: 'GET'
		              }, function (error, response, body) {
		                if (response && response.statusCode && response.statusCode === 200) {
									    shepherd.io.emit('messages', {
								    		'message': {
									    		'shepherd': {
									    			'method': 'cache-one',
									    			'status': 'in progress',
									    			'iguanaAPI': {
									    				'method': key,
									    				'coin': coin,
									    				'address': address,
									    				'status': 'done',
									    				'resp': body
									    			}
									    		}
									    	}
									    });
		                  outObj.basilisk[coin][address][key] = {};
		                  outObj.basilisk[coin][address][key].data = JSON.parse(body);
		                  outObj.basilisk[coin][address][key].timestamp = Date.now(); // add timestamp
					            outObj.basilisk[coin][address][key].status = 'done';
		                  console.log(dexUrl);
		                  console.log(body);
		                  callStack[coin]--;
		                  console.log(coin + ' _stack len ' + callStack[coin]);
		                  checkCallStack();

		                  writeCache();
		                }
		              });
		            } else {
		            	console.log(key + ' is fresh, check back in ' + (cacheGlobLifetime - checkTimestamp(outObj.basilisk[coin][address][key].timestamp)) + 's');
	                callStack[coin]--;
	                console.log(coin + ' _stack len ' + callStack[coin]);
	                checkCallStack();
		            }
	            });
	          });
	        } else {
	          // TODO: error
	        }
	      });
			} else {
	      callStack[coin] = callStack[coin] + (coin === 'BTC' ? callsArray.length : callsArray.length - 2);
	      console.log(coin + ' stack len ' + callStack[coin]);

	      var dexUrls = {
	        'listunspent': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/listunspent?userpass=' + sessionKey + '&symbol=' + coin + '&address=' + address,
	        'listtransactions': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/listtransactions?userpass=' + sessionKey + '&count=100&skip=0&symbol=' + coin + '&address=' + address,
	        'getbalance': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/getbalance?userpass=' + sessionKey + '&symbol=' + coin + '&address=' + address,
	        'refresh': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/basilisk/refresh?userpass=' + sessionKey + '&timeout=600000&symbol=' + coin + '&address=' + address
	      },
	      _dexUrls = {};

	      for (var a = 0; a < callsArray.length; a++) {
	      	_dexUrls[callsArray[a]] = dexUrls[callsArray[a]];
	      }
	      if (coin === 'BTC' || coin === 'SYS') {
	        delete _dexUrls.refresh;
	        delete _dexUrls.getbalance;
	      }
	      //console.log(JSON.stringify(dexUrls));
	      console.log(coin + ' address ' + address);
	      if (!outObj.basilisk[coin][address]) {
	      	outObj.basilisk[coin][address] = {};
	      	writeCache();
	      }
	      console.log(_dexUrls);

	      // set current call status
	      async.forEachOf(_dexUrls, function(dexUrl, key) {
	      	if (!outObj.basilisk[coin][address][key]) {
	      		outObj.basilisk[coin][address][key] = {};
	      		outObj.basilisk[coin][address][key].status = 'waiting';
	      	} else {
	      		outObj.basilisk[coin][address][key].status = 'waiting';
	      	}
	      });
	      writeCache();

	      async.forEachOf(_dexUrls, function(dexUrl, key) {
	      	var tooEarly = false;
	      	if (outObj.basilisk[coin][address][key] &&
	      			outObj.basilisk[coin][address][key].timestamp &&
	      			checkTimestamp(outObj.basilisk[coin][address][key].timestamp) < cacheGlobLifetime) {
	      		tooEarly = true;
	      		outObj.basilisk[coin][address][key].status = 'done';
				    shepherd.io.emit('messages', {
			    		'message': {
				    		'shepherd': {
				    			'method': 'cache-one',
				    			'status': 'in progress',
				    			'iguanaAPI': {
				    				'method': key,
				    				'coin': coin,
				    				'address': address,
				    				'status': 'done',
				    				'resp': 'too early'
				    			}
				    		}
				    	}
				    });
	      	}
	        if (!tooEarly) {
				    shepherd.io.emit('messages', {
			    		'message': {
				    		'shepherd': {
				    			'method': 'cache-one',
				    			'status': 'in progress',
				    			'iguanaAPI': {
				    				'method': key,
				    				'coin': coin,
				    				'address': address,
				    				'status': 'in progress'
				    			}
				    		}
				    	}
				    });
	        	outObj.basilisk[coin][address][key].status = 'in progress';
		        request({
		          url: dexUrl,
		          method: 'GET'
		        }, function (error, response, body) {
		          if (response && response.statusCode && response.statusCode === 200) {
						    shepherd.io.emit('messages', {
					    		'message': {
						    		'shepherd': {
						    			'method': 'cache-one',
						    			'status': 'in progress',
						    			'iguanaAPI': {
						    				'method': key,
						    				'coin': coin,
						    				'address': address,
						    				'status': 'done',
						    				'resp': body
						    			}
						    		}
						    	}
						    });
	              outObj.basilisk[coin][address][key] = {};
	              outObj.basilisk[coin][address][key].data = JSON.parse(body);
		            outObj.basilisk[coin][address][key].timestamp = Date.now(); // add timestamp
		            outObj.basilisk[coin][address][key].status = 'done';
		            console.log(dexUrl);
		            console.log(body);
		            callStack[coin]--;
		            console.log(coin + ' _stack len ' + callStack[coin]);
		            checkCallStack();

		            writeCache();
		          }
		        });
	        } else {
	        	console.log(key + ' is fresh, check back in ' + (cacheGlobLifetime - checkTimestamp(outObj.basilisk[coin][address][key].timestamp)) + 's');
	          callStack[coin]--;
	          console.log(coin + ' _stack len ' + callStack[coin]);
	          checkCallStack();
	        }
	      });
			}
		} else {
	    shepherd.io.emit('messages', {
    		'message': {
	    		'shepherd': {
	    			'method': 'cache-all',
	    			'status': 'done',
	    			'resp': 'internal error'
	    		}
	    	}
	    });
			cacheCallInProgress = false;
		}
  } else {
    res.end(JSON.stringify({
      'msg': 'error',
      'result': 'another call is in progress already'
    }));
  }
});

/*
 *	type: GET
 *	params: herd, lastLines
 */
shepherd.post('/debuglog', function(req, res) {
  var _herd = req.body.herdname,
      _lastNLines = req.body.lastLines,
      _location;

  if (_herd === 'iguana') {
    _location = iguanaDir;
  } else if (_herd === 'komodo') {
    _location = komodoDir;
  }

  shepherd.readDebugLog(_location + '/debug.log', _lastNLines)
    .then(function(result) {
      var _obj = {
        'msg': 'success',
        'result': result
      };

      res.end(JSON.stringify(_obj));
    }, function(result) {
      var _obj = {
        'msg': 'error',
        'result': result
      };

      res.end(JSON.stringify(_obj));
    });
});

/*
 *	type: POST
 *	params: herd
 */
shepherd.post('/herd', function(req, res) {
  console.log('======= req.body =======');
  //console.log(req);
  console.log(req.body);
  //console.log(req.body.herd);
  //console.log(req.body.options);

  herder(req.body.herd, req.body.options);

  var obj = {
    'msg': 'success',
    'result': 'result'
  };

  res.end(JSON.stringify(obj));
});

/*
 *	type: POST
 *	params: herdname
 */
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

      var obj = {
        'herdname': req.body.herdname,
        'status': list[0].pm2_env.status,
        'pid': list[0].pid
      };

      res.end(JSON.stringify(obj));
     });
  });
});

/*
 *	type: POST
 */
shepherd.post('/slay', function(req, res) {
  console.log('======= req.body =======');
  //console.log(req);
  console.log(req.body);
  //console.log(req.body.slay);

  slayer(req.body.slay);
  var obj = {
    'msg': 'success',
    'result': 'result'
  };

  res.end(JSON.stringify(obj));
});

/*
 *	type: POST
 */
shepherd.post('/setconf', function(req, res) {
  console.log('======= req.body =======');
  //console.log(req);
  console.log(req.body);
  //console.log(req.body.chain);

  if (os.platform() === 'win32' && req.body.chain == 'komodod') {
  	setkomodoconf = spawn(path.join(__dirname, '../assets/bin/win64/genkmdconf.bat'));
  } else {
  	setConf(req.body.chain);
  }


  var obj = {
    'msg': 'success',
    'result': 'result'
  };

  res.end(JSON.stringify(obj));
});

/*
 *	type: POST
 */
shepherd.post('/getconf', function(req, res) {
  console.log('======= req.body =======');
  //console.log(req);
  console.log(req.body);
  //console.log(req.body.chain);

  var confpath = getConf(req.body.chain);
  console.log('got conf path is:');
  console.log(confpath);
  var obj = {
    'msg': 'success',
    'result': confpath
  };

  res.end(JSON.stringify(obj));
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

shepherd.readDebugLog = function(fileLocation, lastNLines) {
  return new Promise(
    function(resolve, reject) {
      if (lastNLines) {
        _fs.access(fileLocation, fs.constants.R_OK, function(err) {
		      if (err) {
	          console.log('error reading ' + fileLocation);
		        reject('readDebugLog error: ' + err);
		      } else {
          	console.log('reading ' + fileLocation);
						_fs.readFile(fileLocation, 'utf-8', function(err, data) {
					    if (err) throw err;

					    var lines = data.trim().split('\n'),
					    		lastLine = lines.slice(lines.length - lastNLines, lines.length).join('\n');
					    resolve(lastLine);
						});
	        }
        });
      } else {
        reject('readDebugLog error: lastNLines param is not provided!');
      }
    }
  );
};

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

    // ADD SHEPHERD FOLDER
    mkdirp(iguanaDir + '/shepherd', function(err) {
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
        cwd: iguanaDir //set correct iguana directory
      }, function(err, apps) {
        pm2.disconnect(); // Disconnect from PM2
          if (err)
            throw err;
      });
    });
  }

  if (flock === 'komodod') {
  	var kmdDebugLogLocation = komodoDir + '/debug.log';
    console.log('komodod flock selected...');
    console.log('selected data: ' + data);

    // truncate debug.log
		_fs.access(kmdDebugLogLocation, fs.constants.R_OK, function(err) {
      if (err) {
        console.log('error accessing ' + kmdDebugLogLocation);
      } else {
      	console.log('truncate ' + kmdDebugLogLocation);
		    fs.unlink(kmdDebugLogLocation);
			}
	  });

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
        args: data.ac_options
        //args: ["-server", "-ac_name=USD", "-addnode=78.47.196.146"],  //separate the params with commas
      }, function(err, apps) {
        pm2.disconnect();   // Disconnect from PM2
          if (err)
            throw err;
      });
    });
  }

  if (flock === 'zcashd') {
  	var kmdDebugLogLocation = zcashDir + '/debug.log';
    console.log('zcashd flock selected...');
    console.log('selected data: ' + data);

    pm2.connect(true, function(err) { // start up pm2 god
      if (err) {
        console.error(err);
        process.exit(2);
      }

      pm2.start({
        script: zcashdBin, // path to binary
        name: data.ac_name, // REVS, USD, EUR etc.
        exec_mode : 'fork',
        cwd: zcashDir,
        args: data.ac_options
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
      name: 'CORSPROXY',
      exec_mode : 'fork',
      cwd: iguanaDir
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

	if (os.platform() === 'win32') {
		var komodoDir = process.env.APPDATA + '/Komodo',
				ZcashDir = process.env.APPDATA + '/Zcash';
	}

	switch (flock) {
		case 'komodod':
			var DaemonConfPath = komodoDir + '/komodo.conf';
			if (os.platform() === 'win32') {
				DaemonConfPath = path.normalize(DaemonConfPath);
			}
			break;
		case 'zcashd':
			var DaemonConfPath = ZcashDir + '/zcash.conf';
			if (os.platform() === 'win32') {
				DaemonConfPath = path.normalize(DaemonConfPath);
			}
			break;
		default:
			var DaemonConfPath = komodoDir + '/' + flock + '/' + flock + '.conf';
			if (os.platform() === 'win32') {
				DaemonConfPath = path.normalize(DaemonConfPath);
			}
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

							fs.appendFile(DaemonConfPath, '\nrpcpassword=' + randomstring, (err) => {
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

  	if (os.platform() === 'win32') {
		var komodoDir = process.env.APPDATA + '/Komodo',
			ZcashDir = process.env.APPDATA + '/Zcash';
	}

	switch (flock) {
		case 'komodod':
			var DaemonConfPath = komodoDir;
			if (os.platform() === 'win32') {
				DaemonConfPath = path.normalize(DaemonConfPath);
				console.log('===>>> SHEPHERD API OUTPUT ===>>>');
				console.log(DaemonConfPath);
			}
			break;
		case 'zcashd':
			var DaemonConfPath = ZcashDir;
			if (os.platform() === 'win32') {
				DaemonConfPath = path.normalize(DaemonConfPath);
			}
			break;
		default:
			var DaemonConfPath = komodoDir + '/' + flock;
			if (os.platform() === 'win32') {
				DaemonConfPath = path.normalize(DaemonConfPath);
			}
	}

  console.log(DaemonConfPath);
  return DaemonConfPath;
}

function formatBytes(bytes,decimals) {
   if(bytes == 0) return '0 Bytes';
   var k = 1000,
       dm = decimals + 1 || 3,
       sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
       i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

shepherd.SystemInfo = function() {
	os_data = {
		'totalmem_bytes': os.totalmem(),
		'totalmem_readble': formatBytes(os.totalmem()),
		'arch': os.arch(),
		'cpu': os.cpus()[0].model,
		'cpu_cors': os.cpus().length,
		'platform': os.platform(),
		'os_release': os.release(),
		'os_type': os.type()
	}
	return os_data
}



module.exports = shepherd;