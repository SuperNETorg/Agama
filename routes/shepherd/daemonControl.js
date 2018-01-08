const spawn = require('child_process').spawn;
const fs = require('fs-extra');
const _fs = require('graceful-fs');
const fsnode = require('fs');
const path = require('path');
const os = require('os');
const portscanner = require('portscanner');
const execFile = require('child_process').execFile;
const Promise = require('bluebird');
const md5 = require('../md5.js');

module.exports = (shepherd) => {
  const getConf = (flock, coind) => {
    const _platform = os.platform();
    let DaemonConfPath = '';
    let nativeCoindDir;

    if (flock === 'CHIPS') {
      flock = 'chipsd';
    }

    shepherd.log(flock);
    shepherd.log(`getconf coind ${coind}`);
    shepherd.writeLog(`getconf flock: ${flock}`);

    if (coind) {
      switch (_platform) {
        case 'darwin':
          nativeCoindDir = `${process.env.HOME}/Library/Application Support/${shepherd.nativeCoindList[coind.toLowerCase()].bin}`;
          break;
        case 'linux':
          nativeCoindDir = coind ? `${process.env.HOME}/.${shepherd.nativeCoindList[coind.toLowerCase()].bin.toLowerCase()}` : null;
          break;
        case 'win32':
          nativeCoindDir = coind ? `${process.env.APPDATA}/${shepherd.nativeCoindList[coind.toLowerCase()].bin}` : null;
          break;
      }
    }

    switch (flock) {
      case 'komodod':
        DaemonConfPath = shepherd.komodoDir;
        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
          shepherd.log('===>>> SHEPHERD API OUTPUT ===>>>');
        }
        break;
      case 'zcashd':
        DaemonConfPath = shepherd.ZcashDir;
        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
        break;
      case 'chipsd':
        DaemonConfPath = shepherd.chipsDir;
        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
        break;
      case 'coind':
        DaemonConfPath = _platform === 'win32' ? shepherd.path.normalize(`${shepherd.coindRootDir}/${coind.toLowerCase()}`) : `${shepherd.coindRootDir}/${coind.toLowerCase()}`;
        break;
      default:
        DaemonConfPath = `${shepherd.komodoDir}/${flock}`;
        if (_platform === 'win32') {
          DaemonConfPath = shepherd.path.normalize(DaemonConfPath);
        }
    }

    shepherd.writeLog(`getconf path: ${DaemonConfPath}`);
    shepherd.log(`daemon path: ${DaemonConfPath}`);

    return DaemonConfPath;
  }

  // TODO: json.stringify wrapper

  const herder = (flock, data, coind) => {
    if (data === undefined) {
      data = 'none';
      shepherd.log('it is undefined');
    }

    shepherd.log(`herder flock: ${flock} coind: ${coind}`);
    shepherd.log(`selected data: ${JSON.stringify(data, null, '\t')}`);

    // TODO: notify gui that reindex/rescan param is used to reflect on the screen
    //       asset chain debug.log unlink
    if (flock === 'komodod') {
      let kmdDebugLogLocation = (data.ac_name !== 'komodod' ? `${shepherd.komodoDir}/${data.ac_name}` : shepherd.komodoDir) + '/debug.log';

      // get custom coind port
      const _coindConf = data.ac_name !== 'komodod' ? `${shepherd.komodoDir}/${data.ac_name}/${data.ac_name}.conf` : `${shepherd.komodoDir}/komodo.conf`;

      try {
        const _coindConfContents = fs.readFileSync(_coindConf, 'utf8');

        if (_coindConfContents) {
          const _coindCustomPort = _coindConfContents.match(/rpcport=\s*(.*)/);

          if (_coindCustomPort[1]) {
            shepherd.assetChainPorts[data.ac_name] = _coindCustomPort[1];
            shepherd.rpcConf[data.ac_name === 'komodod' ? 'KMD' : data.ac_name].port = _coindCustomPort[1];
            shepherd.log(`${data.ac_name} custom port ${_coindCustomPort[1]}`);
          } else {
            shepherd.assetChainPorts[data.ac_name] = shepherd.assetChainPortsDefault[data.ac_name];
            shepherd.rpcConf[data.ac_name === 'komodod' ? 'KMD' : data.ac_name].port = shepherd.assetChainPortsDefault[data.ac_name];
            shepherd.log(`${data.ac_name} port ${shepherd.assetChainPorts[data.ac_name]}`);
          }
        } else {
          shepherd.assetChainPorts[data.ac_name] = shepherd.assetChainPortsDefault[data.ac_name];
          shepherd.rpcConf[data.ac_name === 'komodod' ? 'KMD' : data.ac_name].port = shepherd.assetChainPortsDefault[data.ac_name];
          shepherd.log(`${data.ac_name} port ${shepherd.assetChainPorts[data.ac_name]}`);
        }
      } catch (e) {
        if (shepherd.rpcConf[data.ac_name === 'komodod' ? 'KMD' : data.ac_name]) {
          shepherd.rpcConf[data.ac_name === 'komodod' ? 'KMD' : data.ac_name].port = shepherd.assetChainPortsDefault[data.ac_name];
        }
        shepherd.assetChainPorts[data.ac_name] = shepherd.assetChainPortsDefault[data.ac_name];
        shepherd.log(`${data.ac_name} port ${shepherd.assetChainPorts[data.ac_name]}`);
      }

      shepherd.log('komodod flock selected...');
      shepherd.log(`selected data: ${JSON.stringify(data, null, '\t')}`);
      shepherd.writeLog('komodod flock selected...');
      shepherd.writeLog(`selected data: ${data}`);

      // datadir case, check if komodo/chain folder exists
      if (shepherd.appConfig.dataDir.length &&
          data.ac_name !== 'komodod') {
        const _dir = data.ac_name !== 'komodod' ? `${shepherd.komodoDir}/${data.ac_name}` : shepherd.komodoDir;

        try {
          _fs.accessSync(_dir, fs.R_OK | fs.W_OK);

          shepherd.log(`komodod datadir ${_dir} exists`);
        } catch (e) {
          shepherd.log(`komodod datadir ${_dir} access err: ${e}`);
          shepherd.log(`attempting to create komodod datadir ${_dir}`);

          fs.mkdirSync(_dir);

          if (fs.existsSync(_dir)) {
            shepherd.log(`created komodod datadir folder at ${_dir}`);
          } else {
            shepherd.log(`unable to create komodod datadir folder at ${_dir}`);
          }
        }
      }

      // truncate debug.log
      if (!shepherd.kmdMainPassiveMode) {
        try {
          const _confFileAccess = _fs.accessSync(kmdDebugLogLocation, fs.R_OK | fs.W_OK);

          if (_confFileAccess) {
            shepherd.log(`error accessing ${kmdDebugLogLocation}`);
            shepherd.writeLog(`error accessing ${kmdDebugLogLocation}`);
          } else {
            try {
              fs.unlinkSync(kmdDebugLogLocation);
              shepherd.log(`truncate ${kmdDebugLogLocation}`);
              shepherd.writeLog(`truncate ${kmdDebugLogLocation}`);
            } catch (e) {
              shepherd.log('cant unlink debug.log');
            }
          }
        } catch (e) {
          shepherd.log(`komodod debug.log access err: ${e}`);
          shepherd.writeLog(`komodod debug.log access err: ${e}`);
        }
      }

      // get komodod instance port
      const _port = shepherd.assetChainPorts[data.ac_name];

      try {
        // check if komodod instance is already running
        portscanner.checkPortStatus(_port, '127.0.0.1', (error, status) => {
          // Status is 'open' if currently in use or 'closed' if available
          if (status === 'closed' ||
              !shepherd.appConfig.stopNativeDaemonsOnQuit) {
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
              _customParam = _customParam + ' -datadir=' + shepherd.appConfig.dataDir + (data.ac_name !== 'komodod' ? '/' + data.ac_name : '');
            }

            shepherd.log(`exec ${shepherd.komododBin} ${data.ac_options.join(' ')}${_customParam}`);
            shepherd.writeLog(`exec ${shepherd.komododBin} ${data.ac_options.join(' ')}${_customParam}`);

            const isChain = data.ac_name.match(/^[A-Z]*$/);
            const coindACParam = isChain ? ` -ac_name=${data.ac_name} ` : '';
            shepherd.log(`daemon param ${data.ac_custom_param}`);

            shepherd.coindInstanceRegistry[data.ac_name] = true;
            if (!shepherd.kmdMainPassiveMode) {
              let _arg = `${coindACParam}${data.ac_options.join(' ')}${_customParam}`;
              _arg = _arg.trim().split(' ');

              const _daemonName = data.ac_name !== 'komodod' ? data.ac_name : 'komodod';
              const _daemonLogName = `${shepherd.agamaDir}/${_daemonName}.log`;

              try {
                fs.accessSync(_daemonLogName, fs.R_OK | fs.W_OK);
                shepherd.log(`created ${_daemonLogName}`);
                fs.unlinkSync(_daemonLogName);
              } catch (e) {
                shepherd.log(`error accessing ${_daemonLogName}, doesnt exist or another proc is already running`);
              }

              if (!shepherd.appConfig.stopNativeDaemonsOnQuit) {
                let spawnOut = fs.openSync(_daemonLogName, 'a');
                let spawnErr = fs.openSync(_daemonLogName, 'a');

                spawn(shepherd.komododBin, _arg, {
                  stdio: ['ignore', spawnOut, spawnErr],
                  detached: true,
                }).unref();
              } else {
                let logStream = fs.createWriteStream(_daemonLogName, { flags: 'a' });

                let _daemonChildProc = execFile(`${shepherd.komododBin}`, _arg, {
                  maxBuffer: 1024 * 1000000, // 1000 mb
                }, (error, stdout, stderr) => {
                  shepherd.writeLog(`stdout: ${stdout}`);
                  shepherd.writeLog(`stderr: ${stderr}`);

                  if (error !== null) {
                    shepherd.log(`exec error: ${error}`);
                    shepherd.writeLog(`exec error: ${error}`);

                    if (error.toString().indexOf('using -reindex') > -1) {
                      shepherd.io.emit('service', {
                        komodod: {
                          error: 'run -reindex',
                        },
                      });
                    }
                  }
                });

                _daemonChildProc.stdout.on('data', (data) => {
                  // shepherd.log(`${_daemonName} stdout: \n${data}`);
                }).pipe(logStream);

                _daemonChildProc.stdout.on('error', (data) => {
                  // shepherd.log(`${_daemonName} stdout: \n${data}`);
                }).pipe(logStream);

                _daemonChildProc.stderr.on('data', (data) => {
                  // shepherd.error(`${_daemonName} stderr:\n${data}`);
                }).pipe(logStream);

                _daemonChildProc.on('exit', (exitCode) => {
                  const _errMsg = exitCode === 0 ? `${_daemonName} exited with code ${exitCode}` : `${_daemonName} exited with code ${exitCode}, crashed?`;

                  fs.appendFile(_daemonLogName, _errMsg, (err) => {
                    if (err) {
                      shepherd.writeLog(_errMsg);
                      shepherd.log(_errMsg);
                    }
                    shepherd.log(_errMsg);
                  });
                });
              }
            }
          } else {
            if (shepherd.kmdMainPassiveMode) {
              shepherd.coindInstanceRegistry[data.ac_name] = true;
            }
            shepherd.log(`port ${_port} (${data.ac_name}) is already in use`);
            shepherd.writeLog(`port ${_port} (${data.ac_name}) is already in use`);
          }
        });
      } catch(e) {
        shepherd.log(`failed to start komodod err: ${e}`);
        shepherd.writeLog(`failed to start komodod err: ${e}`);
      }
    }

    // TODO: refactor
    if (flock === 'chipsd') {
      let kmdDebugLogLocation = `${shepherd.chipsDir}/debug.log`;

      shepherd.log('chipsd flock selected...');
      shepherd.log(`selected data: ${JSON.stringify(data, null, '\t')}`);
      shepherd.writeLog('chipsd flock selected...');
      shepherd.writeLog(`selected data: ${data}`);

      // truncate debug.log
      try {
        const _confFileAccess = _fs.accessSync(kmdDebugLogLocation, fs.R_OK | fs.W_OK);

        if (_confFileAccess) {
          shepherd.log(`error accessing ${kmdDebugLogLocation}`);
          shepherd.writeLog(`error accessing ${kmdDebugLogLocation}`);
        } else {
          try {
            fs.unlinkSync(kmdDebugLogLocation);
            shepherd.log(`truncate ${kmdDebugLogLocation}`);
            shepherd.writeLog(`truncate ${kmdDebugLogLocation}`);
          } catch (e) {
            shepherd.log('cant unlink debug.log');
          }
        }
      } catch(e) {
        shepherd.log(`chipsd debug.log access err: ${e}`);
        shepherd.writeLog(`chipsd debug.log access err: ${e}`);
      }

      // get komodod instance port
      const _port = shepherd.assetChainPorts.chipsd;

      try {
        // check if komodod instance is already running
        portscanner.checkPortStatus(_port, '127.0.0.1', (error, status) => {
          // Status is 'open' if currently in use or 'closed' if available
          if (status === 'closed') {
            // start komodod via exec
            const _customParamDict = {
              silent: '&',
              reindex: '-reindex',
              change: '-pubkey=',
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

            shepherd.log(`exec ${shepherd.chipsBin} ${_customParam}`);
            shepherd.writeLog(`exec ${shepherd.chipsBin} ${_customParam}`);

            shepherd.log(`daemon param ${data.ac_custom_param}`);

            shepherd.coindInstanceRegistry['CHIPS'] = true;
            let _arg = `${_customParam}`;
            _arg = _arg.trim().split(' ');

            if (_arg &&
                _arg.length > 1) {
              execFile(`${shepherd.chipsBin}`, _arg, {
                maxBuffer: 1024 * 1000000 // 1000 mb
              }, (error, stdout, stderr) => {
                shepherd.writeLog(`stdout: ${stdout}`);
                shepherd.writeLog(`stderr: ${stderr}`);

                if (error !== null) {
                  shepherd.log(`exec error: ${error}`);
                  shepherd.writeLog(`exec error: ${error}`);

                  if (error.toString().indexOf('using -reindex') > -1) {
                    shepherd.io.emit('service', {
                      komodod: {
                        error: 'run -reindex',
                      },
                    });
                  }
                }
              });
            } else {
              execFile(`${shepherd.chipsBin}`, {
                maxBuffer: 1024 * 1000000 // 1000 mb
              }, (error, stdout, stderr) => {
                shepherd.writeLog(`stdout: ${stdout}`);
                shepherd.writeLog(`stderr: ${stderr}`);

                if (error !== null) {
                  shepherd.log(`exec error: ${error}`);
                  shepherd.writeLog(`exec error: ${error}`);

                  if (error.toString().indexOf('using -reindex') > -1) {
                    shepherd.io.emit('service', {
                      komodod: {
                        error: 'run -reindex',
                      },
                    });
                  }
                }
              });
            }
          }
        });
      } catch(e) {
        shepherd.log(`failed to start chipsd err: ${e}`);
        shepherd.writeLog(`failed to start chipsd err: ${e}`);
      }
    }

    if (flock === 'zcashd') { // TODO: fix(?)
      let kmdDebugLogLocation = `${shepherd.zcashDir}/debug.log`;

      shepherd.log('zcashd flock selected...');
      shepherd.log(`selected data: ${data}`);
      shepherd.writeLog('zcashd flock selected...');
      shepherd.writeLog(`selected data: ${data}`);
    }

    if (flock === 'coind') {
      const _osHome = os.platform === 'win32' ? process.env.APPDATA : process.env.HOME;
      let coindDebugLogLocation = `${_osHome}/.${shepherd.nativeCoindList[coind.toLowerCase()].bin.toLowerCase()}/debug.log`;

      shepherd.log(`coind ${coind} flock selected...`);
      shepherd.log(`selected data: ${JSON.stringify(data, null, '\t')}`);
      shepherd.writeLog(`coind ${coind} flock selected...`);
      shepherd.writeLog(`selected data: ${data}`);

      // truncate debug.log
      try {
        _fs.access(coindDebugLogLocation, fs.constants.R_OK, (err) => {
          if (err) {
            shepherd.log(`error accessing ${coindDebugLogLocation}`);
            shepherd.writeLog(`error accessing ${coindDebugLogLocation}`);
          } else {
            shepherd.log(`truncate ${coindDebugLogLocation}`);
            shepherd.writeLog(`truncate ${coindDebugLogLocation}`);
            fs.unlink(coindDebugLogLocation);
          }
        });
       } catch(e) {
         shepherd.log(`coind ${coind} debug.log access err: ${e}`);
         shepherd.writeLog(`coind ${coind} debug.log access err: ${e}`);
       }

       // get komodod instance port
       const _port = shepherd.nativeCoindList[coind.toLowerCase()].port;
       const coindBin = `${shepherd.coindRootDir}/${coind.toLowerCase()}/${shepherd.nativeCoindList[coind.toLowerCase()].bin.toLowerCase()}d`;

       try {
         // check if coind instance is already running
        portscanner.checkPortStatus(_port, '127.0.0.1', (error, status) => {
          // Status is 'open' if currently in use or 'closed' if available
          if (status === 'closed') {
            shepherd.log(`exec ${coindBin} ${data.ac_options.join(' ')}`);
            shepherd.writeLog(`exec ${coindBin} ${data.ac_options.join(' ')}`);

            shepherd.coindInstanceRegistry[coind] = true;
            let _arg = `${data.ac_options.join(' ')}`;
            _arg = _arg.trim().split(' ');
            execFile(`${coindBin}`, _arg, {
              maxBuffer: 1024 * 1000000 // 1000 mb
            }, (error, stdout, stderr) => {
              shepherd.writeLog(`stdout: ${stdout}`);
              shepherd.writeLog(`stderr: ${stderr}`);

              if (error !== null) {
                shepherd.log(`exec error: ${error}`);
                shepherd.writeLog(`exec error: ${error}`);
              }
            });
          } else {
            shepherd.log(`port ${_port} (${coind}) is already in use`);
            shepherd.writeLog(`port ${_port} (${coind}) is already in use`);
          }
        });
      } catch(e) {
        shepherd.log(`failed to start ${coind} err: ${e}`);
        shepherd.writeLog(`failed to start ${coind} err: ${e}`);
      }
    }
  }

  const setConf = (flock, coind) => {
    const _platform = os.platform();
    let nativeCoindDir;
    let DaemonConfPath;

    shepherd.log(flock);
    shepherd.writeLog(`setconf ${flock}`);

    switch (_platform) {
      case 'darwin':
        nativeCoindDir = coind ? `${process.env.HOME}/Library/Application Support/${shepherd.nativeCoindList[coind.toLowerCase()].bin}` : null;
        break;
      case 'linux':
        nativeCoindDir = coind ? `${process.env.HOME}/.${shepherd.nativeCoindList[coind.toLowerCase()].bin.toLowerCase()}` : null;
        break;
      case 'win32':
        nativeCoindDir = coind ?  `${process.env.APPDATA}/${shepherd.nativeCoindList[coind.toLowerCase()].bin}` : null;
        break;
    }

    switch (flock) {
      case 'komodod':
        DaemonConfPath = `${shepherd.komodoDir}/komodo.conf`;

        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
        break;
      case 'zcashd':
        DaemonConfPath = `${shepherd.ZcashDir}/zcash.conf`;

        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
        break;
      case 'chipsd':
        DaemonConfPath = `${shepherd.chipsDir}/chips.conf`;

        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
        break;
      case 'coind':
        DaemonConfPath = `${nativeCoindDir}/${shepherd.nativeCoindList[coind.toLowerCase()].bin.toLowerCase()}.conf`;

        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
        break;
      default:
        DaemonConfPath = `${shepherd.komodoDir}/${flock}/${flock}.conf`;

        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
    }

    shepherd.log(DaemonConfPath);
    shepherd.writeLog(`setconf ${DaemonConfPath}`);

    const CheckFileExists = () => {
      return new Promise((resolve, reject) => {
        const result = 'Check Conf file exists is done';
        const confFileExist = fs.ensureFileSync(DaemonConfPath);

        if (confFileExist) {
          shepherd.log(result);
          shepherd.writeLog(`setconf ${result}`);

          resolve(result);
        } else {
          shepherd.log('conf file doesnt exist');
          resolve('conf file doesnt exist');
        }
      });
    }

    const FixFilePermissions = () => {
      return new Promise((resolve, reject) => {
        const result = 'Conf file permissions updated to Read/Write';

        fsnode.chmodSync(DaemonConfPath, '0666');
        shepherd.log(result);
        shepherd.writeLog(`setconf ${result}`);

        resolve(result);
      });
    }

    const RemoveLines = () => {
      return new Promise((resolve, reject) => {
        const result = 'RemoveLines is done';

        fs.readFile(DaemonConfPath, 'utf8', (err, data) => {
          if (err) {
            shepherd.writeLog(`setconf error ${err}`);
            return shepherd.log(err);
          }

          const rmlines = data.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n');

          fs.writeFile(DaemonConfPath, rmlines, 'utf8', (err) => {
            if (err)
              return shepherd.log(err);

            fsnode.chmodSync(DaemonConfPath, '0666');
            shepherd.writeLog(`setconf ${result}`);
            shepherd.log(result);
            resolve(result);
          });
        });
      });
    }

    const CheckConf = () => {
      return new Promise((resolve, reject) => {
        const result = 'CheckConf is done';

        shepherd.setconf.status(DaemonConfPath, (err, status) => {
          const rpcuser = () => {
            return new Promise((resolve, reject) => {
              const result = 'checking rpcuser...';

              if (status[0].hasOwnProperty('rpcuser')) {
                shepherd.log('rpcuser: OK');
                shepherd.writeLog('rpcuser: OK');
              } else {
                const randomstring = shepherd.md5((Math.random() * Math.random() * 999).toString());

                shepherd.log('rpcuser: NOT FOUND');
                shepherd.writeLog('rpcuser: NOT FOUND');

                fs.appendFile(DaemonConfPath, `\nrpcuser=user${randomstring.substring(0, 16)}`, (err) => {
                  if (err) {
                    shepherd.writeLog(`append daemon conf err: ${err}`);
                    shepherd.log(`append daemon conf err: ${err}`);
                  }
                  // throw err;
                  shepherd.log('rpcuser: ADDED');
                  shepherd.writeLog('rpcuser: ADDED');
                });
              }

              resolve(result);
            });
          }

          const rpcpass = () => {
            return new Promise((resolve, reject) => {
              const result = 'checking rpcpassword...';

              if (status[0].hasOwnProperty('rpcpassword')) {
                shepherd.log('rpcpassword: OK');
                shepherd.writeLog('rpcpassword: OK');
              } else {
                const randomstring = md5((Math.random() * Math.random() * 999).toString());

                shepherd.log('rpcpassword: NOT FOUND');
                shepherd.writeLog('rpcpassword: NOT FOUND');

                fs.appendFile(DaemonConfPath, `\nrpcpassword=${randomstring}`, (err) => {
                  if (err) {
                    shepherd.writeLog(`append daemon conf err: ${err}`);
                    shepherd.log(`append daemon conf err: ${err}`);
                  }
                  // throw err;
                  shepherd.log('rpcpassword: ADDED');
                  shepherd.writeLog('rpcpassword: ADDED');
                });
              }

              resolve(result);
            });
          }

          const rpcport = () => {
            return new Promise((resolve, reject) => {
              const result = 'checking rpcport...';

              if (flock === 'komodod') {
                if (status[0].hasOwnProperty('rpcport')) {
                  shepherd.log('rpcport: OK');
                  shepherd.writeLog('rpcport: OK');
                } else {
                  shepherd.log('rpcport: NOT FOUND');
                  shepherd.writeLog('rpcport: NOT FOUND');

                  fs.appendFile(DaemonConfPath, '\nrpcport=7771', (err) => {
                    if (err) {
                      shepherd.writeLog(`append daemon conf err: ${err}`);
                      shepherd.log(`append daemon conf err: ${err}`);
                    }
                    // throw err;
                    shepherd.log('rpcport: ADDED');
                    shepherd.writeLog('rpcport: ADDED');
                  });
                }
              }

              resolve(result);
            });
          }

          const server = () => {
            return new Promise((resolve, reject) => {
              const result = 'checking server...';

              if (status[0].hasOwnProperty('server')) {
                shepherd.log('server: OK');
                shepherd.writeLog('server: OK');
              } else {
                shepherd.log('server: NOT FOUND');
                shepherd.writeLog('server: NOT FOUND');

                fs.appendFile(DaemonConfPath, '\nserver=1', (err) => {
                  if (err) {
                    shepherd.writeLog(`append daemon conf err: ${err}`);
                    shepherd.log(`append daemon conf err: ${err}`);
                  }
                  // throw err;
                  shepherd.log('server: ADDED');
                  shepherd.writeLog('server: ADDED');
                });
              }

              resolve(result);
            });
          }

          const addnode = () => {
            return new Promise((resolve, reject) => {
              const result = 'checking addnode...';

              if (flock === 'chipsd' ||
                  flock === 'komodod') {
                if (status[0].hasOwnProperty('addnode')) {
                  shepherd.log('addnode: OK');
                  shepherd.writeLog('addnode: OK');
                } else {
                  let nodesList;

                  if (flock === 'chipsd') {
                    nodesList = '\naddnode=95.110.191.193' +
                    '\naddnode=144.76.167.66' +
                    '\naddnode=158.69.248.93' +
                    '\naddnode=149.202.49.218' +
                    '\naddnode=95.213.205.222' +
                    '\naddnode=5.9.253.198' +
                    '\naddnode=164.132.224.253' +
                    '\naddnode=163.172.4.66' +
                    '\naddnode=217.182.194.216' +
                    '\naddnode=94.130.96.114' +
                    '\naddnode=5.9.253.195';
                  } else if (flock === 'komodod') {
                    nodesList = '\naddnode=78.47.196.146' +
                    '\naddnode=5.9.102.210' +
                    '\naddnode=178.63.69.164' +
                    '\naddnode=88.198.65.74' +
                    '\naddnode=5.9.122.241' +
                    '\naddnode=144.76.94.3';
                  }

                  shepherd.log('addnode: NOT FOUND');
                  fs.appendFile(DaemonConfPath, nodesList, (err) => {
                    if (err) {
                      shepherd.writeLog(`append daemon conf err: ${err}`);
                      shepherd.log(`append daemon conf err: ${err}`);
                    }
                    // throw err;
                    shepherd.log('addnode: ADDED');
                    shepherd.writeLog('addnode: ADDED');
                  });
                }
              } else {
                result = 'skip addnode';
              }

              resolve(result);
            });
          }

          rpcuser()
          .then((result) => {
            return rpcpass();
          })
          .then(server)
          .then(rpcport)
          .then(addnode);
        });

        shepherd.log(result);
        shepherd.writeLog(`checkconf addnode ${result}`);

        resolve(result);
      });
    }

    CheckFileExists()
    .then((result) => {
      return FixFilePermissions();
    })
    .then(RemoveLines)
    .then(CheckConf);
  }

  /*
   *  type: POST
   *  params: herd
   */
  shepherd.post('/herd', (req, res) => {
    if (shepherd.checkToken(req.body.token)) {
      const _body = req.body;
      shepherd.log('herd req.body =>');
      shepherd.log(_body);

      if (_body.options &&
          !shepherd.kmdMainPassiveMode) {
        const testCoindPort = (skipError) => {
          const _acName = req.body.options.ac_name;

          if (!shepherd.lockDownAddCoin) {
            const _port = shepherd.assetChainPorts[_acName];

            portscanner.checkPortStatus(_port, '127.0.0.1', (error, status) => {
              // Status is 'open' if currently in use or 'closed' if available
              if (status === 'open' &&
                  shepherd.appConfig.stopNativeDaemonsOnQuit) {
                if (!skipError) {
                  shepherd.log(`komodod service start error at port ${_port}, reason: port is closed`);
                  shepherd.writeLog(`komodod service start error at port ${_port}, reason: port is closed`);
                  shepherd.io.emit('service', {
                    komodod: {
                      error: `error starting ${_body.herd} ${_acName} daemon. Port ${_port} is already taken!`,
                    },
                  });

                  const obj = {
                    msg: 'error',
                    result: `error starting ${_body.herd} ${_acName} daemon. Port ${_port} is already taken!`,
                  };

                  res.status(500);
                  res.end(JSON.stringify(obj));
                } else {
                  shepherd.log(`komodod service start success at port ${_port}`);
                  shepherd.writeLog(`komodod service start success at port ${_port}`);
                }
              } else {
                if (!skipError) {
                  herder(_body.herd, _body.options);

                  const obj = {
                    msg: 'success',
                    result: 'result',
                  };

                  res.end(JSON.stringify(obj));
                } else {
                  shepherd.log(`komodod service start error at port ${_port}, reason: unknown`);
                  shepherd.writeLog(`komodod service start error at port ${_port}, reason: unknown`);
                }
              }
            });
          }
        }

        if (_body.herd === 'komodod') {
          // check if komodod instance is already running
          testCoindPort();
          setTimeout(() => {
            testCoindPort(true);
          }, 10000);
        } else {
          herder(_body.herd, _body.options, _body.coind);

          const obj = {
            msg: 'success',
            result: 'result',
          };

          res.end(JSON.stringify(obj));
        }
      } else {
        // (?)
        herder(_body.herd, _body.options);

        const obj = {
          msg: 'success',
          result: 'result',
        };

        res.end(JSON.stringify(obj));
      }
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  /*
   *  type: POST
   */
  shepherd.post('/setconf', (req, res) => {
    if (shepherd.checkToken(req.body.token)) {
      const _body = req.body;

      shepherd.log('setconf req.body =>');
      shepherd.log(_body);

      if (os.platform() === 'win32' &&
          _body.chain == 'komodod') {
        setkomodoconf = spawn(path.join(__dirname, '../assets/bin/win64/genkmdconf.bat'));
      } else {
        shepherd.setConf(_body.chain);
      }

      const obj = {
        msg: 'success',
        result: 'result',
      };

      res.end(JSON.stringify(obj));
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  /*
   *  type: POST
   */
  shepherd.post('/getconf', (req, res) => {
    if (shepherd.checkToken(req.body.token)) {
      const _body = req.body;

      shepherd.log('getconf req.body =>');
      shepherd.log(_body);

      const confpath = getConf(_body.chain, _body.coind);

      shepherd.log(`getconf path is: ${confpath}`);
      shepherd.writeLog(`getconf path is: ${confpath}`);

      const obj = {
        msg: 'success',
        result: confpath,
      };

      res.end(JSON.stringify(obj));
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  shepherd.setConfKMD = (isChips) => {
    // check if kmd conf exists
    _fs.access(isChips ? `${shepherd.chipsDir}/chips.conf` : `${shepherd.komodoDir}/komodo.conf`, shepherd.fs.constants.R_OK, (err) => {
      if (err) {
        shepherd.log(isChips ? 'creating chips conf' : 'creating komodo conf');
        shepherd.writeLog(isChips ? `creating chips conf in ${shepherd.chipsDir}/chips.conf` : `creating komodo conf in ${shepherd.komodoDir}/komodo.conf`);
        setConf(isChips ? 'chipsd' : 'komodod');
      } else {
        const _confSize = shepherd.fs.lstatSync(isChips ? `${shepherd.chipsDir}/chips.conf` : `${shepherd.komodoDir}/komodo.conf`);

        if (_confSize.size === 0) {
          shepherd.log(isChips ? 'err: chips conf file is empty, creating chips conf' : 'err: komodo conf file is empty, creating komodo conf');
          shepherd.writeLog(isChips ? `creating chips conf in ${shepherd.chipsDir}/chips.conf` : `creating komodo conf in ${shepherd.komodoDir}/komodo.conf`);
          setConf(isChips ? 'chipsd' : 'komodod');
        } else {
          shepherd.writeLog(isChips ? 'chips conf exists' : 'komodo conf exists');
          shepherd.log(isChips ? 'chips conf exists' : 'komodo conf exists');
        }
      }
    });
  }

  shepherd.getAssetChainPorts = () => {
    return shepherd.assetChainPorts;
  }

  return shepherd;
};