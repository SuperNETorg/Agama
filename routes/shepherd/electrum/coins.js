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
    let randomServer = {};

    // pick a random server to communicate with
    if (servers &&
        servers.length > 0) {
      const _randomServerId = getRandomIntInclusive(0, servers.length - 1);
      const _randomServer = servers[_randomServerId];
      const _serverDetails = _randomServer.split(':');

      if (_serverDetails.length === 2) {
        randomServer.ip = _serverDetails[0];
        randomServer.port = _serverDetails[1];
      }
    }

    for (let key in shepherd.electrumServers) {
      if (shepherd.electrumServers[key].abbr === coin) {
        shepherd.electrumCoins[coin] = {
          name: key,
          abbr: coin,
          server: {
            ip: randomServer.ip, // shepherd.electrumServers[key].address,
            port: randomServer.port, // shepherd.electrumServers[key].port,
          },
          serverList: shepherd.electrumServers[key].serverList ? shepherd.electrumServers[key].serverList : 'none',
          txfee: 'calculated' /*shepherd.electrumServers[key].txfee*/,
        };

        shepherd.log(`default ${coin} electrum server ${shepherd.electrumServers[key].address + ':' + shepherd.electrumServers[key].port}`, true);
        shepherd.log(`random ${coin} electrum server ${randomServer.ip + ':' + randomServer.port}`, true);
        return true;
      }
    }
  }

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