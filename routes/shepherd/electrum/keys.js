module.exports = (shepherd) => {
  shepherd.seedToWif = (seed, network, iguana) => {
    const bytes = shepherd.sha256(seed, { asBytes: true });

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

  // spv v2
  /*shepherd.get('/electrum/bip39/seed', (req, res, next) => {
    // TODO
    const bip39 = require('bip39'); // npm i -S bip39
    const crypto = require('crypto');

    // what you describe as 'seed'
    const randomBytes = crypto.randomBytes(16); // 128 bits is enough

    // your 12 word phrase
    const mnemonic = bip39.entropyToMnemonic(randomBytes.toString('hex'));

    // what is accurately described as the wallet seed
    // var seed = bip39.mnemonicToSeed(mnemonic) // you'll use this in #3 below
    const seed = bip39.mnemonicToSeed(req.query.seed);

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

    const key1 = hdMaster.derivePath('m/0');
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