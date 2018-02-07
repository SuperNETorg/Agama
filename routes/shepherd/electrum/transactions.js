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
    if (shepherd.checkToken(req.query.token)) {
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

                          let txInputs = [];
                          shepherd.log(`decodedtx network ${network}`, true);

                          shepherd.log('decodedtx =>', true);
                          shepherd.log(decodedTx.outputs, true);

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
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  shepherd.get('/electrum/gettransaction', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
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
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
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
    if (shepherd.checkToken(req.query.token)) {
      const _network = shepherd.getNetworkData(req.query.network);
      const _rawtx = req.query.rawtx;
      //const _rawtx = '010000006f2c395a02d81487fc7f9d1be3ea900316730133c044af70cd76d21e988e71de0e9e85918f010000006a47304402202097acd391e1d0eaaf91844bd596e918fb71320e3e0c51554acb71a39e4ee98b0220548fd61d4ae77a08d70b01bf5340983a1ba63f6b71ad71d478af77011f96fd510121031ffc010d8abc4180b4c1a13962bf9153a78082e7f2ac18f7d14cb6a6634ca218feffffff2b31f6c9a7916f7cf128cae94b3fc10e4c74ca3a740e1a7a6fd6624e4e9a5c8b010000006a473044022063f014c5fbaa7614732e0ae486179a854215fc32c02230e13f69b7e81fa000e50220236a2ba6373b1854aafc59c5391ab7505062067f3d293c016cbb5d252b35a56a012102f307f17d282fc0eabf99227c2e0f3122ae9ecd7da0de099f0c6007d4c941b57bfeffffff021b797ad7120000001976a914c7a7142d743b3e6eebe76923f43bae477d3ce31a88acff086d66000000001976a91463800ff36b9c52b2ffe5564af1c2a38df4f0126788ac16381d00';
      const decodedTx = shepherd.electrumJSTxDecoder(_rawtx, req.query.network, _network);

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
        shepherd.log(decodedTx.inputs[0]);
        shepherd.log(decodedTx.inputs[0].txid);
        ecl.blockchainTransactionGet(decodedTx.inputs[0].txid)
        .then((json) => {
          ecl.close();
          shepherd.log(json, true);

          const decodedVin = shepherd.electrumJSTxDecoder(json, req.query.network, _network);

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
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  return shepherd;
};