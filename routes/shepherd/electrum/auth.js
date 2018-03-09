const bs58check = require('bs58check');
const bitcoinZcash = require('bitcoinjs-lib-zcash');
const bitcoin = require('bitcoinjs-lib');

module.exports = (shepherd) => {
  shepherd.post('/electrum/login', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      let _wifError = false;

      for (let key in shepherd.electrumCoins) {
        if (key !== 'auth') {
          const _abbr = key;
          const _seed = req.body.seed;
          let keys;
          let isWif = false;

          if (req.body.seed.match('^[a-zA-Z0-9]{34}$') &&
              shepherd.appConfig.experimentalFeatures) {
            shepherd.log('watchonly pub addr');
            shepherd.electrumKeys[_abbr] = {
              priv: req.body.seed,
              pub: req.body.seed,
            };
          } else {
            try {
              bs58check.decode(_seed);
              isWif = true;
            } catch (e) {}

            if (isWif) {
              try {
                let key = shepherd.isZcash(_abbr.toLowerCase()) ? bitcoinZcash.ECPair.fromWIF(_seed, shepherd.getNetworkData(_abbr.toLowerCase()), true) : bitcoin.ECPair.fromWIF(_seed, shepherd.getNetworkData(_abbr.toLowerCase()), true);
                keys = {
                  priv: key.toWIF(),
                  pub: key.getAddress(),
                };
              } catch (e) {
                _wifError = true;
                break;
              }
            } else {
              keys = shepherd.seedToWif(_seed, shepherd.findNetworkObj(_abbr), req.body.iguana);
            }

            shepherd.electrumKeys[_abbr] = {
              priv: keys.priv,
              pub: keys.pub,
            };
          }
        }
      }

      shepherd.electrumCoins.auth = true;

      // shepherd.log(JSON.stringify(shepherd.electrumKeys, null, '\t'), true);

      const successObj = {
        msg: _wifError ? 'error' : 'success',
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

  shepherd.post('/electrum/lock', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      shepherd.electrumCoins.auth = false;
      shepherd.electrumKeys = {};

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

  shepherd.post('/electrum/logout', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      shepherd.electrumCoins = {
        auth: false,
      };
      shepherd.electrumKeys = {};

      const obj = {
        msg: 'success',
        result: 'result',
      };

      res.end(JSON.stringify(obj));
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