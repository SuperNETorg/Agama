module.exports = (shepherd) => {
  /*
   *  type: GET
   *
   */
  shepherd.get('/coindwalletkeys', (req, res, next) => {
    const wif = require('wif');
    const fs = require('fs');
    const chain = req.query.chain;

    // ref: https://gist.github.com/kendricktan/1e62495150ad236b38616d733aac4eb9
    let _walletDatLocation = chain === 'komodo' || chain === 'null' ? `${shepherd.komodoDir}/wallet.dat` : `${shepherd.komodoDir}/${chain}/wallet.dat`;
    _walletDatLocation = chain === 'CHIPS' ? `${shepherd.chipsDir}/wallet.dat` : _walletDatLocation;

    try {
      shepherd._fs.access(_walletDatLocation, shepherd.fs.constants.R_OK, (err) => {
        if (err) {
          shepherd.log(`error reading ${_walletDatLocation}`);
          successObj = {
            msg: 'error',
            result: `error reading ${_walletDatLocation}`,
          };

          res.end(JSON.stringify(successObj));
        } else {
          shepherd.log(`reading ${_walletDatLocation}`);
          fs.readFile(_walletDatLocation, (err, data) => {
            if (err) {
              shepherd.log(`read wallet.dat err: ${err}`);
              successObj = {
                msg: 'error',
                result: `error reading ${_walletDatLocation}`,
              };

              res.end(JSON.stringify(successObj));
            } else {
              const re = /\x30\x81\xD3\x02\x01\x01\x04\x20(.{32})/gm;
              const dataHexStr = data.toString('latin1');
              privateKeys = dataHexStr.match(re);

              if (!privateKeys) {
                shepherd.log('wallet is encrypted?');

                successObj = {
                  msg: 'error',
                  result: 'wallet is encrypted?',
                };

                res.end(JSON.stringify(successObj));
              } else {
                let _keys = [];
                privateKeys = privateKeys.map(x => x.replace('\x30\x81\xD3\x02\x01\x01\x04\x20', ''));
                privateKeys = privateKeys.filter((v, i, a) => a.indexOf(v) === i);
                shepherd.log(`found ${privateKeys.length} keys`);

                for (let i = 0; i < privateKeys.length; i++) {
                  const privateKey = new Buffer(Buffer.from(privateKeys[i], 'latin1').toString('hex'), 'hex');
                  const key = wif.encode(0xbc, privateKey, true);
                  const keyObj = wif.decode(key);
                  const wifKey = wif.encode(keyObj);

                  const keyPair = shepherd.bitcoinJS.ECPair.fromWIF(wifKey, shepherd.electrumJSNetworks.komodo);
                  const _keyPair = {
                    priv: keyPair.toWIF(),
                    pub: keyPair.getAddress(),
                  };

                  if (req.query.search) {
                    if (_keyPair.pub.indexOf(req.query.search) > -1) {
                      _keys.push(_keyPair);
                    }
                  } else {
                    _keys.push(_keyPair);
                  }
                }

                successObj = {
                  msg: 'success',
                  result: _keys,
                };

                res.end(JSON.stringify(successObj));
              }
            }
          });
        }
      });
    } catch (e) {
      successObj = {
        msg: 'error',
        result: `error reading ${_walletDatLocation}`,
      };

      res.end(JSON.stringify(successObj));
    }
  });

  return shepherd;
};