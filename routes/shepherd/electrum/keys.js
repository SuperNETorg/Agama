const sha256 = require('js-sha256');
const buggySha256 = require('sha256');
const bip39 = require('bip39');
const crypto = require('crypto');
const bigi = require('bigi');
const bitcoinZcash = require('bitcoinjs-lib-zcash');
const bitcoin = require('bitcoinjs-lib');
const bs58check = require('bs58check');

module.exports = (shepherd) => {
  shepherd.wifToWif = (wif, network) => {
    network = network === 'KMD' ? 'komodo' : network.toLowerCase();
    const key = shepherd.isZcash(network) ? new bitcoinZcash.ECPair.fromWIF(wif, shepherd.getNetworkData(network), true) : new bitcoin.ECPair.fromWIF(wif, shepherd.getNetworkData(network), true);

    return {
      pub: key.getAddress(),
      priv: key.toWIF(),
    };
  }

  shepherd.seedToWif = (seed, network, iguana) => {
    let bytes;

    if (process.argv.indexOf('spvold=true') > -1) {
      bytes = buggySha256(seed, { asBytes: true });
    } else {
      const hash = sha256.create().update(seed);
      bytes = hash.array();
    }

    if (iguana) {
      bytes[0] &= 248;
      bytes[31] &= 127;
      bytes[31] |= 64;
    }

    const d = bigi.fromBuffer(bytes);
    const keyPair = shepherd.isZcash(network) ? new bitcoinZcash.ECPair(d, null, { network: shepherd.getNetworkData(network) }) : new bitcoin.ECPair(d, null, { network: shepherd.getNetworkData(network) });
    const keys = {
      pub: keyPair.getAddress(),
      priv: keyPair.toWIF(),
    };

    /*shepherd.log(`seed: ${seed}`, true);
    shepherd.log(`network ${network}`, true);
    shepherd.log(`seedtowif priv key ${keys.priv}`, true);
    shepherd.log(`seedtowif pub key ${keys.pub}`, true);*/

    return keys;
  }

  shepherd.get('/electrum/wiftopub', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      let key = shepherd.isZcash(req.query.coin.toLowerCase()) ? bitcoinZcash.ECPair.fromWIF(req.query.wif, shepherd.electrumJSNetworks[req.query.coin], true) : bitcoin.ECPair.fromWIF(req.query.wif, shepherd.electrumJSNetworks[req.query.coin], true);
      keys = {
        priv: key.toWIF(),
        pub: key.getAddress(),
      };

      const successObj = {
        msg: 'success',
        result: {
          keys,
        },
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

  shepherd.post('/electrum/seedtowif', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      let keys = shepherd.seedToWif(req.body.seed, req.body.network.toLowerCase(), req.body.iguana);

      const successObj = {
        msg: 'success',
        result: {
          keys,
        },
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

  shepherd.post('/electrum/seedtowif', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      let keys = shepherd.seedToWif(req.body.seed, req.body.network.toLowerCase(), req.body.iguana);

      const successObj = {
        msg: 'success',
        result: {
          keys,
        },
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

  shepherd.getCoinByPub = (address) => {
    const _skipNetworks = ['btc', 'crw', 'dgb', 'arg', 'zec', 'nmc', 'ltc', 'vtc', 'via', 'fair', 'doge', 'kmd', 'mona'];

    try {
      const _b58check = bitcoin.address.fromBase58Check(address);
      let _coin = [];
      let returnObj;

      for (let key in shepherd.electrumJSNetworks) {
        if (_b58check.version === shepherd.electrumJSNetworks[key].pubKeyHash &&
            !_skipNetworks.find((item) => { return item === key ? true : false })) {
          _coin.push(key);
        }
      }

      if (_coin.length) {
        return {
          coin: _coin,
          version: _b58check.version,
        };
      } else {
        return 'Unable to find matching coin version';
      }
    } catch(e) {
      return 'Invalid pub address';
    }
  };

  shepherd.addressVersionCheck = (network, address) => {
    const _network = shepherd.getNetworkData(network.toLowerCase());

    try {
      const _b58check = shepherd.isZcash(network.toLowerCase()) ? bitcoinZcash.address.fromBase58Check(address) : bitcoin.address.fromBase58Check(address);

      if (_b58check.version === _network.pubKeyHash) {
        return true;
      } else {
        return false;
      }
    } catch(e) {
      return 'Invalid pub address';
    }
  };

  shepherd.post('/electrum/keys', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      let _matchingKeyPairs = 0;
      let _totalKeys = 0;
      let _electrumKeys = {};
      let _seed = req.body.seed;
      let _wifError = false;

      for (let key in shepherd.electrumCoins) {
        if (key !== 'auth') {
          const _abbr = key;
          let isWif = false;
          let priv;
          let pub;

          try {
            bs58check.decode(_seed);
            isWif = true;
          } catch (e) {}

          if (isWif) {
            try {
              let key = shepherd.isZcash(_abbr.toLowerCase()) ? bitcoinZcash.ECPair.fromWIF(_seed, shepherd.getNetworkData(_abbr.toLowerCase()), true) : bitcoin.ECPair.fromWIF(_seed, shepherd.getNetworkData(_abbr.toLowerCase()), true);
              priv = key.toWIF();
              pub = key.getAddress();
            } catch (e) {
              _wifError = true;
              break;
            }
          } else {
            let _keys = shepherd.seedToWif(_seed, shepherd.findNetworkObj(_abbr), req.body.iguana);
            priv = _keys.priv;
            pub = _keys.pub;
          }

          if (shepherd.electrumKeys[_abbr].pub === pub &&
              shepherd.electrumKeys[_abbr].priv === priv) {
            _matchingKeyPairs++;
          }
          _totalKeys++;
        }
      }

      if (req.body.active) {
        _electrumKeys = JSON.parse(JSON.stringify(shepherd.electrumKeys));

        for (let key in _electrumKeys) {
          if (!shepherd.electrumCoins[key]) {
            delete _electrumKeys[key];
          }
        }
      } else {
        _electrumKeys = shepherd.electrumKeys;
      }

      const successObj = {
        msg: _wifError ? 'error' : 'success',
        result: _wifError ? false : (_matchingKeyPairs === _totalKeys ? _electrumKeys : false),
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

  shepherd.getSpvFees = () => {
    let _fees = {};

    for (let key in shepherd.electrumServers) {
      if (shepherd.electrumServers[key].txfee) {
        _fees[shepherd.electrumServers[key].abbr] = shepherd.electrumServers[key].txfee;
      }
    }

    return _fees;
  };

  shepherd.post('/electrum/seed/bip39/match', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      const seed = bip39.mnemonicToSeed(req.body.seed);
      const hdMaster = bitcoin.HDNode.fromSeedBuffer(seed, shepherd.electrumJSNetworks.komodo);
      const matchPattern = req.body.match;
      const _defaultAddressDepth = req.body.addressdepth;
      const _defaultAccountCount = req.body.accounts;
      let _addresses = [];
      let _matchingKey;

      for (let i = 0; i < _defaultAccountCount; i++) {
        for (let j = 0; j < 1; j++) {
          for (let k = 0; k < _defaultAddressDepth; k++) {
            const _key = hdMaster.derivePath(`m/44'/141'/${i}'/${j}/${k}`);

            if (_key.keyPair.getAddress() === matchPattern) {
              _matchingKey = {
                pub: _key.keyPair.getAddress(),
                priv: _key.keyPair.toWIF(),
              };
            }
          }
        }
      }

      const successObj = {
        msg: 'success',
        result: _matchingKey ? _matchingKey : 'address is not found',
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

  return shepherd;
};