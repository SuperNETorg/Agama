module.exports = (shepherd) => {
  shepherd.isZcash = (network) => {
    if (network === 'ZEC' ||
        network === 'zec' ||
        network === 'zcash' ||
        network === 'ZCASH' ||
        network === 'HUSH' ||
        network === 'hush' ||
        network === 'blk' ||
        network === 'BLK') {
      return true;
    }
  };

  shepherd.getNetworkData = (network) => {
    const coin = shepherd.findNetworkObj(network) || shepherd.findNetworkObj(network.toUpperCase()) || shepherd.findNetworkObj(network.toLowerCase());
    const coinUC = coin ? coin.toUpperCase() : null;

    if (coin === 'SUPERNET' ||
        coin === 'REVS' ||
        coin === 'SUPERNET' ||
        coin === 'PANGEA' ||
        coin === 'DEX' ||
        coin === 'JUMBLR' ||
        coin === 'BET' ||
        coin === 'CRYPTO' ||
        coin === 'COQUI' ||
        coin === 'HODL' ||
        coin === 'SHARK' ||
        coin === 'MSHARK' ||
        coin === 'BOTS' ||
        coin === 'MGW' ||
        coin === 'MVP' ||
        coin === 'KV' ||
        coin === 'CEAL' ||
        coin === 'MESH' ||
        coin === 'WLC' ||
        coin === 'MNZ' ||
        coinUC === 'SUPERNET' ||
        coinUC === 'REVS' ||
        coinUC === 'SUPERNET' ||
        coinUC === 'PANGEA' ||
        coinUC === 'DEX' ||
        coinUC === 'JUMBLR' ||
        coinUC === 'BET' ||
        coinUC === 'CRYPTO' ||
        coinUC === 'COQUI' ||
        coinUC === 'HODL' ||
        coinUC === 'SHARK' ||
        coinUC === 'MSHARK' ||
        coinUC === 'BOTS' ||
        coinUC === 'MGW' ||
        coinUC === 'MVP' ||
        coinUC === 'KV' ||
        coinUC === 'CEAL' ||
        coinUC === 'MESH' ||
        coinUC === 'WLC' ||
        coinUC === 'MNZ') {
      return shepherd.electrumJSNetworks.komodo;
    } else {
      return shepherd.electrumJSNetworks[network];
    }
  }

  shepherd.findNetworkObj = (coin) => {
    for (let key in shepherd.electrumServers) {
      if (shepherd.electrumServers[key].abbr === coin) {
        return key;
      }
    }
  }

  shepherd.get('/electrum/servers', (req, res, next) => {
    if (req.query.abbr) {
      let _electrumServers = {};

      for (let key in shepherd.electrumServers) {
        _electrumServers[shepherd.electrumServers[key].abbr] = shepherd.electrumServers[key];
      }

      const successObj = {
        msg: 'success',
        result: {
          servers: _electrumServers,
        },
      };

      res.end(JSON.stringify(successObj));
    } else {
      const successObj = {
        msg: 'success',
        result: {
          servers: shepherd.electrumServers,
        },
      };

      res.end(JSON.stringify(successObj));
    }
  });

  shepherd.get('/electrum/coins/server/set', (req, res, next) => {
    shepherd.electrumCoins[req.query.coin].server = {
      ip: req.query.address,
      port: req.query.port,
    };

    for (let key in shepherd.electrumServers) {
      if (shepherd.electrumServers[key].abbr === req.query.coin) { // a bit risky
        shepherd.electrumServers[key].address = req.query.address;
        shepherd.electrumServers[key].port = req.query.port;
        break;
      }
    }

    shepherd.log(JSON.stringify(shepherd.electrumCoins[req.query.coin], null, '\t'), true);

    const successObj = {
      msg: 'success',
      result: true,
    };

    res.end(JSON.stringify(successObj));
  });

  shepherd.get('/electrum/servers/test', (req, res, next) => {
    const ecl = new shepherd.electrumJSCore(req.query.port, req.query.address, 'tcp'); // tcp or tls

    ecl.connect();
    ecl.serverVersion()
    .then((serverData) => {
      ecl.close();
      shepherd.log('serverData', true);
      shepherd.log(serverData, true);

      if (serverData &&
          typeof serverData === 'string' &&
          serverData.indexOf('Electrum') > -1) {
        const successObj = {
          msg: 'success',
          result: true,
        };

        res.end(JSON.stringify(successObj));
      } else {
        const successObj = {
          msg: 'error',
          result: false,
        };

        res.end(JSON.stringify(successObj));
      }
    });
  });

  return shepherd;
};