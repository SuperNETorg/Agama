const fs = require('fs-extra'),
      request = require('request'),
      async = require('async'),
      url = require('url');

let mock = {};

mock.setVar = function(variable, value) {
  mock[variable] = value;
}

mock.get = function(req, res, next) {
	const _url = req.query.url;

	if (_url.indexOf('/InstantDEX/allcoins') > -1) {
	  res.end(JSON.stringify({
	  	'native': [],
	  	'basilisk': [ 'KMD', 'BTC'],
	  	'full':[],
	  	'tag': '18430609759584422959'
	  }));
	}
	if (_url.indexOf('/bitcoinrpc/getaddressesbyaccount') > -1) {
		console.log(_url.indexOf('/bitcoinrpc/getaddressesbyaccount'));
		res.end(JSON.stringify({
	  	'result': [
				"RDbGxL8QYdEp8sMULaVZS2E6XThcTKT9Jd",
				"RL4orv22Xch7PhM5w9jUHhVQhX6kF6GkfS",
				"RUrxvPTEKGWEDTvAtgiqbUTTFE53Xdpj8a",
				"RPJoLDa7RezvfUUBr7R3U8wrP16AgUsNw3",
				"RQPTpRJEeafNx5hkDzgjcsPyU4E8RFVApT"
			]
		}));
	}
	if (_url.indexOf('/api/dex/listunspent') > -1 ||
			_url.indexOf('/api/dex/listtransactions') > -1 ||
			_url.indexOf('/api/ss/getbalance') > -1 ||
			_url.indexOf('/api/ww/refresh') > -1) {
		res.end(JSON.stringify({
			'some key': 'some value'
		}));
	}
}

module.exports = mock;