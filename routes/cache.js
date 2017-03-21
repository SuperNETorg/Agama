const fs = require('fs-extra');

var cache = {};

cache.setVars = function(variable, value) {
  cache[variable] = value;
}

/*
 *  type: GET
 *  params: pubkey
 */
cache.get = function(req, res, next) {
  var pubkey = req.query.pubkey;

  if (pubkey) {
    if (fs.existsSync(iguanaDir + '/shepherd/cache-' + pubkey + '.json')) {
      fs.readFile(iguanaDir + '/shepherd/cache-' + pubkey + '.json', 'utf8', function (err, data) {
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

/*
 *  type: GET
 *  params: filename
 */
/*cache.get('/groom', function(req, res, next) {
  var _filename = req.query.filename;

  if (_filename) {
    if (fs.existsSync(iguanaDir + '/shepherd/cache-' + _filename + '.json')) {
      fs.readFile(iguanaDir + '/shepherd/cache-' + _filename + '.json', 'utf8', function (err, data) {
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
});

/*
 *  type: DELETE
 *  params: filename
 */
/*shepherd.delete('/groom', function(req, res, next) {
  var _filename = req.body.filename;

  if (_filename) {
    if (fs.existsSync(iguanaDir + '/shepherd/cache-' + _filename + '.json')) {
      fs.unlink(iguanaDir + '/shepherd/cache-' + _filename + '.json', function(err) {
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
});

/*
 *  type: POST
 *  params: filename, payload
 */
/*shepherd.post('/groom', function(req, res) {
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
      fs.writeFile(iguanaDir + '/shepherd/cache-' + _filename + '.json', _payload, function (err) {
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
});

var cacheCallInProgress = false,
    cacheGlobLifetime = 300; // sec

// TODO: reset calls' states on new /cache call start
/*
 *  type: GET
 *  params: userpass, pubkey, skip
 */
/*shepherd.get('/cache-all', function(req, res, next) {
  if (req.query.pubkey && !fs.existsSync(iguanaDir + '/shepherd/cache-' + req.query.pubkey + '.json')) {
    cacheCallInProgress = false;
  }

  if (!cacheCallInProgress) {
    cacheCallInProgress = true;

    var sessionKey = req.query.userpass,
        pubkey = req.query.pubkey,
        skipTimeout = req.query.skip,
        _obj = {
          'msg': 'error',
          'result': 'error'
        },
        outObj = {
          basilisk: {}
        },
        writeCache = function() {
          fs.writeFile(iguanaDir + '/shepherd/cache-' + pubkey + '.json', JSON.stringify(outObj), function(err) {
            if (err) {
              return console.log(err);
            }

            console.log('file ' + iguanaDir + '/shepherd/cache-' + pubkey + '.json is updated');
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
            shepherd.io.emit('messages', {
              'message': {
                'shepherd': {
                  'method': 'cache-all',
                  'status': 'done',
                  'resp': 'success'
                }
              }
            });
          }
        },
        checkTimestamp = function(dateToCheck) {
          var currentEpochTime = new Date(Date.now()) / 1000,
              secondsElapsed = Number(currentEpochTime) - Number(dateToCheck / 1000);

          return Math.floor(secondsElapsed);
        },
        internalError = false;

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

    if (!internalError) {
      console.log('cache-all call started');
      shepherd.io.emit('messages', {
        'message': {
          'shepherd': {
            'method': 'cache-all',
            'status': 'in progress'
          }
        }
      });
      res.end(JSON.stringify({
        'msg': 'success',
        'result': 'call is initiated'
      }));

      shepherd.io.emit('messages', {
        'message': {
          'shepherd': {
            'method': 'cache-all',
            'status': 'in progress',
            'iguanaAPI': {
              'method': 'allcoins',
              'status': 'in progress'
            }
          }
        }
      });
      request({
        url: 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/InstantDEX/allcoins?userpass=' + sessionKey,
        method: 'GET'
      }, function (error, response, body) {
        if (response && response.statusCode && response.statusCode === 200) {
          shepherd.io.emit('messages', {
            'message': {
              'shepherd': {
                'method': 'cache-all',
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

              shepherd.io.emit('messages', {
                'message': {
                  'shepherd': {
                    'method': 'cache-all',
                    'status': 'in progress',
                    'iguanaAPI': {
                      'method': 'getaddressesbyaccount',
                      'coin': coin,
                      'status': 'in progress'
                    }
                  }
                }
              });
              request({
                url: 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/bitcoinrpc/getaddressesbyaccount?userpass=' + sessionKey + '&coin=' + coin + '&account=*',
                method: 'GET'
              }, function (error, response, body) {
                if (response && response.statusCode && response.statusCode === 200) {
                  shepherd.io.emit('messages', {
                    'message': {
                      'shepherd': {
                        'method': 'cache-all',
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
                  writeCache();
                  var addrCount = outObj.basilisk[coin].addresses ? outObj.basilisk[coin].addresses.length : 0;
                  callStack[coin] = callStack[coin] + addrCount * (coin === 'BTC' || coin === 'SYS' ? 2 : 4);
                  console.log(coin + ' stack len ' + callStack[coin]);

                  async.each(outObj.basilisk[coin].addresses, function(address) {
                    var dexUrls = {
                      'listunspent': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/listunspent?userpass=' + sessionKey + '&symbol=' + coin + '&address=' + address,
                      'listtransactions': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/listtransactions?userpass=' + sessionKey + '&count=100&skip=0&symbol=' + coin + '&address=' + address,
                      'getbalance': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/getbalance?userpass=' + sessionKey + '&symbol=' + coin + '&address=' + address,
                      'refresh': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/basilisk/refresh?userpass=' + sessionKey + '&timeout=600000&symbol=' + coin + '&address=' + address
                    };
                    if (coin === 'BTC' || coin === 'SYS') {
                      delete dexUrls.refresh;
                      delete dexUrls.getbalance;
                    }
                    //console.log(JSON.stringify(dexUrls));
                    console.log(coin + ' address ' + address);
                    outObj.basilisk[coin][address] = {};
                    writeCache();

                    // set current call status
                    async.forEachOf(dexUrls, function(dexUrl, key) {
                      if (!outObj.basilisk[coin][address][key]) {
                        outObj.basilisk[coin][address][key] = {};
                        outObj.basilisk[coin][address][key].status = 'waiting';
                      } else {
                        outObj.basilisk[coin][address][key].status = 'waiting';
                      }
                    });
                    writeCache();

                    async.forEachOf(dexUrls, function(dexUrl, key) {
                      var tooEarly = false;
                      if (outObj.basilisk[coin][address][key] &&
                          outObj.basilisk[coin][address][key].timestamp &&
                          checkTimestamp(outObj.basilisk[coin][address][key].timestamp) < cacheGlobLifetime) {
                        tooEarly = true;
                        outObj.basilisk[coin][address][key].status = 'done';
                        shepherd.io.emit('messages', {
                          'message': {
                            'shepherd': {
                              'method': 'cache-all',
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
                      tooEarly = skipTimeout ? false : tooEarly;
                      if (!tooEarly) {
                        shepherd.io.emit('messages', {
                          'message': {
                            'shepherd': {
                              'method': 'cache-all',
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
                          url: dexUrl,
                          method: 'GET'
                        }, function (error, response, body) {
                          if (response && response.statusCode && response.statusCode === 200) {
                            shepherd.io.emit('messages', {
                              'message': {
                                'shepherd': {
                                  'method': 'cache-all',
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
                        });
                      } else {
                        console.log(key + ' is fresh, check back in ' + (cacheGlobLifetime - checkTimestamp(outObj.basilisk[coin][address][key].timestamp)) + 's');
                        callStack[coin]--;
                        console.log(coin + ' _stack len ' + callStack[coin]);
                        checkCallStack();
                      }
                    });
                  });
                } else {
                  // TODO: error
                }
              });
            });
          } else {
            // TODO: error
          }
        } else {
          // TODO: error
        }
      });
    } else {
      shepherd.io.emit('messages', {
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
});

/*
 *  type: GET
 *  params: userpass, pubkey, coin, address, skip
 */
/*shepherd.get('/cache-one', function(req, res, next) {
  if (req.query.pubkey && !fs.existsSync(iguanaDir + '/shepherd/cache-' + req.query.pubkey + '.json')) {
    cacheCallInProgress = false;
  }

  if (!cacheCallInProgress) {
    // TODO: add check to allow only one cache call/sequence in progress
    cacheCallInProgress = true;
    var sessionKey = req.query.userpass,
        coin = req.query.coin,
        address = req.query.address,
        pubkey = req.query.pubkey,
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

          fs.writeFile(iguanaDir + '/shepherd/cache-' + pubkey + '.json', JSON.stringify(outObj), function(err) {
            if (err) {
              return console.log(err);
            }

            console.log('file ' + iguanaDir + '/shepherd/cache-' + pubkey + '.json is updated');
            if (timeStamp) {
              console.log('file ' + iguanaDir + '/shepherd/cache-' + pubkey + '.json is timestamped');
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
            shepherd.io.emit('messages', {
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

    if (fs.existsSync(iguanaDir + '/shepherd/cache-' + pubkey + '.json')) {
      var _file = fs.readFileSync(iguanaDir + '/shepherd/cache-' + pubkey + '.json', 'utf8');
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
      shepherd.io.emit('messages', {
        'message': {
          'shepherd': {
            'method': 'cache-one',
            'status': 'in progress'
          }
        }
      });
      // update all available coin addresses
      if (!address) {
        shepherd.io.emit('messages', {
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
        request({
          url: 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/bitcoinrpc/getaddressesbyaccount?userpass=' + sessionKey + '&coin=' + coin + '&account=*',
          method: 'GET'
        }, function (error, response, body) {
          if (response && response.statusCode && response.statusCode === 200) {
            shepherd.io.emit('messages', {
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
            callStack[coin] = callStack[coin] + addrCount * (coin === 'BTC' || coin === 'SYS' ? callsArray.length - 2 : callsArray.length);
            console.log(coin + ' stack len ' + callStack[coin]);

            async.each(outObj.basilisk[coin].addresses, function(address) {
              var dexUrls = {
                'listunspent': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/listunspent?userpass=' + sessionKey + '&symbol=' + coin + '&address=' + address,
                'listtransactions': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/listtransactions?userpass=' + sessionKey + '&count=100&skip=0&symbol=' + coin + '&address=' + address,
                'getbalance': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/getbalance?userpass=' + sessionKey + '&symbol=' + coin + '&address=' + address,
                'refresh': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/basilisk/refresh?userpass=' + sessionKey + '&timeout=600000&symbol=' + coin + '&address=' + address
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
                  shepherd.io.emit('messages', {
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
                tooEarly = skipTimeout ? false : tooEarly;
                if (!tooEarly) {
                  shepherd.io.emit('messages', {
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
                    url: dexUrl,
                    method: 'GET'
                  }, function (error, response, body) {
                    if (response && response.statusCode && response.statusCode === 200) {
                      shepherd.io.emit('messages', {
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
                  });
                } else {
                  console.log(key + ' is fresh, check back in ' + (cacheGlobLifetime - checkTimestamp(outObj.basilisk[coin][address][key].timestamp)) + 's');
                  callStack[coin]--;
                  console.log(coin + ' _stack len ' + callStack[coin]);
                  checkCallStack();
                }
              });
            });
          } else {
            // TODO: error
          }
        });
      } else {
        callStack[coin] = callStack[coin] + (coin === 'BTC' ? callsArray.length : callsArray.length - 2);
        console.log(coin + ' stack len ' + callStack[coin]);

        var dexUrls = {
          'listunspent': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/listunspent?userpass=' + sessionKey + '&symbol=' + coin + '&address=' + address,
          'listtransactions': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/listtransactions?userpass=' + sessionKey + '&count=100&skip=0&symbol=' + coin + '&address=' + address,
          'getbalance': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/dex/getbalance?userpass=' + sessionKey + '&symbol=' + coin + '&address=' + address,
          'refresh': 'http://' + shepherd.appConfig.host + ':' + shepherd.appConfig.iguanaCorePort + '/api/basilisk/refresh?userpass=' + sessionKey + '&timeout=600000&symbol=' + coin + '&address=' + address
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
            shepherd.io.emit('messages', {
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
            shepherd.io.emit('messages', {
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
              url: dexUrl,
              method: 'GET'
            }, function (error, response, body) {
              if (response && response.statusCode && response.statusCode === 200) {
                shepherd.io.emit('messages', {
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
            });
          } else {
            console.log(key + ' is fresh, check back in ' + (cacheGlobLifetime - checkTimestamp(outObj.basilisk[coin][address][key].timestamp)) + 's');
            callStack[coin]--;
            console.log(coin + ' _stack len ' + callStack[coin]);
            checkCallStack();
          }
        });
      }
    } else {
      shepherd.io.emit('messages', {
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
});*/

module.exports = cache;