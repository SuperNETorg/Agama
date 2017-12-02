const electron = require('electron');
const express = require('express');
const app = electron.app;
let shepherd = express.Router();

shepherd.path = require('path');
shepherd.os = require('os');
shepherd.fsnode = require('fs');
shepherd.fs = require('fs-extra');
shepherd._fs = require('graceful-fs');
shepherd.md5 = require('./md5.js');
shepherd.request = require('request');
shepherd.portscanner = require('portscanner');
shepherd.aes256 = require('nodejs-aes256');
shepherd.AdmZip = require('adm-zip');
shepherd.remoteFileSize = require('remote-file-size');
shepherd.Promise = require('bluebird');
shepherd.exec = require('child_process').exec;
shepherd.execFile = require('child_process').execFile;
shepherd.sha256 = require('sha256');
shepherd.CoinKey = require('coinkey');
shepherd.bitcoinJS = require('bitcoinjs-lib');
shepherd.coinSelect = require('coinselect');
shepherd.fixPath = require('fix-path');
shepherd.crypto = require('crypto');

shepherd.setconf = require('../private/setconf.js');
shepherd.nativeCoind = require('./nativeCoind.js');
shepherd.nativeCoindList = {};
shepherd.assetChainPorts = require('./ports.js');
shepherd._appConfig = require('./appConfig.js');

shepherd.coindInstanceRegistry = {};
shepherd.coindStdout = {};
shepherd.guiLog = {};
shepherd.rpcConf = {};
shepherd.appRuntimeLog = [];
shepherd.appRuntimeSPVLog = [];
shepherd.lockDownAddCoin = false;
shepherd.mmupass = null;
shepherd.mmRatesInterval = null;
shepherd.mmPublic = {
  coins: [],
  mmupass: null,
  swaps: [],
  bids: [],
  asks: [],
  isAuth: false,
  rates: {},
  prices: [],
  coinsHelper: [],
  stats: [],
};

// spv vars and libs
shepherd.electrumCoins = {
  auth: false,
};
shepherd.electrumKeys = {};

shepherd.electrumJSCore = require('./electrumjs/electrumjs.core.js');
shepherd.electrumJSNetworks = require('./electrumjs/electrumjs.networks.js');
shepherd.electrumJSTxDecoder = require('./electrumjs/electrumjs.txdecoder.js');
shepherd.electrumServers = require('./electrumjs/electrumServers.js');

shepherd.CONNECTION_ERROR_OR_INCOMPLETE_DATA = 'connection error or incomplete data';

shepherd.appConfig = shepherd._appConfig.config;

// core
shepherd = require('./shepherd/paths.js')(shepherd);

shepherd.pathsAgama();

// core
shepherd = require('./shepherd/log.js')(shepherd);
shepherd = require('./shepherd/config.js')(shepherd);

shepherd.appConfig = shepherd.loadLocalConfig();

shepherd.pathsDaemons();

shepherd.appConfigSchema = shepherd._appConfig.schema;
shepherd.defaultAppConfig = Object.assign({}, shepherd.appConfig);
shepherd.kmdMainPassiveMode = false;

// spv
shepherd = require('./shepherd/electrum/network.js')(shepherd);
shepherd = require('./shepherd/electrum/coins.js')(shepherd);
shepherd = require('./shepherd/electrum/keys.js')(shepherd);
shepherd = require('./shepherd/electrum/auth.js')(shepherd);
shepherd = require('./shepherd/electrum/merkle.js')(shepherd);
shepherd = require('./shepherd/electrum/balance.js')(shepherd);
shepherd = require('./shepherd/electrum/transactions.js')(shepherd);
shepherd = require('./shepherd/electrum/block.js')(shepherd);
shepherd = require('./shepherd/electrum/createtx.js')(shepherd);
shepherd = require('./shepherd/electrum/interest.js')(shepherd);
shepherd = require('./shepherd/electrum/listunspent.js')(shepherd);
shepherd = require('./shepherd/electrum/estimate.js')(shepherd);

// dex
shepherd = require('./shepherd/dex/coind.js')(shepherd);
shepherd = require('./shepherd/dex/mmControl.js')(shepherd);
shepherd = require('./shepherd/dex/mmRequest.js')(shepherd);

// core
shepherd = require('./shepherd/addCoinShortcuts.js')(shepherd);
shepherd = require('./shepherd/dashboardUpdate.js')(shepherd);
shepherd = require('./shepherd/binsTestUtil.js')(shepherd);
shepherd = require('./shepherd/binsUtils.js')(shepherd);
shepherd = require('./shepherd/downloadUtil.js')(shepherd);
shepherd = require('./shepherd/init.js')(shepherd);
shepherd = require('./shepherd/pin.js')(shepherd);
shepherd = require('./shepherd/downloadBins.js')(shepherd);
shepherd = require('./shepherd/downloadPatch.js')(shepherd);
shepherd = require('./shepherd/downloadZcparams.js')(shepherd);
shepherd = require('./shepherd/coinsList.js')(shepherd);
shepherd = require('./shepherd/quitDaemon.js')(shepherd);
shepherd = require('./shepherd/rpc.js')(shepherd);
shepherd = require('./shepherd/kickstart.js')(shepherd);
shepherd = require('./shepherd/debugLog.js')(shepherd);
shepherd = require('./shepherd/confMaxconnections.js')(shepherd);
shepherd = require('./shepherd/appInfo.js')(shepherd);
shepherd = require('./shepherd/daemonControl.js')(shepherd);
shepherd = require('./shepherd/auth.js')(shepherd);
shepherd = require('./shepherd/coins.js')(shepherd);
shepherd = require('./shepherd/coindWalletKeys.js')(shepherd);

shepherd.printDirs();

// default route
shepherd.get('/', (req, res, next) => {
  res.send('Agama app server');
});

// expose sockets obj
shepherd.setIO = (io) => {
  shepherd.io = io;
};

shepherd.setVar = (_name, _body) => {
  shepherd[_name] = _body;
};

module.exports = shepherd;