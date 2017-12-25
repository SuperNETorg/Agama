module.exports = (shepherd) => {
  shepherd.get('/electrum/getbalance', (req, res, next) => {
    const network = req.query.network || shepherd.findNetworkObj(req.query.coin);
    const ecl = new shepherd.electrumJSCore(shepherd.electrumServers[network].port, shepherd.electrumServers[network].address, shepherd.electrumServers[network].proto); // tcp or tls

    shepherd.log('electrum getbalance =>', true);

    ecl.connect();
    ecl.blockchainAddressGetBalance(req.query.address)
    .then((json) => {
      if (json &&
          json.hasOwnProperty('confirmed') &&
          json.hasOwnProperty('unconfirmed')) {
        if (network === 'komodo') {
          ecl.connect();
          ecl.blockchainAddressListunspent(req.query.address)
          .then((utxoList) => {
            if (utxoList &&
                utxoList.length) {
              // filter out < 10 KMD amounts
              let _utxo = [];

              for (let i = 0; i < utxoList.length; i++) {
                shepherd.log(`utxo ${utxoList[i]['tx_hash']} sats ${utxoList[i].value} value ${Number(utxoList[i].value) * 0.00000001}`, true);

                if (Number(utxoList[i].value) * 0.00000001 >= 10) {
                  _utxo.push(utxoList[i]);
                }
              }

              shepherd.log('filtered utxo list =>', true);
              shepherd.log(_utxo, true);

              if (_utxo &&
                  _utxo.length) {
                let interestTotal = 0;

                shepherd.Promise.all(_utxo.map((_utxoItem, index) => {
                  return new shepherd.Promise((resolve, reject) => {
                    ecl.blockchainTransactionGet(_utxoItem['tx_hash'])
                    .then((_rawtxJSON) => {
                      shepherd.log('electrum gettransaction ==>', true);
                      shepherd.log((index + ' | ' + (_rawtxJSON.length - 1)), true);
                      shepherd.log(_rawtxJSON, true);

                      // decode tx
                      const _network = shepherd.getNetworkData(network);
                      const decodedTx = shepherd.electrumJSTxDecoder(_rawtxJSON, network, _network);

                      if (decodedTx &&
                          decodedTx.format &&
                          decodedTx.format.locktime > 0) {
                        interestTotal += shepherd.kmdCalcInterest(decodedTx.format.locktime, _utxoItem.value);
                      }

                      shepherd.log('decoded tx =>', true);
                      shepherd.log(decodedTx, true);

                      resolve(true);
                    });
                  });
                }))
                .then(promiseResult => {
                  ecl.close();

                  const successObj = {
                    msg: 'success',
                    result: {
                      balance: Number((0.00000001 * json.confirmed).toFixed(8)),
                      unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
                      unconfirmedSats: json.unconfirmed,
                      balanceSats: json.confirmed,
                      interest: Number(interestTotal.toFixed(8)),
                      interestSats: Math.floor(interestTotal * 100000000),
                      total: interestTotal > 0 ? Number((0.00000001 * json.confirmed + interestTotal).toFixed(8)) : 0,
                      totalSats: interestTotal > 0 ?json.confirmed + Math.floor(interestTotal * 100000000) : 0,
                    },
                  };

                  res.end(JSON.stringify(successObj));
                });
              } else {
                const successObj = {
                  msg: 'success',
                  result: {
                    balance: Number((0.00000001 * json.confirmed).toFixed(8)),
                    unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
                    unconfirmedSats: json.unconfirmed,
                    balanceSats: json.confirmed,
                    interest: 0,
                    interestSats: 0,
                    total: 0,
                    totalSats: 0,
                  },
                };

                res.end(JSON.stringify(successObj));
              }
            } else {
              const successObj = {
                msg: 'success',
                result: {
                  balance: Number((0.00000001 * json.confirmed).toFixed(8)),
                  unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
                  unconfirmedSats: json.unconfirmed,
                  balanceSats: json.confirmed,
                  interest: 0,
                  interestSats: 0,
                  total: 0,
                  totalSats: 0,
                },
              };

              res.end(JSON.stringify(successObj));
            }
          });
        } else {
          ecl.close();
          shepherd.log('electrum getbalance ==>', true);
          shepherd.log(json, true);

          const successObj = {
            msg: 'success',
            result: {
              balance: Number((0.00000001 * json.confirmed).toFixed(8)),
              unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
              unconfirmedSats: json.unconfirmed,
              balanceSats: json.confirmed,
            },
          };

          res.end(JSON.stringify(successObj));
        }
      } else {
        const successObj = {
          msg: 'error',
          result: shepherd.CONNECTION_ERROR_OR_INCOMPLETE_DATA,
        };

        res.end(JSON.stringify(successObj));
      }
    });
  });
  return shepherd;
};