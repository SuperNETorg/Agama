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
      portscanner = require('portscanner'),
      aes256 = require('nodejs-aes256'),
      AdmZip = require('adm-zip'),
      remoteFileSize = require('remote-file-size'),
      Promise = require('bluebird'),
      {shell} = require('electron'),
      { execFile } = require('child_process');

const fixPath = require('fix-path');
var ps = require('ps-node'),
    setconf = require('../private/setconf.js'),
    assetChainPorts = require('./ports.js'),
    _appConfig = require('./appConfig.js'),
    shepherd = express.Router(),
    iguanaInstanceRegistry = {},
    coindInstanceRegistry = {},
    syncOnlyIguanaInstanceInfo = {},
    syncOnlyInstanceInterval = -1,
    guiLog = {},
    rpcConf = {};

shepherd.appConfig = _appConfig.config;

// IGUANA FILES AND CONFIG SETTINGS
var iguanaConfsDirSrc = path.join(__dirname, '../assets/deps/confs');

// SETTING OS DIR TO RUN IGUANA FROM
// SETTING APP ICON FOR LINUX AND WINDOWS
if (os.platform() === 'darwin') {
  fixPath();
  var iguanaBin = path.join(__dirname, '../assets/osx/iguana'),
      iguanaDir = `${process.env.HOME}/Library/Application Support/iguana`,
      iguanaConfsDir = `${iguanaDir}/confs`,
      komododBin = path.join(__dirname, '../assets/bin/osx/komodod'),
      komodocliBin = path.join(__dirname, '../assets/bin/osx/komodo-cli'),
      komodoDir = shepherd.appConfig.dataDir.length ? shepherd.appConfig.dataDir : `${process.env.HOME}/Library/Application Support/Komodo`,
      zcashdBin = '/Applications/ZCashSwingWalletUI.app/Contents/MacOS/zcashd',
      zcashcliBin = '/Applications/ZCashSwingWalletUI.app/Contents/MacOS/zcash-cli',
      zcashDir = `${process.env.HOME}/Library/Application Support/Zcash`,
      zcashParamsDir = `${process.env.HOME}/Library/Application Support/ZcashParams`;
}

if (os.platform() === 'linux') {
  var iguanaBin = path.join(__dirname, '../assets/bin/linux64/iguana'),
      iguanaDir = `${process.env.HOME}/.iguana`,
      iguanaConfsDir = `${iguanaDir}/confs`,
      iguanaIcon = path.join(__dirname, '/assets/icons/agama_icons/128x128.png'),
      komododBin = path.join(__dirname, '../assets/bin/linux64/komodod'),
      komodocliBin = path.join(__dirname, '../assets/bin/linux64/komodo-cli'),
      komodoDir = shepherd.appConfig.dataDir.length ? shepherd.appConfig.dataDir : `${process.env.HOME}/.komodo`,
      zcashParamsDir = `${process.env.HOME}/.zcash-params`;
}

if (os.platform() === 'win32') {
  var iguanaBin = path.join(__dirname, '../assets/bin/win64/iguana.exe');
      iguanaBin = path.normalize(iguanaBin);
      iguanaDir = `${process.env.APPDATA}/iguana`;
      iguanaDir = path.normalize(iguanaDir);
      iguanaConfsDir = `${process.env.APPDATA}/iguana/confs`;
      iguanaConfsDir = path.normalize(iguanaConfsDir);
      iguanaIcon = path.join(__dirname, '/assets/icons/agama_icons/agama_app_icon.ico'),
      iguanaConfsDirSrc = path.normalize(iguanaConfsDirSrc),
      komododBin = path.join(__dirname, '../assets/bin/win64/komodod.exe'),
      komododBin = path.normalize(komododBin),
      komodocliBin = path.join(__dirname, '../assets/bin/win64/komodo-cli.exe'),
      komodocliBin = path.normalize(komodocliBin),
      komodoDir = shepherd.appConfig.dataDir.length ? shepherd.appConfig.dataDir : `${process.env.APPDATA}/Komodo`,
      komodoDir = path.normalize(komodoDir);
      zcashParamsDir = `${process.env.APPDATA}/ZcashParams`;
      zcashParamsDir = path.normalize(zcashParamsDir);
}

shepherd.appConfigSchema = _appConfig.schema;
shepherd.defaultAppConfig = Object.assign({}, shepherd.appConfig);

shepherd.coindInstanceRegistry = coindInstanceRegistry;

shepherd.testLocation = function(path) {
  return new Promise(function(resolve, reject) {
    fs.lstat(path, (err, stats) => {
      if (err) {
        console.log('error testing path ' + path);
        resolve(-1);
      } else {
        if (stats.isDirectory()) {
          resolve(true);
        } else {
          console.log('error testing path ' + path + ' not a folder');
          resolve(false);
        }
      }
    });
  });
}

// osx and linux
shepherd.binFixRights = function() {
  const osPlatform = os.platform();
  const _bins = [
    iguanaBin,
    komododBin,
    komodocliBin
  ];

  if (osPlatform === 'darwin' ||
      osPlatform === 'linux') {
    for (let i = 0; i < _bins.length; i++) {
      _fs.stat(_bins[i], function(err, stat) {
        if (!err) {
          if (parseInt(stat.mode.toString(8), 10) !== 100775) {
            console.log(`${_bins[i]} fix permissions`);
            fsnode.chmodSync(_bins[i], '0775');
          }
        } else {
          console.log(`error: ${_bins[i]} not found`);
        }
      });
    }
  }
}

shepherd.killRogueProcess = function(processName) {
  // kill rogue process copies on start
  let processGrep;
  const osPlatform = os.platform();

  switch (osPlatform) {
    case 'darwin':
      processGrep = "ps -p $(ps -A | grep -m1 " + processName + " | awk '{print $1}') | grep -i " + processName;
      break;
    case 'linux':
      processGrep = 'ps -p $(pidof ' + processName + ') | grep -i ' + processName;
      break;
    case 'win32':
      processGrep = 'tasklist';
      break;
  }

  exec(processGrep, function(error, stdout, stderr) {
    if (stdout.indexOf(processName) > -1) {
      const pkillCmd = osPlatform === 'win32' ? 'taskkill /f /im ' + processName + '.exe' : 'pkill -15 ' + processName;

      console.log(`found another ${processName} process(es)`);
      shepherd.writeLog(`found another ${processName} process(es)`);

      exec(pkillCmd, function(error, stdout, stderr) {
        console.log(`${pkillCmd} is issued`);
        shepherd.writeLog(`${pkillCmd} is issued`);

        if (error !== null) {
          console.log(`${pkillCmd} exec error: ${error}`);
          shepherd.writeLog(`${pkillCmd} exec error: ${error}`);
        };
      });
    }

    if (error !== null) {
      console.log(`${processGrep} exec error: ${error}`);
      shepherd.writeLog(`${processGrep} exec error: ${error}`);
    };
  });
}

shepherd.zcashParamsExist = function() {
  if (_fs.existsSync(zcashParamsDir) &&
      _fs.existsSync(`${zcashParamsDir}/sprout-proving.key`) &&
      _fs.existsSync(`${zcashParamsDir}/sprout-verifying.key`)) {
    console.log('zcashparams exist');
    return true;
  }

  console.log('zcashparams doesnt exist');
  return false;
}

shepherd.readVersionFile = function() {
  // read app version
  const rootLocation = path.join(__dirname, '../');
  const localVersionFile = fs.readFileSync(`${rootLocation}version`, 'utf8');

  return localVersionFile;
}

shepherd.writeLog = function(data) {
  const logLocation = `${iguanaDir}/shepherd`;
  const timeFormatted = new Date(Date.now()).toLocaleString('en-US', { hour12: false });

  if (shepherd.appConfig.debug) {
    if (fs.existsSync(`${logLocation}/agamalog.txt`)) {
      fs.appendFile(`${logLocation}/agamalog.txt`, `${timeFormatted}  ${data}\r\n`, function (err) {
        if (err) {
          console.log('error writing log file');
        }
      });
    } else {
      fs.writeFile(`${logLocation}/agamalog.txt`, `${timeFormatted}  ${data}\r\n`, function (err) {
        if (err) {
          console.log('error writing log file');
        }
      });
    }
  }
}

