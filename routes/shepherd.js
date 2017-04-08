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
      async = require('async'),
      rimraf = require('rimraf'),
      portscanner = require('portscanner');

Promise = require('bluebird');

const fixPath = require('fix-path');
var ps = require('ps-node'),
    setconf = require('../private/setconf.js'),
    kmdcli = require('../private/kmdcli.js'),
    assetChainPorts = require('./ports.js')
    shepherd = express.Router(),
    iguanaInstanceRegistry = {};

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
      iguanaIcon = path.join(__dirname, '/assets/icons/agama_icons/128x128.png'),
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
      iguanaIcon = path.join(__dirname, '/assets/icons/agama_icons/agama_app_icon.ico'),
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
  "minNotaries": 8,
  "host": "127.0.0.1",
  "iguanaAppPort": 17777,
  "iguanaCorePort": 7778,
  "maxDescriptors": {
    "darwin": 90000,
    "linux": 1000000
  },
  "killIguanaOnStart": true,
  "dev": false
};

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
  .then(FixFilePermissions());
}

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

    if (localAppConfig) {
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
      return shepherd.appConfig;
    }
  } else {
    console.log('local config file is not found!');
    shepherd.saveLocalAppConf(shepherd.appConfig);

    return shepherd.appConfig;
  }
};

shepherd.appConfig = shepherd.loadLocalConfig();

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

var cache = require('./cache');
var mock = require('./mock');

// expose sockets obj
shepherd.setIO = function(io) {
  shepherd.io = io;
  cache.setVar('io', io);
};

cache.setVar('iguanaDir', iguanaDir);
cache.setVar('appConfig', shepherd.appConfig);

/*
 *  type: GET
 *
 */
shepherd.get('/forks', function(req, res, next) {
  var successObj = {
    'msg': 'success',
    'result': iguanaInstanceRegistry
  };

  res.end(JSON.stringify(successObj));
});

/*
 *  type: POST
 *  params: name
 */
shepherd.post('/forks', function(req, res, next) {
  const name = req.body.name;
        port = shepherd.appConfig.iguanaCorePort;

  portscanner.findAPortNotInUse(port, port + 100, '127.0.0.1', function(error, _port) {
    pm2.connect(true, function(err) { //start up pm2 god
      if (err) {
        console.error(err);
        process.exit(2);
      }

      console.log('iguana core fork port ' + _port);
      pm2.start({
        script: iguanaBin, // path to binary
        name: 'IGUANA ' + _port + ' ' + name,
        exec_mode : 'fork',
        args: ['-port=' + _port],
        cwd: iguanaDir //set correct iguana directory
      }, function(err, apps) {
        iguanaInstanceRegistry[_port] = name;

        var successObj = {
          'msg': 'success',
          'result': _port
        };

        res.end(JSON.stringify(successObj));

        pm2.disconnect(); // Disconnect from PM2
          if (err) {
            throw err;
            console.log('iguana fork error: ' + err);
          }
      });
    });
  });
});

/*
 *  type: GET
 *  params: pubkey
 */
shepherd.get('/cache', function(req, res, next) {
  cache.get(req, res, next);
});

/*
 *  type: GET
 *  params: filename
 */
shepherd.get('/groom', function(req, res, next) {
  cache.groomGet(req, res, next);
})

/*
 *  type: DELETE
 *  params: filename
 */
shepherd.delete('/groom', function(req, res, next) {
  cache.groomDelete(req, res, next);
});

/*
 *  type: POST
 *  params: filename, payload
 */
shepherd.post('/groom', function(req, res) {
  cache.groomPost(req, res, next);
});

/*
 *  type: GET
 *  params: userpass, pubkey, skip
 */
shepherd.get('/cache-all', function(req, res, next) {
  cache.all(req, res, next);
});

/*
 *  type: GET
 *  params: userpass, pubkey, coin, address, skip
 */
shepherd.get('/cache-one', function(req, res, next) {
  cache.one(req, res, next);
});

/*
 *  type: GET
 */
shepherd.get('/mock', function(req, res, next) {
  mock.get(req, res, next);
});

/*
 *  type: GET
 *  params: herd, lastLines
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
 *  type: POST
 *  params: herd
 */
shepherd.post('/herd', function(req, res) {
  console.log('======= req.body =======');
  console.log(req.body);

  herder(req.body.herd, req.body.options);

  var obj = {
    'msg': 'success',
    'result': 'result'
  };

  res.end(JSON.stringify(obj));

  if (req.body.herd === 'komodod') {
    var _port = assetChainPorts[req.body.options.ac_name];
    // check if komodod instance is already running
    setTimeout(function() {
      portscanner.checkPortStatus(_port, '127.0.0.1', function(error, status) {
        // Status is 'open' if currently in use or 'closed' if available
        if (status === 'closed') {
          cache.io.emit('service', {
            'komodod': {
              'error': 'start error'
            }
          });
        }
      });
    }, 10000);
  }
});

