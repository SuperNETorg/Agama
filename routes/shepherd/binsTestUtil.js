module.exports = (shepherd) => {
  shepherd.testClearAll = () => {
    return new shepherd.Promise((resolve, reject) => {
      shepherd.fs.removeSync(`${iguanaTestDir}`);
      resolve('done');
    });
  }

  shepherd.testBins = (daemonName) => {
    return new shepherd.Promise((resolve, reject) => {
      const _bins = {
        komodod: shepherd.komododBin,
        komodoCli: shepherd.komodocliBin,
      };
      const _arg = null;
      let _pid;

      shepherd.log('testBins exec ' + _bins[daemonName]);

      if (!shepherd.fs.existsSync(shepherd.agamaTestDir)) {
        shepherd.fs.mkdirSync(shepherd.agamaTestDir);
      }

      try {
        shepherd._fs.access(`${shepherd.agamaTestDir}/${daemonName}Test.log`, shepherd.fs.constants.R_OK, (err) => {
          if (!err) {
            try {
              shepherd._fs.unlinkSync(`${shepherd.agamaTestDir}/${daemonName}Test.log`);
            } catch (e) {}
          } else {
            shepherd.log(`path ${shepherd.agamaTestDir}/${daemonName}Test.log doesnt exist`);
          }
        });
      } catch (e) {}

      if (daemonName === 'komodod') {
        try {
          shepherd._fs.access(`${iguanaTestDir}/debug.log`, shepherd.fs.constants.R_OK, (err) => {
            if (!err) {
              shepherd._fs.unlinkSync(`${iguanaTestDir}/db.log`);
              shepherd._fs.unlinkSync(`${iguanaTestDir}/debug.log`);
              shepherd._fs.unlinkSync(`${iguanaTestDir}/komodo.conf`);
              shepherd._fs.unlinkSync(`${iguanaTestDir}/komodod.pid`);
              shepherd._fs.unlinkSync(`${iguanaTestDir}/komodostate`);
              shepherd._fs.unlinkSync(`${iguanaTestDir}/realtime`);
              shepherd._fs.unlinkSync(`${iguanaTestDir}/wallet.dat`);
              shepherd._fs.unlinkSync(`${iguanaTestDir}/.lock`);
              shepherd.fs.removeSync(`${iguanaTestDir}/blocks`);
              shepherd.fs.removeSync(`${iguanaTestDir}/chainstate`);
              shepherd.fs.removeSync(`${iguanaTestDir}/database`);
              execKomodod();
            } else {
              shepherd.log(`test: nothing to remove in ${iguanaTestDir}`);
              execKomodod();
            }
          });
        } catch (e) {}

        const execKomodod = () => {
          let _komododTest = {
            port: 'unknown',
            start: 'unknown',
            getinfo: 'unknown',
            errors: {
              assertFailed: false,
              zcashParams: false,
            },
          };
          const _komodoConf = 'rpcuser=user83f3afba8d714993\n' +
            'rpcpassword=0d4430ca1543833e35bce5a0cc9e16b3\n' +
            'server=1\n' +
            'addnode=78.47.196.146\n' +
            'addnode=5.9.102.210\n' +
            'addnode=178.63.69.164\n' +
            'addnode=88.198.65.74\n' +
            'addnode=5.9.122.241\n' +
            'addnode=144.76.94.3\n' +
            'addnode=144.76.94.38\n' +
            'addnode=89.248.166.91\n' +
            'addnode=148.251.57.148\n' +
            'addnode=149.56.28.84\n' +
            'addnode=176.9.26.39\n' +
            'addnode=94.102.63.199\n' +
            'addnode=94.102.63.200\n' +
            'addnode=104.255.64.3\n' +
            'addnode=221.121.144.140\n' +
            'addnode=103.18.58.150\n' +
            'addnode=103.18.58.146\n' +
            'addnode=213.202.253.10\n' +
            'addnode=185.106.121.32\n' +
            'addnode=27.100.36.201\n';

          shepherd.fs.writeFile(`${iguanaTestDir}/komodo.conf`, _komodoConf, (err) => {
            if (err) {
              shepherd.log(`test: error writing komodo conf in ${iguanaTestDir}`);
            }
          });

          shepherd.portscanner.checkPortStatus('7771', '127.0.0.1', (error, status) => {
            // Status is 'open' if currently in use or 'closed' if available
            if (status === 'closed') {
              _komododTest.port = 'passed';
            } else {
              _komododTest.port = 'failed';
            }
          });

          /*pm2.connect(true,function(err) { //start up pm2 god
            if (err) {
              shepherd.error(err);
              process.exit(2);
            }

            pm2.start({
              script: shepherd.komododBin, // path to binary
              name: 'komodod',
              exec_mode : 'fork',
              args: [
                '-daemon=0',
                '-addnode=78.47.196.146',
                `-datadir=${iguanaTestDir}/`
              ],
              output: `${iguanaTestDir}/komododTest.log`,
              mergeLogs: true,
            }, function(err, apps) {
              if (apps[0] &&
                  apps[0].process &&
                  apps[0].process.pid) {
                _komododTest.start = 'success';
                shepherd.log(`test: got komodod instance pid = ${apps[0].process.pid}`);
                shepherd.writeLog(`test: komodod started with pid ${apps[0].process.pid}`);
              } else {
                _komododTest.start = 'failed';
                shepherd.log(`unable to start komodod`);
              }

              pm2.disconnect(); // Disconnect from PM2
              if (err) {
                shepherd.writeLog(`test: error starting komodod`);
                shepherd.log(`komodod fork err: ${err}`);
                // throw err;
              }
            });
          });*/

          setTimeout(() => {
            const options = {
              url: `http://localhost:7771`,
              method: 'POST',
              auth: {
                user: 'user83f3afba8d714993',
                pass: '0d4430ca1543833e35bce5a0cc9e16b3',
              },
              body: JSON.stringify({
                agent: 'bitcoinrpc',
                method: 'getinfo',
              }),
            };

            shepherd.request(options, (error, response, body) => {
              if (response &&
                  response.statusCode &&
                  response.statusCode === 200) {
                // res.end(body);
                shepherd.log(JSON.stringify(body, null, '\t'));
              } else {
                // res.end(body);
                shepherd.log(JSON.stringify(body, null, '\t'));
              }
            });
          }, 10000);

          setTimeout(() => {
            pm2.delete('komodod');
            resolve(_komododTest);
          }, 20000);
        }
        // komodod debug.log hooks

  //"{\"result\":{\"version\":1000850,\"protocolversion\":170002,\"KMDversion\":\"0.1.1\",\"notarized\":0,\"notarizedhash\":\"0000000000000000000000000000000000000000000000000000000000000000\",\"notarizedtxid\":\"0000000000000000000000000000000000000000000000000000000000000000\",\"notarizedtxid_height\":\"mempool\",\"notarized_confirms\":0,\"walletversion\":60000,\"balance\":0.00000000,\"interest\":0.00000000,\"blocks\":128,\"longestchain\":472331,\"timeoffset\":0,\"tiptime\":1473827710,\"connections\":1,\"proxy\":\"\",\"difficulty\":1,\"testnet\":false,\"keypoololdest\":1504118047,\"keypoolsize\":101,\"paytxfee\":0.00000000,\"relayfee\":0.00000100,\"errors\":\"\"},\"error\":null,\"id\":null}\n"

        //2017-08-30 17:51:33 Error: Cannot find the Zcash network parameters in the following directory:
        //"/home/pbca/.zcash-params"
        //Please run 'zcash-fetch-params' or './zcutil/fetch-params.sh' and then restart.
        //EXCEPTION: St13runtime_error
        //Assertion failed.
        //2017-08-30 17:51:14 Using config file /home/pbca/.iguana/test/komodo.conf
        //2017-08-30 18:23:43 UpdateTip: new best=0a47c1323f393650f7221c217d19d149d002d35444f47fde61be2dd90fbde8e6  height=1  log2_work=5.0874628  tx=2  date=2016-09-13 19:04:01 progress=0.000001  cache=0.0MiB(1tx)
        //2017-08-30 18:23:43 UpdateTip: new best=05076a4e1fc9af0f5fda690257b17ae20c12d4796dfba1624804d012c9ec00be  height=2  log2_work=5.6724253  tx=3  date=2016-09-13 19:05:28 progress=0.000001  cache=0.0MiB(2tx)

        /*shepherd.execFile(`${shepherd.komododBin}`, _arg, {
          maxBuffer: 1024 * 10000 // 10 mb
        }, function(error, stdout, stderr) {
          shepherd.writeLog(`stdout: ${stdout}`);
          shepherd.writeLog(`stderr: ${stderr}`);

          if (error !== null) {
            console.log(`exec error: ${error}`);
            shepherd.writeLog(`exec error: ${error}`);

            if (error.toString().indexOf('using -reindex') > -1) {
              shepherd.io.emit('service', {
                komodod: {
                  error: 'run -reindex',
                }
              });
            }
          }
        });*/
      }
    });
  }

  // komodod datadir location test
  shepherd.testLocation = (path) => {
    return new shepherd.Promise((resolve, reject) => {
      if (shepherd.path.indexOf(' ') > -1) {
        shepherd.log(`error testing path ${path}`);
        resolve(-1);
      } else {
        shepherd.fs.lstat(path, (err, stats) => {
          if (err) {
            shepherd.log(`error testing path ${path}`);
            resolve(-1);
          } else {
            if (stats.isDirectory()) {
              resolve(true);
            } else {
              shepherd.log(`error testing path ${path} not a folder`);
              resolve(false);
            }
          }
        });
      }
    });
  }

  return shepherd;
};