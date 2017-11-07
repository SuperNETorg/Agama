module.exports = (shepherd) => {
  /*
   *  Combined native dashboard update same as in gui
   *  type: GET
   *  params: coin
   */
  shepherd.post('/native/dashboard/update', (req, res, next) => {
    let _returnObj;
    let _promiseStack;
    const _coin = req.body.coin;

    if (_coin === 'CHIPS') {
      _returnObj = {
        getinfo: {},
        listtransactions: [],
        getbalance: {},
        listunspent: {},
        addresses: {},
      };
      _promiseStack = [
        'getinfo',
        'listtransactions',
        'getbalance',
      ];
    } else {
      _returnObj = {
        getinfo: {},
        listtransactions: [],
        z_gettotalbalance: {},
        z_getoperationstatus: {},
        listunspent: {},
        addresses: {},
      };
      _promiseStack = [
        'getinfo',
        'listtransactions',
        'z_gettotalbalance',
        'z_getoperationstatus'
      ];
    }

    const getAddressesNative = (coin) => {
      const type = [
        'public',
        'private'
      ];

      if (coin === 'CHIPS') {
        type.pop();
      }

      shepherd.Promise.all(type.map((_type, index) => {
        return new shepherd.Promise((resolve, reject) => {
          _bitcoinRPC(
            coin,
            _type === 'public' ? 'getaddressesbyaccount' : 'z_listaddresses',
            ['']
          ).then((_json) => {
            if (_json === 'Work queue depth exceeded' ||
                !_json) {
              resolve({ error: 'daemon is busy' });
            } else {
              resolve(JSON.parse(_json).result);
            }
          });
        });
      }))
      .then(result => {
        if (result[0] &&
            result[0].length) {
          const calcBalance = (result, json) => {
            if (json &&
                json.length) {
              const allAddrArray = json.map(res => res.address).filter((x, i, a) => a.indexOf(x) == i);

              for (let a = 0; a < allAddrArray.length; a++) {
                const filteredArray = json.filter(res => res.address === allAddrArray[a]).map(res => res.amount);

                let isNewAddr = true;
                for (let x = 0; x < result.length && isNewAddr; x++) {
                  for (let y = 0; y < result[x].length && isNewAddr; y++) {
                    if (allAddrArray[a] === result[x][y]) {
                      isNewAddr = false;
                    }
                  }
                }

                if (isNewAddr &&
                    (allAddrArray[a].substring(0, 2) === 'zc' ||
                    allAddrArray[a].substring(0, 2) === 'zt')) {
                  result[1][result[1].length] = allAddrArray[a];
                } else {
                  result[0][result[0].length] = allAddrArray[a];
                }
              }
            }

            // remove addr duplicates
            if (result[0] &&
                result[0].length) {
              result[0] = result[0].filter((elem, pos) => {
                return result[0].indexOf(elem) === pos;
              });
            }
            if (result[1] &&
                result[1].length) {
              result[1] = result[1].filter((elem, pos) => {
                return result[1].indexOf(elem) === pos;
              });
            }

            let newAddressArray = [];
            for (let a = 0; a < result.length; a++) {
              newAddressArray[a] = [];

              if (result[a]) {
                for (let b = 0; b < result[a].length; b++) {
                  let filteredArray;

                  filteredArray = json.filter(res => res.address === result[a][b]).map(res => res.amount);

                  let sum = 0;
                  for (let i = 0; i < filteredArray.length; i++) {
                    sum += filteredArray[i];
                  }

                  newAddressArray[a][b] = {
                    address: result[a][b],
                    amount: sum,
                    type: a === 0 ? 'public': 'private',
                  };
                }
              }
            }

            // get zaddr balance
            if (result[1] &&
                result[1].length) {
              shepherd.Promise.all(result[1].map((_address, index) => {
                return new shepherd.Promise((resolve, reject) => {
                  _bitcoinRPC(coin, 'z_getbalance', [_address])
                  .then((__json) => {
                    __json = JSON.parse(__json);
                    if (__json &&
                        __json.error) {
                      resolve(0);
                    } else {
                      resolve(__json.result)
                      newAddressArray[1][index] = {
                        address: _address,
                        amount: __json.result,
                        type: 'private',
                      };
                    }
                  });
                });
              }))
              .then(zresult => {
                _returnObj.addresses = {
                  public: newAddressArray[0],
                  private: newAddressArray[1],
                };

                const returnObj = {
                  msg: 'success',
                  result: _returnObj,
                };

                res.end(JSON.stringify(returnObj));
              });
            } else {
              _returnObj.addresses = {
                public: newAddressArray[0],
                private: newAddressArray[1],
              };

              const returnObj = {
                msg: 'success',
                result: _returnObj,
              };

              res.end(JSON.stringify(returnObj));
            }
          }

          _bitcoinRPC(coin, 'listunspent')
          .then((__json) => {
            if (__json === 'Work queue depth exceeded' ||
                !__json) {
              const returnObj = {
                msg: 'success',
                result: _returnObj,
              };

              res.end(JSON.stringify(returnObj));
            } else {
              _returnObj.listunspent = JSON.parse(__json);

              calcBalance(
                result,
                JSON.parse(__json).result
              );
            }
          });
        } else {
          _returnObj.addresses = {
            public: {},
            private: {},
          };

          const returnObj = {
            msg: 'success',
            result: _returnObj,
          };

          res.end(JSON.stringify(returnObj));
        }
      })
    }

    const _bitcoinRPC = (coin, cmd, params) => {
      return new shepherd.Promise((resolve, reject) => {
        let _payload;

        if (params) {
          _payload = {
            mode: null,
            chain: coin,
            cmd: cmd,
            params: params,
          };
        } else {
          _payload = {
            mode: null,
            chain: coin,
            cmd: cmd,
          };
        }

        const options = {
          url: `http://127.0.0.1:${shepherd.appConfig.agamaPort}/shepherd/cli`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ payload: _payload }),
          timeout: 120000,
        };

        shepherd.request(options, (error, response, body) => {
          if (response &&
              response.statusCode &&
              response.statusCode === 200) {
            resolve(body);
          } else {
            resolve(body);
          }
        });
      });
    }

    shepherd.Promise.all(_promiseStack.map((_call, index) => {
      let _params;

      if (_call === 'listtransactions') {
        _params = [
          '*',
          300,
          0
        ];
      }
      return new shepherd.Promise((resolve, reject) => {
        _bitcoinRPC(
          _coin,
          _call,
          _params
        )
        .then((json) => {
          if (json === 'Work queue depth exceeded' ||
              !json) {
            _returnObj[_call] = { error: 'daemon is busy' };
          } else {
            _returnObj[_call] = JSON.parse(json);
          }
          resolve(json);
        });
      });
    }))
    .then(result => {
      getAddressesNative(_coin);
    });
  });

  return shepherd;
};