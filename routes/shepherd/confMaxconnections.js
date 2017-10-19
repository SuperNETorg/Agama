module.exports = (shepherd) => {
  shepherd.getMaxconKMDConf = () => {
    return new shepherd.Promise((resolve, reject) => {
      shepherd.fs.readFile(`${shepherd.komodoDir}/komodo.conf`, 'utf8', (err, data) => {
        if (err) {
          shepherd.log(`kmd conf maxconnections param read failed`);
          resolve('unset');
        } else {
          const _maxcon = data.match(/maxconnections=\s*(.*)/);

          if (!_maxcon) {
            shepherd.log(`kmd conf maxconnections param is unset`);
            resolve(false);
          } else {
            shepherd.log(`kmd conf maxconnections param is already set to ${_maxcon[1]}`);
            resolve(_maxcon[1]);
          }
        }
      });
    });
  }

  shepherd.setMaxconKMDConf = (limit) => {
    return new shepherd.Promise((resolve, reject) => {
      shepherd.fs.readFile(`${shepherd.komodoDir}/komodo.conf`, 'utf8', (err, data) => {
        const _maxconVal = limit ? 1 : 10;

        if (err) {
          shepherd.log(`error reading ${shepherd.komodoDir}/komodo.conf`);
          resolve(false);
        } else {
          if (data.indexOf('maxconnections=') > -1) {
            const _maxcon = data.match(/maxconnections=\s*(.*)/);

            data = data.replace(`maxconnections=${_maxcon[1]}`, `maxconnections=${_maxconVal}`);
          } else {
            data = `${data}\nmaxconnections=${_maxconVal}\n`;
          }

          shepherd.fs.writeFile(`${shepherd.komodoDir}/komodo.conf`, data, (err) => {
            if (err) {
              shepherd.log(`error writing ${shepherd.komodoDir}/komodo.conf maxconnections=${_maxconVal}`);
              resolve(false);
            } else {
              shepherd.log(`kmd conf maxconnections is set to ${_maxconVal}`);
              resolve(true);
            }
          });
        }
      });
    });
  }

  return shepherd;
};