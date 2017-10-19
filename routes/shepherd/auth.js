module.exports = (shepherd) => {
  /*
   *  type: GET
   *
   */
  shepherd.get('/auth/status', (req, res, next) => { // not finished
    let successObj;
    let _status = false;

    if (Object.keys(shepherd.coindInstanceRegistry).length) {
      if (Object.keys(shepherd.electrumCoins).length > 1 && shepherd.electrumCoins.auth) {
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
      pubkey: 'nativeonly',
      result: 'success',
      handle: '',
      status: _status ? 'unlocked' : 'locked',
      duration: 2507830,
    };

    res.end(JSON.stringify(successObj));
  });

  return shepherd;
};