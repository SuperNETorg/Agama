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

      if (_seed.match('^[a-zA-Z0-9]{34}$')) {
        shepherd.log('watchonly elections pub addr');
        shepherd.elections = {
          priv: _seed,
          pub: _seed,
        };
      } else {
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
      }

      const successObj = {
        msg: 'success',
        result: shepherd.elections.pub,
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

  shepherd.electionsDecodeTx = (decodedTx, ecl, network, _network, transaction, blockInfo, address) => {
    let txInputs = [];

    return new shepherd.Promise((resolve, reject) => {
      if (decodedTx &&
          decodedTx.inputs) {
        shepherd.Promise.all(decodedTx.inputs.map((_decodedInput, index) => {
          return new shepherd.Promise((_resolve, _reject) => {
            if (_decodedInput.txid !== '0000000000000000000000000000000000000000000000000000000000000000') {
              ecl.blockchainTransactionGet(_decodedInput.txid)
              .then((rawInput) => {
                const decodedVinVout = shepherd.electrumJSTxDecoder(rawInput, network, _network);

                shepherd.log('electrum raw input tx ==>', true);

                if (decodedVinVout) {
                  shepherd.log(decodedVinVout.outputs[_decodedInput.n], true);
                  txInputs.push(decodedVinVout.outputs[_decodedInput.n]);
                  _resolve(true);
                } else {
                  _resolve(true);
                }
              });
            } else {
              _resolve(true);
            }
          });
        }))
        .then(promiseResult => {
          const _parsedTx = {
            network: decodedTx.network,
            format: decodedTx.format,
            inputs: txInputs,
            outputs: decodedTx.outputs,
            height: transaction.height,
            timestamp: Number(transaction.height) === 0 ? Math.floor(Date.now() / 1000) : blockInfo.timestamp,
          };

          resolve(shepherd.parseTransactionAddresses(_parsedTx, address, network, true));
        });
      } else {
        const _parsedTx = {
          network: decodedTx.network,
          format: 'cant parse',
          inputs: 'cant parse',
          outputs: 'cant parse',
          height: transaction.height,
          timestamp: Number(transaction.height) === 0 ? Math.floor(Date.now() / 1000) : blockInfo.timestamp,
        };

        resolve(shepherd.parseTransactionAddresses(_parsedTx, address, network));
      }
    });
  };

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
          let _rawtx = [];

          json = shepherd.sortTransactions(json);
          // json = json.length > MAX_TX ? json.slice(0, MAX_TX) : json;

          shepherd.log(json.length, true);

          shepherd.Promise.all(json.map((transaction, index) => {
            return new shepherd.Promise((resolve, reject) => {
              ecl.blockchainBlockGetHeader(transaction.height)
              .then((blockInfo) => {
                if (blockInfo &&
                    blockInfo.timestamp) {
                  ecl.blockchainTransactionGet(transaction['tx_hash'])
                  .then((_rawtxJSON) => {
                    //shepherd.log('electrum gettransaction ==>', true);
                    //shepherd.log((index + ' | ' + (_rawtxJSON.length - 1)), true);
                    //shepherd.log(_rawtxJSON, true);

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
                          if (_region === 'ne2k18-na-1-eu-2-ae-3-sh-4') {
                            const _regionsLookup = [
                              'ne2k18-na',
                              'ne2k18-eu',
                              'ne2k18-ae',
                              'ne2k18-sh'
                            ];

                            shepherd.log(`i voted ${decodedTx.outputs[i].value} for ${decodedTx.outputs[i].scriptPubKey.addresses[0]}`);
                            _rawtx.push({
                              address: decodedTx.outputs[i].scriptPubKey.addresses[0],
                              amount: decodedTx.outputs[i].value,
                              region: _regionsLookup[i],
                              timestamp: blockInfo.timestamp,
                            });
                            resolve(true);
                          } else {
                            shepherd.log(`i voted ${decodedTx.outputs[i].value} for ${decodedTx.outputs[i].scriptPubKey.addresses[0]}`);
                            _rawtx.push({
                              address: decodedTx.outputs[i].scriptPubKey.addresses[0],
                              amount: decodedTx.outputs[i].value,
                              region: _region,
                              timestamp: blockInfo.timestamp,
                            });
                            resolve(true);
                          }
                        }

                        if (type === 'candidate') {
                          if (_region === 'ne2k18-na-1-eu-2-ae-3-sh-4') {
                            if (decodedTx.outputs[i].scriptPubKey.addresses[0] === _address && decodedTx.outputs[i].scriptPubKey.asm.indexOf('OP_RETURN') === -1) {
                              const _regionsLookup = [
                                'ne2k18-na',
                                'ne2k18-eu',
                                'ne2k18-ae',
                                'ne2k18-sh'
                              ];

                              shepherd.electionsDecodeTx(decodedTx, ecl, network, _network, transaction, blockInfo, _address)
                              .then((res) => {
                                shepherd.log(`i received ${decodedTx.outputs[i].value} from ${res.outputAddresses[0]} out ${i} region ${_regionsLookup[i]}`);
                                _rawtx.push({
                                  address: res.outputAddresses[0],
                                  timestamp: blockInfo.timestamp,
                                  amount: decodedTx.outputs[i].value,
                                  region: _regionsLookup[i],
                                });
                                resolve(true);
                              });
                            }
                          } else {
                            shepherd.electionsDecodeTx(decodedTx, ecl, network, _network, transaction, blockInfo, _address)
                            .then((res) => {
                              if (decodedTx.outputs[i].scriptPubKey.addresses[0] === _address) {
                                _candidate.amount = decodedTx.outputs[i].value;
                              } else if (decodedTx.outputs[i].scriptPubKey.addresses[0] !== _address && decodedTx.outputs[i].scriptPubKey.asm.indexOf('OP_RETURN') === -1) {
                                _candidate.address = decodedTx.outputs[i].scriptPubKey.addresses[0];
                                _candidate.region = _region;
                                _candidate.timestamp = blockInfo.timestamp;
                              }

                              if (i === decodedTx.outputs.length - 1) {
                                shepherd.log(`i received ${_candidate.amount} from ${_candidate.address} region ${_region}`);
                                _rawtx.push(_candidate);
                                resolve(true);
                              }
                            });
                          }
                        }
                      }
                    } else {
                      shepherd.log('elections regular tx', true);
                      shepherd.electionsDecodeTx(decodedTx, ecl, network, _network, transaction, blockInfo, _address)
                      .then((_regularTx) => {
                        if (_regularTx[0] &&
                            _regularTx[1]) {
                          _rawtx.push({
                            address: _regularTx[type === 'voter' ? 0 : 1].address || 'self',
                            timestamp: _regularTx[type === 'voter' ? 0 : 1].timestamp,
                            amount: _regularTx[type === 'voter' ? 0 : 1].amount,
                            region: 'unknown',
                            regularTx: true,
                            hash: transaction['tx_hash'],
                          });
                        } else {
                          if ((type === 'voter' && _regularTx.type !== 'received') && (type === 'candidate' && _regularTx.type !== 'sent')) {
                            _rawtx.push({
                              address: _regularTx.address || 'self',
                              timestamp: _regularTx.timestamp,
                              amount: _regularTx.amount,
                              region: 'unknown',
                              regularTx: true,
                              hash: transaction['tx_hash'],
                            });
                          }
                        }
                        resolve(true);
                      });
                    }
                  });
                } else {
                  _rawtx.push({
                    address: 'unknown',
                    timestamp: 'cant get block info',
                    amount: 'unknown',
                    region: 'unknown',
                    regularTx: true,
                  });
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