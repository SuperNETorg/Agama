module.exports = (shepherd) => {
  shepherd.post('/electrum/login', (req, res, next) => {
    for (let key in shepherd.electrumServers) {
      const _abbr = shepherd.electrumServers[key].abbr;
      let keys;

      if (req.body.seed.length === 52 &&
          req.body.seed.indexOf(' ') === -1 &&
          req.body.seed.match(/^[a-zA-Z0-9]*$/)) {
        let key = shepherd.bitcoinJS.ECPair.fromWIF(req.body.seed, shepherd.electrumJSNetworks.komodo);
        keys = {
          priv: key.toWIF(),
          pub: key.getAddress(),
        };
      } else {
        keys = shepherd.seedToWif(req.body.seed, shepherd.findNetworkObj(_abbr), req.body.iguana, req.body.old);
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