shepherd.createIguanaDirs = function() {
  if (!fs.existsSync(iguanaDir)) {
    fs.mkdirSync(iguanaDir);

    if (fs.existsSync(iguanaDir)) {
      console.log(`created iguana folder at ${iguanaDir}`);
      shepherd.writeLog(`created iguana folder at ${iguanaDir}`);
    }
  } else {
    console.log('iguana folder already exists');
  }

  if (!fs.existsSync(`${iguanaDir}/shepherd`)) {
    fs.mkdirSync(`${iguanaDir}/shepherd`);

    if (fs.existsSync(`${iguanaDir}/shepherd`)) {
      console.log(`created shepherd folder at ${iguanaDir}/shepherd`);
      shepherd.writeLog(`create shepherd folder at ${iguanaDir}/shepherd`);
    }
  } else {
    console.log('iguana/shepherd folder already exists');
  }

  if (!fs.existsSync(`${iguanaDir}/shepherd/pin`)) {
    fs.mkdirSync(`${iguanaDir}/shepherd/pin`);

    if (fs.existsSync(`${iguanaDir}/shepherd/pin`)) {
      console.log(`created pin folder at ${iguanaDir}/shepherd/pin`);
      shepherd.writeLog(`create pin folder at ${iguanaDir}/shepherd/pin`);
    }
  } else {
    console.log('shepherd/pin folder already exists');
  }
}

/*
 *  type: POST
 *  params: none
 */
shepherd.post('/encryptkey', function(req, res, next) {
  if (req.body.key &&
      req.body.string &&
      req.body.pubkey) {
    const encryptedString = aes256.encrypt(req.body.key, req.body.string);

    // test pin security
    // - at least 1 char in upper case
    // - at least 1 digit
    // - at least one special character
    // - min length 8

    const _pin = req.body.key;
    const _pinTest = _pin.match('^(?=.*[A-Z])(?=.*[^<>{}\"/|;:.,~!?@#$%^=&*\\]\\\\()\\[_+]*$)(?=.*[0-9])(?=.*[a-z]).{8}$');

    fs.writeFile(`${iguanaDir}/shepherd/pin/${req.body.pubkey}.pin`, encryptedString, function (err) {
      if (err) {
        console.log('error writing pin file');
      }

      const returnObj = {
        msg: 'success',
        result: encryptedString,
      };

      res.end(JSON.stringify(returnObj));
    });
  } else {
    let errorObj = {
      msg: 'error',
      result: '',
    };
    const _paramsList = [
      'key',
      'string',
      'pubkey'
    ];
    let _errorParamsList = [];

    for (let i = 0; i < _paramsList.length; i++) {
      if (!req.query[_paramsList[i]]) {
        _errorParamsList.push(_paramsList[i]);
      }
    }

    errorObj.result = `missing param ${_errorParamsList.join(', ')}`;
    res.end(JSON.stringify(errorObj));
  }
});

shepherd.post('/decryptkey', function(req, res, next) {
  if (req.body.key &&
      req.body.pubkey) {
    if (fs.existsSync(`${iguanaDir}/shepherd/pin/${req.body.pubkey}.pin`)) {
      fs.readFile(`${iguanaDir}/shepherd/pin/${req.body.pubkey}.pin`, 'utf8', function (err, data) {
        if (err) {
          const errorObj = {
            msg: 'error',
            result: err,
          };

          res.end(JSON.stringify(errorObj));
        } else {
          const encryptedKey = aes256.decrypt(req.body.key, data);
          // test if stored encrypted passphrase is decrypted correctly
          // if not then the key is wrong
          const _regexTest = encryptedKey.match(/^[0-9a-zA-Z ]+$/g);
          let returnObj;

          if (!_regexTest) {
            returnObj = {
              msg: 'error',
              result: 'wrong key',
            };
          } else {
            returnObj = {
              msg: 'success',
              result: encryptedKey,
            };
          }

          res.end(JSON.stringify(returnObj));
        }
      });
    } else {
      const errorObj = {
        msg: 'error',
        result: `file ${req.query.pubkey}.pin doesnt exist`,
      };

      res.end(JSON.stringify(errorObj));
    }
  } else {
    const errorObj = {
      msg: 'error',
      result: 'missing key or pubkey param',
    };

    res.end(JSON.stringify(errorObj));
  }
});

shepherd.get('/getpinlist', function(req, res, next) {
  if (fs.existsSync(`${iguanaDir}/shepherd/pin`)) {
    fs.readdir(`${iguanaDir}/shepherd/pin`, function(err, items) {
      let _pins = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].substr(items[i].length - 4, 4) === '.pin') {
          _pins.push(items[i].substr(0, items[i].length - 4));
        }
      }

      if (!items.length) {
        const errorObj = {
          msg: 'error',
          result: 'no pins',
        };

        res.end(JSON.stringify(errorObj));
      } else {
        const successObj = {
          msg: 'success',
          result: _pins,
        };

        res.end(JSON.stringify(successObj));
      }
    });
  } else {
    const errorObj = {
      msg: 'error',
      result: 'pin folder doesnt exist',
    };

    res.end(JSON.stringify(errorObj));
  }
});
/**
 * Promise based download file method
 */
function downloadFile(configuration) {
  return new Promise(function(resolve, reject) {
    // Save variable to know progress
    let receivedBytes = 0;
    let totalBytes = 0;

    let req = request({
      method: 'GET',
      uri: configuration.remoteFile,
      agentOptions: {
        keepAlive: true,
        keepAliveMsecs: 15000,
      },
    });

    let out = fs.createWriteStream(configuration.localFile);
    req.pipe(out);

    req.on('response', function(data) {
      // Change the total bytes value to get progress later.
      totalBytes = parseInt(data.headers['content-length']);
    });

    // Get progress if callback exists
    if (configuration.hasOwnProperty('onProgress')) {
      req.on('data', function(chunk) {
        // Update the received bytes
        receivedBytes += chunk.length;
        configuration.onProgress(receivedBytes, totalBytes);
      });
    } else {
      req.on('data', function(chunk) {
        // Update the received bytes
        receivedBytes += chunk.length;
      });
    }

    req.on('end', function() {
      resolve();
    });
  });
}

const remoteBinLocation = {
  win32: 'https://artifacts.supernet.org/latest/windows/',
  darwin: 'https://artifacts.supernet.org/latest/osx/',
  linux: 'https://artifacts.supernet.org/latest/linux/',
};
const localBinLocation = {
  win32: 'assets/bin/win64/',
  darwin: 'assets/bin/osx/',
  linux: 'assets/bin/linux64/',
};
const latestBins = {
  win32: [
    'iguana.exe',
    'komodo-cli.exe',
    'komodod.exe',
    'libcrypto-1_1.dll',
    'libcurl-4.dll',
    'libcurl.dll',
    'libgcc_s_sjlj-1.dll',
    'libnanomsg.dll',
    'libssl-1_1.dll',
    'libwinpthread-1.dll',
    'nanomsg.dll',
    'pthreadvc2.dll',
  ],
  darwin: [
    'iguana',
    'komodo-cli',
    'komodod',
    'libgcc_s.1.dylib',
    'libgomp.1.dylib',
    'libnanomsg.5.0.0.dylib',
    'libstdc++.6.dylib', // encode %2B
  ],
  linux: [
    'iguana',
    'komodo-cli',
    'komodod',
  ]
};

let binsToUpdate = [];

/*
 *  Check bins file size
 *  type:
 *  params:
 */
shepherd.get('/update/bins/check', function(req, res, next) {
  const rootLocation = path.join(__dirname, '../');
  const successObj = {
    msg: 'success',
    result: 'bins',
  };

  res.end(JSON.stringify(successObj));

  const _os = os.platform();
  console.log(`checking bins: ${_os}`);

  cache.io.emit('patch', {
    patch: {
      type: 'bins-check',
      status: 'progress',
      message: `checking bins: ${_os}`,
    },
  });
  // get list of bins/dlls that can be updated to the latest
  for (let i = 0; i < latestBins[_os].length; i++) {
    remoteFileSize(remoteBinLocation[_os] + latestBins[_os][i], function(err, remoteBinSize) {
      const localBinSize = fs.statSync(rootLocation + localBinLocation[_os] + latestBins[_os][i]).size;

      console.log('remote url: ' + (remoteBinLocation[_os] + latestBins[_os][i]) + ' (' + remoteBinSize + ')');
      console.log('local file: ' + (rootLocation + localBinLocation[_os] + latestBins[_os][i]) + ' (' + localBinSize + ')');

      if (remoteBinSize !== localBinSize) {
        console.log(`${latestBins[_os][i]} can be updated`);
        binsToUpdate.push({
          name: latestBins[_os][i],
          rSize: remoteBinSize,
          lSize: localBinSize,
        });
      }

      if (i === latestBins[_os].length - 1) {
        cache.io.emit('patch', {
          patch: {
            type: 'bins-check',
            status: 'done',
            fileList: binsToUpdate,
          },
        });
      }
    });
  }
});

