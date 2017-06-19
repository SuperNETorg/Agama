const fs = require('fs-extra'),
      request = require('request'),
      async = require('async');

var cache = {};
var inMemCache;
var inMemPubkey;

cache.setVar = function(variable, value) {
  cache[variable] = value;
}

/*
 * cache data is dumped to disk before app quit or after cache.one call is finished
 */
cache.dumpCacheBeforeExit = function() {
  if (inMemCache) {
    console.log('dumping cache before exit');
    fs.writeFileSync(`${cache.iguanaDir}/shepherd/cache-${inMemPubkey}.json`, JSON.stringify(inMemCache), 'utf8');
  }
}

cache.get = function(req, res, next) {
  const pubkey = req.query.pubkey;

  if (pubkey) {
    inMemPubkey = pubkey;

    if (!inMemCache) {
      console.log('serving cache from disk');

      if (fs.existsSync(`${cache.iguanaDir}/shepherd/cache-${pubkey}.json`)) {
        fs.readFile(`${cache.iguanaDir}/shepherd/cache-${pubkey}.json`, 'utf8', function (err, data) {
          if (err) {
            const errorObj = {
              'msg': 'error',
              'result': err
            };

            res.end(JSON.stringify(errorObj));
          } else {
            try {
              const parsedJSON = JSON.parse(data),
                    successObj = {
                      'msg': 'success',
                      'result': parsedJSON
                    };

              inMemCache = parsedJSON;
              res.end(JSON.stringify(successObj));
            } catch (e) {
              console.log('JSON parse error while reading cache data from disk:');
              console.log(e);
              if (e.toString().indexOf('at position') > -1) {
                const errorPos = e.toString().split(' ');

                console.log(`JSON error ---> ${data.substring(errorPos[errorPos.length - 1] - 20, errorPos[errorPos.length - 1] + 20)} | error sequence: ${data.substring(errorPos[errorPos.length - 1], errorPos[errorPos.length - 1] + 1)}`);
                console.log('attempting to recover JSON data');

                fs.writeFile(`${cache.iguanaDir}/shepherd/cache-${pubkey}.json`, data.substring(0, errorPos[errorPos.length - 1]), function(err) {
                  const successObj = {
                    'msg': 'success',
                    'result': data.substring(0, errorPos[errorPos.length - 1])
                  };

                  inMemCache = JSON.parse(data.substring(0, errorPos[errorPos.length - 1]));
                  res.end(JSON.stringify(successObj));
                });
              }
            }
          }
        });
      } else {
        const errorObj = {
          'msg': 'error',
          'result': `no file with handle ${pubkey}`
        };

        res.end(JSON.stringify(errorObj));
      }
    } else {
      const successObj = {
        'msg': 'success',
        'result': inMemCache
      };

      res.end(JSON.stringify(successObj));
    }
  } else {
    const errorObj = {
      'msg': 'error',
      'result': 'no pubkey provided'
    };

    res.end(JSON.stringify(errorObj));
  }
}

cache.groomGet = function(req, res, next) {
  const _filename = req.query.filename;

  if (_filename) {
    if (fs.existsSync(`${cache.iguanaDir}/shepherd/cache-${_filename}.json`)) {
      fs.readFile(`${cache.iguanaDir}/shepherd/cache-${_filename}.json`, 'utf8', function (err, data) {
        if (err) {
          const errorObj = {
            'msg': 'error',
            'result': err
          };

          res.end(JSON.stringify(errorObj));
        } else {
          const successObj = {
            'msg': 'success',
            'result': data ? JSON.parse(data) : ''
          };

          res.end(JSON.stringify(successObj));
        }
      });
    } else {
      const errorObj = {
        'msg': 'error',
        'result': `no file with name ${_filename}`
      };

      res.end(JSON.stringify(errorObj));
    }
  } else {
    const errorObj = {
      'msg': 'error',
      'result': 'no file name provided'
    };

    res.end(JSON.stringify(errorObj));
  }
}

cache.groomDelete = function(req, res, next) {
  const _filename = req.body.filename;

  if (_filename) {
    if (fs.existsSync(`${cache.iguanaDir}/shepherd/cache-${_filename}.json`)) {
      inMemCache = null;

      fs.unlink(`${cache.iguanaDir}/shepherd/cache-${_filename}.json`, function(err) {
        if (err) {
          const errorObj = {
            'msg': 'error',
            'result': err
          };

          res.end(JSON.stringify(errorObj));
        } else {
          const successObj = {
            'msg': 'success',
            'result': 'deleted'
          };

          res.end(JSON.stringify(successObj));
        }
      });
    } else {
      const errorObj = {
        'msg': 'error',
        'result': `no file with name ${_filename}`
      };

      res.end(JSON.stringify(errorObj));
    }
  } else {
    const errorObj = {
      'msg': 'error',
      'result': 'no file name provided'
    };

    res.end(JSON.stringify(errorObj));
  }
}

