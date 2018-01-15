module.exports = (shepherd) => {
  /*
   *  type: GET
   *
   */
  shepherd.get('/InstantDEX/allcoins', (req, res, next) => {
    let successObj;
    let nativeCoindList = [];
    let electrumCoinsList = [];

    for (let key in shepherd.electrumCoins) {
      if (key !== 'auth') {
        electrumCoinsList.push(shepherd.electrumCoins[key].abbr);
      }
    }

    for (let key in shepherd.coindInstanceRegistry) {
      nativeCoindList.push(key === 'komodod' ? 'KMD' : key);
    }

    successObj = {
      native: nativeCoindList,
      spv: electrumCoinsList,
      total: Object.keys(shepherd.electrumCoins).length - 1 + Object.keys(nativeCoindList).length,
    };

    res.end(JSON.stringify(successObj));
  });

  return shepherd;
};