module.exports = (shepherd) => {
  shepherd.listunspent = (ecl, address, network, full, verify) => {
    let _atLeastOneDecodeTxFailed = false;

    if (full) {
      return new shepherd.Promise((resolve, reject) => {
        ecl.connect();
        ecl.blockchainAddressListunspent(address)
        .then((_utxoJSON) => {
          if (_utxoJSON &&
              _utxoJSON.length) {
            let formattedUtxoList = [];
            let _utxo = [];

            ecl.blockchainNumblocksSubscribe()
            .then((currentHeight) => {
              if (currentHeight &&
                  Number(currentHeight) > 0) {
                // filter out unconfirmed utxos
                for (let i = 0; i < _utxoJSON.length; i++) {
                  if (Number(currentHeight) - Number(_utxoJSON[i].height) !== 0) {
                    _utxo.push(_utxoJSON[i]);
                  }
                }

                if (!_utxo.length) { // no confirmed utxo
                  resolve('no valid utxo');
                } else {
                  shepherd.Promise.all(_utxo.map((_utxoItem, index) => {
                    return new shepherd.Promise((resolve, reject) => {
                      ecl.blockchainTransactionGet(_utxoItem['tx_hash'])
                      .then((_rawtxJSON) => {
                        shepherd.log('electrum gettransaction ==>', true);
                        shepherd.log(index + ' | ' + (_rawtxJSON.length - 1), true);
                        shepherd.log(_rawtxJSON, true);

                        // decode tx
                        const _network = shepherd.getNetworkData(network);
                        const decodedTx = shepherd.electrumJSTxDecoder(_rawtxJSON, network, _network);

                        shepherd.log('decoded tx =>', true);
                        shepherd.log(decodedTx, true);

                        if (!decodedTx) {
                          _atLeastOneDecodeTxFailed = true;
                          resolve('cant decode tx');
                        } else {
                          if (network === 'komodo') {
                            let interest = 0;

                            if (Number(_utxoItem.value) * 0.00000001 >= 10 &&
                                decodedTx.format.locktime > 0) {
                              interest = shepherd.kmdCalcInterest(decodedTx.format.locktime, _utxoItem.value);
                            }

                            let _resolveObj = {
                              txid: _utxoItem['tx_hash'],
                              vout: _utxoItem['tx_pos'],
                              address,
                              amount: Number(_utxoItem.value) * 0.00000001,
                              amountSats: _utxoItem.value,
                              locktime: decodedTx.format.locktime,
                              interest: Number(interest.toFixed(8)),
                              interestSats: Math.floor(interest * 100000000),
                              confirmations: Number(_utxoItem.height) === 0 ? 0 : currentHeight - _utxoItem.height,
                              spendable: true,
                              verified: false,
                            };

                            // merkle root verification agains another electrum server
                            if (verify) {
                              shepherd.verifyMerkleByCoin(shepherd.findCoinName(network), _utxoItem['tx_hash'], _utxoItem.height)
                              .then((verifyMerkleRes) => {
                                if (verifyMerkleRes &&
                                    verifyMerkleRes === shepherd.CONNECTION_ERROR_OR_INCOMPLETE_DATA) {
                                  verifyMerkleRes = false;
                                }

                                _resolveObj.verified = verifyMerkleRes;
                                resolve(_resolveObj);
                              });
                            } else {
                              resolve(_resolveObj);
                            }
                          } else {
                            let _resolveObj = {
                              txid: _utxoItem['tx_hash'],
                              vout: _utxoItem['tx_pos'],
                              address,
                              amount: Number(_utxoItem.value) * 0.00000001,
                              amountSats: _utxoItem.value,
                              confirmations: Number(_utxoItem.height) === 0 ? 0 : currentHeight - _utxoItem.height,
                              spendable: true,
                              verified: false,
                            };

                            // merkle root verification agains another electrum server
                            if (verify) {
                              shepherd.verifyMerkleByCoin(shepherd.findCoinName(network), _utxoItem['tx_hash'], _utxoItem.height)
                              .then((verifyMerkleRes) => {
                                if (verifyMerkleRes &&
                                    verifyMerkleRes === shepherd.CONNECTION_ERROR_OR_INCOMPLETE_DATA) {
                                  verifyMerkleRes = false;
                                }

                                _resolveObj.verified = verifyMerkleRes;
                                resolve(_resolveObj);
                              });
                            } else {
                              resolve(_resolveObj);
                            }
                          }
                        }
                      });
                    });
                  }))
                  .then(promiseResult => {
                    ecl.close();

                    if (!_atLeastOneDecodeTxFailed) {
                      shepherd.log(promiseResult, true);
                      resolve(promiseResult);
                    } else {
                      shepherd.log('listunspent error, cant decode tx(s)', true);
                      resolve('decode error');
                    }
                  });
                }
              } else {
                resolve('cant get current height');
              }
            });
          } else {
            ecl.close();
            resolve(shepherd.CONNECTION_ERROR_OR_INCOMPLETE_DATA);
          }
        });
      });
    } else {
      return new shepherd.Promise((resolve, reject) => {
        ecl.connect();
        ecl.blockchainAddressListunspent(address)
        .then((json) => {
          ecl.close();

          if (json &&
              json.length) {
            resolve(json);
          } else {
            resolve(shepherd.CONNECTION_ERROR_OR_INCOMPLETE_DATA);
          }
        });
      });
    }
  }

  shepherd.get('/electrum/listunspent', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      const network = req.query.network || shepherd.findNetworkObj(req.query.coin);
      const ecl = new shepherd.electrumJSCore(shepherd.electrumServers[network].port, shepherd.electrumServers[network].address, shepherd.electrumServers[network].proto); // tcp or tls

      if (req.query.full &&
          req.query.full === 'true') {
        shepherd.listunspent(
          ecl,
          req.query.address,
          network,
          true,
          req.query.verify
        ).then((listunspent) => {
          shepherd.log('electrum listunspent ==>', true);

          const successObj = {
            msg: 'success',
            result: listunspent,
          };

          res.end(JSON.stringify(successObj));
        });
      } else {
        shepherd.listunspent(ecl, req.query.address, network)
        .then((listunspent) => {
          ecl.close();
          shepherd.log('electrum listunspent ==>', true);

          const successObj = {
            msg: 'success',
            result: listunspent,
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