cache.groomPost = function(req, res) {
  const _filename = req.body.filename,
        _payload = req.body.payload;

  if (!cacheCallInProgress) {
    cacheCallInProgress = true;

    if (_filename) {
      if (!_payload) {
        const errorObj = {
          'msg': 'error',
          'result': 'no payload provided'
        };

        res.end(JSON.stringify(errorObj));
      } else {
        inMemCache = JSON.parse(_payload);
        console.log('appending groom post to in mem cache');
        console.log('appending groom post to on disk cache');

        fs.writeFile(`${cache.iguanaDir}/shepherd/cache-${_filename}.json`, _payload, function (err) {
          if (err) {
            const errorObj = {
              'msg': 'error',
              'result': err
            };

            cacheCallInProgress = false;
            res.end(JSON.stringify(errorObj));
          } else {
            const successObj = {
              'msg': 'success',
              'result': 'done'
            };

            cacheCallInProgress = false;
            res.end(JSON.stringify(successObj));
          }
        });
      }
    } else {
      const errorObj = {
        'msg': 'error',
        'result': 'no file name provided'
      };

      res.end(JSON.stringify(errorObj));
    }
  } else {
    const errorObj = {
      'msg': 'error',
      'result': 'another job is in progress'
    };

    res.end(JSON.stringify(errorObj));
  }
}

var cacheCallInProgress = false,
    cacheGlobLifetime = 600; // sec

// TODO: reset calls' states on new /cache call start
var mock = require('./mock');

var callStack = {},
checkCallStack = function() {
  var total = 0;

  for (var coin in callStack) {
    total =+ callStack[coin];
  }

  if (total / Object.keys(callStack).length === 1) {
    cache.dumpCacheBeforeExit();
    cacheCallInProgress = false;
    cache.io.emit('messages', {
      'message': {
        'shepherd': {
          'method': 'cache-one',
          'status': 'done',
          'resp': 'success'
        }
      }
    });
  }
};

/*
 *  type: GET
 *  params: userpass, pubkey, coin, address, skip
 */
