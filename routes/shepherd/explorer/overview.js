const remoteExplorers = require('./remoteExplorers');
const request = require('request');
const fs = require('fs-extra');
const path = require('path');

let remoteExplorersArray = [];

for (let key in remoteExplorers) {
  remoteExplorersArray.push(key);
}

const sortByDate = (data, sortKey) => {
  return data.sort(function(b, a) {
    if (a[sortKey] < b[sortKey]) {
      return -1;
    }

    if (a[sortKey] > b[sortKey]) {
      return 1;
    }

    return 0;
  });
}

module.exports = (shepherd) => {
  shepherd.get('/explorer/overview', (req, res, next) => {
    if (req.query.coin) {
      const options = {
        url: `${remoteExplorers[req.query.coin]}/ext/getlasttxs/0.00000001`,
        method: 'GET',
      };

      request(options, (error, response, body) => {
        const _parsedBody = JSON.parse(body);

        if (response &&
            response.statusCode &&
            response.statusCode === 200) {
          res.end(body);
        } else {
          res.end(body ? body : JSON.stringify({
            result: 'error',
            error: {
              code: -777,
              message: `unable to retrieve remote data from remoteExplorers[req.query.coin]`,
            },
          }));
        }
      });
    } else {
      Promise.all(remoteExplorersArray.map((coin, index) => {
        shepherd.log(`explorer ${coin} overview`);

        return new Promise((resolve, reject) => {
          const options = {
            url: `${remoteExplorers[coin]}/ext/getlasttxs/0.00000001`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              resolve({
                coin,
                result: body,
              });
            } else {
              resolve({
                coin,
                result: 'unable to get lasttx'
              });
            }
          });
        });
      }))
      .then(result => {
        const returnObj = {
          msg: 'success',
          result,
        };

        res.end(JSON.stringify(returnObj));

        /*if (result &&
            result.length) {
        } else {
          const returnObj = {
            msg: 'success',
            result: _returnObj,
          };

          res.end(JSON.stringify(returnObj));
        }*/
      });
    }
  });

  shepherd.get('/explorer/overview/test', (req, res, next) => {
    const testFileLocation = path.join(__dirname, '../explorer/test.json');
    const testFile = fs.readJsonSync(testFileLocation, { throws: false });
    const resSizeLimit = 1000;
    let items = [];

    for (let i = 0; i < testFile.result.length; i++) {
      const _parseData = JSON.parse(testFile.result[i].result).data;

      for (let j = 0; j < _parseData.length; j++) {
        items.push({
          coin: testFile.result[i].coin,
          txid: _parseData[j].txid,
          blockhash: _parseData[j].blockhash,
          blockindex: _parseData[j].blockindex,
          timestamp: _parseData[j].timestamp,
          total: _parseData[j].total,
          vout: _parseData[j].vout,
          vin: _parseData[j].vin,
        });
      }
    }

    items = sortByDate(items, 'timestamp');
    items = items.slice(0, resSizeLimit + 1);

    res.end(JSON.stringify(items));
  });

  return shepherd;
};