/*
 *  Update bins
 *  type:
 *  params:
 */
shepherd.get('/update/bins', function(req, res, next) {
  const rootLocation = path.join(__dirname, '../');
  const _os = os.platform();
  const successObj = {
    msg: 'success',
    result: {
      filesCount: binsToUpdate.length,
      list: binsToUpdate,
    },
  };

  res.end(JSON.stringify(successObj));

  for (let i = 0; i < binsToUpdate.length; i++) {
    downloadFile({
      remoteFile: remoteBinLocation[_os] + binsToUpdate[i].name,
      localFile: `${rootLocation}${localBinLocation[_os]}patch/${binsToUpdate[i].name}`,
      onProgress: function(received, total) {
        const percentage = (received * 100) / total;
        cache.io.emit('patch', {
          msg: {
            type: 'bins-update',
            status: 'progress',
            file: binsToUpdate[i].name,
            bytesTotal: total,
            bytesReceived: received,
          }
        });
        console.log(`${binsToUpdate[i].name} ${percentage}% | ${received} bytes out of ${total} bytes.`);
      }
    })
    .then(function() {
      // verify that remote file is matching to DL'ed file
      const localBinSize = fs.statSync(`${rootLocation}${localBinLocation[_os]}patch/${binsToUpdate[i].name}`).size;
      console.log('compare dl file size');

      if (localBinSize === binsToUpdate[i].rSize) {
        cache.io.emit('patch', {
          msg: {
            type: 'bins-update',
            file: binsToUpdate[i].name,
            status: 'done',
          }
        });
        console.log(`file ${binsToUpdate[i].name} succesfully downloaded`);
      } else {
        cache.io.emit('patch', {
          msg: {
            type: 'bins-update',
            file: binsToUpdate[i].name,
            message: 'size mismatch',
          }
        });
        console.log(`error: ${binsToUpdate[i].name} file size doesnt match remote!`);
      }
    });
  }
});

/*
 *  DL app patch
 *  type:
 *  params: patchList
 */
shepherd.get('/update/patch', function(req, res, next) {
  const successObj = {
    msg: 'success',
    result: 'dl started'
  };

  res.end(JSON.stringify(successObj));

  shepherd.updateAgama();
});

shepherd.updateAgama = function() {
  const rootLocation = path.join(__dirname, '../');

  downloadFile({
    remoteFile: 'https://github.com/pbca26/dl-test/raw/master/patch.zip',
    localFile: rootLocation + 'patch.zip',
    onProgress: function(received, total) {
      const percentage = (received * 100) / total;
      if (Math.floor(percentage) % 5 === 0 ||
          Math.floor(percentage) % 10 === 0) {
        console.log(`patch ${percentage}% | ${received} bytes out of ${total} bytes.`);
        cache.io.emit('patch', {
          msg: {
            status: 'progress',
            type: 'ui',
            progress: percentage,
            bytesTotal: total,
            bytesReceived: received,
          },
        });
      }
    }
  })
  .then(function() {
    remoteFileSize('https://github.com/pbca26/dl-test/raw/master/patch.zip', function(err, remotePatchSize) {
      // verify that remote file is matching to DL'ed file
      const localPatchSize = fs.statSync(`${rootLocation}patch.zip`).size;
      console.log('compare dl file size');

      if (localPatchSize === remotePatchSize) {
        const zip = new AdmZip(`${rootLocation}patch.zip`);

        console.log('patch succesfully downloaded');
        console.log('extracting contents');

        if (shepherd.appConfig.dev) {
          if (!fs.existsSync(`${rootLocation}/patch`)) {
            fs.mkdirSync(`${rootLocation}/patch`);
          }
        }

        zip.extractAllTo(/*target path*/rootLocation + (shepherd.appConfig.dev ? '/patch' : ''), /*overwrite*/true);
        // TODO: extract files in chunks
        cache.io.emit('patch', {
          msg: {
            type: 'ui',
            status: 'done',
          },
        });
        fs.unlink(`${rootLocation}patch.zip`);
      } else {
        cache.io.emit('patch', {
          msg: {
            type: 'ui',
            status: 'error',
            message: 'size mismatch',
          },
        });
        console.log('patch file size doesnt match remote!');
      }
    });
  });
}

/*
 *  check latest version
 *  type:
 *  params:
 */
shepherd.get('/update/patch/check', function(req, res, next) {
  const rootLocation = path.join(__dirname, '../');
  const options = {
    url: 'https://github.com/pbca26/dl-test/raw/master/version',
    method: 'GET',
  };

  request(options, function (error, response, body) {
    if (response &&
        response.statusCode &&
        response.statusCode === 200) {
      const remoteVersion = body.split('\n');
      const localVersionFile = fs.readFileSync(`${rootLocation}version`, 'utf8');
      let localVersion;

      if (localVersionFile.indexOf('\r\n') > -1) {
        localVersion = localVersionFile.split('\r\n');
      } else {
        localVersion = localVersionFile.split('\n');
      }

      if (remoteVersion[0] === localVersion[0]) {
        const successObj = {
          msg: 'success',
          result: 'latest',
        };

        res.end(JSON.stringify(successObj));
      } else {
        const successObj = {
          msg: 'success',
          result: 'update',
          version: {
            local: localVersion[0],
            remote: remoteVersion[0],
          },
        };

        res.end(JSON.stringify(successObj));
      }
    } else {
      res.end({
        err: 'error getting update',
      });
    }
  });
});

/*
 *  unpack zip
 *  type:
 *  params:
 */
shepherd.get('/unpack', function(req, res, next) {
  const dlLocation = path.join(__dirname, '../');
  const zip = new AdmZip(`${dlLocation}patch.zip`);
  zip.extractAllTo(/*target path*/ `${dlLocation}/patch/unpack`, /*overwrite*/true);

  const successObj = {
    msg: 'success',
    result: 'unpack started',
  };

  res.end(JSON.stringify(successObj));
});

/*
 *  type: GET
 *
 */
shepherd.get('/coinslist', function(req, res, next) {
  if (fs.existsSync(`${iguanaDir}/shepherd/coinslist.json`)) {
    fs.readFile(`${iguanaDir}/shepherd/coinslist.json`, 'utf8', function (err, data) {
      if (err) {
        const errorObj = {
          msg: 'error',
          result: err,
        };

        res.end(JSON.stringify(errorObj));
      } else {
        const successObj = {
          msg: 'success',
          result: data ? JSON.parse(data) : '',
        };

        res.end(JSON.stringify(successObj));
      }
    });
  } else {
    const errorObj = {
      msg: 'error',
      result: 'coin list doesn\'t exist',
    };

    res.end(JSON.stringify(errorObj));
  }
});

/*
 *  type: POST
 *  params: payload
 */
shepherd.post('/guilog', function(req, res, next) {
  const logLocation = `${iguanaDir}/shepherd`;

  if (!guiLog[shepherd.appSessionHash]) {
    guiLog[shepherd.appSessionHash] = {};
  }

  if (guiLog[shepherd.appSessionHash][req.body.timestamp]) {
    guiLog[shepherd.appSessionHash][req.body.timestamp].status = req.body.status;
    guiLog[shepherd.appSessionHash][req.body.timestamp].response = req.body.response;
  } else {
    guiLog[shepherd.appSessionHash][req.body.timestamp] = {
      function: req.body.function,
      type: req.body.type,
      url: req.body.url,
      payload: req.body.payload,
      status: req.body.status,
    };
  }

  fs.writeFile(`${logLocation}/agamalog.json`, JSON.stringify(guiLog), function (err) {
    if (err) {
      shepherd.writeLog('error writing gui log file');
    }

    const returnObj = {
      msg: 'success',
      result: 'gui log entry is added',
    };

    res.end(JSON.stringify(returnObj));
  });
});

/*
 *  type: GET
 *  params: type
 */
