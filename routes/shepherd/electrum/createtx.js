module.exports = (shepherd) => {
  // single sig
  shepherd.buildSignedTx = (sendTo, changeAddress, wif, network, utxo, changeValue, spendValue) => {
    let key = shepherd.bitcoinJS.ECPair.fromWIF(wif, shepherd.getNetworkData(network));
    let tx = new shepherd.bitcoinJS.TransactionBuilder(shepherd.getNetworkData(network));

    shepherd.log('buildSignedTx');
    // console.log(`buildSignedTx priv key ${wif}`);
    shepherd.log(`buildSignedTx pub key ${key.getAddress().toString()}`, true);
    // console.log('buildSignedTx std tx fee ' + shepherd.electrumServers[network].txfee);

    for (let i = 0; i < utxo.length; i++) {
      tx.addInput(utxo[i].txid, utxo[i].vout);
    }

    tx.addOutput(sendTo, Number(spendValue));

    if (changeValue > 0) {
      tx.addOutput(changeAddress, Number(changeValue));
    }

    if (network === 'komodo' ||
        network === 'KMD') {
      const _locktime = Math.floor(Date.now() / 1000) - 777;
      tx.setLockTime(_locktime);
      shepherd.log(`kmd tx locktime set to ${_locktime}`, true);
    }

    shepherd.log('buildSignedTx unsigned tx data vin', true);
    shepherd.log(tx.tx.ins, true);
    shepherd.log('buildSignedTx unsigned tx data vout', true);
    shepherd.log(tx.tx.outs, true);
    shepherd.log('buildSignedTx unsigned tx data', true);
    shepherd.log(tx, true);

    for (let i = 0; i < utxo.length; i++) {
      tx.sign(i, key);
    }

    const rawtx = tx.build().toHex();

    shepherd.log('buildSignedTx signed tx hex', true);
    shepherd.log(rawtx, true);

    return rawtx;
  }

  shepherd.maxSpendBalance = (utxoList, fee) => {
    let maxSpendBalance = 0;

    for (let i = 0; i < utxoList.length; i++) {
      maxSpendBalance += Number(utxoList[i].value);
    }

    if (fee) {
      return Number(maxSpendBalance) - Number(fee);
    } else {
      return maxSpendBalance;
    }
  }

  shepherd.get('/electrum/createrawtx', (req, res, next) => {
    // txid 64 char
    const network = req.query.network || shepherd.findNetworkObj(req.query.coin);
    const ecl = new shepherd.electrumJSCore(shepherd.electrumServers[network].port, shepherd.electrumServers[network].address, shepherd.electrumServers[network].proto); // tcp or tls
    const outputAddress = req.query.address;
    const changeAddress = req.query.change;
    let value = Number(req.query.value);
    const push = req.query.push;
    const fee = shepherd.electrumServers[network].txfee;
    let wif = req.query.wif;

    if (req.query.gui) {
      wif = shepherd.electrumKeys[req.query.coin].priv;
    }

    shepherd.log('electrum createrawtx =>', true);

    ecl.connect();
    shepherd.listunspent(ecl, changeAddress, network, true, true)
    .then((utxoList) => {
      ecl.close();

      if (utxoList &&
          utxoList.length) {
        let utxoListFormatted = [];
        let totalInterest = 0;
        let totalInterestUTXOCount = 0;
        let interestClaimThreshold = 200;
        let utxoVerified = true;

        for (let i = 0; i < utxoList.length; i++) {
          if (network === 'komodo') {
            utxoListFormatted.push({
              txid: utxoList[i].txid,
              vout: utxoList[i].vout,
              value: Number(utxoList[i].amountSats),
              interestSats: Number(utxoList[i].interestSats),
              verified: utxoList[i].verified ? utxoList[i].verified : false,
            });
          } else {
            utxoListFormatted.push({
              txid: utxoList[i].txid,
              vout: utxoList[i].vout,
              value: Number(utxoList[i].amountSats),
              verified: utxoList[i].verified ? utxoList[i].verified : false,
            });
          }
        }

        shepherd.log('electrum listunspent unformatted ==>', true);
        shepherd.log(utxoList, true);

        shepherd.log('electrum listunspent formatted ==>', true);
        shepherd.log(utxoListFormatted, true);

        const _maxSpendBalance = Number(shepherd.maxSpendBalance(utxoListFormatted));
        let targets = [{
          address: outputAddress,
          value: value > _maxSpendBalance ? _maxSpendBalance : value,
        }];
        shepherd.log('targets =>', true);
        shepherd.log(targets, true);

        const feeRate = 20; // sats/byte

        // default coin selection algo blackjack with fallback to accumulative
        // make a first run, calc approx tx fee
        // if ins and outs are empty reduce max spend by txfee
        let { inputs, outputs, fee } = shepherd.coinSelect(utxoListFormatted, targets, feeRate);

        shepherd.log('coinselect res =>', true);
        shepherd.log('coinselect inputs =>', true);
        shepherd.log(inputs, true);
        shepherd.log('coinselect outputs =>', true);
        shepherd.log(outputs, true);
        shepherd.log('coinselect calculated fee =>', true);
        shepherd.log(fee, true);

        if (!outputs) {
          targets[0].value = targets[0].value - fee;
          shepherd.log('second run', true);
          shepherd.log('coinselect adjusted targets =>', true);
          shepherd.log(targets, true);

          const secondRun = shepherd.coinSelect(utxoListFormatted, targets, feeRate);
          inputs = secondRun.inputs;
          outputs = secondRun.outputs;
          fee = secondRun.fee;

          shepherd.log('second run coinselect inputs =>', true);
          shepherd.log(inputs, true);
          shepherd.log('second run coinselect outputs =>', true);
          shepherd.log(outputs, true);
          shepherd.log('second run coinselect fee =>', true);
          shepherd.log(fee, true);
        }

        let _change = 0;

        if (outputs &&
            outputs.length === 2) {
          _change = outputs[1].value;
        }

        // check if any outputs are unverified
        if (inputs &&
            inputs.length) {
          for (let i = 0; i < inputs.length; i++) {
            if (!inputs[i].verified) {
              utxoVerified = false;
              break;
            }
          }

          for (let i = 0; i < inputs.length; i++) {
            if (Number(inputs[i].interestSats) > interestClaimThreshold) {
              totalInterest += Number(inputs[i].interestSats);
              totalInterestUTXOCount++;
            }
          }
        }

        const _maxSpend = shepherd.maxSpendBalance(utxoListFormatted);

        if (value > _maxSpend) {
          const successObj = {
            msg: 'error',
            result: `Spend value is too large. Max available amount is ${Number((_maxSpend * 0.00000001.toFixed(8)))}`,
          };

          res.end(JSON.stringify(successObj));
        } else {
          shepherd.log(`maxspend ${_maxSpend} (${_maxSpend * 0.00000001})`, true);
          shepherd.log(`value ${value}`, true);
          shepherd.log(`sendto ${outputAddress} amount ${value} (${value * 0.00000001})`, true);
          shepherd.log(`changeto ${changeAddress} amount ${_change} (${_change * 0.00000001})`, true);

          // account for KMD interest
          if (network === 'komodo' &&
              totalInterest > 0) {
            // account for extra vout
            const _feeOverhead = outputs.length === 1 ? shepherd.estimateTxSize(0, 1) * feeRate : 0;

            shepherd.log(`max interest to claim ${totalInterest} (${totalInterest * 0.00000001})`, true);
            shepherd.log(`estimated fee overhead ${_feeOverhead}`, true);
            shepherd.log(`current change amount ${_change} (${_change * 0.00000001}), boosted change amount ${_change + (totalInterest - _feeOverhead)} (${(_change + (totalInterest - _feeOverhead)) * 0.00000001})`, true);

            if (_maxSpend === value) {
              _change = totalInterest -_change - _feeOverhead;

              if (outputAddress === changeAddress) {
                value += _change;
                _change = 0;
                shepherd.log(`send to self ${outputAddress} = ${changeAddress}`, true);
                shepherd.log(`send to self old val ${value}, new val ${value + _change}`, true);
              }
            } else {
              _change = _change + (totalInterest - _feeOverhead);
            }
          }

          if (!inputs &&
              !outputs) {
            const successObj = {
              msg: 'error',
              result: 'Can\'t find best fit utxo. Try lower amount.',
            };

            res.end(JSON.stringify(successObj));
          } else {
            let vinSum = 0;

            for (let i = 0; i < inputs.length; i++) {
              vinSum += inputs[i].value;
            }

            const _estimatedFee = vinSum - outputs[0].value - _change;

            shepherd.log(`vin sum ${vinSum} (${vinSum * 0.00000001})`, true);
            shepherd.log(`estimatedFee ${_estimatedFee} (${_estimatedFee * 0.00000001})`, true);

            const _rawtx = shepherd.buildSignedTx(
              outputAddress,
              changeAddress,
              wif,
              network,
              inputs,
              _change,
              value
            );

            if (!push ||
                push === 'false') {
              const successObj = {
                msg: 'success',
                result: {
                  utxoSet: inputs,
                  change: _change,
                  changeAdjusted: _change,
                  totalInterest,
                  // wif,
                  fee,
                  value,
                  outputAddress,
                  changeAddress,
                  network,
                  rawtx: _rawtx,
                  utxoVerified,
                },
              };

              res.end(JSON.stringify(successObj));
            } else {
              const ecl = new shepherd.electrumJSCore(shepherd.electrumServers[network].port, shepherd.electrumServers[network].address, shepherd.electrumServers[network].proto); // tcp or tls

              ecl.connect();
              ecl.blockchainTransactionBroadcast(_rawtx)
              .then((txid) => {
                ecl.close();

                if (txid &&
                    txid.indexOf('bad-txns-inputs-spent') > -1) {
                  const successObj = {
                    msg: 'error',
                    result: 'Bad transaction inputs spent',
                    raw: {
                      utxoSet: inputs,
                      change: _change,
                      changeAdjusted: _change,
                      totalInterest,
                      fee,
                      value,
                      outputAddress,
                      changeAddress,
                      network,
                      rawtx: _rawtx,
                      txid,
                      utxoVerified,
                    },
                  };

                  res.end(JSON.stringify(successObj));
                } else {
                  if (txid &&
                      txid.length === 64) {
                    if (txid.indexOf('bad-txns-in-belowout') > -1) {
                      const successObj = {
                        msg: 'error',
                        result: 'Bad transaction inputs spent',
                        raw: {
                          utxoSet: inputs,
                          change: _change,
                          changeAdjusted: _change,
                          totalInterest,
                          fee,
                          value,
                          outputAddress,
                          changeAddress,
                          network,
                          rawtx: _rawtx,
                          txid,
                          utxoVerified,
                        },
                      };

                      res.end(JSON.stringify(successObj));
                    } else {
                      const successObj = {
                        msg: 'success',
                        result: {
                          utxoSet: inputs,
                          change: _change,
                          changeAdjusted: _change,
                          totalInterest,
                          fee,
                          // wif,
                          value,
                          outputAddress,
                          changeAddress,
                          network,
                          rawtx: _rawtx,
                          txid,
                          utxoVerified,
                        },
                      };

                      res.end(JSON.stringify(successObj));
                    }
                  } else {
                    if (txid &&
                        txid.indexOf('bad-txns-in-belowout') > -1) {
                      const successObj = {
                        msg: 'error',
                        result: 'Bad transaction inputs spent',
                        raw: {
                          utxoSet: inputs,
                          change: _change,
                          changeAdjusted: _change,
                          totalInterest,
                          fee,
                          value,
                          outputAddress,
                          changeAddress,
                          network,
                          rawtx: _rawtx,
                          txid,
                          utxoVerified,
                        },
                      };

                      res.end(JSON.stringify(successObj));
                    } else {
                      const successObj = {
                        msg: 'error',
                        result: 'Can\'t broadcast transaction',
                        raw: {
                          utxoSet: inputs,
                          change: _change,
                          changeAdjusted: _change,
                          totalInterest,
                          fee,
                          value,
                          outputAddress,
                          changeAddress,
                          network,
                          rawtx: _rawtx,
                          txid,
                          utxoVerified,
                        },
                      };

                      res.end(JSON.stringify(successObj));
                    }
                  }
                }
              });
            }
          }
        }
      } else {
        const successObj = {
          msg: 'error',
          result: utxoList,
        };

        res.end(JSON.stringify(successObj));
      }
    });
  });

  shepherd.get('/electrum/pushtx', (req, res, next) => {
    const rawtx = req.query.rawtx;
    const ecl = new shepherd.electrumJSCore(shepherd.electrumServers[req.query.network].port, shepherd.electrumServers[req.query.network].address, shepherd.electrumServers[req.query.network].proto); // tcp or tls

    ecl.connect();
    ecl.blockchainTransactionBroadcast(rawtx)
    .then((json) => {
      ecl.close();
      shepherd.log('electrum pushtx ==>', true);
      shepherd.log(json, true);

      const successObj = {
        msg: 'success',
        result: json,
      };

      res.end(JSON.stringify(successObj));
    });
  });

  return shepherd;
};