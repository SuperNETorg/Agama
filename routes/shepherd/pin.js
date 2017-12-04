module.exports = (shepherd) => {
  /*
   *  type: POST
   *  params: none
   */
  shepherd.post('/encryptkey', (req, res, next) => {
    if (req.body.key &&
        req.body.string &&
        req.body.pubkey) {
      const encryptedString = shepherd.aes256.encrypt(req.body.key, req.body.string);

      // test pin security
      // - at least 1 char in upper case
      // - at least 1 digit
      // - at least one special character
      // - min length 8

      const _pin = req.body.key;
      const _pinTest = _pin.match('^(?=.*[A-Z])(?=.*[^<>{}\"/|;:.,~!?@#$%^=&*\\]\\\\()\\[_+]*$)(?=.*[0-9])(?=.*[a-z]).{8}$');

      shepherd.fs.writeFile(`${shepherd.agamaDir}/shepherd/pin/${req.body.pubkey}.pin`, encryptedString, (err) => {
        if (err) {
          shepherd.log('error writing pin file');
        }

        const returnObj = {
          msg: 'success',
          result: encryptedString,
        };

        res.end(JSON.stringify(returnObj));
      });
    } else {
      let errorObj = {
        msg: 'error',
        result: '',
      };
      const _paramsList = [
        'key',
        'string',
        'pubkey'
      ];
      let _errorParamsList = [];

      for (let i = 0; i < _paramsList.length; i++) {
        if (!req.query[_paramsList[i]]) {
          _errorParamsList.push(_paramsList[i]);
        }
      }

      errorObj.result = `missing param ${_errorParamsList.join(', ')}`;
      res.end(JSON.stringify(errorObj));
    }
  });

  shepherd.post('/decryptkey', (req, res, next) => {
    if (req.body.key &&
        req.body.pubkey) {
      if (shepherd.fs.existsSync(`${shepherd.agamaDir}/shepherd/pin/${req.body.pubkey}.pin`)) {
        shepherd.fs.readFile(`${shepherd.agamaDir}/shepherd/pin/${req.body.pubkey}.pin`, 'utf8', (err, data) => {
          if (err) {
            const errorObj = {
              msg: 'error',
              result: err,
            };

            res.end(JSON.stringify(errorObj));
          } else {
            const encryptedKey = shepherd.aes256.decrypt(req.body.key, data);
            // test if stored encrypted passphrase is decrypted correctly
            // if not then the key is wrong
            const _regexTest = encryptedKey.match(/^[0-9a-zA-Z ]+$/g);
            let returnObj;

            if (!_regexTest) {
              returnObj = {
                msg: 'error',
                result: 'wrong key',
              };
            } else {
              returnObj = {
                msg: 'success',
                result: encryptedKey,
              };
            }

            res.end(JSON.stringify(returnObj));
          }
        });
      } else {
        const errorObj = {
          msg: 'error',
          result: `file ${req.query.pubkey}.pin doesnt exist`,
        };

        res.end(JSON.stringify(errorObj));
      }
    } else {
      const errorObj = {
        msg: 'error',
        result: 'missing key or pubkey param',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  shepherd.get('/getpinlist', (req, res, next) => {
    if (shepherd.fs.existsSync(`${shepherd.agamaDir}/shepherd/pin`)) {
      shepherd.fs.readdir(`${shepherd.agamaDir}/shepherd/pin`, (err, items) => {
        let _pins = [];

        for (let i = 0; i < items.length; i++) {
          if (items[i].substr(items[i].length - 4, 4) === '.pin') {
            _pins.push(items[i].substr(0, items[i].length - 4));
          }
        }

        if (!items.length) {
          const errorObj = {
            msg: 'error',
            result: 'no pins',
          };

          res.end(JSON.stringify(errorObj));
        } else {
          const successObj = {
            msg: 'success',
            result: _pins,
          };

          res.end(JSON.stringify(successObj));
        }
      });
    } else {
      const errorObj = {
        msg: 'error',
        result: 'pin folder doesnt exist',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  return shepherd;
};