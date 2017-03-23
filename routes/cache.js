const fs = require('fs-extra'),
      request = require('request'),
      async = require('async');

var cache = {};

cache.setVar = function(variable, value) {
  cache[variable] = value;
}

cache.get = function(req, res, next) {
  var pubkey = req.query.pubkey;

  if (pubkey) {
    if (fs.existsSync(cache.iguanaDir + '/shepherd/cache-' + pubkey + '.json')) {
      fs.readFile(cache.iguanaDir + '/shepherd/cache-' + pubkey + '.json', 'utf8', function (err, data) {
        if (err) {
          var errorObj = {
            'msg': 'error',
            'result': err
          };

          res.end(JSON.stringify(errorObj));
        } else {
          var parsedJSON = 'JSON parse error';

          try {
            parsedJSON = JSON.parse(data);
          } catch (e) {
            console.log('JSON parse error');
          }

          var successObj = {
            'msg': 'success',
            'result': parsedJSON
          };

          res.end(JSON.stringify(successObj));
        }
      });
    } else {
      var errorObj = {
        'msg': 'error',
        'result': 'no file with handle ' + pubkey
      };

      res.end(JSON.stringify(errorObj));
    }
  } else {
    var errorObj = {
      'msg': 'error',
      'result': 'no pubkey provided'
    };

    res.end(JSON.stringify(errorObj));
  }
}

cache.groomGet = function(req, res, next) {
  var _filename = req.query.filename;

  if (_filename) {
    if (fs.existsSync(cache.iguanaDir + '/shepherd/cache-' + _filename + '.json')) {
      fs.readFile(cache.iguanaDir + '/shepherd/cache-' + _filename + '.json', 'utf8', function (err, data) {
        if (err) {
          var errorObj = {
            'msg': 'error',
            'result': err
          };

          res.end(JSON.stringify(errorObj));
        } else {
          var successObj = {
            'msg': 'success',
            'result': data ? JSON.parse(data) : ''
          };

          res.end(JSON.stringify(successObj));
        }
      });
    } else {
      var errorObj = {
        'msg': 'error',
        'result': 'no file with name ' + _filename
      };

      res.end(JSON.stringify(errorObj));
    }
  } else {
    var errorObj = {
      'msg': 'error',
      'result': 'no file name provided'
    };

    res.end(JSON.stringify(errorObj));
  }
}

cache.groomDelete = function(req, res, next) {
  var _filename = req.body.filename;

  if (_filename) {
    if (fs.existsSync(cache.iguanaDir + '/shepherd/cache-' + _filename + '.json')) {
      fs.unlink(cache.iguanaDir + '/shepherd/cache-' + _filename + '.json', function(err) {
        if (err) {
          var errorObj = {
            'msg': 'error',
            'result': err
          };

          res.end(JSON.stringify(errorObj));
        } else {
          var successObj = {
            'msg': 'success',
            'result': 'deleted'
          };

          res.end(JSON.stringify(successObj));
        }
      });
    } else {
      var errorObj = {
        'msg': 'error',
        'result': 'no file with name ' + _filename
      };

      res.end(JSON.stringify(errorObj));
    }
  } else {
    var errorObj = {
      'msg': 'error',
      'result': 'no file name provided'
    };

    res.end(JSON.stringify(errorObj));
  }
}

cache.groomPost = function(req, res) {
  var _filename = req.body.filename,
      _payload = req.body.payload;

  if (_filename) {
    if (!_payload) {
      var errorObj = {
        'msg': 'error',
        'result': 'no payload provided'
      };

      res.end(JSON.stringify(errorObj));
    } else {
      fs.writeFile(cache.iguanaDir + '/shepherd/cache-' + _filename + '.json', _payload, function (err) {
        if (err) {
          var errorObj = {
            'msg': 'error',
            'result': err
          };

          res.end(JSON.stringify(errorObj));
        } else {
          var successObj = {
            'msg': 'success',
            'result': 'done'
          };

          res.end(JSON.stringify(successObj));
        }
      });
    }
  } else {
    var errorObj = {
      'msg': 'error',
      'result': 'no file name provided'
    };

    res.end(JSON.stringify(errorObj));
  }
}

