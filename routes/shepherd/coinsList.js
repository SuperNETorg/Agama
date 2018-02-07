module.exports = (shepherd) => {
  /*
   *  type: GET
   *
   */
  shepherd.get('/coinslist', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      if (shepherd.fs.existsSync(`${shepherd.agamaDir}/shepherd/coinslist.json`)) {
        shepherd.fs.readFile(`${shepherd.agamaDir}/shepherd/coinslist.json`, 'utf8', (err, data) => {
          if (err) {
            const errorObj = {
              msg: 'error',
              result: err,
            };

            res.end(JSON.stringify(errorObj));
          } else {
            const successObj = {
              msg: 'success',
              result: data ? JSON.parse(data) : '',
            };

            res.end(JSON.stringify(successObj));
          }
        });
      } else {
        const errorObj = {
          msg: 'error',
          result: 'coin list doesn\'t exist',
        };

        res.end(JSON.stringify(errorObj));
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
   *  params: payload
   */
  shepherd.post('/coinslist', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      const _payload = req.body.payload;

      if (!_payload) {
        const errorObj = {
          msg: 'error',
          result: 'no payload provided',
        };

        res.end(JSON.stringify(errorObj));
      } else {
        shepherd.fs.writeFile(`${shepherd.agamaDir}/shepherd/coinslist.json`, JSON.stringify(_payload), (err) => {
          if (err) {
            const errorObj = {
              msg: 'error',
              result: err,
            };

            res.end(JSON.stringify(errorObj));
          } else {
            const successObj = {
              msg: 'success',
              result: 'done',
            };

            res.end(JSON.stringify(successObj));
          }
        });
      }
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