shepherd.get('/getlog', function(req, res, next) {
  const logExt = req.query.type === 'txt' ? 'txt' : 'json';

  if (fs.existsSync(`${iguanaDir}/shepherd/agamalog.${logExt}`)) {
    fs.readFile(`${iguanaDir}/shepherd/agamalog.${logExt}`, 'utf8', function (err, data) {
      if (err) {
        const errorObj = {
          msg: 'error',
          result: err,
        };

        res.end(JSON.stringify(errorObj));
      } else {
        const successObj = {
          msg: 'success',
          result: data ? JSON.parse(data) : '',
        };

        res.end(JSON.stringify(successObj));
      }
    });
  } else {
    const errorObj = {
      msg: 'error',
      result: `agama.${logExt} doesnt exist`,
    };

    res.end(JSON.stringify(errorObj));
  }
});

/*
 *  type: POST
 *  params: payload
 */
shepherd.post('/coinslist', function(req, res, next) {
  const _payload = req.body.payload;

  if (!_payload) {
    const errorObj = {
      msg: 'error',
      result: 'no payload provided',
    };

    res.end(JSON.stringify(errorObj));
  } else {
    fs.writeFile(`${cache.iguanaDir}/shepherd/coinslist.json`, JSON.stringify(_payload), function (err) {
      if (err) {
        const errorObj = {
          msg: 'error',
          result: err,
        };

        res.end(JSON.stringify(errorObj));
      } else {
        const successObj = {
          msg: 'success',
          result: 'done',
        };

        res.end(JSON.stringify(successObj));
      }
    });
  }
});

// TODO: check if komodod is running
shepherd.quitKomodod = function(timeout = 100) {
  // if komodod is under heavy load it may not respond to cli stop the first time
  // exit komodod gracefully
  let coindExitInterval = {};

  for (let key in coindInstanceRegistry) {
    const chain = key !== 'komodod' ? key : null;

    coindExitInterval[key] = setInterval(function() {
      let _arg = [];
      if (chain) {
        _arg.push(`-ac_name=${chain}`);
      }
      _arg.push('stop');
      execFile(`${komodocliBin}`, _arg, function(error, stdout, stderr) {
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);

        if (stdout.indexOf('EOF reached') > -1 ||
            stderr.indexOf('EOF reached') > -1 ||
            (error && error.toString().indexOf('Command failed') > -1 && !stderr) || // win "special snowflake" case
            stdout.indexOf('connect to server: unknown (code -1)') > -1 ||
            stderr.indexOf('connect to server: unknown (code -1)') > -1) {
          delete coindInstanceRegistry[key];
          clearInterval(coindExitInterval[key]);
        }

        if (error !== null) {
          console.log(`exec error: ${error}`);
        }
        shepherd.killRogueProcess('komodo-cli');
      });
    }, timeout);
  }
}

shepherd.getConf = function(chain) {
  const _confLocation = chain === 'komodod' ? `${komodoDir}/komodo.conf` : `${komodoDir}/${chain}/${chain}.conf`;

  if (fs.existsSync(_confLocation)) {
    const _port = assetChainPorts[chain];
    const _rpcConf = fs.readFileSync(_confLocation, 'utf8');

    if (_rpcConf.length) {
      let _match;
      let parsedRpcConfig = {
        user: '',
        pass: '',
        port: _port,
      };

      if (_match = _rpcConf.match(/rpcuser=\s*(.*)/)) {
        parsedRpcConfig.user = _match[1];
      }

      if ((_match = _rpcConf.match(/rpcpass=\s*(.*)/)) ||
          (_match = _rpcConf.match(/rpcpassword=\s*(.*)/))) {
        parsedRpcConfig.pass = _match[1];
      }

      rpcConf[chain === 'komodod' ? 'KMD' : chain] = parsedRpcConfig;
    } else {
      console.log(`${_confLocation} is empty`);
    }
  } else {
    console.log(`${_confLocation} doesnt exist`);
  }
}

/*
 *  type: POST
 *  params: payload
 */
shepherd.post('/cli', function(req, res, next) {
  if (!req.body.payload) {
    const errorObj = {
      msg: 'error',
      result: 'no payload provided',
    };

    res.end(JSON.stringify(errorObj));
  } else if (!req.body.payload.cmd.match(/^[0-9a-zA-Z _\,\.\[\]"'/\\]+$/g)) {
    const errorObj = {
      msg: 'error',
      result: 'wrong cli string format',
    };

    res.end(JSON.stringify(errorObj));
  } else {
    const _mode = req.body.payload.mode === 'passthru' ? 'passthru' : 'default';
    const _chain = req.body.payload.chain === 'KMD' ? null : req.body.payload.chain;
    const _cmd = req.body.payload.cmd;
    const _params = req.body.payload.params ? ` ${req.body.payload.params}` : '';

    if (!rpcConf[_chain]) {
      shepherd.getConf(req.body.payload.chain === 'KMD' ? 'komodod' : req.body.payload.chain);
    }

    if (_mode === 'default') {
      let _body = {
        agent: 'bitcoinrpc',
        method: _cmd,
      };

      if (req.body.payload.params) {
        _body = {
          agent: 'bitcoinrpc',
          method: _cmd,
          params: req.body.payload.params === ' ' ? [''] : req.body.payload.params,
        };
      }

      const options = {
        url: `http://localhost:${rpcConf[req.body.payload.chain].port}`,
        method: 'POST',
        auth: {
          user: rpcConf[req.body.payload.chain].user,
          pass: rpcConf[req.body.payload.chain].pass,
        },
        body: JSON.stringify(_body)
      };

      // send back body on both success and error
      // this bit replicates iguana core's behaviour
      request(options, function (error, response, body) {
        if (response &&
            response.statusCode &&
            response.statusCode === 200) {
          res.end(body);
        } else {
          res.end(body);
        }
      });
    } else {
      let _arg = (_chain ? ' -ac_name=' + _chain : '') + ' ' + _cmd + _params;
      _arg = _arg.trim().split(' ');
      execFile(komodocliBin, _arg, function(error, stdout, stderr) {
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);

        if (error !== null) {
          console.log(`exec error: ${error}`);
        }

        let responseObj;

        if (stderr) {
          responseObj = {
            msg: 'error',
            result: stderr,
          };
        } else {
          responseObj = {
            msg: 'success',
            result: stdout,
          };
        }

        res.end(JSON.stringify(responseObj));
        shepherd.killRogueProcess('komodo-cli');
      });
    }
  }
});

/*
 *  type: POST
 *  params: payload
 */
shepherd.post('/appconf', function(req, res, next) {
  if (!req.body.payload) {
    const errorObj = {
      msg: 'error',
      result: 'no payload provided',
    };

    res.end(JSON.stringify(errorObj));
  } else {
    shepherd.saveLocalAppConf(req.body.payload);

    const successObj = {
      msg: 'success',
      result: 'config saved',
    };

    res.end(JSON.stringify(successObj));
  }
});

/*
 *  type: POST
 *  params: none
 */
shepherd.post('/appconf/reset', function(req, res, next) {
  shepherd.saveLocalAppConf(shepherd.defaultAppConfig);

  const successObj = {
    msg: 'success',
    result: 'config saved',
  };

  res.end(JSON.stringify(successObj));
});

shepherd.saveLocalAppConf = function(appSettings) {
  let appConfFileName = `${iguanaDir}/config.json`;

  _fs.access(iguanaDir, fs.constants.R_OK, function(err) {
    if (!err) {

      const FixFilePermissions = function() {
        return new Promise(function(resolve, reject) {
          const result = 'config.json file permissions updated to Read/Write';

          fsnode.chmodSync(appConfFileName, '0666');

          setTimeout(function() {
            console.log(result);
            shepherd.writeLog(result);
            resolve(result);
          }, 1000);
        });
      }

      const FsWrite = function() {
        return new Promise(function(resolve, reject) {
          const result = 'config.json write file is done';

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
            console.log(`app conf.json file is created successfully at: ${iguanaConfsDir}`);
            shepherd.writeLog(`app conf.json file is created successfully at: ${iguanaConfsDir}`);
            resolve(result);
          }, 2000);
        });
      }

      FsWrite()
      .then(FixFilePermissions());
    }
  });
}

