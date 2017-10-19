module.exports = (shepherd) => {
  /*
   *  list native coind
   *  type:
   *  params:
   */
  shepherd.get('/coind/list', (req, res, next) => {
    const successObj = {
      msg: 'success',
      result: shepherd.nativeCoindList,
    };

    res.end(JSON.stringify(successObj));
  });

  shepherd.scanNativeCoindBins = () => {
    let nativeCoindList = {};

    // check if coind bins are present in agama
    for (let key in shepherd.nativeCoind) {
      nativeCoindList[key] = {
        name: shepherd.nativeCoind[key].name,
        port: shepherd.nativeCoind[key].port,
        bin: shepherd.nativeCoind[key].bin,
        bins: {
          daemon: false,
          cli: false,
        },
      };

      if (shepherd.fs.existsSync(`${shepherd.coindRootDir}/${key}/${shepherd.nativeCoind[key].bin}d${shepherd.os.platform() === 'win32' ? '.exe' : ''}`)) {
        nativeCoindList[key].bins.daemon = true;
      }

      if (shepherd.fs.existsSync(`${shepherd.coindRootDir}/${key}/${shepherd.nativeCoind[key].bin}-cli${shepherd.os.platform() === 'win32' ? '.exe' : ''}`)) {
        nativeCoindList[key].bins.cli = true;
      }
    }

    return nativeCoindList;
  }

  return shepherd;
};