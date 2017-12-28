const bs58check = require('bs58check');
const bitcoinZcash = require('bitcoinjs-lib-zcash');

module.exports = (shepherd) => {
  shepherd.post('/electrum/login', (req, res, next) => {
    for (let key in shepherd.electrumServers) {
      const _abbr = shepherd.electrumServers[key].abbr;
      const _seed = req.body.seed;
      let keys;
      let isWif = false;

      try {
        bs58check.decode(_seed);
        isWif = true;
      } catch (e) {}

      if (isWif) {
        let key = shepherd.isZcash(_abbr.toLowerCase()) ? bitcoinZcash.ECPair.fromWIF(_seed, shepherd.getNetworkData(_abbr.toLowerCase()), true) : shepherd.bitcoinJS.ECPair.fromWIF(_seed, shepherd.getNetworkData(_abbr.toLowerCase()), true);
        keys = {
          priv: key.toWIF(),
          pub: key.getAddress(),
        };
      } else {
        keys = shepherd.seedToWif(_seed, shepherd.findNetworkObj(_abbr), req.body.iguana);
      }

      shepherd.electrumKeys[_abbr] = {
        priv: keys.priv,
        pub: keys.pub,
      };
    }

    shepherd.electrumCoins.auth = true;

    // shepherd.log(JSON.stringify(shepherd.electrumKeys, null, '\t'), true);

    const successObj = {
      msg: 'success',
      result: 'true',
    };

    res.end(JSON.stringify(successObj));
  });

  shepherd.post('/electrum/lock', (req, res, next) => {
    shepherd.electrumCoins.auth = false;
    shepherd.electrumKeys = {};

    const successObj = {
      msg: 'success',
      result: 'true',
    };

    res.end(JSON.stringify(successObj));
  });

  shepherd.post('/electrum/logout', (req, res, next) => {
    shepherd.electrumCoins = {
      auth: false,
    };
    shepherd.electrumKeys = {};

    const obj = {
      msg: 'success',
      result: 'result',
    };

    res.end(JSON.stringify(obj));
  });

  return shepherd;
};