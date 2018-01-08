module.exports = (shepherd) => {
  shepherd.findCoinName = (network) => {
    for (let key in shepherd.electrumServers) {
      if (key === network) {
        return shepherd.electrumServers[key].abbr;
      }
    }
  }

  shepherd.addElectrumCoin = (coin) => {
    const servers = shepherd.electrumServers[coin === 'KMD' ? 'komodo' : coin.toLowerCase()].serverList;
    // select random server
    const getRandomIntInclusive = (min, max) => {
      min = Math.ceil(min);
      max = Math.floor(max);

      return Math.floor(Math.random() * (max - min + 1)) + min; // the maximum is inclusive and the minimum is inclusive
    }
    let randomServer;

    // pick a random server to communicate with
    if (servers &&
        servers.length > 0) {
      const _randomServerId = getRandomIntInclusive(0, servers.length - 1);
      const _randomServer = servers[_randomServerId];
      const _serverDetails = _randomServer.split(':');

      if (_serverDetails.length === 2) {
        randomServer = {
          ip: _serverDetails[0],
          port: _serverDetails[1],
        };
      }
    }

    for (let key in shepherd.electrumServers) {
      if (shepherd.electrumServers[key].abbr === coin) {
        shepherd.electrumCoins[coin] = {
          name: key,
          abbr: coin,
          server: {
            ip: randomServer ? randomServer.ip : shepherd.electrumServers[key].address,
            port: randomServer ? randomServer.port : shepherd.electrumServers[key].port,
          },
          serverList: shepherd.electrumServers[key].serverList ? shepherd.electrumServers[key].serverList : 'none',
          txfee: 'calculated' /*shepherd.electrumServers[key].txfee*/,
        };

        shepherd.log(`default ${coin} electrum server ${shepherd.electrumServers[key].address + ':' + shepherd.electrumServers[key].port}`, true);

        if (randomServer) {
          shepherd.log(`random ${coin} electrum server ${randomServer.ip + ':' + randomServer.port}`, true);
        } else {
          shepherd.log(`${coin} doesnt have any backup electrum servers`, true);
        }

        if (Object.keys(shepherd.electrumKeys).length > 0) {
          const _keys = shepherd.wifToWif(shepherd.electrumKeys[Object.keys(shepherd.electrumKeys)[0]].priv, coin);

          shepherd.electrumKeys[coin] = {
            priv: _keys.priv,
            pub: _keys.pub,
          };
        }

        return true;
      }
    }
  }

  shepherd.get('/electrum/coin/changepub', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      shepherd.electrumKeys[req.query.coin].pub = req.query.pub;

      const successObj = {
        msg: 'success',
        result: 'true',
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

  shepherd.get('/electrum/coins/add', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      const result = shepherd.addElectrumCoin(req.query.coin);

      const successObj = {
        msg: 'success',
        result,
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

  shepherd.get('/electrum/coins', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
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