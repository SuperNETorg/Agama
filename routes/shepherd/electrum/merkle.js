module.exports = (shepherd) => {
  // get merkle root
  shepherd.getMerkleRoot = (txid, proof, pos) => {
    const reverse = require('buffer-reverse');
    const _sha256 = (data) => {
      return shepherd.crypto.createHash('sha256').update(data).digest();
    }
    let hash = txid;
    let serialized;

    shepherd.log(`getMerkleRoot txid ${txid}`, true);
    shepherd.log(`getMerkleRoot pos ${pos}`, true);
    shepherd.log('getMerkleRoot proof', true);
    shepherd.log(`getMerkleRoot ${proof}`, true);

    for (i = 0; i < proof.length; i++) {
      const _hashBuff = new Buffer(hash, 'hex');
      const _proofBuff = new Buffer(proof[i], 'hex');

      if ((pos & 1) == 0) {
        serialized = Buffer.concat([reverse(_hashBuff), reverse(_proofBuff)]);
      } else {
        serialized = Buffer.concat([reverse(_proofBuff), reverse(_hashBuff)]);
      }

      hash = reverse(_sha256(_sha256(serialized))).toString('hex');
      pos /= 2;
    }

    return hash;
  }

  shepherd.verifyMerkle = (txid, height, serverList, mainServer) => {
    // select random server
    const getRandomIntInclusive = (min, max) => {
      min = Math.ceil(min);
      max = Math.floor(max);

      return Math.floor(Math.random() * (max - min + 1)) + min; // the maximum is inclusive and the minimum is inclusive
    }

    const _rnd = getRandomIntInclusive(0, serverList.length - 1);
    const randomServer = serverList[_rnd];
    const _randomServer = randomServer.split(':');
    const _mainServer = mainServer.split(':');

    let ecl = new shepherd.electrumJSCore(_mainServer[1], _mainServer[0], 'tcp'); // tcp or tls

    return new shepherd.Promise((resolve, reject) => {
      shepherd.log(`main server: ${mainServer}`, true);
      shepherd.log(`verification server: ${randomServer}`, true);

      ecl.connect();
      ecl.blockchainTransactionGetMerkle(txid, height)
      .then((merkleData) => {
        if (merkleData &&
            merkleData.merkle &&
            merkleData.pos) {
          shepherd.log('electrum getmerkle =>', true);
          shepherd.log(merkleData, true);
          ecl.close();

          const _res = shepherd.getMerkleRoot(txid, merkleData.merkle, merkleData.pos);
          shepherd.log(_res, true);

          ecl = new shepherd.electrumJSCore(_randomServer[1], _randomServer[0], 'tcp');
          ecl.connect();

          ecl.blockchainBlockGetHeader(height)
          .then((blockInfo) => {
            if (blockInfo &&
                blockInfo['merkle_root']) {
              ecl.close();
              shepherd.log('blockinfo =>', true);
              shepherd.log(blockInfo, true);
              shepherd.log(blockInfo['merkle_root'], true);

              if (blockInfo &&
                  blockInfo['merkle_root']) {
                if (_res === blockInfo['merkle_root']) {
                  resolve(true);
                } else {
                  resolve(false);
                }
              } else {
                resolve(shepherd.CONNECTION_ERROR_OR_INCOMPLETE_DATA);
              }
            } else {
              resolve(shepherd.CONNECTION_ERROR_OR_INCOMPLETE_DATA);
            }
          });
        } else {
          resolve(shepherd.CONNECTION_ERROR_OR_INCOMPLETE_DATA);
        }
      });
    });
  }

  shepherd.verifyMerkleByCoin = (coin, txid, height) => {
    const _serverList = shepherd.electrumCoins[coin].serverList;

    shepherd.log(`verifyMerkleByCoin`, true);
    shepherd.log(shepherd.electrumCoins[coin].server, true);
    shepherd.log(shepherd.electrumCoins[coin].serverList, true);

    return new shepherd.Promise((resolve, reject) => {
      if (_serverList !== 'none') {
        let _filteredServerList = [];

        for (let i = 0; i < _serverList.length; i++) {
          if (_serverList[i] !== shepherd.electrumCoins[coin].server.ip + ':' + shepherd.electrumCoins[coin].server.port) {
            _filteredServerList.push(_serverList[i]);
          }
        }

        shepherd.verifyMerkle(
          txid,
          height,
          _filteredServerList,
          shepherd.electrumCoins[coin].server.ip + ':' + shepherd.electrumCoins[coin].server.port
        ).then((proof) => {
          resolve(proof);
        });
      } else {
        resolve(false);
      }
    });
  }

  shepherd.get('/electrum/merkle/verify', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      shepherd.verifyMerkleByCoin(req.query.coin, req.query.txid, req.query.height)
      .then((verifyMerkleRes) => {
        const successObj = {
          msg: 'success',
          result: {
            merkleProof: verifyMerkleRes,
          },
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

  return shepherd;
};
