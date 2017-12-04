const sha256 = require('js-sha256');

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

    const toHexString = (byteArray) => {
      return Array.from(byteArray, (byte) => {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
      }).join('');
    }

    const hex = toHexString(bytes);

    const key = new shepherd.CoinKey(new Buffer(hex, 'hex'), {
      private: shepherd.getNetworkData(network).wif,
      public: shepherd.getNetworkData(network).pubKeyHash,
    });

    key.compressed = true;

    // shepherd.log(`seed: ${seed}`, true);
    // shepherd.log(`network ${network}`, true);
    // shepherd.log(`seedtowif priv key ${key.privateWif}`, true);
    // shepherd.log(`seedtowif pub key ${key.publicAddress}`, true);

    return {
      priv: key.privateWif,
      pub: key.publicAddress,
    };
  }

  shepherd.get('/electrum/seedtowif', (req, res, next) => {
    const keys = shepherd.seedToWif(req.query.seed, req.query.network, req.query.iguana);

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
    let _electrumKeys = {};

    for (let key in shepherd.electrumServers) {
      const _abbr = shepherd.electrumServers[key].abbr;
      const { priv, pub } = shepherd.seedToWif(req.body.seed, shepherd.findNetworkObj(_abbr), req.body.iguana);

      if (shepherd.electrumKeys[_abbr].pub === pub &&
          shepherd.electrumKeys[_abbr].priv === priv) {
        _matchingKeyPairs++;
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

    // shepherd.log(JSON.stringify(_electrumKeys, null, '\t'), true);

    const successObj = {
      msg: 'success',
      result: _matchingKeyPairs === Object.keys(shepherd.electrumKeys).length ? _electrumKeys : false,
    };

    res.end(JSON.stringify(successObj));
  });

  shepherd.post('/electrum/seed/bip39/match', (req, res, next) => {
    const bip39 = require('bip39'); // npm i -S bip39
    const crypto = require('crypto');
    const seed = bip39.mnemonicToSeed(req.body.seed);
    const hdMaster = shepherd.bitcoinJS.HDNode.fromSeedBuffer(seed, shepherd.electrumJSNetworks.komodo); // seed from above
    const matchPattern = req.body.match;
    const _defaultAddressDepth = 50;
    const _defaultAccountCount = 20;
    let _addresses = [];
    let _matchingKey;

    for (let i = 0; i < _defaultAccountCount; i++) {
      for (let j = 0; j < 2; j++) {
        for (let k = 0; k < 1; k++) {
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
    const _seed = 'force mystery use shoot choice universe jaguar pattern aunt kiwi swarm tunnel wild pig cup cruise together neither else clean typical other farm recycle';
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