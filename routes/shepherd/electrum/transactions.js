module.exports = (shepherd) => {
  shepherd.sortTransactions = (transactions) => {
    return transactions.sort((b, a) => {
      if (a.height < b.height) {
        return -1;
      }

      if (a.height > b.height) {
        return 1;
      }

      return 0;
    });
  }

  shepherd.get('/electrum/listtransactions', (req, res, next) => {
    const network = req.query.network || shepherd.findNetworkObj(req.query.coin);
    const ecl = new shepherd.electrumJSCore(shepherd.electrumServers[network].port, shepherd.electrumServers[network].address, shepherd.electrumServers[network].proto); // tcp or tls

    shepherd.log('electrum listtransactions ==>', true);

    if (!req.query.full) {
      ecl.connect();
      ecl.blockchainAddressGetHistory(req.query.address)
      .then((json) => {
        ecl.close();
        shepherd.log(json, true);

        json = shepherd.sortTransactions(json);

        const successObj = {
          msg: 'success',
          result: json,
        };

        res.end(JSON.stringify(successObj));
      });
    } else {
      // !expensive call!
      // TODO: limit e.g. 1-10, 10-20 etc
      const MAX_TX = req.query.maxlength || 10;
      ecl.connect();

      ecl.blockchainNumblocksSubscribe()
      .then((currentHeight) => {
        if (currentHeight &&
            Number(currentHeight) > 0) {
          ecl.blockchainAddressGetHistory(req.query.address)
          .then((json) => {
            if (json &&
                json.length) {
              json = shepherd.sortTransactions(json);
              json = json.slice(0, MAX_TX);
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
                        const decodedTx = shepherd.electrumJSTxDecoder(_rawtxJSON, _network);

                        let txInputs = [];

                        shepherd.log('decodedtx =>', true);
                        shepherd.log(decodedTx.outputs, true);

                        if (decodedTx &&
                            decodedTx.inputs) {
                          shepherd.Promise.all(decodedTx.inputs.map((_decodedInput, index) => {
                            return new shepherd.Promise((_resolve, _reject) => {
                              if (_decodedInput.txid !== '0000000000000000000000000000000000000000000000000000000000000000') {
                                ecl.blockchainTransactionGet(_decodedInput.txid)
                                .then((rawInput) => {
                                  const decodedVinVout = shepherd.electrumJSTxDecoder(rawInput, _network);

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
                              confirmations: Number(transaction.height) === 0 ? 0 : currentHeight - transaction.height,
                            };

                            const formattedTx = shepherd.parseTransactionAddresses(_parsedTx, req.query.address, network);

                            if (formattedTx.type) {
                              formattedTx.height = transaction.height;
                              formattedTx.blocktime = blockInfo.timestamp;
                              formattedTx.timereceived = blockInfo.timereceived;
                              formattedTx.hex = _rawtxJSON;
                              formattedTx.inputs = decodedTx.inputs;
                              formattedTx.outputs = decodedTx.outputs;
                              formattedTx.locktime = decodedTx.format.locktime;
                              _rawtx.push(formattedTx);
                            } else {
                              formattedTx[0].height = transaction.height;
                              formattedTx[0].blocktime = blockInfo.timestamp;
                              formattedTx[0].timereceived = blockInfo.timereceived;
                              formattedTx[0].hex = _rawtxJSON;
                              formattedTx[0].inputs = decodedTx.inputs;
                              formattedTx[0].outputs = decodedTx.outputs;
                              formattedTx[0].locktime = decodedTx.format.locktime;
                              formattedTx[1].height = transaction.height;
                              formattedTx[1].blocktime = blockInfo.timestamp;
                              formattedTx[1].timereceived = blockInfo.timereceived;
                              formattedTx[1].hex = _rawtxJSON;
                              formattedTx[1].inputs = decodedTx.inputs;
                              formattedTx[1].outputs = decodedTx.outputs;
                              formattedTx[1].locktime = decodedTx.format.locktime;
                              _rawtx.push(formattedTx[0]);
                              _rawtx.push(formattedTx[1]);
                            }
                            resolve(true);
                          });
                        } else {
                          const _parsedTx = {
                            network: decodedTx.network,
                            format: 'cant parse',
                            inputs: 'cant parse',
                            outputs: 'cant parse',
                            height: transaction.height,
                            timestamp: Number(transaction.height) === 0 ? Math.floor(Date.now() / 1000) : blockInfo.timestamp,
                            confirmations: Number(transaction.height) === 0 ? 0 : currentHeight - transaction.height,
                          };

                          const formattedTx = shepherd.parseTransactionAddresses(_parsedTx, req.query.address, network);
                          _rawtx.push(formattedTx);
                          resolve(true);
                        }
                      });
                    } else {
                      const _parsedTx = {
                        network: 'cant parse',
                        format: 'cant parse',
                        inputs: 'cant parse',
                        outputs: 'cant parse',
                        height: transaction.height,
                        timestamp: 'cant get block info',
                        confirmations: Number(transaction.height) === 0 ? 0 : currentHeight - transaction.height,
                      };
                      const formattedTx = shepherd.parseTransactionAddresses(_parsedTx, req.query.address, network);
                      _rawtx.push(formattedTx);
                      resolve(true);
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
          const successObj = {
            msg: 'error',
            result: 'cant get current height',
          };

          res.end(JSON.stringify(successObj));
        }
      });
    }
  });

  shepherd.get('/electrum/gettransaction', (req, res, next) => {
    const network = req.query.network || shepherd.findNetworkObj(req.query.coin);
    const ecl = new shepherd.electrumJSCore(shepherd.electrumServers[network].port, shepherd.electrumServers[network].address, shepherd.electrumServers[network].proto); // tcp or tls

    shepherd.log('electrum gettransaction =>', true);

    ecl.connect();
    ecl.blockchainTransactionGet(req.query.txid)
    .then((json) => {
      ecl.close();
      shepherd.log(json, true);

      const successObj = {
        msg: 'success',
        result: json,
      };

      res.end(JSON.stringify(successObj));
    });
  });

  shepherd.parseTransactionAddresses = (tx, targetAddress, network) => {
    // TODO: - sum vins / sum vouts to the same address
    //       - multi vin multi vout
    //       - detect change address
    let result = [];
    let _parse = {
      inputs: {},
      outputs: {},
    };
    let _sum = {
      inputs: 0,
      outputs: 0,
    };
    let _total = {
      inputs: 0,
      outputs: 0,
    };

    shepherd.log('parseTransactionAddresses result ==>', true);

    if (tx.format === 'cant parse') {
      return {
        type: 'unknown',
        amount: 'unknown',
        address: targetAddress,
        timestamp: tx.timestamp,
        txid: tx.format.txid,
        confirmations: tx.confirmations,
      }
    }

    for (let key in _parse) {
      if (!tx[key].length) {
        _parse[key] = [];
        _parse[key].push(tx[key]);
      } else {
        _parse[key] = tx[key];
      }

      for (let i = 0; i < _parse[key].length; i++) {
        shepherd.log(`key ==>`, true);
        shepherd.log(_parse[key][i], true);
        shepherd.log(Number(_parse[key][i].value), true);

        _total[key] += Number(_parse[key][i].value);

        if (_parse[key][i].scriptPubKey &&
            _parse[key][i].scriptPubKey.addresses &&
            _parse[key][i].scriptPubKey.addresses[0] === targetAddress &&
            _parse[key][i].value) {
          _sum[key] += Number(_parse[key][i].value);
        }
      }
    }

    if (_sum.inputs > 0 &&
        _sum.outputs > 0) {
      // vin + change, break into two tx
      result = [{ // reorder since tx sort by default is from newest to oldest
        type: 'sent',
        amount: Number(_sum.inputs.toFixed(8)),
        address: targetAddress,
        timestamp: tx.timestamp,
        txid: tx.format.txid,
        confirmations: tx.confirmations,
      }, {
        type: 'received',
        amount: Number(_sum.outputs.toFixed(8)),
        address: targetAddress,
        timestamp: tx.timestamp,
        txid: tx.format.txid,
        confirmations: tx.confirmations,
      }];

      if (network === 'komodo') { // calc claimed interest amount
        const vinVoutDiff = _total.inputs - _total.outputs;

        if (vinVoutDiff < 0) {
          result[1].interest = Number(vinVoutDiff.toFixed(8));
        }
      }
    } else if (_sum.inputs === 0 && _sum.outputs > 0) {
      result = {
        type: 'received',
        amount: Number(_sum.outputs.toFixed(8)),
        address: targetAddress,
        timestamp: tx.timestamp,
        txid: tx.format.txid,
        confirmations: tx.confirmations,
      };
    } else if (_sum.inputs > 0 && _sum.outputs === 0) {
      result = {
        type: 'sent',
        amount: Number(_sum.inputs.toFixed(8)),
        address: targetAddress,
        timestamp: tx.timestamp,
        txid: tx.format.txid,
        confirmations: tx.confirmations,
      };
    } else {
      // (?)
      result = {
        type: 'other',
        amount: 'unknown',
        address: targetAddress,
        timestamp: tx.timestamp,
        txid: tx.format.txid,
        confirmations: tx.confirmations,
      };
    }

    shepherd.log(_sum, true);
    shepherd.log(result, true);

    return result;
  }

  shepherd.get('/electrum/decoderawtx', (req, res, next) => {
    const _network = shepherd.getNetworkData(req.query.network);
    const _rawtx = req.query.rawtx;
    // const _rawtx = '0100000001dd6d064f5665f8454293ecaa9dbb55accf4f7e443d35f3b5ab7760f54b6c15fe000000006a473044022056355585a4a501ec9afc96aa5df124cf29ad3ac6454b47cd07cd7d89ec95ec2b022074c4604ee349d30e5336f210598e4dc576bf16ebeb67eeac3f4e82f56e930fee012103b90ba01af308757054e0484bb578765d5df59c4a57adbb94e2419df5e7232a63feffffff0289fc923b000000001976a91424af38fcb13bbc171b0b42bb017244a53b6bb2fa88ac20a10700000000001976a9142f4c0f91fc06ac228c120aee41741d0d3909683288ac49258b58';
    const decodedTx = shepherd.electrumJSTxDecoder(_rawtx, _network);

    shepherd.log('electrum decoderawtx input tx ==>', true);

    if (req.query.parseonly ||
        decodedTx.inputs[0].txid === '0000000000000000000000000000000000000000000000000000000000000000') {
      const successObj = {
        msg: 'success',
        result: {
          network: decodedTx.network,
          format: decodedTx.format,
          inputs: decodedTx.inputs,
          outputs: decodedTx.outputs,
        },
      };

      shepherd.log(successObj.result, true);

      res.end(JSON.stringify(successObj));
    } else {
      const ecl = new shepherd.electrumJSCore(shepherd.electrumServers[req.query.network].port, shepherd.electrumServers[req.query.network].address, shepherd.electrumServers[req.query.network].proto); // tcp or tls

      ecl.connect();
      ecl.blockchainTransactionGet(decodedTx.inputs[0].txid)
      .then((json) => {
        ecl.close();
        shepherd.log(json, true);

        const decodedVin = shepherd.electrumJSTxDecoder(json, _network);

        const successObj = {
          msg: 'success',
          result: {
            network: decodedTx.network,
            format: decodedTx.format,
            inputs: decodedVin.outputs[decodedTx.inputs[0].n],
            outputs: decodedTx.outputs,
          },
        };

        res.end(JSON.stringify(successObj));
      });
    }
  });

  return shepherd;
};