var cacheCallInProgress = false,
    cacheGlobLifetime = 300; // sec

// TODO: reset calls' states on new /cache call start
var mock = require('./mock');

/*
 *  type: GET
 *  params: userpass, pubkey, coin, address, skip
 */
cache.one = function(req, res, next) {
  if (req.query.pubkey && !fs.existsSync(cache.iguanaDir + '/shepherd/cache-' + req.query.pubkey + '.json')) {
    cacheCallInProgress = false;
  }

  if (!cacheCallInProgress) {
    // TODO: add check to allow only one cache call/sequence in progress
    cacheCallInProgress = true;

    var sessionKey = req.query.userpass,
        coin = req.query.coin,
        address = req.query.address,
        pubkey = req.query.pubkey,
        mock = req.query.mock,
        skipTimeout = req.query.skip,
        callsArray = req.query.calls.split(':'),
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

          fs.writeFile(cache.iguanaDir + '/shepherd/cache-' + pubkey + '.json', JSON.stringify(outObj), function(err) {
            if (err) {
              return console.log(err);
            }

            console.log('file ' + cache.iguanaDir + '/shepherd/cache-' + pubkey + '.json is updated');
            if (timeStamp) {
              console.log('file ' + cache.iguanaDir + '/shepherd/cache-' + pubkey + '.json is timestamped');
            }
          });
        },
        callStack = {},
        checkCallStack = function() {
          var total = 0;

          for (var coin in callStack) {
            total =+ callStack[coin];
          }

          if (total / Object.keys(callStack).length === 1) {
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
            // add timestamp to cache file
            // writeCache(Date.now());
          }
        },
        checkTimestamp = function(dateToCheck) {
          var currentEpochTime = new Date(Date.now()) / 1000,
              secondsElapsed = Number(currentEpochTime) - Number(dateToCheck / 1000);

          return Math.floor(secondsElapsed);
        },
        internalError = false;

    callStack[coin] = 1;
    console.log(callsArray);

    if (!sessionKey) {
      var errorObj = {
        'msg': 'error',
        'result': 'no session key provided'
      };

      res.end(JSON.stringify(errorObj));
      internalError = true;
    }

    if (!pubkey) {
      var errorObj = {
        'msg': 'error',
        'result': 'no pubkey provided'
      };

      res.end(JSON.stringify(errorObj));
      internalError = true;
    }

    console.log('cache-one call started');

    if (fs.existsSync(cache.iguanaDir + '/shepherd/cache-' + pubkey + '.json') && coin !== 'all') {
      var _file = fs.readFileSync(cache.iguanaDir + '/shepherd/cache-' + pubkey + '.json', 'utf8');
      outObj = _file ? JSON.parse(_file) : {};

      if (!outObj || !outObj.basilisk) {
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

      function execDEXRequests(address, coin) {
        var dexUrls = {
          'listunspent': 'http://' + cache.appConfig.host + ':' + cache.appConfig.iguanaCorePort + '/api/dex/listunspent?userpass=' + sessionKey + '&symbol=' + coin + '&address=' + address,
          'listtransactions': 'http://' + cache.appConfig.host + ':' + cache.appConfig.iguanaCorePort + '/api/dex/listtransactions?userpass=' + sessionKey + '&count=100&skip=0&symbol=' + coin + '&address=' + address,
          'getbalance': 'http://' + cache.appConfig.host + ':' + cache.appConfig.iguanaCorePort + '/api/dex/getbalance?userpass=' + sessionKey + '&symbol=' + coin + '&address=' + address,
          'refresh': 'http://' + cache.appConfig.host + ':' + cache.appConfig.iguanaCorePort + '/api/basilisk/refresh?userpass=' + sessionKey + '&timeout=600000&symbol=' + coin + '&address=' + address
        },
        _dexUrls = {};

        for (var a = 0; a < callsArray.length; a++) {
          _dexUrls[callsArray[a]] = dexUrls[callsArray[a]];
        }
        if (coin === 'BTC' || coin === 'SYS') {
          delete _dexUrls.refresh;
          delete _dexUrls.getbalance;
        }
        //console.log(JSON.stringify(dexUrls));
        console.log(coin + ' address ' + address);
        if (!outObj.basilisk[coin][address]) {
          outObj.basilisk[coin][address] = {};
          writeCache();
        }
        console.log(_dexUrls);

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
              url: mock ? 'http://localhost:17777/shepherd/mock?url=' + dexUrl : dexUrl,
              method: 'GET'
            }, function (error, response, body) {
              if (response && response.statusCode && response.statusCode === 200) {
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
                outObj.basilisk[coin][address][key] = {};
                outObj.basilisk[coin][address][key].data = JSON.parse(body);
                outObj.basilisk[coin][address][key].timestamp = Date.now(); // add timestamp
                outObj.basilisk[coin][address][key].status = 'done';
                console.log(dexUrl);
                console.log(body);
                callStack[coin]--;
                console.log(coin + ' _stack len ' + callStack[coin]);
                checkCallStack();

                writeCache();
              }
              if (error) {
                outObj.basilisk[coin][address][key] = {};
                outObj.basilisk[coin][address][key].data = { 'error': 'request failed' };
                outObj.basilisk[coin][address][key].timestamp = 1471620867 // add timestamp
                outObj.basilisk[coin][address][key].status = 'done';
                callStack[coin]--;
                console.log(coin + ' _stack len ' + callStack[coin]);
                checkCallStack();
                writeCache();
              }
            });
          } else {
            console.log(key + ' is fresh, check back in ' + (cacheGlobLifetime - checkTimestamp(outObj.basilisk[coin][address][key].timestamp)) + 's');
            callStack[coin]--;
            console.log(coin + ' _stack len ' + callStack[coin]);
            checkCallStack();
          }
        });
      }

      function getAddresses(coin) {
        var tempUrl = 'http://' + cache.appConfig.host + ':' + cache.appConfig.iguanaCorePort + '/api/bitcoinrpc/getaddressesbyaccount?userpass=' + sessionKey + '&coin=' + coin + '&account=*';
        request({
          url: mock ? 'http://localhost:17777/shepherd/mock?url=' + tempUrl : tempUrl,
          method: 'GET'
        }, function (error, response, body) {
          if (response && response.statusCode && response.statusCode === 200) {
            cache.io.emit('messages', {
              'message': {
                'shepherd': {
                  'method': 'cache-one',
                  'status': 'in progress',
                  'iguanaAPI': {
                    'method': 'getaddressesbyaccount',
                    'coin': coin,
                    'status': 'done',
                    'resp': body
                  }
                }
              }
            });
            outObj.basilisk[coin].addresses = JSON.parse(body).result;
            console.log(JSON.parse(body).result);
            writeCache();
            var addrCount = outObj.basilisk[coin].addresses ? outObj.basilisk[coin].addresses.length : 0;
            var callsArrayBTC = callsArray.length;
            if (callsArray.indexOf('getbalance') > - 1) {
              callsArrayBTC--;
            }
            if (callsArray.indexOf('refresh') > - 1) {
              callsArrayBTC--;
            }
            callStack[coin] = callStack[coin] + addrCount * (coin === 'BTC' || coin === 'SYS' ? callsArrayBTC : callsArray.length);
            console.log(coin + ' stack len ' + callStack[coin]);

            async.each(outObj.basilisk[coin].addresses, function(address) {
              execDEXRequests(address, coin);
            });
          } else {
            // TODO: error
          }
        });
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
          var tempUrl = 'http://' + cache.appConfig.host + ':' + cache.appConfig.iguanaCorePort + '/api/InstantDEX/allcoins?userpass=' + sessionKey;
          request({
            url: mock ? 'http://localhost:17777/shepherd/mock?url=' + tempUrl : tempUrl,
            method: 'GET'
          }, function (error, response, body) {
            if (response && response.statusCode && response.statusCode === 200) {
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
              if (body.basilisk && body.basilisk.length) {
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
        callStack[coin] = callStack[coin] + (coin === 'BTC' ? callsArray.length : callsArray.length - 2);
        console.log(coin + ' stack len ' + callStack[coin]);

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