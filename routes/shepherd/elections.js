const bs58check = require('bs58check');
const bitcoin = require('bitcoinjs-lib');

module.exports = (shepherd) => {
  shepherd.elections = {};

  shepherd.hex2str = (hexx) => {
    const hex = hexx.toString(); // force conversion
    let str = '';

    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }

    return str;
  };

  shepherd.post('/elections/status', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      const successObj = {
        msg: 'success',
        result: shepherd.elections.pub ? shepherd.elections.pub : 'unauth',
      };

      res.end(JSON.stringify(successObj));
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  shepherd.post('/elections/login', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      const _seed = req.body.seed;
      const _network = req.body.network;
      let keys;
      let isWif = false;

      try {
        bs58check.decode(_seed);
        isWif = true;
      } catch (e) {}

      if (isWif) {
        try {
          let key = bitcoin.ECPair.fromWIF(_seed, shepherd.getNetworkData(_network.toLowerCase()), true);
          keys = {
            priv: key.toWIF(),
            pub: key.getAddress(),
          };
        } catch (e) {
          _wifError = true;
        }
      } else {
        keys = shepherd.seedToWif(_seed, _network, req.body.iguana);
      }

      shepherd.elections = {
        priv: keys.priv,
        pub: keys.pub,
      };

      const successObj = {
        msg: 'success',
        result: keys.pub,
      };

      res.end(JSON.stringify(successObj));
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  shepherd.post('/elections/logout', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      shepherd.elections = {};

      const successObj = {
        msg: 'success',
        result: true,
      };

      res.end(JSON.stringify(successObj));
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  shepherd.get('/elections/listtransactions', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      const network = req.query.network || shepherd.findNetworkObj(req.query.coin);
      const ecl = new shepherd.electrumJSCore(shepherd.electrumServers[network].port, shepherd.electrumServers[network].address, shepherd.electrumServers[network].proto); // tcp or tls
      const type = req.query.type;
      const _address = req.query.address;

      shepherd.log('electrum elections listtransactions ==>', true);

      const MAX_TX = req.query.maxlength || 10;
      ecl.connect();

      ecl.blockchainAddressGetHistory(_address)
      .then((json) => {
        if (json &&
            json.length) {
          json = shepherd.sortTransactions(json);
          json = json.length > MAX_TX ? json.slice(0, MAX_TX) : json;
          let _rawtx = [];

          shepherd.log(json.length, true);

          shepherd.Promise.all(json.map((transaction, index) => {
            return new shepherd.Promise((resolve, reject) => {
              ecl.blockchainBlockGetHeader(transaction.height)
              .then((blockInfo) => {
                if (blockInfo &&
                    blockInfo.timestamp) {
                  ecl.blockchainTransactionGet(transaction['tx_hash'])
                  .then((_rawtxJSON) => {
                    shepherd.log('electrum gettransaction ==>', true);
                    shepherd.log((index + ' | ' + (_rawtxJSON.length - 1)), true);
                    shepherd.log(_rawtxJSON, true);

                    // decode tx
                    const _network = shepherd.getNetworkData(network);
                    const decodedTx = shepherd.electrumJSTxDecoder(_rawtxJSON, network, _network);
                    let _res = {};
                    let _opreturnFound = false;
                    let _region;

                    if (decodedTx &&
                        decodedTx.outputs &&
                        decodedTx.outputs.length) {
                      for (let i = 0; i < decodedTx.outputs.length; i++) {
                        if (decodedTx.outputs[i].scriptPubKey.asm.indexOf('OP_RETURN') > -1) {
                          _opreturnFound = true;
                          _region = shepherd.hex2str(decodedTx.outputs[i].scriptPubKey.hex.substr(4, decodedTx.outputs[i].scriptPubKey.hex.length));
                          shepherd.log(`found opreturn tag ${_region}`);
                          break;
                        }
                      }
                    }

                    if (_opreturnFound) {
                      let _candidate = {};

                      for (let i = 0; i < decodedTx.outputs.length; i++) {
                        if (type === 'voter' &&
                            decodedTx.outputs[i].scriptPubKey.addresses &&
                            decodedTx.outputs[i].scriptPubKey.addresses[0] &&
                            decodedTx.outputs[i].scriptPubKey.addresses[0] !== _address) {
                          shepherd.log(`i voted ${decodedTx.outputs[i].value} for ${decodedTx.outputs[i].scriptPubKey.addresses[0]}`);
                          _rawtx.push({
                            address: decodedTx.outputs[i].scriptPubKey.addresses[0],
                            amount: decodedTx.outputs[i].value,
                            region: _region,
                            timestamp: blockInfo.timestamp,
                          });
                        }

                        if (type === 'candidate') {
                          if (decodedTx.outputs[i].scriptPubKey.addresses[0] === _address) {
                            _candidate.amount = decodedTx.outputs[i].value;
                          } else if (decodedTx.outputs[i].scriptPubKey.addresses[0] !== _address && decodedTx.outputs[i].scriptPubKey.asm.indexOf('OP_RETURN') === -1) {
                            _candidate.address = decodedTx.outputs[i].scriptPubKey.addresses[0];
                            _candidate.region = _region;
                            _candidate.timestamp = blockInfo.timestamp;
                          }

                          if (i === decodedTx.outputs.length - 1) {
                            shepherd.log(`i received ${_candidate.amount} from ${_candidate.address}`);
                            _rawtx.push(_candidate);
                          }
                        }
                      }
                    }

                    resolve(true);
                  });
                } else {
                  resolve(false);
                }
              });
            });
          }))
          .then(promiseResult => {
            ecl.close();

            const successObj = {
              msg: 'success',
              result: _rawtx,
            };

            res.end(JSON.stringify(successObj));
          });
        } else {
          const successObj = {
            msg: 'success',
            result: [],
          };

          res.end(JSON.stringify(successObj));
        }
      });
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  return shepherd;
}