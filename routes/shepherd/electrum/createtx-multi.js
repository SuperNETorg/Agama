const bitcoinJSForks = require('bitcoinforksjs-lib');
const bitcoinZcash = require('bitcoinjs-lib-zcash');
const bitcoinPos = require('bitcoinjs-lib-pos');

// not prod ready, only for voting!
// needs a fix

module.exports = (shepherd) => {
  shepherd.post('/electrum/createrawtx-multiout', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      // TODO: 1) unconf output(s) error message
      // 2) check targets integrity
      const network = req.body.network || shepherd.findNetworkObj(req.body.coin);
      const ecl = new shepherd.electrumJSCore(shepherd.electrumServers[network].port, shepherd.electrumServers[network].address, shepherd.electrumServers[network].proto); // tcp or tls
      const initTargets = JSON.parse(JSON.stringify(req.body.targets));
      let targets = req.body.targets;
      const changeAddress = req.body.change;
      const push = req.body.push;
      const opreturn = req.body.opreturn;
      const btcFee = req.body.btcfee ? Number(req.body.btcfee) : null;
      let fee = shepherd.electrumServers[network].txfee;
      let wif = req.body.wif;

      if (req.body.gui) {
        wif = shepherd.electrumKeys[req.body.coin].priv;
      }

      if (req.body.vote) {
        wif = shepherd.elections.priv;
      }

      if (btcFee) {
        fee = 0;
      }

      shepherd.log('electrum createrawtx =>', true);

      ecl.connect();
      shepherd.listunspent(ecl, changeAddress, network, true, req.body.verify === 'true' ? true : null)
      .then((utxoList) => {
        ecl.close();

        if (utxoList &&
            utxoList.length &&
            utxoList[0] &&
            utxoList[0].txid) {
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
          /*let targets = [{
            address: outputAddress,
            value: value > _maxSpendBalance ? _maxSpendBalance : value,
          }];*/
          shepherd.log('targets =>', true);
          shepherd.log(targets, true);

          targets[0].value = targets[0].value + fee;

          shepherd.log(`default fee ${fee}`, true);
          shepherd.log(`targets ==>`, true);
          shepherd.log(targets, true);

          // default coin selection algo blackjack with fallback to accumulative
          // make a first run, calc approx tx fee
          // if ins and outs are empty reduce max spend by txfee
          const firstRun = shepherd.coinSelect(utxoListFormatted, targets, btcFee ? btcFee : 0);
          let inputs = firstRun.inputs;
          let outputs = firstRun.outputs;

          if (btcFee) {
            shepherd.log(`btc fee per byte ${btcFee}`, true);
            fee = firstRun.fee;
          }

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

            const secondRun = shepherd.coinSelect(utxoListFormatted, targets, 0);
            inputs = secondRun.inputs;
            outputs = secondRun.outputs;
            fee = fee ? fee : secondRun.fee;

            shepherd.log('second run coinselect inputs =>', true);
            shepherd.log(inputs, true);
            shepherd.log('second run coinselect outputs =>', true);
            shepherd.log(outputs, true);
            shepherd.log('second run coinselect fee =>', true);
            shepherd.log(fee, true);
          }

          let _change = 0;

          if (outputs &&
              outputs.length > 1) {
            _change = outputs[outputs.length - 1].value - fee;
          }

          if (!btcFee &&
              _change === 0) {
            outputs[0].value = outputs[0].value - fee;
          }

          shepherd.log('adjusted outputs');
          shepherd.log(outputs, true);

          shepherd.log('init targets', true);
          shepherd.log(initTargets, true);

          if (initTargets[0].value < targets[0].value) {
            targets[0].value = initTargets[0].value;
          }

          let _targetsSum = 0;

          for (let i = 0; i < targets.length; i++) {
            _targetsSum += Number(targets[i].value);
          }

          shepherd.log(`total targets sum ${_targetsSum}`);

          /*if (btcFee) {
            value = _targetsSum;
          } else {
            if (_change > 0) {
              value = _targetsSum - fee;
            }
          }*/
          value = _targetsSum;

          shepherd.log('adjusted outputs, value - default fee =>', true);
          shepherd.log(outputs, true);

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
            // shepherd.log(`sendto ${outputAddress} amount ${value} (${value * 0.00000001})`, true);
            shepherd.log(`changeto ${changeAddress} amount ${_change} (${_change * 0.00000001})`, true);

            // account for KMD interest
            if (network === 'komodo' &&
                totalInterest > 0) {
              // account for extra vout
              // const _feeOverhead = outputs.length === 1 ? shepherd.estimateTxSize(0, 1) * feeRate : 0;
              const _feeOverhead = 0;

              shepherd.log(`max interest to claim ${totalInterest} (${totalInterest * 0.00000001})`, true);
              shepherd.log(`estimated fee overhead ${_feeOverhead}`, true);
              shepherd.log(`current change amount ${_change} (${_change * 0.00000001}), boosted change amount ${_change + (totalInterest - _feeOverhead)} (${(_change + (totalInterest - _feeOverhead)) * 0.00000001})`, true);

              if (_maxSpend - fee === value) {
                _change = totalInterest - _change - _feeOverhead;

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

              let voutSum = 0;

              for (let i = 0; i < outputs.length; i++) {
                voutSum += outputs[i].value;
              }

              const _estimatedFee = vinSum - voutSum;

              shepherd.log(`vin sum ${vinSum} (${vinSum * 0.00000001})`, true);
              shepherd.log(`vout sum ${voutSum} (${voutSum * 0.00000001})`, true);
              shepherd.log(`estimatedFee ${_estimatedFee} (${_estimatedFee * 0.00000001})`, true);
              // double check no extra fee is applied
              shepherd.log(`vin - vout - change ${vinSum - value - _change}`);

              if ((vinSum - value - _change) > fee) {
                _change += fee;
                shepherd.log(`double fee, increase change by ${fee}`);
                shepherd.log(`adjusted vin - vout - change ${vinSum - value - _change}`);
              }

              // TODO: use individual dust thresholds
              if (_change > 0 &&
                  _change <= 1000) {
                shepherd.log(`change is < 1000 sats, donate ${_change} sats to miners`, true);
                _change = 0;
              }

              outputAddress = outputs;

              if (outputAddress.length > 1) {
                outputAddress.pop();
              }

              let _rawtx;

              if (network === 'btg' ||
                  network === 'bch') {
                /*_rawtx = shepherd.buildSignedTxForks(
                  outputAddress,
                  changeAddress,
                  wif,
                  network,
                  inputs,
                  _change,
                  value
                );*/
              } else {
                _rawtx = shepherd.buildSignedTxMulti(
                  outputAddress,
                  changeAddress,
                  wif,
                  network,
                  inputs,
                  _change,
                  value,
                  opreturn
                );
              }

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

                  const _rawObj = {
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
                  };

                  if (txid &&
                      txid.indexOf('bad-txns-inputs-spent') > -1) {
                    const successObj = {
                      msg: 'error',
                      result: 'Bad transaction inputs spent',
                      raw: _rawObj,
                    };

                    res.end(JSON.stringify(successObj));
                  } else {
                    if (txid &&
                        txid.length === 64) {
                      if (txid.indexOf('bad-txns-in-belowout') > -1) {
                        const successObj = {
                          msg: 'error',
                          result: 'Bad transaction inputs spent',
                          raw: _rawObj,
                        };

                        res.end(JSON.stringify(successObj));
                      } else {
                        const successObj = {
                          msg: 'success',
                          result: _rawObj,
                        };

                        res.end(JSON.stringify(successObj));
                      }
                    } else {
                      if (txid &&
                          txid.indexOf('bad-txns-in-belowout') > -1) {
                        const successObj = {
                          msg: 'error',
                          result: 'Bad transaction inputs spent',
                          raw: _rawObj,
                        };

                        res.end(JSON.stringify(successObj));
                      } else {
                        const successObj = {
                          msg: 'error',
                          result: 'Can\'t broadcast transaction',
                          raw: _rawObj,
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
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  // single sig
  shepherd.buildSignedTxMulti = (sendTo, changeAddress, wif, network, utxo, changeValue, spendValue, opreturn) => {
    let key = shepherd.isZcash(network) ? bitcoinZcash.ECPair.fromWIF(wif, shepherd.getNetworkData(network)) : shepherd.bitcoinJS.ECPair.fromWIF(wif, shepherd.getNetworkData(network));
    let tx;

    if (shepherd.isZcash(network)) {
      tx = new bitcoinZcash.TransactionBuilder(shepherd.getNetworkData(network));
    } else if (shepherd.isPos(network)) {
      tx = new bitcoinPos.TransactionBuilder(shepherd.getNetworkData(network));
    } else {
      tx = new shepherd.bitcoinJS.TransactionBuilder(shepherd.getNetworkData(network));
    }

    shepherd.log('buildSignedTx', true);
    // console.log(`buildSignedTx priv key ${wif}`);
    shepherd.log(`buildSignedTx pub key ${key.getAddress().toString()}`, true);
    // console.log('buildSignedTx std tx fee ' + shepherd.electrumServers[network].txfee);

    for (let i = 0; i < utxo.length; i++) {
      tx.addInput(utxo[i].txid, utxo[i].vout);
    }

    for (let i = 0; i < sendTo.length; i++) {
      if (shepherd.isPos(network)) {
        tx.addOutput(sendTo[i].address, Number(sendTo[i].value), shepherd.getNetworkData(network));
      } else {
        tx.addOutput(sendTo[i].address, Number(sendTo[i].value));
      }
    }

    if (changeValue > 0) {
      if (shepherd.isPos(network)) {
        tx.addOutput(changeAddress, Number(changeValue), shepherd.getNetworkData(network));
      } else {
        tx.addOutput(changeAddress, Number(changeValue));
      }
    }

    if (opreturn &&
        opreturn.length) {
      for (let i = 0; i < opreturn.length; i++) {
        shepherd.log(`opreturn ${i} ${opreturn[i]}`);
        const data = Buffer.from(opreturn[i], 'utf8');
        const dataScript = shepherd.bitcoinJS.script.nullData.output.encode(data);
        tx.addOutput(dataScript, 1000);
      }
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
      if (shepherd.isPos(network)) {
        tx.sign(shepherd.getNetworkData(network), i, key);
      } else {
        tx.sign(i, key);
      }
    }

    const rawtx = tx.build().toHex();

    shepherd.log('buildSignedTx signed tx hex', true);
    shepherd.log(rawtx, true);

    return rawtx;
  }

  return shepherd;
};