module.exports = (shepherd) => {
  /*
   *  type: GET
   *
   */
  shepherd.get('/auth/status', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      let successObj;
      let _status = false;

      if (Object.keys(shepherd.coindInstanceRegistry).length) {
        if (Object.keys(shepherd.electrumCoins).length > 1 &&
            shepherd.electrumCoins.auth) {
          _status = true;
        } else if (Object.keys(shepherd.electrumCoins).length === 1 && !shepherd.electrumCoins.auth) {
          _status = true;
        }
      } else if (Object.keys(shepherd.electrumCoins).length > 1 && shepherd.electrumCoins.auth) {
        _status = true;
      } else if (Object.keys(shepherd.electrumCoins).length === 1 && !Object.keys(shepherd.coindInstanceRegistry).length) {
        _status = true;
      }

      successObj = {
        status: _status ? 'unlocked' : 'locked',
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

  shepherd.checkToken = (token) => {
    if (token === shepherd.appSessionHash ||
        process.argv.indexOf('devmode') > -1) {
      return true;
    }
  };

  return shepherd;
};