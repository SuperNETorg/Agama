module.exports = (shepherd) => {
  shepherd.quitKomodod = (timeout = 100) => {
    // if komodod is under heavy load it may not respond to cli stop the first time
    // exit komodod gracefully
    let coindExitInterval = {};
    shepherd.lockDownAddCoin = true;

    for (let key in shepherd.coindInstanceRegistry) {
      const chain = key !== 'komodod' ? key : null;
      let _coindQuitCmd = shepherd.komodocliBin;

       // any coind
      if (shepherd.nativeCoindList[key.toLowerCase()]) {
        _coindQuitCmd = `${shepherd.coindRootDir}/${key.toLowerCase()}/${shepherd.nativeCoindList[key.toLowerCase()].bin.toLowerCase()}-cli`;
      }
      if (key === 'CHIPS') {
        _coindQuitCmd = shepherd.chipscliBin;
      }

      const execCliStop = () => {
        let _arg = [];
        if (chain && !shepherd.nativeCoindList[key.toLowerCase()] && key !== 'CHIPS') {
          _arg.push(`-ac_name=${chain}`);

          if (shepherd.appConfig.dataDir.length) {
            _arg.push(`-datadir=${shepherd.appConfig.dataDir + (key !== 'komodod' ? '/' + key : '')}`);
          }
        } else if (key === 'komodod' && shepherd.appConfig.dataDir.length) {
          _arg.push(`-datadir=${shepherd.appConfig.dataDir}`);
        }

        _arg.push('stop');
        shepherd.execFile(`${_coindQuitCmd}`, _arg, (error, stdout, stderr) => {
          shepherd.log(`stdout: ${stdout}`);
          shepherd.log(`stderr: ${stderr}`);

          if (stdout.indexOf('EOF reached') > -1 ||
              stderr.indexOf('EOF reached') > -1 ||
              (error && error.toString().indexOf('Command failed') > -1 && !stderr) || // win "special snowflake" case
              stdout.indexOf('connect to server: unknown (code -1)') > -1 ||
              stderr.indexOf('connect to server: unknown (code -1)') > -1) {
            delete shepherd.coindInstanceRegistry[key];
            clearInterval(coindExitInterval[key]);
          }

          // workaround for AGT-65
          const _port = shepherd.assetChainPorts[key];
          setTimeout(() => {
            shepherd.portscanner.checkPortStatus(_port, '127.0.0.1', (error, status) => {
              // Status is 'open' if currently in use or 'closed' if available
              if (status === 'closed') {
                delete shepherd.coindInstanceRegistry[key];
                clearInterval(coindExitInterval[key]);
              }
            });
          }, 100);

          if (error !== null) {
            shepherd.log(`exec error: ${error}`);
          }

          if (key === 'CHIPS') {
            setTimeout(() => {
              shepherd.killRogueProcess('chips-cli');
            }, 100);
          } else {
            setTimeout(() => {
              shepherd.killRogueProcess('komodo-cli');
            }, 100);
          }
        });
      }

      execCliStop();
      coindExitInterval[key] = setInterval(() => {
        execCliStop();
      }, timeout);
    }
  }

  return shepherd;
};
