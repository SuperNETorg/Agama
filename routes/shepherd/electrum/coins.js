module.exports = (shepherd) => {
  shepherd.findCoinName = (network) => {
    for (let key in shepherd.electrumServers) {
      if (key === network) {
        return shepherd.electrumServers[key].abbr;
      }
    }
  }

  shepherd.addElectrumCoin = (coin) => {
    for (let key in shepherd.electrumServers) {
      if (shepherd.electrumServers[key].abbr === coin) {
        shepherd.electrumCoins[coin] = {
          name: key,
          abbr: coin,
          server: {
            ip: shepherd.electrumServers[key].address,
            port: shepherd.electrumServers[key].port,
          },
          serverList: shepherd.electrumServers[key].serverList ? shepherd.electrumServers[key].serverList : 'none',
          txfee: 'calculated' /*shepherd.electrumServers[key].txfee*/,
        };

        return true;
      }
    }
  }

  shepherd.get('/electrum/coins/remove', (req, res, next) => {
    delete shepherd.electrumCoins[req.query.coin];

    const successObj = {
      msg: 'success',
      result,
    };

    res.end(JSON.stringify(successObj));
  });

  shepherd.get('/electrum/coins/add', (req, res, next) => {
    const result = shepherd.addElectrumCoin(req.query.coin);

    const successObj = {
      msg: 'success',
      result,
    };

    res.end(JSON.stringify(successObj));
  });

  shepherd.get('/electrum/coins', (req, res, next) => {
    let _electrumCoins = JSON.parse(JSON.stringify(shepherd.electrumCoins)); // deep cloning

    for (let key in _electrumCoins) {
      if (shepherd.electrumKeys[key]) {
        _electrumCoins[key].pub = shepherd.electrumKeys[key].pub;
      }
    }

    const successObj = {
      msg: 'success',
      result: _electrumCoins,
    };

    res.end(JSON.stringify(successObj));
  });

  return shepherd;
};