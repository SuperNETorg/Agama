module.exports = (shepherd) => {
  shepherd.get('/electrum/getblockinfo', (req, res, next) => {
    shepherd.electrumGetBlockInfo(req.query.height, req.query.network)
    .then((json) => {
      const successObj = {
        msg: 'success',
        result: json,
      };

      res.end(JSON.stringify(successObj));
    });
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
    shepherd.electrumGetCurrentBlock(req.query.network)
    .then((json) => {
      const successObj = {
        msg: 'success',
        result: json,
      };

      res.end(JSON.stringify(successObj));
    });
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