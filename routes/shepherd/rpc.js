module.exports = (shepherd) => {
  shepherd.getConf = (chain) => {
    let _confLocation = chain === 'komodod' ? `${shepherd.komodoDir}/komodo.conf` : `${shepherd.komodoDir}/${chain}/${chain}.conf`;
    _confLocation = chain === 'CHIPS' ? `${shepherd.chipsDir}/chips.conf` : _confLocation;

    // any coind
    if (chain) {
      if (shepherd.nativeCoindList[chain.toLowerCase()]) {
        const _osHome = shepherd.os.platform === 'win32' ? process.env.APPDATA : process.env.HOME;
        let coindDebugLogLocation = `${_osHome}/.${shepherd.nativeCoindList[chain.toLowerCase()].bin.toLowerCase()}/debug.log`;

        _confLocation = `${_osHome}/.${shepherd.nativeCoindList[chain.toLowerCase()].bin.toLowerCase()}/${shepherd.nativeCoindList[chain.toLowerCase()].bin.toLowerCase()}.conf`;
      }

      if (shepherd.fs.existsSync(_confLocation)) {
        let _port = shepherd.assetChainPorts[chain];
        const _rpcConf = shepherd.fs.readFileSync(_confLocation, 'utf8');

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
      let _cmd = req.body.payload.cmd;
      const _params = req.body.payload.params ? ` ${req.body.payload.params}` : '';

      if (!shepherd.rpcConf[_chain]) {
        shepherd.getConf(req.body.payload.chain === 'KMD' || !req.body.payload.chain && shepherd.kmdMainPassiveMode ? 'komodod' : req.body.payload.chain);
      }

      if (_mode === 'default') {
        /*let _body = {
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
        shepherd.request(options, function(error, response, body) {
          if (response &&
              response.statusCode &&
              response.statusCode === 200) {
            res.end(body);
          } else {
            res.end(body);
          }
        });*/
        if (_cmd === 'debug' &&
            _chain !== 'CHIPS') {
          if (shepherd.nativeCoindList[_chain.toLowerCase()]) {
            const _osHome = shepherd.os.platform === 'win32' ? process.env.APPDATA : process.env.HOME;
            let coindDebugLogLocation;

            if (_chain === 'CHIPS') {
              coindDebugLogLocation = `${shepherd.chipsDir}/debug.log`;
            } else {
              coindDebugLogLocation = `${_osHome}/.${shepherd.nativeCoindList[_chain.toLowerCase()].bin.toLowerCase()}/debug.log`;
            }

            shepherd.readDebugLog(coindDebugLogLocation, 1)
            .then((result) => {
              const _obj = {
                'msg': 'success',
                'result': result,
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
            'agent': 'bitcoinrpc',
            'method': _cmd,
          };

          if (req.body.payload.params) {
            _body = {
              'agent': 'bitcoinrpc',
              'method': _cmd,
              'params': req.body.payload.params === ' ' ? [''] : req.body.payload.params,
            };
          }

          if (req.body.payload.chain) {
            const options = {
              url: `http://localhost:${shepherd.rpcConf[req.body.payload.chain].port}`,
              method: 'POST',
              auth: {
                'user': shepherd.rpcConf[req.body.payload.chain].user,
                'pass': shepherd.rpcConf[req.body.payload.chain].pass
              },
              body: JSON.stringify(_body)
            };

            // send back body on both success and error
            // this bit replicates iguana core's behaviour
            shepherd.request(options, (error, response, body) => {
              if (response &&
                  response.statusCode &&
                  response.statusCode === 200) {
                res.end(body);
              } else {
                res.end(body);
              }
            });
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