shepherd.loadLocalConfig = function() {
  if (fs.existsSync(`${iguanaDir}/config.json`)) {
    let localAppConfig = fs.readFileSync(`${iguanaDir}/config.json`, 'utf8');

    console.log('app config set from local file');
    shepherd.writeLog('app config set from local file');

    // find diff between local and hardcoded configs
    // append diff to local config
    const compareJSON = function(obj1, obj2) {
      let result = {};

      for (let i in obj1) {
        if (!obj2.hasOwnProperty(i)) {
          result[i] = obj1[i];
        }
      }

      return result;
    };

    if (localAppConfig) {
      const compareConfigs = compareJSON(shepherd.appConfig, JSON.parse(localAppConfig));

      if (Object.keys(compareConfigs).length) {
        const newConfig = Object.assign(JSON.parse(localAppConfig), compareConfigs);

        console.log('config diff is found, updating local config');
        console.log('config diff:');
        console.log(compareConfigs);
        shepherd.writeLog('aconfig diff is found, updating local config');
        shepherd.writeLog('config diff:');
        shepherd.writeLog(compareConfigs);

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
    shepherd.writeLog('local config file is not found!');
    shepherd.saveLocalAppConf(shepherd.appConfig);

    return shepherd.appConfig;
  }
};

shepherd.appConfig = shepherd.loadLocalConfig();

console.log(`iguana dir: ${iguanaDir}`);
console.log(`iguana bin: ${iguanaBin}`);
console.log('--------------------------')
console.log(`iguana dir: ${komododBin}`);
console.log(`iguana bin: ${komodoDir}`);
shepherd.writeLog(`iguana dir: ${iguanaDir}`);
shepherd.writeLog(`iguana bin: ${iguanaBin}`);
shepherd.writeLog(`iguana dir: ${komododBin}`);
shepherd.writeLog(`iguana bin: ${komodoDir}`);

// END IGUANA FILES AND CONFIG SETTINGS
// default route
shepherd.get('/', function(req, res, next) {
  res.send('Iguana app server');
});

/*
 *  type: GET
 *
 */
shepherd.get('/appconf', function(req, res, next) {
  const obj = shepherd.loadLocalConfig();
  res.send(obj);
});

/*
 *  type: GET
 *
 */
shepherd.get('/sysinfo', function(req, res, next) {
  const obj = shepherd.SystemInfo();
  res.send(obj);
});

/*
 *  type: GET
 *
 */
shepherd.get('/appinfo', function(req, res, next) {
  const obj = shepherd.appInfo();
  res.send(obj);
});

shepherd.dumpCacheBeforeExit = function() {
  cache.dumpCacheBeforeExit();
}

var cache = require('./cache');
var mock = require('./mock');

// expose sockets obj
shepherd.setIO = function(io) {
  shepherd.io = io;
  cache.setVar('io', io);
};

shepherd.setVar = function(_name, _body) {
  shepherd[_name] = _body;
};

cache.setVar('iguanaDir', iguanaDir);
cache.setVar('appConfig', shepherd.appConfig);

// fetch sync only forks info
shepherd.getSyncOnlyForksInfo = function() {
  async.forEachOf(iguanaInstanceRegistry, function(data, port) {
    if (iguanaInstanceRegistry[port].mode.indexOf('/sync') > -1) {
      syncOnlyIguanaInstanceInfo[port] = {};
      request({
        url: `http://localhost:${port}/api/bitcoinrpc/getinfo?userpass=tmpIgRPCUser@${shepherd.appSessionHash}`,
        method: 'GET'
      }, function (error, response, body) {
        if (response &&
            response.statusCode &&
            response.statusCode === 200) {
          // console.log(body);
          try {
            syncOnlyIguanaInstanceInfo[port].getinfo = JSON.parse(body);
          } catch(e) {}
        } else {
          // TODO: error
        }
      });
      request({
        url: `http://localhost:${port}/api/SuperNET/activehandle?userpass=${shepherd.appSessionHash}`,
        method: 'GET'
      }, function (error, response, body) {
        if (response &&
            response.statusCode &&
            response.statusCode === 200) {
          // console.log(body);
          try {
            syncOnlyIguanaInstanceInfo[port].activehandle = JSON.parse(body);
          } catch(e) {}
        } else {
          // TODO: error
        }
      });
      syncOnlyIguanaInstanceInfo[port].registry = iguanaInstanceRegistry[port];
    }
  });
}

/*
 *  type: GET
 *
 */
shepherd.get('/forks/info/start', function(req, res, next) {
  const successObj = {
    msg: 'success',
    result: 'started',
  };

  res.end(JSON.stringify(successObj));
  shepherd.getSyncOnlyForksInfo();
});

/*
 *  type: GET
 *
 */
shepherd.get('/forks/info/show', function(req, res, next) {
  const successObj = {
    msg: 'success',
    result: JSON.stringify(syncOnlyIguanaInstanceInfo),
  };

  res.end(JSON.stringify(successObj));
});

/*
 *  type: GET
 *
 */
shepherd.get('/forks/restart', function(req, res, next) {
  const _pmid = req.query.pmid;

  pm2.connect(function(err) {
    if (err) {
      console.error(err);
    }

    pm2.restart(_pmid, function(err, ret) {
      if (err) {
        console.error(err);
      }
      pm2.disconnect();

      const successObj = {
        msg: 'success',
        result: 'restarted',
      };
      shepherd.writeLog(`iguana fork pmid ${_pmid} restarted`);

      res.end(JSON.stringify(successObj));
    });
  });
});

/*
 *  type: GET
 *
 */
shepherd.get('/forks/stop', function(req, res, next) {
  const _pmid = req.query.pmid;

  pm2.connect(function(err) {
    if (err) {
      console.error(err);
    }

    pm2.stop(_pmid, function(err, ret) {
      if (err) {
        console.error(err);
      }
      pm2.disconnect();

      const successObj = {
        msg: 'success',
        result: 'stopped',
      };

      shepherd.writeLog(`iguana fork pmid ${_pmid} stopped`);

      res.end(JSON.stringify(successObj));
    });
  });
});

/*
 *  type: GET
 *
 */
shepherd.get('/forks', function(req, res, next) {
  const successObj = {
    msg: 'success',
    result: iguanaInstanceRegistry,
  };

  res.end(JSON.stringify(successObj));
});

/*
 *  type: POST
 *  params: name
 */
shepherd.post('/forks', function(req, res, next) {
  const mode = req.body.mode;
  const coin = req.body.coin;
  const port = shepherd.appConfig.iguanaCorePort;

  portscanner.findAPortNotInUse(port, port + 100, '127.0.0.1', function(error, _port) {
    pm2.connect(true, function(err) { //start up pm2 god
      if (err) {
        console.error(err);
        process.exit(2);
      }

      console.log(`iguana core fork port ${_port}`);
      shepherd.writeLog(`iguana core fork port ${_port}`);

      pm2.start({
        script: iguanaBin, // path to binary
        name: `IGUANA ${_port} ${mode} / ${coin}`,
        exec_mode : 'fork',
        args: [`-port=${_port}`],
        cwd: iguanaDir //set correct iguana directory
      }, function(err, apps) {
        if (apps && apps[0] && apps[0].process && apps[0].process.pid) {
          iguanaInstanceRegistry[_port] = {
            mode: mode,
            coin: coin,
            pid: apps[0].process && apps[0].process.pid,
            pmid: apps[0].pm2_env.pm_id,
          };
          cache.setVar('iguanaInstances', iguanaInstanceRegistry);

          const successObj = {
            msg: 'success',
            result: _port,
          };

          res.end(JSON.stringify(successObj));
        } else {
          const errorObj = {
            msg: 'success',
            error: 'iguana start error',
          };

          res.end(JSON.stringify(errorObj));
        }

        // get sync only forks info
        if (syncOnlyInstanceInterval === -1) {
          setTimeout(function() {
            shepherd.getSyncOnlyForksInfo();
          }, 5000);
          setInterval(function() {
            shepherd.getSyncOnlyForksInfo();
          }, 20000);
        }

        pm2.disconnect(); // Disconnect from PM2
        if (err) {
          shepherd.writeLog(`iguana fork error: ${err}`);
          console.log(`iguana fork error: ${err}`);
          throw err;
        }
      });
    });
  });
});

/*
 *  type: GET
 *
 */
shepherd.get('/InstantDEX/allcoins', function(req, res, next) {
  // TODO: if only native return obj
  //       else query main iguana instance and return combined response
  // http://localhost:7778/api/InstantDEX/allcoins?userpass=tmpIgRPCUser@1234
  let successObj;
  let nativeCoindList = [];

  for (let key in coindInstanceRegistry) {
    nativeCoindList.push(key === 'komodod' ? 'KMD' : key);
  }

  if (Object.keys(iguanaInstanceRegistry).length) {
    // call to iguana
    request({
      url: `http://localhost:${shepherd.appConfig.iguanaCorePort}/api/InstantDEX/allcoins?userpass=${req.query.userpass}`,
      method: 'GET'
    }, function (error, response, body) {
      if (response &&
          response.statusCode &&
          response.statusCode === 200) {
        const _body = JSON.parse(body);
        _body.native = nativeCoindList;
        console.log(_body);
      } else {
        console.log('main iguana instance is not ready yet');
      }

      res.send(body);
    });
  } else {
    successObj = {
      native: nativeCoindList,
      basilisk: [],
      full: [],
    };

    res.end(JSON.stringify(successObj));
  }
});

/*
 *  type: GET
 *
 */
shepherd.get('/SuperNET/activehandle', function(req, res, next) { // not finished
  // TODO: if only native return obj
  //       else query main iguana instance and return combined response
  // http://localhost:7778/api/SuperNET/activehandle?userpass=tmpIgRPCUser@1234
  let successObj;

  if (Object.keys(iguanaInstanceRegistry).length) {
    // call to iguana
    request({
      url: `http://localhost:${shepherd.appConfig.iguanaCorePort}/api/SuperNET/activehandle?userpass=${req.query.userpass}`,
      method: 'GET'
    }, function (error, response, body) {
      if (response &&
          response.statusCode &&
          response.statusCode === 200) {
        console.log(body);
      } else {
        console.log('main iguana instance is not ready yet');
      }

      res.send(body);
    });
  } else {
    successObj = {
      pubkey: 'nativeonly',
      result: 'success',
      handle: '',
      status: Object.keys(coindInstanceRegistry).length ? 'unlocked' : 'locked',
      duration: 2507830,
    };

    res.end(JSON.stringify(successObj));
  }
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
shepherd.post('/groom', function(req, res, next) {
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
  let _herd = req.body.herdname;
  let _ac = req.body.ac;
  let _lastNLines = req.body.lastLines;
  let _location;

  if (os.platform() === 'darwin') {
    komodoDir = shepherd.appConfig.dataDir.length ? shepherd.appConfig.dataDir : `${process.env.HOME}/Library/Application Support/Komodo`;
  }

  if (os.platform() === 'linux') {
    komodoDir = shepherd.appConfig.dataDir.length ? shepherd.appConfig.dataDir : `${process.env.HOME}/.komodo`;
  }

  if (os.platform() === 'win32') {
    komodoDir = shepherd.appConfig.dataDir.length ? shepherd.appConfig.dataDir : `${process.env.APPDATA}/Komodo`;
    komodoDir = path.normalize(komodoDir);
  }

  if (_herd === 'iguana') {
    _location = iguanaDir;
  } else if (_herd === 'komodo') {
    _location = komodoDir;
  }

  if (_ac) {
    _location = `${komodoDir}/${_ac}`;
  }

  console.log('komodo dir ' + komodoDir);
  shepherd.readDebugLog(`${_location}/debug.log`, _lastNLines)
  .then(function(result) {
    const _obj = {
      msg: 'success',
      result: result,
    };

    res.end(JSON.stringify(_obj));
  }, function(result) {
    const _obj = {
      msg: 'error',
      result: result,
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

  function testCoindPort() {
    const _port = assetChainPorts[req.body.options.ac_name];

    portscanner.checkPortStatus(_port, '127.0.0.1', function(error, status) {
      // Status is 'open' if currently in use or 'closed' if available
      if (status === 'open') {
        console.log(`komodod service start error at port ${_port}, reason: port is closed`);
        shepherd.writeLog(`komodod service start error at port ${_port}, reason: port is closed`);
        cache.io.emit('service', {
          komodod: {
            error: 'error starting ' + req.body.herd + ' ' + req.body.options.ac_name + ' daemon. Port ' + _port + ' is already taken!',
          },
        });

        const obj = {
          msg: 'error',
          result: 'error starting ' + req.body.herd + ' ' + req.body.options.ac_name + ' daemon. Port ' + _port + ' is already taken!',
        };

        res.status(500);
        res.end(JSON.stringify(obj));
      } else {
        herder(req.body.herd, req.body.options);

        const obj = {
          msg: 'success',
          result: 'result',
        };

        res.end(JSON.stringify(obj));
      }
    });
  }

  if (req.body.herd === 'komodod') {
    // check if komodod instance is already running
    testCoindPort();
    setTimeout(function() {
      testCoindPort();
    }, 10000);
  } else {
    herder(req.body.herd, req.body.options);

    const obj = {
      msg: 'success',
      result: 'result',
    };

    res.end(JSON.stringify(obj));
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
      shepherd.writeLog(list[0].pm2_env.status);
      shepherd.writeLog(list[0].pid);

      const obj = {
        herdname: req.body.herdname,
        status: list[0].pm2_env.status,
        pid: list[0].pid,
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
  const obj = {
    msg: 'success',
    result: 'result',
  };

  res.end(JSON.stringify(obj));
});

/*
 *  type: POST
 */
shepherd.post('/setconf', function(req, res) {
  console.log('======= req.body =======');
  console.log(req.body);

  if (os.platform() === 'win32' &&
      req.body.chain == 'komodod') {
    setkomodoconf = spawn(path.join(__dirname, '../assets/bin/win64/genkmdconf.bat'));
    //setkomodoconf = spawn(path.join(__dirname, '../assets/bin/win64/genkmdconf.bat'));
  } else {
    setConf(req.body.chain);
  }

  const obj = {
    msg: 'success',
    result: 'result',
  };

  res.end(JSON.stringify(obj));
});

/*
 *  type: POST
 */
shepherd.post('/getconf', function(req, res) {
  console.log('======= req.body =======');
  console.log(req.body);

  const confpath = getConf(req.body.chain);

  console.log('got conf path is:');
  console.log(confpath);
  shepherd.writeLog('got conf path is:');
  shepherd.writeLog(confpath);

  const obj = {
    msg: 'success',
    result: confpath,
  };

  res.end(JSON.stringify(obj));
});

/*
 *  type: GET
 *  params: coin, type
 */
shepherd.get('/kick', function(req, res, next) {
  const _coin = req.query.coin;
  const _type = req.query.type;

  if (!_coin) {
    const errorObj = {
      msg: 'error',
      result: 'no coin name provided',
    };

    res.end(JSON.stringify(errorObj));
  }

  if (!_type) {
    const errorObj = {
      msg: 'error',
      result: 'no type provided',
    };

    res.end(JSON.stringify(errorObj));
  }

  const kickStartDirs = {
    soft: [
      {
        name: 'DB/[coin]',
        type: 'pattern',
        match: 'balancecrc.',
      },
      {
        name: 'DB/[coin]/utxoaddrs',
        type: 'file',
      },
      {
        name: 'DB/[coin]/accounts',
        type: 'folder',
      },
      {
        name: 'DB/[coin]/fastfind',
        type: 'folder',
      },
      {
        name: 'tmp/[coin]',
        type: 'folder',
      }
    ],
    hard: [
      {
        name: 'DB/[coin]',
        type: 'pattern',
        match: 'balancecrc.',
      },
      {
        name: 'DB/[coin]/utxoaddrs',
        type: 'file',
      },
      {
        name: 'DB/[coin]',
        type: 'pattern',
        match: 'utxoaddrs.',
      },
      {
        name: 'DB/[coin]/accounts',
        type: 'folder',
      },
      {
        name: 'DB/[coin]/fastfind',
        type: 'folder',
      },
      {
        name: 'DB/[coin]/spends',
        type: 'folder',
      },
      {
        name: 'tmp/[coin]',
        type: 'folder',
      }
    ],
    brutal: [ // delete all coin related data
      {
        name: 'DB/[coin]',
        type: 'folder',
      },
      {
        name: 'DB/purgeable/[coin]',
        type: 'folder',
      },
      {
        name: 'DB/ro/[coin]',
        type: 'folder',
      },
      {
        name: 'tmp/[coin]',
        type: 'folder',
      }
    ]
  };

  if (_coin &&
      _type) {
    for (let i = 0; i < kickStartDirs[_type].length; i++) {
      let currentKickItem = kickStartDirs[_type][i];

      console.log('deleting ' + currentKickItem.type + (currentKickItem.match ? ' ' + currentKickItem.match : '') + ' ' + iguanaDir + '/' + currentKickItem.name.replace('[coin]', _coin));
      if (currentKickItem.type === 'folder' ||
          currentKickItem.type === 'file') {
        rimraf(`${iguanaDir}/${currentKickItem.name.replace('[coin]', _coin)}`, function(err) {
          if (err) {
            throw err;
          }
        });
      } else if (currentKickItem.type === 'pattern') {
        let dirItems = fs.readdirSync(`${iguanaDir}/currentKickItem.name.replace('[coin]', _coin)`);

        if (dirItems &&
            dirItems.length) {
          for (let j = 0; j < dirItems.length; j++) {
            if (dirItems[j].indexOf(currentKickItem.match) > -1) {
              rimraf(`${iguanaDir}/${currentKickItem.name.replace('[coin]', _coin)}/${dirItems[j]}`, function(err) {
                if (err) {
                  throw err;
                }
              });

              console.log(`deleting ${dirItems[j]}`);
            }
          }
        }
      }
    }

    const successObj = {
      msg: 'success',
      result: 'kickstart: brutal is executed',
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
            console.log(`error reading ${fileLocation}`);
            shepherd.writeLog(`error reading ${fileLocation}`);
            reject(`readDebugLog error: ${err}`);
          } else {
            console.log(`reading ${fileLocation}`);
            _fs.readFile(fileLocation, 'utf-8', function(err, data) {
              if (err)
                throw err;

              const lines = data.trim().split('\n');
              const lastLine = lines.slice(lines.length - lastNLines, lines.length).join('\n');

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
  if (data === undefined) {
    data = 'none';
    console.log('it is undefined');
  }

  if (flock === 'iguana') {
    console.log('iguana flock selected...');
    console.log(`selected data: ${data}`);
    shepherd.writeLog('iguana flock selected...');
    shepherd.writeLog(`selected data: ${data}`);

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
    mkdirp(`${iguanaDir}/shepherd`, function(err) {
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

      console.log(`confs files copied successfully at: ${iguanaConfsDir}`);
      shepherd.writeLog(`confs files copied successfully at: ${iguanaConfsDir}`);
    });

    pm2.connect(true,function(err) { //start up pm2 god
      if (err) {
        console.error(err);
        process.exit(2);
      }

      console.log(`iguana core port ${shepherd.appConfig.iguanaCorePort}`);
      shepherd.writeLog(`iguana core port ${shepherd.appConfig.iguanaCorePort}`);

      pm2.start({
        script: iguanaBin, // path to binary
        name: 'IGUANA',
        exec_mode : 'fork',
        args: [`-port=${shepherd.appConfig.iguanaCorePort}`],
        cwd: iguanaDir // set correct iguana directory
      }, function(err, apps) {
        iguanaInstanceRegistry[shepherd.appConfig.iguanaCorePort] = {
          mode: 'main',
          coin: 'none',
          pid: apps[0].process.pid,
          pmid: apps[0].pm2_env.pm_id,
        };
        shepherd.writeLog(`iguana core started at port ${shepherd.appConfig.iguanaCorePort} pid ${apps[0].process.pid}`);

        pm2.disconnect(); // Disconnect from PM2
        if (err) {
          shepherd.writeLog(`iguana core port ${shepherd.appConfig.iguanaCorePort}`);
          console.log(`iguana fork error: ${err}`);
          throw err;
        }
      });
    });
  }

  // TODO: notify gui that reindex/rescan param is used to reflect on the screen
  //       asset chain debug.log unlink
  if (flock === 'komodod') {
    let kmdDebugLogLocation = (data.ac_name !== 'komodod' ? komodoDir + '/' + data.ac_name : komodoDir) + '/debug.log';

    console.log('komodod flock selected...');
    console.log(`selected data: ${data}`);
    shepherd.writeLog('komodod flock selected...');
    shepherd.writeLog(`selected data: ${data}`);

    // truncate debug.log
    try {
      _fs.access(kmdDebugLogLocation, fs.constants.R_OK, function(err) {
        if (err) {
          console.log(`error accessing ${kmdDebugLogLocation}`);
          shepherd.writeLog(`error accessing ${kmdDebugLogLocation}`);
        } else {
          try {
            fs.unlink(kmdDebugLogLocation);
            console.log(`truncate ${kmdDebugLogLocation}`);
            shepherd.writeLog(`truncate ${kmdDebugLogLocation}`);
          } catch (e) {
            console.log('cant unlink debug.log');
          }
        }
      });
    } catch(e) {
      console.log(`komodod debug.log access err: ${e}`);
      shepherd.writeLog(`komodod debug.log access err: ${e}`);
    }

    // get komodod instance port
    const _port = assetChainPorts[data.ac_name];

    try {
      // check if komodod instance is already running
      portscanner.checkPortStatus(_port, '127.0.0.1', function(error, status) {
        // Status is 'open' if currently in use or 'closed' if available
        if (status === 'closed') {
          // start komodod via exec
          const _customParamDict = {
            silent: '&',
            reindex: '-reindex',
            change: '-pubkey=',
            datadir: '-datadir=',
            rescan: '-rescan',
          };
          let _customParam = '';

          if (data.ac_custom_param === 'silent' ||
              data.ac_custom_param === 'reindex' ||
              data.ac_custom_param === 'rescan') {
            _customParam = ` ${_customParamDict[data.ac_custom_param]}`;
          } else if (data.ac_custom_param === 'change' && data.ac_custom_param_value) {
            _customParam = ` ${_customParamDict[data.ac_custom_param]}${data.ac_custom_param_value}`;
          }

          if (shepherd.appConfig.dataDir.length) {
            _customParam = _customParam + ' -datadir=' + shepherd.appConfig.dataDir + '/' + data.ac_name;
          }

          console.log(`exec ${komododBin} ${data.ac_options.join(' ')}${_customParam}`);
          shepherd.writeLog(`exec ${komododBin} ${data.ac_options.join(' ')}${_customParam}`);

          const isChain = data.ac_name.match(/^[A-Z]*$/);
          const coindACParam = isChain ? ` -ac_name=${data.ac_name} ` : '';
          console.log(`daemon param ${data.ac_custom_param}`);

          coindInstanceRegistry[data.ac_name] = true;
          let _arg = `${coindACParam}${data.ac_options.join(' ')}${_customParam}`;
          _arg = _arg.trim().split(' ');
          execFile(`${komododBin}`, _arg, {
            maxBuffer: 1024 * 10000 // 10 mb
          }, function(error, stdout, stderr) {
            shepherd.writeLog(`stdout: ${stdout}`);
            shepherd.writeLog(`stderr: ${stderr}`);

            if (error !== null) {
              console.log(`exec error: ${error}`);
              shepherd.writeLog(`exec error: ${error}`);

              if (error.toString().indexOf('using -reindex') > -1) {
                cache.io.emit('service', {
                  komodod: {
                    error: 'run -reindex',
                  }
                });
              }
            }
          });
        } else {
          console.log(`port ${_port} (${data.ac_name}) is already in use`);
          shepherd.writeLog(`port ${_port} (${data.ac_name}) is already in use`);
        }
      });
    } catch(e) {
      console.log(`failed to start komodod err: ${e}`);
      shepherd.writeLog(`failed to start komodod err: ${e}`);
    }
  }

  if (flock === 'zcashd') {
    let kmdDebugLogLocation = `${zcashDir}/debug.log`;

    console.log('zcashd flock selected...');
    console.log(`selected data: ${data}`);
    shepherd.writeLog('zcashd flock selected...');
    shepherd.writeLog(`selected data: ${data}`);

    pm2.connect(true, function(err) { // start up pm2 god
      if (err) {
        console.error(err);
        process.exit(2);
      }

      pm2.start({
        script: zcashdBin, // path to binary
        name: data.ac_name, // REVS, USD, EUR etc.
        exec_mode: 'fork',
        cwd: zcashDir,
        args: data.ac_options
      }, function(err, apps) {
        shepherd.writeLog(`zcashd fork started ${data.ac_name} ${JSON.stringify(data.ac_options)}`);

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
    shepherd.writeLog(`deleting flock ${flock}`);
    shepherd.writeLog(ret);

    console.log(ret);
  });
}

shepherd.setConfKMD = function() {
  let komodoDir;
  let zcashDir;

  if (os.platform() === 'darwin') {
    komodoDir = `${process.env.HOME}/Library/Application Support/Komodo`;
    ZcashDir = `${process.env.HOME}/Library/Application Support/Zcash`;
  }

  if (os.platform() === 'linux') {
    komodoDir = `${process.env.HOME}/.komodo`;
    ZcashDir = `${process.env.HOME}/.zcash`;
  }

  if (os.platform() === 'win32') {
    komodoDir = `${process.env.APPDATA}/Komodo`;
    ZcashDir = `${process.env.APPDATA}/Zcash`;
  }

  // check if kmd conf exists
  _fs.access(`${komodoDir}/komodo.conf`, fs.constants.R_OK, function(err) {
    if (err) {
      console.log('creating komodo conf');
      shepherd.writeLog(`creating komodo conf in ${komodoDir}/komodo.conf`);
      setConf('komodod');
    } else {
      shepherd.writeLog('komodo conf exists');
      console.log('komodo conf exists');
    }
  });
}

function setConf(flock) {
  let komodoDir;
  let zcashDir;

  console.log(flock);
  shepherd.writeLog(`setconf ${flock}`);

  if (os.platform() === 'darwin') {
    komodoDir = `${process.env.HOME}/Library/Application Support/Komodo`;
    ZcashDir = `${process.env.HOME}/Library/Application Support/Zcash`;
  }

  if (os.platform() === 'linux') {
    komodoDir = `${process.env.HOME}/.komodo`;
    ZcashDir = `${process.env.HOME}/.zcash`;
  }

  if (os.platform() === 'win32') {
    komodoDir = `${process.env.APPDATA}/Komodo`;
    ZcashDir = `${process.env.APPDATA}/Zcash`;
  }

  let DaemonConfPath;
  switch (flock) {
    case 'komodod':
      DaemonConfPath = `${komodoDir}/komodo.conf`;

      if (os.platform() === 'win32') {
        DaemonConfPath = path.normalize(DaemonConfPath);
      }
      break;
    case 'zcashd':
      DaemonConfPath = `${ZcashDir}/zcash.conf`;

      if (os.platform() === 'win32') {
        DaemonConfPath = path.normalize(DaemonConfPath);
      }
      break;
    default:
      DaemonConfPath = `${komodoDir}/${flock}/${flock}.conf`;

      if (os.platform() === 'win32') {
        DaemonConfPath = path.normalize(DaemonConfPath);
      }
  }

  console.log(DaemonConfPath);
  shepherd.writeLog(`setconf ${DaemonConfPath}`);

  const CheckFileExists = function() {
    return new Promise(function(resolve, reject) {
      const result = 'Check Conf file exists is done'

      fs.ensureFile(DaemonConfPath, function(err) {
        console.log(err); // => null
      });

      setTimeout(function() {
        console.log(result);
        shepherd.writeLog(`setconf ${result}`);

        resolve(result);
      }, 2000);
    });
  }

  const FixFilePermissions = function() {
    return new Promise(function(resolve, reject) {
      const result = 'Conf file permissions updated to Read/Write';

      fsnode.chmodSync(DaemonConfPath, '0666');

      setTimeout(function() {
        console.log(result);
        shepherd.writeLog(`setconf ${result}`);

        resolve(result);
      }, 1000);
    });
  }

  const RemoveLines = function() {
    return new Promise(function(resolve, reject) {
      const result = 'RemoveLines is done';

      fs.readFile(DaemonConfPath, 'utf8', function(err, data) {
        if (err) {
          shepherd.writeLog(`setconf error ${err}`);
          return console.log(err);
        }

        const rmlines = data.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n');

        fs.writeFile(DaemonConfPath, rmlines, 'utf8', function(err) {
          if (err)
            return console.log(err);
        });
      });

      fsnode.chmodSync(DaemonConfPath, '0666');
      setTimeout(function() {
        shepherd.writeLog(`setconf ${result}`);
        console.log(result);

        resolve(result);
      }, 2000);
    });
  }

  const CheckConf = function() {
    return new Promise(function(resolve, reject) {
      const result = 'CheckConf is done';

      setconf.status(DaemonConfPath, function(err, status) {
        const rpcuser = function() {
          return new Promise(function(resolve, reject) {
            const result = 'checking rpcuser...';

            if (status[0].hasOwnProperty('rpcuser')) {
              console.log('rpcuser: OK');
              shepherd.writeLog('rpcuser: OK');
            } else {
              const randomstring = md5(Math.random() * Math.random() * 999);

              console.log('rpcuser: NOT FOUND');
              shepherd.writeLog('rpcuser: NOT FOUND');

              fs.appendFile(DaemonConfPath, `\nrpcuser=user${randomstring.substring(0, 16)}`, (err) => {
                if (err)
                  throw err;
                console.log('rpcuser: ADDED');
                shepherd.writeLog('rpcuser: ADDED');
              });
            }

            resolve(result);
          });
        }

        const rpcpass = function() {
          return new Promise(function(resolve, reject) {
            const result = 'checking rpcpassword...';

            if (status[0].hasOwnProperty('rpcpassword')) {
              console.log('rpcpassword: OK');
              shepherd.writeLog('rpcpassword: OK');
            } else {
              var randomstring = md5(Math.random() * Math.random() * 999);

              console.log('rpcpassword: NOT FOUND');
              shepherd.writeLog('rpcpassword: NOT FOUND');

              fs.appendFile(DaemonConfPath, `\nrpcpassword=${randomstring}`, (err) => {
                if (err)
                  throw err;
                console.log('rpcpassword: ADDED');
                shepherd.writeLog('rpcpassword: ADDED');
              });
            }

            resolve(result);
          });
        }

        const server = function() {
          return new Promise(function(resolve, reject) {
            const result = 'checking server...';

            if (status[0].hasOwnProperty('server')) {
              console.log('server: OK');
              shepherd.writeLog('server: OK');
            } else {
              console.log('server: NOT FOUND');
              shepherd.writeLog('server: NOT FOUND');

              fs.appendFile(DaemonConfPath, '\nserver=1', (err) => {
                if (err)
                  throw err;
                console.log('server: ADDED');
                shepherd.writeLog('server: ADDED');
              });
            }

            resolve(result);
          });
        }

        const addnode = function() {
          return new Promise(function(resolve, reject) {
            const result = 'checking addnode...';

            if (status[0].hasOwnProperty('addnode')) {
              console.log('addnode: OK');
              shepherd.writeLog('addnode: OK');
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
                shepherd.writeLog('addnode: ADDED');
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
        shepherd.writeLog(`checkconf addnode ${result}`);

        resolve(result);
      }, 2000);
    });
  }

  const MakeConfReadOnly = function() {
    return new Promise(function(resolve, reject) {
      const result = 'Conf file permissions updated to Read Only';

      fsnode.chmodSync(DaemonConfPath, '0400');

      setTimeout(function() {
        console.log(result);
        shepherd.writeLog(`MakeConfReadOnly ${result}`);

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
  let komodoDir = '';
  let ZcashDir = '';
  let DaemonConfPath = '';

  console.log(flock);
  shepherd.writeLog(`getconf flock: ${flock}`);

  if (os.platform() === 'darwin') {
    komodoDir = `${process.env.HOME}/Library/Application Support/Komodo`;
    ZcashDir = `${process.env.HOME}/Library/Application Support/Zcash`;
  }

  if (os.platform() === 'linux') {
    komodoDir = `${process.env.HOME}/.komodo`;
    ZcashDir = `${process.env.HOME}/.zcash`;
  }

  if (os.platform() === 'win32') {
    komodoDir = `${process.env.APPDATA}/Komodo`;
    ZcashDir = `${process.env.APPDATA}/Zcash`;
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
      DaemonConfPath = `${komodoDir}/${flock}`;
      if (os.platform() === 'win32') {
        DaemonConfPath = path.normalize(DaemonConfPath);
      }
  }

  shepherd.writeLog(`getconf path: ${DaemonConfPath}`);
  console.log(DaemonConfPath);
  return DaemonConfPath;
}

function formatBytes(bytes, decimals) {
  if (bytes === 0)
    return '0 Bytes';

  const k = 1000;
  const dm = (decimals + 1) || 3;
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

shepherd.SystemInfo = function() {
  const os_data = {
    'totalmem_bytes': os.totalmem(),
    'totalmem_readable': formatBytes(os.totalmem()),
    'arch': os.arch(),
    'cpu': os.cpus()[0].model,
    'cpu_cores': os.cpus().length,
    'platform': os.platform(),
    'os_release': os.release(),
    'os_type': os.type()
  };

  return os_data;
}

shepherd.appInfo = function() {
  const sysInfo = shepherd.SystemInfo();
  const releaseInfo = shepherd.appBasicInfo;
  const dirs = {
    iguanaDir,
    iguanaBin,
    komodoDir,
    komododBin,
    configLocation: `${iguanaDir}/config.json`,
    cacheLocation: `${iguanaDir}/shepherd`,
  };

  return {
    sysInfo,
    releaseInfo,
    dirs,
    appSession: shepherd.appSessionHash
  };
}

module.exports = shepherd;
