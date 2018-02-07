/*
MIT License

Copyright (c) 2017 Yuki Akiyama, SuperNET

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var bitcoin = require('bitcoinjs-lib-zcash');

var decodeFormat = function(tx) {
  var result = {
    txid: tx.getId(),
    version: tx.version,
    locktime: tx.locktime,
  };

  return result;
}

var decodeInput = function(tx) {
  var result = [];

  tx.ins.forEach(function(input, n) {
    var vin = {
      txid: input.hash.reverse().toString('hex'),
      n: input.index,
      script: bitcoin.script.toASM(input.script),
      sequence: input.sequence,
    };

    result.push(vin);
  });

  return result;
}

var decodeOutput = function(tx, network) {
  var format = function(out, n, network) {
    var vout = {
      satoshi: out.value,
      value: (1e-8 * out.value).toFixed(8),
      n: n,
      scriptPubKey: {
        asm: bitcoin.script.toASM(out.script),
        hex: out.script.toString('hex'),
        type: bitcoin.script.classifyOutput(out.script),
        addresses: [],
      },
    };

    switch(vout.scriptPubKey.type) {
      case 'pubkeyhash':
        vout.scriptPubKey.addresses.push(bitcoin.address.fromOutputScript(out.script, network));
        break;
      case 'pubkey':
        const pubKeyBuffer = new Buffer(vout.scriptPubKey.asm.split(' ')[0], 'hex');
        vout.scriptPubKey.addresses.push(bitcoin.ECPair.fromPublicKeyBuffer(pubKeyBuffer, network).getAddress());
        break;
      case 'scripthash':
        vout.scriptPubKey.addresses.push(bitcoin.address.fromOutputScript(out.script, network));
        break;
    }

    return vout;
  }

  var result = [];

  tx.outs.forEach(function(out, n) {
    result.push(format(out, n, network));
  });

  return result;
}

var TxDecoder = module.exports = function(rawtx, network) {
  try {
    const _tx = bitcoin.Transaction.fromHex(rawtx);

    return {
      tx: _tx,
      network: network,
      format: decodeFormat(_tx),
      inputs: decodeInput(_tx),
      outputs: decodeOutput(_tx, network),
    };
  } catch (e) {
    return false;
  }
}

TxDecoder.prototype.decode = function() {
  var result = {};
  var self = this;

  Object.keys(self.format).forEach(function(key) {
    result[key] = self.format[key];
  });

  result.outputs = self.outputs;

  return result;
}