/*
 *  type: POST
 *  params: herdname
 */
shepherd.post('/herdlist', function(req, res) {
  console.log(req.body.herdname);

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
 *  type: POST
 */
shepherd.post('/slay', function(req, res) {
  console.log('======= req.body =======');
  console.log(req.body);

  slayer(req.body.slay);
  var obj = {
    'msg': 'success',
    'result': 'result'
  };

  res.end(JSON.stringify(obj));
});

/*
 *  type: POST
 */
shepherd.post('/setconf', function(req, res) {
  console.log('======= req.body =======');
  console.log(req.body);

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
 *  type: POST
 */
shepherd.post('/getconf', function(req, res) {
  console.log('======= req.body =======');
  console.log(req.body);

  var confpath = getConf(req.body.chain);
  console.log('got conf path is:');
  console.log(confpath);
  var obj = {
    'msg': 'success',
    'result': confpath
  };

  res.end(JSON.stringify(obj));
});

/*
 *  type: GET
 *  params: coin, type
 */
shepherd.get('/kick', function(req, res, next) {
  var _coin = req.query.coin,
      _type = req.query.type;

  if (!_coin) {
    var errorObj = {
      'msg': 'error',
      'result': 'no coin name provided'
    };

    res.end(JSON.stringify(errorObj));
  }

  if (!_type) {
    var errorObj = {
      'msg': 'error',
      'result': 'no type provided'
    };

    res.end(JSON.stringify(errorObj));
  }

  var kickStartDirs = {
    'soft': [
      {
        'name': 'DB/[coin]',
        'type': 'pattern',
        'match': 'balancecrc.'
      },
      {
        'name': 'DB/[coin]/utxoaddrs',
        'type': 'file'
      },
      {
        'name': 'DB/[coin]/accounts',
        'type': 'folder'
      },
      {
        'name': 'DB/[coin]/fastfind',
        'type': 'folder'
      },
      {
        'name': 'tmp/[coin]',
        'type': 'folder'
      }
    ],
    'hard': [
      {
        'name': 'DB/[coin]',
        'type': 'pattern',
        'match': 'balancecrc.'
      },
      {
        'name': 'DB/[coin]/utxoaddrs',
        'type': 'file'
      },
      {
        'name': 'DB/[coin]',
        'type': 'pattern',
        'match': 'utxoaddrs.'
      },
      {
        'name': 'DB/[coin]/accounts',
        'type': 'folder'
      },
      {
        'name': 'DB/[coin]/fastfind',
        'type': 'folder'
      },
      {
        'name': 'DB/[coin]/spends',
        'type': 'folder'
      },
      {
        'name': 'tmp/[coin]',
        'type': 'folder'
      }
    ],
    'brutal': [ // delete coin related data
      {
        'name': 'DB/[coin]',
        'type': 'folder'
      },
      {
        'name': 'DB/purgeable/[coin]',
        'type': 'folder'
      },
      {
        'name': 'DB/ro/[coin]',
        'type': 'folder'
      },
      {
        'name': 'tmp/[coin]',
        'type': 'folder'
      }
    ]
  };

  if (_coin && _type) {
    for (var i = 0; i < kickStartDirs[_type].length; i++) {
      var currentKickItem = kickStartDirs[_type][i];

      console.log('deleting ' + currentKickItem.type + (currentKickItem.match ? ' ' + currentKickItem.match : '') + ' ' + iguanaDir + '/' + currentKickItem.name.replace('[coin]', _coin));
      if (currentKickItem.type === 'folder' || currentKickItem.type === 'file') {
        rimraf(iguanaDir + '/' + currentKickItem.name.replace('[coin]', _coin), function(err) {
          if (err) {
            throw err;
          }
        });
      } else if (currentKickItem.type === 'pattern') {
        var dirItems = fs.readdirSync(iguanaDir + '/' + currentKickItem.name.replace('[coin]', _coin));

        if (dirItems && dirItems.length) {
          for (var j = 0; j < dirItems.length; j++) {
            if (dirItems[j].indexOf(currentKickItem.match) > -1) {
              rimraf(iguanaDir + '/' + currentKickItem.name.replace('[coin]', _coin) + '/' + dirItems[j], function(err) {
                if (err) {
                  throw err;
                }
              });

              console.log('deleting ' + dirItems[j]);
            }
          }
        }
      }
    }

    var successObj = {
      'msg': 'success',
      'result': 'kickstart: brutal is executed'
    };

    res.end(JSON.stringify(successObj));
  }
});

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
  if (data == undefined) {
    data = 'none';
    console.log('it is undefined');
  }

  if (flock === 'iguana') {
    console.log('iguana flock selected...');
    console.log('selected data: ' + data);

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

      console.log('iguana core port ' + shepherd.appConfig.iguanaCorePort);
      pm2.start({
        script: iguanaBin, // path to binary
        name: 'IGUANA',
        exec_mode : 'fork',
        args: ['-port=' + shepherd.appConfig.iguanaCorePort],
        cwd: iguanaDir //set correct iguana directory
      }, function(err, apps) {
        iguanaInstanceRegistry[shepherd.appConfig.iguanaCorePort] = 'main';
        pm2.disconnect(); // Disconnect from PM2
          if (err) {
            throw err;
            console.log('iguana fork error: ' + err);
          }
      });
    });
  }

  if (flock === 'komodod') {
    var kmdDebugLogLocation = ( data.ac_name ? komodoDir + '/' + data.ac_name : komodoDir ) + '/debug.log';
    console.log('komodod flock selected...');
    console.log('selected data: ' + data);

    // truncate debug.log
    try {
      _fs.access(kmdDebugLogLocation, fs.constants.R_OK, function(err) {
        if (err) {
          console.log('error accessing ' + kmdDebugLogLocation);
        } else {
          console.log('truncate ' + kmdDebugLogLocation);
          fs.unlink(kmdDebugLogLocation);
        }
      });
    } catch(e) {
      console.log('komodod debug.log access err: ' + e);
    }

    // get komodod instance port
    var _port = assetChainPorts[data.ac_name];

    try {
      // check if komodod instance is already running
      portscanner.checkPortStatus(_port, '127.0.0.1', function(error, status) {
        // Status is 'open' if currently in use or 'closed' if available
        if (status === 'closed') {
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
            }, function(err, apps) {
              pm2.disconnect(); // Disconnect from PM2
              if (err)
                throw err;
            });
          });
        } else {
          console.log('port ' + _port + ' (' + data.ac_name + ') is already in use');
        }
      });
    } catch(e) {
      console.log('failed to start komodod err: ' + e);
    }
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
      }, function(err, apps) {
        pm2.disconnect(); // Disconnect from PM2
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
    pm2.disconnect();
    console.log(ret);
  });
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

            resolve(result);
          });
        }

        var rpcpass = function() {
          return new Promise(function(resolve, reject) {
            var result = 'checking rpcpassword...';

            if (status[0].hasOwnProperty('rpcpassword')) {
              console.log('rpcpassword: OK');
            } else {
              console.log('rpcpassword: NOT FOUND');
              var randomstring = md5(Math.random() * Math.random() * 999);

              fs.appendFile(DaemonConfPath, '\nrpcpassword=' + randomstring, (err) => {
                if (err)
                  throw err;
                console.log('rpcpassword: ADDED');
              });
            }

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

            resolve(result);
          });
        }

        var addnode = function() {
          return new Promise(function(resolve, reject) {
            var result = 'checking addnode...';

            if (status[0].hasOwnProperty('addnode')) {
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

            resolve(result);
          });
        }

        rpcuser()
        .then(function(result) {
          return rpcpass();
        })
        .then(server)
        .then(addnode);
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
  var komodoDir = '',
        ZcashDir = '',
        DaemonConfPath = '';

  console.log(flock);

  if (os.platform() === 'darwin') {
    komodoDir = process.env.HOME + '/Library/Application Support/Komodo';
    ZcashDir = process.env.HOME + '/Library/Application Support/Zcash';
  }

  if (os.platform() === 'linux') {
    komodoDir = process.env.HOME + '/.komodo';
    ZcashDir = process.env.HOME + '/.zcash';
  }

  if (os.platform() === 'win32') {
    komodoDir = process.env.APPDATA + '/Komodo';
    ZcashDir = process.env.APPDATA + '/Zcash';
  }

  switch (flock) {
    case 'komodod':
      DaemonConfPath = komodoDir;
      if (os.platform() === 'win32') {
        DaemonConfPath = path.normalize(DaemonConfPath);
        console.log('===>>> SHEPHERD API OUTPUT ===>>>');
      }
      break;
    case 'zcashd':
      DaemonConfPath = ZcashDir;
      if (os.platform() === 'win32') {
        DaemonConfPath = path.normalize(DaemonConfPath);
      }
      break;
    default:
      DaemonConfPath = komodoDir + '/' + flock;
      if (os.platform() === 'win32') {
        DaemonConfPath = path.normalize(DaemonConfPath);
      }
  }

  console.log(DaemonConfPath);
  return DaemonConfPath;
}

function formatBytes(bytes, decimals) {
  if (bytes == 0)
    return '0 Bytes';

  var k = 1000,
      dm = decimals + 1 || 3,
      sizes = [
        'Bytes',
        'KB',
        'MB',
        'GB',
        'TB',
        'PB',
        'EB',
        'ZB',
        'YB'
      ],
      i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

shepherd.SystemInfo = function() {
  const os_data = {
          'totalmem_bytes': os.totalmem(),
          'totalmem_readble': formatBytes(os.totalmem()),
          'arch': os.arch(),
          'cpu': os.cpus()[0].model,
          'cpu_cores': os.cpus().length,
          'platform': os.platform(),
          'os_release': os.release(),
          'os_type': os.type()
        };

  return os_data;
}

module.exports = shepherd;