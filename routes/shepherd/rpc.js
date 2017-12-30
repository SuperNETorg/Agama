const fs = require('fs-extra');
const os = require('os');

module.exports = (shepherd) => {
  shepherd.getConf = (chain) => {
    let _confLocation = chain === 'komodod' ? `${shepherd.komodoDir}/komodo.conf` : `${shepherd.komodoDir}/${chain}/${chain}.conf`;
    _confLocation = chain === 'CHIPS' ? `${shepherd.chipsDir}/chips.conf` : _confLocation;

    // any coind
    if (chain) {
      if (shepherd.nativeCoindList[chain.toLowerCase()]) {
        const _osHome = os.platform === 'win32' ? process.env.APPDATA : process.env.HOME;
        let coindDebugLogLocation = `${_osHome}/.${shepherd.nativeCoindList[chain.toLowerCase()].bin.toLowerCase()}/debug.log`;

        _confLocation = `${_osHome}/.${shepherd.nativeCoindList[chain.toLowerCase()].bin.toLowerCase()}/${shepherd.nativeCoindList[chain.toLowerCase()].bin.toLowerCase()}.conf`;
      }

      if (fs.existsSync(_confLocation)) {
        let _port = shepherd.assetChainPorts[chain];
        const _rpcConf = fs.readFileSync(_confLocation, 'utf8');

        // any coind
        if (shepherd.nativeCoindList[chain.toLowerCase()]) {
          _port = shepherd.nativeCoindList[chain.toLowerCase()].port;
        }

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

          if (shepherd.nativeCoindList[chain.toLowerCase()]) {
            shepherd.rpcConf[chain] = parsedRpcConfig;
          } else {
            shepherd.rpcConf[chain === 'komodod' ? 'KMD' : chain] = parsedRpcConfig;
          }
        } else {
          shepherd.log(`${_confLocation} is empty`);
        }
      } else {
        shepherd.log(`${_confLocation} doesnt exist`);
      }
    }
  }

  /*
   *  type: POST
   *  params: payload
   */
  shepherd.post('/cli', (req, res, next) => {
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
      let _params = req.body.payload.params ? ` ${req.body.payload.params}` : '';
      let _cmd = req.body.payload.cmd;

      if (!shepherd.rpcConf[_chain]) {
        shepherd.getConf(req.body.payload.chain === 'KMD' || !req.body.payload.chain && shepherd.kmdMainPassiveMode ? 'komodod' : req.body.payload.chain);
      }

      if (_mode === 'default') {
        if (req.body.payload.rpc2cli) {
          let _coindCliBin = shepherd.komodocliBin;

          if (shepherd.nativeCoindList &&
              _chain &&
              shepherd.nativeCoindList[_chain.toLowerCase()]) {
            _coindCliBin = `${shepherd.coindRootDir}/${_chain.toLowerCase()}/${shepherd.nativeCoindList[_chain.toLowerCase()].bin.toLowerCase()}-cli`;
          }

          if (_params.indexOf('*')) {
            _params = _params.replace('*', '"*"');
          }
          if (_params.indexOf(',') > -1) {
            _params = _params.split(',');
          }
          if (_cmd.indexOf('getaddressesbyaccount') > -1) {
            _cmd = 'getaddressesbyaccount ""';
          }

          let _arg = (_chain ? ' -ac_name=' + _chain : '') + ' ' + _cmd + (typeof _params === 'object' ? _params.join(' ') : _params);

          if (shepherd.appConfig.dataDir.length) {
            _arg = `${_arg} -datadir=${shepherd.appConfig.dataDir  + (_chain ? '/' + key : '')}`;
          }

          shepherd.exec(`"${_coindCliBin}" ${_arg}`, (error, stdout, stderr) => {
            //shepherd.log(`stdout: ${stdout}`);
            //shepherd.log(`stderr: ${stderr}`);

            if (error !== null) {
              shepherd.log(`exec error: ${error}`);
            }

            let responseObj;

            if (stderr) {
              let _res;
              let _error;

              if (_chain !== 'komodod' &&
                  stderr.indexOf(`error creating`) > -1) {
                shepherd.log(`replace error creating (gen${_chain})`);
                stderr = stderr.replace(`error creating (gen${_chain})`, '');
                shepherd.log(stderr);
              }

              if ((stderr.indexOf('{') > -1 && stderr.indexOf('}') > -1) ||
                  (stderr.indexOf('[') > -1 && stderr.indexOf(']') > -1)) {
                _res = JSON.parse(stderr);
              } else {
                _res = stderr.trim();
              }

              if (stderr.indexOf('error code:') > -1) {
                _error = {
                  code: Number(stderr.substring(stderr.indexOf('error code:') + 11, stderr.indexOf('error message:') - stderr.indexOf('error code:')).trim()),
                  message: stderr.substring(stderr.indexOf('error message:') + 15, stderr.length).trim(),
                };
              }

              if (_error) {
                responseObj = {
                  error: _error,
                };
              } else {
                responseObj = {
                  result: _res,
                };
              }
            } else {
              let _res;
              let _error;

              if (_chain !== 'komodod' &&
                  stdout.indexOf(`error creating`) > -1) {
                shepherd.log(`replace error creating (gen${_chain})`);
                stdout = stdout.replace(`error creating (gen${_chain})`, '');
                shepherd.log(stdout);
              }

              if ((stdout.indexOf('{') > -1 && stdout.indexOf('}') > -1) ||
                  (stdout.indexOf('[') > -1 && stdout.indexOf(']') > -1)) {
                _res = JSON.parse(stdout);
              } else {
                _res = stdout.trim();
              }

              if (stdout.indexOf('error code:') > -1) {
                _error = {
                  code: Number(stdout.substring(stdout.indexOf('error code:') + 11, stdout.indexOf('error message:') - stdout.indexOf('error code:')).trim()),
                  message: stdout.substring(stdout.indexOf('error message:') + 15, stdout.length).trim(),
                };
              }

              if (_error) {
                responseObj = {
                  error: _error,
                };
              } else {
                responseObj = {
                  result: _res,
                };
              }
            }

            res.end(JSON.stringify(responseObj));
            // shepherd.killRogueProcess('komodo-cli');
          });
        } else {
          if (_cmd === 'debug' &&
              _chain !== 'CHIPS') {
            if (shepherd.nativeCoindList[_chain.toLowerCase()]) {
              const _osHome = os.platform === 'win32' ? process.env.APPDATA : process.env.HOME;
              let coindDebugLogLocation;

              if (_chain === 'CHIPS') {
                coindDebugLogLocation = `${shepherd.chipsDir}/debug.log`;
              } else {
                coindDebugLogLocation = `${_osHome}/.${shepherd.nativeCoindList[_chain.toLowerCase()].bin.toLowerCase()}/debug.log`;
              }

              shepherd.readDebugLog(coindDebugLogLocation, 1)
              .then((result) => {
                const _obj = {
                  msg: 'success',
                  result: result,
                };

                // shepherd.log('bitcoinrpc debug ====>');
                // console.log(result);

                res.end(JSON.stringify(_obj));
              }, (result) => {
                const _obj = {
                  error: result,
                  result: 'error',
                };

                res.end(JSON.stringify(_obj));
              });
            } else {
              res.end({
                error: 'bitcoinrpc debug error',
                result: 'error',
              });
              // console.log('bitcoinrpc debug error');
            }
          } else {
            if (_chain === 'CHIPS' &&
                _cmd === 'debug') {
              _cmd = 'getblockchaininfo';
            }

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

            if (req.body.payload.chain) {
              const options = {
                url: `http://localhost:${shepherd.rpcConf[req.body.payload.chain].port}`,
                method: 'POST',
                auth: {
                  user: shepherd.rpcConf[req.body.payload.chain].user,
                  pass: shepherd.rpcConf[req.body.payload.chain].pass,
                },
                body: JSON.stringify(_body),
              };

              // send back body on both success and error
              // this bit replicates iguana core's behaviour
              shepherd.request(options, (error, response, body) => {
                if (response &&
                    response.statusCode &&
                    response.statusCode === 200) {
                  res.end(body);
                } else {
                  res.end(body ? body : JSON.stringify({
                    result: 'error',
                    error: {
                      code: -777,
                      message: `unable to call method ${_cmd} at port ${shepherd.rpcConf[req.body.payload.chain].port}`,
                    },
                  }));
                }
              });
            }
          }
        }
      } else {
        let _coindCliBin = shepherd.komodocliBin;

        if (shepherd.nativeCoindList &&
            _chain &&
            shepherd.nativeCoindList[_chain.toLowerCase()]) {
          _coindCliBin = `${shepherd.coindRootDir}/${_chain.toLowerCase()}/${shepherd.nativeCoindList[_chain.toLowerCase()].bin.toLowerCase()}-cli`;
        }

        let _arg = (_chain ? ' -ac_name=' + _chain : '') + ' ' + _cmd + _params;

        if (shepherd.appConfig.dataDir.length) {
          _arg = `${_arg} -datadir=${shepherd.appConfig.dataDir  + (_chain ? '/' + key : '')}`;
        }

        _arg = _arg.trim().split(' ');
        shepherd.execFile(_coindCliBin, _arg, (error, stdout, stderr) => {
          shepherd.log(`stdout: ${stdout}`);
          shepherd.log(`stderr: ${stderr}`);

          if (error !== null) {
            shepherd.log(`exec error: ${error}`);
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

  return shepherd;
};