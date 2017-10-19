module.exports = (shepherd) => {
  // osx and linux
  shepherd.binFixRights = () => {
    const osPlatform = shepherd.os.platform();
    const _bins = [
      shepherd.komododBin,
      shepherd.komodocliBin
    ];

    if (osPlatform === 'darwin' ||
        osPlatform === 'linux') {
      for (let i = 0; i < _bins.length; i++) {
        shepherd._fs.stat(_bins[i], (err, stat) => {
          if (!err) {
            if (parseInt(stat.mode.toString(8), 10) !== 100775) {
              shepherd.log(`${_bins[i]} fix permissions`);
              shepherd.fsnode.chmodSync(_bins[i], '0775');
            }
          } else {
            shepherd.log(`error: ${_bins[i]} not found`);
          }
        });
      }
    }
  }

  shepherd.killRogueProcess = (processName) => {
    // kill rogue process copies on start
    let processGrep;
    const osPlatform = shepherd.os.platform();

    switch (osPlatform) {
      case 'darwin':
        processGrep = "ps -p $(ps -A | grep -m1 " + processName + " | awk '{print $1}') | grep -i " + processName;
        break;
      case 'linux':
        processGrep = 'ps -p $(pidof ' + processName + ') | grep -i ' + processName;
        break;
      case 'win32':
        processGrep = 'tasklist';
        break;
    }

    shepherd.exec(processGrep, (error, stdout, stderr) => {
      if (stdout.indexOf(processName) > -1) {
        const pkillCmd = osPlatform === 'win32' ? `taskkill /f /im ${processName}.exe` : `pkill -15 ${processName}`;

        shepherd.log(`found another ${processName} process(es)`);
        shepherd.writeLog(`found another ${processName} process(es)`);

        shepherd.exec(pkillCmd, (error, stdout, stderr) => {
          shepherd.log(`${pkillCmd} is issued`);
          shepherd.writeLog(`${pkillCmd} is issued`);

          if (error !== null) {
            shepherd.log(`${pkillCmd} exec error: ${error}`);
            shepherd.writeLog(`${pkillCmd} exec error: ${error}`);
          };
        });
      }

      if (error !== null) {
        shepherd.log(`${processGrep} exec error: ${error}`);
        shepherd.writeLog(`${processGrep} exec error: ${error}`);
      };
    });
  }

  return shepherd;
};