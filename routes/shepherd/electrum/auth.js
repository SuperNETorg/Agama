module.exports = (shepherd) => {
  shepherd.post('/electrum/login', (req, res, next) => {
    for (let key in shepherd.electrumServers) {
      const _abbr = shepherd.electrumServers[key].abbr;
      const { priv, pub } = shepherd.seedToWif(req.body.seed, shepherd.findNetworkObj(_abbr), req.body.iguana);

      shepherd.electrumKeys[_abbr] = {
        priv,
        pub,
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

  shepherd.get('/electrum/dev/logout', (req, res, next) => {
    shepherd.electrumCoins.auth = false;
    shepherd.electrumKeys = {};

    const successObj = {
      msg: 'success',
      result: 'true',
    };

    res.end(JSON.stringify(successObj));
  });

  return shepherd;
};