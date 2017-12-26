const sha256 = require('js-sha256');
const bip39 = require('bip39');
const crypto = require('crypto');
const bigi = require('bigi');
const bitcoinZcash = require('bitcoinjs-lib-zcash');
const bitcoin = require('bitcoinjs-lib');

module.exports = (shepherd) => {
  shepherd.seedToWif = (seed, network, iguana) => {
    let bytes;

    if (process.argv.indexOf('spvold=true') > -1) {
      bytes = shepherd.sha256(seed, { asBytes: true });
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
    const keyPair = shepherd.isZcash(network) ? new bitcoinZcash.ECPair(d, null, { network: shepherd.getNetworkData(network) }) : new bitcoinZcash.ECPair(d, null, { network: shepherd.getNetworkData(network) });
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
    let key = shepherd.bitcoinJS.ECPair.fromWIF(req.query.wif, shepherd.electrumJSNetworks[req.query.coin]);
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
  });

  shepherd.get('/electrum/seedtowif', (req, res, next) => {
    let keys = shepherd.seedToWif(req.query.seed, req.query.network, req.query.iguana);

    const successObj = {
      msg: 'success',
      result: {
        keys,
      },
    };

    res.end(JSON.stringify(successObj));
  });

  shepherd.post('/electrum/keys', (req, res, next) => {
    let _matchingKeyPairs = 0;
    let _totalKeys = 0;
    let _electrumKeys = {};

    for (let key in shepherd.electrumServers) {
      const _abbr = shepherd.electrumServers[key].abbr;
      const { priv, pub } = shepherd.seedToWif(req.body.seed, shepherd.findNetworkObj(_abbr), req.body.iguana);

      if (shepherd.electrumKeys[_abbr].pub === pub &&
          shepherd.electrumKeys[_abbr].priv === priv) {
        _matchingKeyPairs++;
      }
      _totalKeys++;
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
      msg: 'success',
      result: _matchingKeyPairs === _totalKeys ? _electrumKeys : false,
    };

    res.end(JSON.stringify(successObj));
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
    const seed = bip39.mnemonicToSeed(req.body.seed);
    const hdMaster = shepherd.bitcoinJS.HDNode.fromSeedBuffer(seed, shepherd.electrumJSNetworks.komodo); // seed from above
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
          /*_addresses.push({
            pub: _key.keyPair.getAddress(),
            priv: _key.keyPair.toWIF(),
          });*/
        }
      }
    }

    const successObj = {
      msg: 'success',
      result: _matchingKey ? _matchingKey : 'address is not found',
    };

    res.end(JSON.stringify(successObj));
  });

  // spv v2
  /*shepherd.get('/electrum/bip39/seed', (req, res, next) => {
    const _seed = '';
    // TODO
    const bip39 = require('bip39'); // npm i -S bip39
    const crypto = require('crypto');

    // what you describe as 'seed'
    const randomBytes = crypto.randomBytes(16); // 128 bits is enough

    // your 12 word phrase
    const mnemonic = bip39.entropyToMnemonic(randomBytes.toString('hex'));

    // what is accurately described as the wallet seed
    // var seed = bip39.mnemonicToSeed(mnemonic) // you'll use this in #3 below
    const seed = bip39.mnemonicToSeed(_seed);

    console.log(seed);

    const successObj = {
      msg: 'success',
      result: {
        servers: shepherd.electrumServers,
      },
    };

    res.end(JSON.stringify(successObj));

    console.log(shepherd.bitcoinJS.networks.komodo);
    const hdMaster = shepherd.bitcoinJS.HDNode.fromSeedBuffer(seed, shepherd.electrumJSNetworks.komodo); // seed from above

    const key1 = hdMaster.derivePath("m/44'/141'/0'/0/0");
    const key2 = hdMaster.derivePath('m/1');
    console.log(hdMaster);

    console.log(key1.keyPair.toWIF());
    console.log(key1.keyPair.getAddress());
    console.log(key2.keyPair.toWIF());

    const hdnode = shepherd.bitcoinJS.HDNode.fromSeedBuffer(seed, shepherd.electrumJSNetworks.komodo).deriveHardened(0).derive(0).derive(1);
    console.log(`address: ${hdnode.getAddress()}`);
    console.log(`priv (WIF): ${hdnode.keyPair.toWIF()}`);
  });*/

  return shepherd;
};