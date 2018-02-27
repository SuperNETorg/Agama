module.exports = (shepherd) => {
  shepherd.get('/electrum/getblockinfo', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      shepherd.electrumGetBlockInfo(req.query.height, req.query.network)
      .then((json) => {
        const successObj = {
          msg: 'success',
          result: json,
        };

        res.end(JSON.stringify(successObj));
      });
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  shepherd.electrumGetBlockInfo = (height, network) => {
    return new shepherd.Promise((resolve, reject) => {
      const ecl = new shepherd.electrumJSCore(shepherd.electrumServers[network].port, shepherd.electrumServers[network].address, shepherd.electrumServers[network].proto); // tcp or tls

      ecl.connect();
      ecl.blockchainBlockGetHeader(height)
      .then((json) => {
        ecl.close();
        shepherd.log('electrum getblockinfo ==>', true);
        shepherd.log(json, true);

        resolve(json);
      });
    });
  }

  shepherd.get('/electrum/getcurrentblock', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      shepherd.electrumGetCurrentBlock(req.query.network)
      .then((json) => {
        const successObj = {
          msg: 'success',
          result: json,
        };

        res.end(JSON.stringify(successObj));
      });
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  shepherd.electrumGetCurrentBlock = (network) => {
    return new shepherd.Promise((resolve, reject) => {
      const ecl = new shepherd.electrumJSCore(shepherd.electrumServers[network].port, shepherd.electrumServers[network].address, shepherd.electrumServers[network].proto); // tcp or tls

      ecl.connect();
      ecl.blockchainNumblocksSubscribe()
      .then((json) => {
        ecl.close();
        shepherd.log('electrum currentblock ==>', true);
        shepherd.log(json, true);

        resolve(json);
      });
    });
  }

  return shepherd;
};