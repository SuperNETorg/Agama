const os = require('os');
const fs = require('fs-extra');
const portscanner = require('portscanner');
const exec = require('child_process').exec;
const execFile = require('child_process').execFile;
const path = require('path');
const request = require('request');
const Promise = require('bluebird');

const RATES_UPDATE_INTERVAL = 60000;

module.exports = (shepherd) => {
  shepherd.get('/mm/start', (req, res, next) => {
    shepherd.log('mm start is called');

    shepherd.startMarketMaker({ passphrase: req.query.passphrase });
    shepherd.mmupass = null;

    shepherd.mmupass = setInterval(() => {
      const options = {
        url: `http://localhost:7783`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method: 'balance' }),
      };

      // send back body on both success and error
      // this bit replicates iguana core's behaviour
      request(options, (error, response, body) => {
        if (response &&
            response.statusCode &&
            response.statusCode === 200) {
          const _parsedBody = JSON.parse(body);

          if (_parsedBody.userpass) {
            res.end(body);
            clearInterval(shepherd.mmupass);
            shepherd.mmupass = _parsedBody.userpass;
            shepherd.mmPublic.mmupass = shepherd.mmupass;
            shepherd.mmPublic.isAuth = true;
            shepherd.mmPublic.coins = _parsedBody.coins;
            shepherd.log(`mm start success`);
            shepherd.log(`mm userpass ${_parsedBody.userpass}`);
            shepherd.getCoinsHelper();
            shepherd.getRates();
          }
        } else {
          shepherd.log(`mm start responded with error ${error}`);
          /*res.end(body ? body : JSON.stringify({
            result: 'error',
            error: {
              code: -777,
              message: `unable to call method balance at port 7783`,
            },
          }));*/
        }
      });
    }, 500);
  });

  shepherd.getCoinsHelper = () => {
    const defaultCoinsListFile = path.join(__dirname, '../dex/coins.json');
    const _coins = fs.readJsonSync(defaultCoinsListFile, { throws: false });
    let coins = {};

    for (let i = 0; i < _coins.length; i++) {
      coins[_coins[i].coin] = _coins[i];
    }
    coins.MNZ.name = 'Monaize';
    coins.KMD =  { coin: 'KMD', name: 'Komodo' };
    coins.BTC = { coin: 'BTC', name: 'Bitcoin' };
    coins.IOP.name = 'Internet of People';

    shepherd.mmPublic.coinsHelper = coins;
  }

  shepherd.getRates = () => {
    function _getRates() {
      const options = {
        url: `https://min-api.cryptocompare.com/data/price?fsym=KMD&tsyms=BTC,USD`,
        method: 'GET',
      };

      // send back body on both success and error
      // this bit replicates iguana core's behaviour
      request(options, (error, response, body) => {
        if (response &&
            response.statusCode &&
            response.statusCode === 200) {
          const _parsedBody = JSON.parse(body);
          shepherd.log(`rates ${body}`);
          shepherd.mmPublic.rates = _parsedBody;
        } else {
          shepherd.log(`mm unable to retrieve KMD/BTC,USD rate`);
        }
      });
    }

    _getRates();
    shepherd.mmRatesInterval = setInterval(() => {
      _getRates();
    }, RATES_UPDATE_INTERVAL);
  }

  shepherd.getMMCacheData = () => {
    return new Promise((resolve, reject) => {
      resolve(shepherd.mmPublic);
    });
  }

  shepherd.get('/mm/stop', (req, res, next) => {
    shepherd.log('mm stop is called');
    clearInterval(shepherd.mmRatesInterval);
    shepherd.killRogueProcess('marketmaker');
    shepherd.mmPublic = {
      coins: [],
      mmupass: null,
      swaps: [],
      bids: [],
      asks: [],
      isAuth: false,
      rates: {},
    };

    const successObj = {
      msg: 'success',
      result: 'executed',
    };

    res.end(JSON.stringify(successObj));
  });

  shepherd.get('/mm/restart', (req, res, next) => {
    shepherd.log('mm restart is called');
    shepherd.killRogueProcess('marketmaker');
    shepherd.mmPublic = {
      coins: {},
      mmupass: null,
      swaps: [],
      bids: [],
      asks: [],
      isAuth: false,
    };

    setTimeout(() => {
      shepherd.startMarketMaker({ passphrase: req.query.passphrase });

      const successObj = {
        msg: 'success',
        result: 'restarting',
      };

      res.end(JSON.stringify(successObj));
    }, 1000);
  });

  shepherd.startMarketMaker = (data) => {
    const defaultCoinsListFile = path.join(__dirname, '../dex/coins.json');

    try {
      // check if marketmaker instance is already running
      portscanner.checkPortStatus(7783, '127.0.0.1', (error, status) => {
        // Status is 'open' if currently in use or 'closed' if available
        if (status === 'closed') {
          // add BarterDEX check
          const _coinsListFile = shepherd.agamaDir + '/coins.json';

          fs.pathExists(_coinsListFile, (err, exists) => {
            if (exists) {
              shepherd.log('dex coins file exist');
              data.coinslist = fs.readJsonSync(_coinsListFile, { throws: false });
              shepherd.execMarketMaker(data);
            } else if (!exists) {
              shepherd.log(`dex coins file doesnt exist`);
              fs.copy(defaultCoinsListFile, _coinsListFile)
              .then(() => {
                shepherd.log(`dex coins file copied to ${shepherd.agamaDir}`);
                data.coinslist = fs.readJsonSync(_coinsListFile, { throws: false });
                shepherd.execMarketMaker(data);
              })
              .catch(err => {
                shepherd.log(`unable to copy dex coins file, ${err}`);
              });
            } else if (err) {
              shepherd.log(`dex coins file doesnt exist, ${err}`);
            }
          });
        } else {
          shepherd.log(`port 7783 marketmaker is already in use`);
        }
      });
    } catch(e) {
      shepherd.log(`failed to start marketmaker err: ${e}`);
    }
  }

  shepherd.execMarketMaker = (data) => {
    const _customParam = {
      gui: 'agama-buildog',
      client: 1,
      profitmargin: 0.01, // (?)
      userhome: `${process.env.HOME}`,
      passphrase: data.passphrase,
      coins: data.coinslist,
    };

    //console.log(JSON.stringify(_customParam))
    //console.log(`exec ${BarterDEXBin} ${JSON.stringify(_customParam)}`);

    let params = _customParam;
    if (os.platform() !== 'win32') {
      params = `'${JSON.stringify(_customParam)}'`;
    } else {
      shepherd.mmBin = `"${shepherd.mmBin}"`;
      params.userhome = process.env.APPDATA;

      if (!!params.coins) { // if not undefined and true
        delete params.coins; // for Windows we should use coins.json file, and don't pass coins in command line
      }

      params = JSON.stringify(_customParam);
      params = params.replace(/"/g, '\\"');
      params = `"${params}"`;
    }

    const logStream = fs.createWriteStream(`${shepherd.agamaDir}/logFile.log`, { flags: 'a' });

    shepherd.log('starting mm');
    const mmid = exec(`${shepherd.mmBin} ${params}`, {
      cwd: shepherd.agamaDir,
      maxBuffer: 1024 * 50000 // 50 mb
    }, function(error, stdout, stderr) {
      // console.log(`stdout: ${stdout}`);
      // console.log(`stderr: ${stderr}`);

      if (error !== null) {
        shepherd.log(`mm exec error: ${error}`);
      }
    });

    mmid.stdout.on('data', (data) => {
      // console.log(`child stdout:\n${data}`);
    }).pipe(logStream);

    mmid.stderr.on('data', (data) => {
      // console.error(`child stderr:\n${data}`);
    }).pipe(logStream);
  }

  return shepherd;
};