module.exports = (shepherd) => {
  shepherd.get('/electrum/estimatefee', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      const ecl = new shepherd.electrumJSCore(shepherd.electrumServers[req.query.network].port, shepherd.electrumServers[req.query.network].address, shepherd.electrumServers[req.query.network].proto); // tcp or tls

      ecl.connect();
      ecl.blockchainEstimatefee(req.query.blocks)
      .then((json) => {
        ecl.close();
        shepherd.log('electrum estimatefee ==>', true);

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

  shepherd.estimateTxSize = (numVins, numOuts) => {
    // in x 180 + out x 34 + 10 plus or minus in
    return numVins * 180 + numOuts * 34 + 11;
  }

  return shepherd;
};