cache.one = function(req, res, next) {
  if (req.query.pubkey &&
      !fs.existsSync(`${cache.iguanaDir}/shepherd/cache-${req.query.pubkey}.json`)) {
    cacheCallInProgress = false;
  }

  if (cacheCallInProgress) {
    checkCallStack();
  }

  if (!cacheCallInProgress) {
    cache.dumpCacheBeforeExit();

    if (fs.existsSync(`${cache.iguanaDir}/shepherd/cache-${req.query.pubkey}.json`)) {
      let _data = fs.readFileSync(`${cache.iguanaDir}/shepherd/cache-${req.query.pubkey}.json`, 'utf8');
      if (_data) {
          inMemCache = JSON.parse(_data);
          _data = _data.replace('waiting', 'failed');
          cache.dumpCacheBeforeExit();
      }
    }

    // TODO: add check to allow only one cache call/sequence in progress
    cacheCallInProgress = true;

    var sessionKey = req.query.userpass,
        coin = req.query.coin,
        address = req.query.address,
        addresses = req.query.addresses && req.query.addresses.indexOf(':') > -1 ? req.query.addresses.split(':') : null,
        pubkey = req.query.pubkey,
        mock = req.query.mock,
        skipTimeout = req.query.skip,
        callsArray = req.query.calls.split(':'),
        iguanaCorePort = req.query.port ? req.query.port : cache.appConfig.iguanaCorePort,
        errorObj = {
          'msg': 'error',
          'result': 'error'
        },
        outObj = {},
        pubkey,
        writeCache = function(timeStamp) {
          if (timeStamp) {
            outObj.timestamp = timeStamp;
          }

          inMemCache = outObj;
        },
        checkTimestamp = function(dateToCheck) {
          var currentEpochTime = new Date(Date.now()) / 1000,
              secondsElapsed = Number(currentEpochTime) - Number(dateToCheck / 1000);

          return Math.floor(secondsElapsed);
        },
        internalError = false;

    inMemPubkey = pubkey;
    callStack[coin] = 1;
    console.log(callsArray);
    console.log(`iguana core port ${iguanaCorePort}`);

    if (!sessionKey) {
      const errorObj = {
        'msg': 'error',
        'result': 'no session key provided'
      };

      res.end(JSON.stringify(errorObj));
      internalError = true;
    }

    if (!pubkey) {
      const errorObj = {
        'msg': 'error',
        'result': 'no pubkey provided'
      };

      res.end(JSON.stringify(errorObj));
      internalError = true;
    }

    console.log('cache-one call started');

    function fixJSON(data) {
      if (data && data.length) {
        try {
          const parsedJSON = JSON.parse(data);

          return parsedJSON;
        } catch (e) {
          console.log(e);
          if (e.toString().indexOf('at position') > -1) {
            const errorPos = e.toString().split(' ');

            console.log(`JSON error ---> ${data.substring(errorPos[errorPos.length - 1] - 20, errorPos[errorPos.length - 1] + 20)} | error sequence: ${data.substring(errorPos[errorPos.length - 1], errorPos[errorPos.length - 1] + 1)}`);
            console.log('attempting to recover JSON data');
            return JSON.parse(data.substring(0, errorPos[errorPos.length - 1]));
          }
          if (e.toString().indexOf('Unexpected end of JSON input')) {
            return {};
          }
        }
      } else {
        return {};
      }
    }

    if (fs.existsSync(`${cache.iguanaDir}/shepherd/cache-${pubkey}.json`) && coin !== 'all') {
      if (inMemCache) {
        console.log('cache one from mem');
        outObj = inMemCache;
      } else {
        const _file = fs.readFileSync(`${cache.iguanaDir}/shepherd/cache-${pubkey}.json`, 'utf8');
        console.log('cache one from disk');
        outObj = fixJSON(_file);
      }

      if (!outObj ||
          !outObj.basilisk) {
        console.log('no local basilisk info');
        outObj['basilisk'] = {};
        outObj['basilisk'][coin] = {};
      } else {
        if (!outObj['basilisk'][coin]) {
          console.log('no local coin info');
          outObj['basilisk'][coin] = {};
        }
      }
    } else {
      outObj['basilisk'] = {};
      outObj['basilisk'][coin] = {};
    }

    res.end(JSON.stringify({
      'msg': 'success',
      'result': 'call is initiated'
    }));

    if (!internalError) {
      cache.io.emit('messages', {
        'message': {
          'shepherd': {
            'method': 'cache-one',
            'status': 'in progress'
          }
        }
      });

      function execDEXRequests(coin, address) {
        let dexUrls = {
          'listunspent': `http://${cache.appConfig.host}:${iguanaCorePort}/api/dex/listunspent?userpass=${sessionKey}&symbol=${coin}&address=${address}`,
          'listtransactions': `http://${cache.appConfig.host}:${iguanaCorePort}/api/dex/listtransactions?userpass=${sessionKey}&count=100&skip=0&symbol=${coin}&address=${address}`,
          'getbalance': `http://${cache.appConfig.host}:${iguanaCorePort}/api/dex/getbalance?userpass=${sessionKey}&symbol=${coin}&address=${address}`,
          'refresh': `http://${cache.appConfig.host}:${iguanaCorePort}/api/basilisk/refresh?userpass=${sessionKey}&symbol=${coin}&address=${address}`
        },
        _dexUrls = {};

        for (let a = 0; a < callsArray.length; a++) {
          _dexUrls[callsArray[a]] = dexUrls[callsArray[a]];
        }

        if (coin === 'BTC' ||
            coin === 'SYS') {
          delete _dexUrls.refresh;
          delete _dexUrls.getbalance;
        }

        console.log(`${coin} address ${address}`);

        if (!outObj.basilisk[coin][address]) {
          outObj.basilisk[coin][address] = {};
          writeCache();
        }

        // set current call status
        async.forEachOf(_dexUrls, function(dexUrl, key) {
          if (!outObj.basilisk[coin][address][key]) {
            outObj.basilisk[coin][address][key] = {};
            outObj.basilisk[coin][address][key].status = 'waiting';
          } else {
            outObj.basilisk[coin][address][key].status = 'waiting';
          }
        });
        writeCache();

        async.forEachOf(_dexUrls, function(dexUrl, key) {
          var tooEarly = false;
          if (outObj.basilisk[coin][address][key] &&
              outObj.basilisk[coin][address][key].timestamp &&
              checkTimestamp(outObj.basilisk[coin][address][key].timestamp) < cacheGlobLifetime) {
            tooEarly = true;
            outObj.basilisk[coin][address][key].status = 'done';
            cache.io.emit('messages', {
              'message': {
                'shepherd': {
                  'method': 'cache-one',
                  'status': 'in progress',
                  'iguanaAPI': {
                    'method': key,
                    'coin': coin,
                    'address': address,
                    'status': 'done',
                    'resp': 'too early'
                  }
                }
              }
            });
          }
          if (!tooEarly) {
            cache.io.emit('messages', {
              'message': {
                'shepherd': {
                  'method': 'cache-one',
                  'status': 'in progress',
                  'iguanaAPI': {
                    'method': key,
                    'coin': coin,
                    'address': address,
                    'status': 'in progress'
                  }
                }
              }
            });
            outObj.basilisk[coin][address][key].status = 'in progress';
            request({
              url: mock ? `http://localhost:17777/shepherd/mock?url=${dexUrl}` : dexUrl,
              method: 'GET'
            }, function (error, response, body) {
              if (response &&
                  response.statusCode &&
                  response.statusCode === 200) {
                cache.io.emit('messages', {
                  'message': {
                    'shepherd': {
                      'method': 'cache-one',
                      'status': 'in progress',
                      'iguanaAPI': {
                        'method': key,
                        'coin': coin,
                        'address': address,
                        'status': 'done',
                        'resp': body
                      }
                    }
                  }
                });

                // basilisk balance fallback
                const _parsedJSON = JSON.parse(body);
                if (key === 'getbalance' &&
                  coin === 'KMD'/* &&
                  ((_parsedJSON && _parsedJSON.balance === 0) || body === [])*/) {
                  console.log('fallback to kmd explorer ======>');
                  request({
                    url: `http://kmd.explorer.supernet.org/api/addr/${address}/?noTxList=1`,
                    method: 'GET'
                  }, function (error, response, body) {
                    if (response &&
                        response.statusCode &&
                        response.statusCode === 200) {
                      console.log(JSON.stringify(body));
                      /*cache.io.emit('messages', {
                        'message': {
                          'shepherd': {
                            'method': 'cache-one',
                            'status': 'in progress',
                            'iguanaAPI': {
                              'method': key,
                              'coin': coin,
                              'address': address,
                              'status': 'done',
                              'resp': body
                            }
                          }
                        }
                      });*/
                    } else {

                    }
                  });
                }

                outObj.basilisk[coin][address][key] = {};
                outObj.basilisk[coin][address][key].data = JSON.parse(body);
                outObj.basilisk[coin][address][key].timestamp = Date.now(); // add timestamp
                outObj.basilisk[coin][address][key].status = 'done';
                console.log(dexUrl);
                console.log(body);
                callStack[coin]--;
                console.log(`${coin} _stack len ${callStack[coin]}`);
                cache.io.emit('messages', {
                  'message': {
                    'shepherd': {
                      'method': 'cache-one',
                      'status': 'in progress',
                      'iguanaAPI': {
                        'currentStackLength': callStack[coin]
                      }
                    }
                  }
                });
                checkCallStack();

                writeCache();
              }
              if (error ||
                  !body ||
                  !response) {
                outObj.basilisk[coin][address][key] = {};
                outObj.basilisk[coin][address][key].data = { 'error': 'request failed' };
                outObj.basilisk[coin][address][key].timestamp = 1471620867 // add timestamp
                outObj.basilisk[coin][address][key].status = 'done';
                callStack[coin]--;
                console.log(`${coin} _stack len ${callStack[coin]}`);
                cache.io.emit('messages', {
                  'message': {
                    'shepherd': {
                      'method': 'cache-one',
                      'status': 'in progress',
                      'iguanaAPI': {
                        'currentStackLength': callStack[coin]
                      }
                    }
                  }
                });
                checkCallStack();
                writeCache();
              }
            });
          } else {
            console.log(`${key} is fresh, check back in ${(cacheGlobLifetime - checkTimestamp(outObj.basilisk[coin][address][key].timestamp))}s`);
            callStack[coin]--;
            console.log(`${coin} _stack len ${callStack[coin]}`);
            cache.io.emit('messages', {
              'message': {
                'shepherd': {
                  'method': 'cache-one',
                  'status': 'in progress',
                  'iguanaAPI': {
                    'currentStackLength': callStack[coin]
                  }
                }
              }
            });
            checkCallStack();
          }
        });
      }

      function parseAddresses(coin, addrArray) {
        cache.io.emit('messages', {
          'message': {
            'shepherd': {
              'method': 'cache-one',
              'status': 'in progress',
              'iguanaAPI': {
                'method': 'getaddressesbyaccount',
                'coin': coin,
                'status': 'done',
                'resp': addrArray
              }
            }
          }
        });
        outObj.basilisk[coin].addresses = addrArray;
        console.log(addrArray);
        writeCache();

        const addrCount = outObj.basilisk[coin].addresses ? outObj.basilisk[coin].addresses.length : 0;
        let callsArrayBTC = callsArray.length;

        if (callsArray.indexOf('getbalance') > - 1) {
          callsArrayBTC--;
        }
        if (callsArray.indexOf('refresh') > - 1) {
          callsArrayBTC--;
        }
        callStack[coin] = callStack[coin] + addrCount * (coin === 'BTC' || coin === 'SYS' ? callsArrayBTC : callsArray.length);
        console.log(`${coin} stack len ${callStack[coin]}`);

        cache.io.emit('messages', {
          'message': {
            'shepherd': {
              'method': 'cache-one',
              'status': 'in progress',
              'iguanaAPI': {
                'totalStackLength': callStack[coin]
              }
            }
          }
        });
        async.each(outObj.basilisk[coin].addresses, function(address) {
          execDEXRequests(coin, address);
        });
      }

      function getAddresses(coin) {
        if (addresses) {
          parseAddresses(coin, addresses);
        } else {
          const tempUrl = `http://${cache.appConfig.host}:${cache.appConfig.iguanaCorePort}/api/bitcoinrpc/getaddressesbyaccount?userpass=${sessionKey}&coin=${coin}&account=*`;
          request({
            url: mock ? `http://localhost:17777/shepherd/mock?url=${tempUrl}` : tempUrl,
            method: 'GET'
          }, function (error, response, body) {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              parseAddresses(coin, JSON.parse(body).result);
            } else {
              // TODO: error
            }
          });
        }
      }

      // update all available coin addresses
      if (!address) {
        cache.io.emit('messages', {
          'message': {
            'shepherd': {
              'method': 'cache-one',
              'status': 'in progress',
              'iguanaAPI': {
                'method': 'getaddressesbyaccount',
                'coin': coin,
                'status': 'in progress'
              }
            }
          }
        });

        if (coin === 'all') {
          const tempUrl = `http://${cache.appConfig.host}:${cache.appConfig.iguanaCorePort}/api/InstantDEX/allcoins?userpass=${sessionKey}`;
          request({
            url: mock ? `http://localhost:17777/shepherd/mock?url=${tempUrl}` : tempUrl,
            method: 'GET'
          }, function (error, response, body) {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              console.log(JSON.parse(body).basilisk);
              cache.io.emit('messages', {
                'message': {
                  'shepherd': {
                    'method': 'cache-one',
                    'status': 'in progress',
                    'iguanaAPI': {
                      'method': 'allcoins',
                      'status': 'done',
                      'resp': body
                    }
                  }
                }
              });
              body = JSON.parse(body);
              // basilisk coins
              if (body.basilisk &&
                  body.basilisk.length) {
                // get coin addresses
                async.each(body.basilisk, function(coin) {
                  callStack[coin] = 1;
                });

                async.each(body.basilisk, function(coin) {
                  outObj.basilisk[coin] = {};
                  writeCache();

                  cache.io.emit('messages', {
                    'message': {
                      'shepherd': {
                        'method': 'cache-one',
                        'status': 'in progress',
                        'iguanaAPI': {
                          'method': 'getaddressesbyaccount',
                          'coin': coin,
                          'status': 'in progress'
                        }
                      }
                    }
                  });

                  getAddresses(coin);
                });
              }
            }
            if (error) { // stop further requests on failure, exit
              callStack[coin] = 1;
              checkCallStack();
            }
          });
        } else {
          getAddresses(coin);
        }
      } else {
        let callsArrayBTC = callsArray.length; // restrict BTC and SYS only to listunspent and listtransactions calls

        if (callsArray.indexOf('getbalance') > - 1) {
          callsArrayBTC--;
        }
        if (callsArray.indexOf('refresh') > - 1) {
          callsArrayBTC--;
        }

        callStack[coin] = callStack[coin] + (coin === 'BTC' || coin === 'SYS' ? callsArrayBTC : callsArray.length);
        console.log(`${coin} stack len ${callStack[coin]}`);

        cache.io.emit('messages', {
          'message': {
            'shepherd': {
              'method': 'cache-one',
              'status': 'in progress',
              'iguanaAPI': {
                'totalStackLength': callStack[coin],
                'currentStackLength': callStack[coin]
              }
            }
          }
        });

        execDEXRequests(coin, address);
      }
    } else {
      cache.io.emit('messages', {
        'message': {
          'shepherd': {
            'method': 'cache-all',
            'status': 'done',
            'resp': 'internal error'
          }
        }
      });
      cacheCallInProgress = false;
    }
  } else {
    res.end(JSON.stringify({
      'msg': 'error',
      'result': 'another call is in progress already'
    }));
  }
};

module.exports = cache;