module.exports = (shepherd) => {
  shepherd.loadLocalConfig = () => {
    if (shepherd.fs.existsSync(`${shepherd.agamaDir}/config.json`)) {
      let localAppConfig = shepherd.fs.readFileSync(`${shepherd.agamaDir}/config.json`, 'utf8');

      shepherd.log('app config set from local file');
      shepherd.writeLog('app config set from local file');

      // find diff between local and hardcoded configs
      // append diff to local config
      const compareJSON = (obj1, obj2) => {
        let result = {};

        for (let i in obj1) {
          if (!obj2.hasOwnProperty(i)) {
            result[i] = obj1[i];
          }
        }

        return result;
      };

      if (localAppConfig) {
        const compareConfigs = compareJSON(shepherd.appConfig, JSON.parse(localAppConfig));

        if (Object.keys(compareConfigs).length) {
          const newConfig = Object.assign(JSON.parse(localAppConfig), compareConfigs);

          shepherd.log('config diff is found, updating local config');
          shepherd.log('config diff:');
          shepherd.log(compareConfigs);
          shepherd.writeLog('aconfig diff is found, updating local config');
          shepherd.writeLog('config diff:');
          shepherd.writeLog(compareConfigs);

          shepherd.saveLocalAppConf(newConfig);
          return newConfig;
        } else {
          return JSON.parse(localAppConfig);
        }
      } else {
        return shepherd.appConfig;
      }
    } else {
      shepherd.log('local config file is not found!');
      shepherd.writeLog('local config file is not found!');
      shepherd.saveLocalAppConf(shepherd.appConfig);

      return shepherd.appConfig;
    }
  };

  shepherd.saveLocalAppConf = (appSettings) => {
    let appConfFileName = `${shepherd.agamaDir}/config.json`;

    shepherd._fs.access(shepherd.agamaDir, shepherd.fs.constants.R_OK, (err) => {
      if (!err) {

        const FixFilePermissions = () => {
          return new shepherd.Promise((resolve, reject) => {
            const result = 'config.json file permissions updated to Read/Write';

            shepherd.fsnode.chmodSync(appConfFileName, '0666');

            setTimeout(() => {
              shepherd.log(result);
              shepherd.writeLog(result);
              resolve(result);
            }, 1000);
          });
        }

        const FsWrite = () => {
          return new shepherd.Promise((resolve, reject) => {
            const result = 'config.json write file is done';

            shepherd.fs.writeFile(appConfFileName,
                        JSON.stringify(appSettings)
                        .replace(/,/g, ',\n') // format json in human readable form
                        .replace(/":/g, '": ')
                        .replace(/{/g, '{\n')
                        .replace(/}/g, '\n}'), 'utf8', (err) => {
              if (err)
                return shepherd.log(err);
            });

            shepherd.fsnode.chmodSync(appConfFileName, '0666');
            setTimeout(() => {
              shepherd.log(result);
              shepherd.log(`app conf.json file is created successfully at: ${shepherd.agamaDir}`);
              shepherd.writeLog(`app conf.json file is created successfully at: ${shepherd.agamaDir}`);
              resolve(result);
            }, 2000);
          });
        }

        FsWrite()
        .then(FixFilePermissions());
      }
    });
  }

  /*
   *  type: POST
   *  params: payload
   */
  shepherd.post('/appconf', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      if (!req.body.payload) {
        const errorObj = {
          msg: 'error',
          result: 'no payload provided',
        };

        res.end(JSON.stringify(errorObj));
      } else {
        shepherd.saveLocalAppConf(req.body.payload);

        const successObj = {
          msg: 'success',
          result: 'config saved',
        };

        res.end(JSON.stringify(successObj));
      }
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  /*
   *  type: POST
   *  params: none
   */
  shepherd.post('/appconf/reset', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      shepherd.saveLocalAppConf(shepherd.defaultAppConfig);

      const successObj = {
        msg: 'success',
        result: 'config saved',
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

  /*
   *  type: GET
   *
   */
  shepherd.get('/appconf', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      const obj = shepherd.loadLocalConfig();
      res.send(obj);
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