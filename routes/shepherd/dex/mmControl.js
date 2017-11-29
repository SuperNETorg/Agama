const os = require('os');
const fs = require('fs-extra');
const portscanner = require('portscanner');
const exec = require('child_process').exec;
const execFile = require('child_process').execFile;
const path = require('path');

module.exports = (shepherd) => {
  shepherd.get('/mm/start', (req, res, next) => {
    shepherd.log('mm start is called');

    shepherd.startMarketMaker({ passphrase: req.query.passphrase });

    const successObj = {
      msg: 'success',
      result: 'started',
    };

    res.end(JSON.stringify(successObj));
  });

  shepherd.get('/mm/stop', (req, res, next) => {
    shepherd.log('mm stop is called');
    shepherd.killRogueProcess('marketmaker');

    const successObj = {
      msg: 'success',
      result: 'executed',
    };

    res.end(JSON.stringify(successObj));
  });

  shepherd.get('/mm/restart', (req, res, next) => {
    shepherd.log('mm restart is called');
    shepherd.killRogueProcess('marketmaker');
    setTimeout(() => {
      shepherd.startMarketMaker({ passphrase: req.query.passphrase });
    }, 1000);
    const successObj = {
      msg: 'success',
      result: 'restarting',
    };

    res.end(JSON.stringify(successObj));
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