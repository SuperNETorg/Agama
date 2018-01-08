module.exports = (shepherd) => {
  /*
   *  DL app patch
   *  type: GET
   *  params: patchList
   */
  shepherd.get('/update/patch', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      const successObj = {
        msg: 'success',
        result: 'dl started'
      };

      res.end(JSON.stringify(successObj));

      shepherd.updateAgama();
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  shepherd.updateAgama = () => {
    const rootLocation = shepherd.path.join(__dirname, '../../');

    shepherd.downloadFile({
      remoteFile: 'https://github.com/pbca26/dl-test/raw/master/patch.zip',
      localFile: `${rootLocation}patch.zip`,
      onProgress: (received, total) => {
        const percentage = (received * 100) / total;

        if (percentage.toString().indexOf('.10') > -1) {
          shepherd.io.emit('patch', {
            msg: {
              status: 'progress',
              type: 'ui',
              progress: percentage,
              bytesTotal: total,
              bytesReceived: received,
            },
          });
          //shepherd.log(`patch ${percentage}% | ${received} bytes out of ${total} bytes.`);
        }
      }
    })
    .then(() => {
      shepherd.remoteFileSize('https://github.com/pbca26/dl-test/raw/master/patch.zip', (err, remotePatchSize) => {
        // verify that remote file is matching to DL'ed file
        const localPatchSize = shepherd.fs.statSync(`${rootLocation}patch.zip`).size;
        shepherd.log('compare dl file size');

        if (localPatchSize === remotePatchSize) {
          const zip = new shepherd.AdmZip(`${rootLocation}patch.zip`);

          shepherd.log('patch succesfully downloaded');
          shepherd.log('extracting contents');

          if (shepherd.appConfig.dev) {
            if (!shepherd.fs.existsSync(`${rootLocation}/patch`)) {
              shepherd.fs.mkdirSync(`${rootLocation}/patch`);
            }
          }

          zip.extractAllTo(/*target path*/rootLocation + (shepherd.appConfig.dev ? '/patch' : ''), /*overwrite*/true);
          // TODO: extract files in chunks
          shepherd.io.emit('patch', {
            msg: {
              type: 'ui',
              status: 'done',
            },
          });
          shepherd.fs.unlinkSync(`${rootLocation}patch.zip`);
        } else {
          shepherd.io.emit('patch', {
            msg: {
              type: 'ui',
              status: 'error',
              message: 'size mismatch',
            },
          });
          shepherd.log('patch file size doesnt match remote!');
        }
      });
    });
  }

  /*
   *  check latest version
   *  type:
   *  params:
   */
  shepherd.get('/update/patch/check', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      const rootLocation = shepherd.path.join(__dirname, '../../');
      const options = {
        url: 'https://github.com/pbca26/dl-test/raw/master/version',
        method: 'GET',
      };

      shepherd.request(options, (error, response, body) => {
        if (response &&
            response.statusCode &&
            response.statusCode === 200) {
          const remoteVersion = body.split('\n');
          const localVersionFile = shepherd.fs.readFileSync(`${rootLocation}version`, 'utf8');
          let localVersion;

          if (localVersionFile.indexOf('\r\n') > -1) {
            localVersion = localVersionFile.split('\r\n');
          } else {
            localVersion = localVersionFile.split('\n');
          }

          if (remoteVersion[0] === localVersion[0]) {
            const successObj = {
              msg: 'success',
              result: 'latest',
            };

            res.end(JSON.stringify(successObj));
          } else {
            const successObj = {
              msg: 'success',
              result: 'update',
              version: {
                local: localVersion[0],
                remote: remoteVersion[0],
              },
            };

            res.end(JSON.stringify(successObj));
          }
        } else {
          res.end({
            err: 'error getting update',
          });
        }
      });
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  /*
   *  unpack zip
   *  type:
   *  params:
   */
  shepherd.get('/unpack', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      const dlLocation = shepherd.path.join(__dirname, '../../');
      const zip = new shepherd.AdmZip(`${dlLocation}patch.zip`);
      zip.extractAllTo(/*target path*/ `${dlLocation}/patch/unpack`, /*overwrite*/true);

      const successObj = {
        msg: 'success',
        result: 'unpack started',
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

  return shepherd;
};