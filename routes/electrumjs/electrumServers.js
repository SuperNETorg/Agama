let electrumServers = {
  coqui: { // !estimatefee
    address: 'electrum1.cipig.net',
    port: 10011,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'COQUI',
    serverList: [
      'electrum1.cipig.net:10011',
      'electrum2.cipig.net:10011'
    ],
  },
  revs: { // !estimatefee
    address: 'electrum1.cipig.net',
    port: 10003,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'REVS',
    serverList: [
      'electrum1.cipig.net:10003',
      'electrum2.cipig.net:10003'
    ],
  },
  supernet: { // !estimatefee
    address: 'electrum1.cipig.net',
    port: 10005,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'SUPERNET',
    serverList: [
      'electrum1.cipig.net:10005',
      'electrum2.cipig.net:10005'
    ],
  },
  dex: { // !estimatefee
    address: 'electrum1.cipig.net',
    port: 10006,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'DEX',
    serverList: [
      'electrum1.cipig.net:10006',
      'electrum2.cipig.net:10006'
    ],
  },
  bots: { // !estimatefee
    address: 'electrum1.cipig.net',
    port: 10007,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'BOTS',
    serverList: [
      'electrum1.cipig.net:10007',
      'electrum2.cipig.net:10007'
    ],
  },
  crypto: { // !estimatefee
    address: 'electrum1.cipig.net',
    port: 10008,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'CRYPTO',
    serverList: [
      'electrum1.cipig.net:10008',
      'electrum2.cipig.net:10008'
    ],
  },
  hodl: { // !estimatefee
    address: 'electrum1.cipig.net',
    port: 10009,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'HODL',
    serverList: [
      'electrum1.cipig.net:10009',
      'electrum2.cipig.net:10009'
    ],
  },
  pangea: { // !estimatefee
    address: 'electrum1.cipig.net',
    port: 10010,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'PANGEA',
    serverList: [
      'electrum1.cipig.net:10010',
      'electrum2.cipig.net:10010'
    ],
  },
  bet: { // !estimatefee
    address: 'electrum1.cipig.net',
    port: 10012,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'BET',
    serverList: [
      'electrum1.cipig.net:10012',
      'electrum2.cipig.net:10012'
    ],
  },
  mshark: { // !estimatefee
    address: 'electrum1.cipig.net',
    port: 10013,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'MSHARK',
    serverList: [
      'electrum1.cipig.net:10013',
      'electrum2.cipig.net:10013'
    ],
  },
  mnz: { // !estimatefee
    address: 'electrum1.cipig.net',
    port: 10002,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'MNZ',
    serverList: [
      'electrum1.cipig.net:10002',
      'electrum2.cipig.net:10002'/*,
      '18.216.195.109:10002',
      '52.41.58.116:10002',
      '52.67.48.29:10002',
      '13.124.87.194:10002',
      '52.63.107.102:10002'*/
    ],
  },
  wlc: { // !estimatefee
    address: 'electrum1.cipig.net',
    port: 10014,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'WLC',
    serverList: [
      'electrum1.cipig.net:10014',
      'electrum2.cipig.net:10014'
    ],
  },
  jumblr: { // !estimatefee
    address: 'electrum1.cipig.net',
    port: 10004,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'JUMBLR',
    serverList: [
      'electrum1.cipig.net:10004',
      'electrum2.cipig.net:10004'
    ],
  },
  komodo: { // !estimatefee
    address: 'electrum1.cipig.net',
    port: 10001,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'KMD',
    serverList: [
      'electrum1.cipig.net:10001',
      'electrum2.cipig.net:10001',
    ],
  },
  dogecoin: { // !estimatefee
    address: '173.212.225.176',
    port: 50015,
    proto: 'tcp',
    txfee: 100000000,
    abbr: 'DOGE',
    serverList: [
      '173.212.225.176:50015',
      '136.243.45.140:50015'
    ],
  },
  viacoin: { // !estimatefee
    address: '173.212.225.176',
    port: 50033,
    proto: 'tcp',
    txfee: 100000,
    abbr: 'VIA',
    serverList: [
      '173.212.225.176:50033',
      '136.243.45.140:50033'
    ],
  },
  vertcoin: {
    address: '173.212.225.176',
    port: 50088,
    proto: 'tcp',
    txfee: 100000,
    abbr: 'VTC',
    serverList: [
      '173.212.225.176:50088',
      '136.243.45.140:50088'
    ],
  },
  namecoin: {
    address: '173.212.225.176',
    port: 50036,
    proto: 'tcp',
    txfee: 100000,
    abbr: 'NMC',
    serverList: [
      '173.212.225.176:50036',
      '136.243.45.140:50036'
    ],
  },
  monacoin: { // !estimatefee
    address: '173.212.225.176',
    port: 50002,
    proto: 'tcp',
    txfee: 100000,
    abbr: 'MONA',
    serverList: [
      '173.212.225.176:50002',
      '136.243.45.140:50002'
    ],
  },
  litecoin: {
    address: '173.212.225.176',
    port: 50012,
    proto: 'tcp',
    txfee: 30000,
    abbr: 'LTC',
    serverList: [
      '173.212.225.176:50012',
      '136.243.45.140:50012'
    ],
  },
  faircoin: {
    address: '173.212.225.176',
    port: 50005,
    proto: 'tcp',
    txfee: 1000000,
    abbr: 'FAIR',
    serverList: [
      '173.212.225.176:50005',
      '136.243.45.140:50005'
    ],
  },
  dgb: {
    address: '173.212.225.176',
    port: 50022,
    proto: 'tcp',
    txfee: 100000,
    abbr: 'DGB',
    serverList: [
      '173.212.225.176:50022',
      '136.243.45.140:50022'
    ],
  },
  dash: {
    address: '173.212.225.176',
    port: 50098,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'DASH',
    serverList: [
      '173.212.225.176:50098',
      '136.243.45.140:50098'
    ],
  },
  crown: {
    address: '173.212.225.176',
    port: 50041,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'CRW',
    serverList: [
      '173.212.225.176:50041',
      '136.243.45.140:50041'
    ],
  },
  /*btc: {
    address: 'electrum1.cipig.net',
    port: 10000,
    proto: 'tcp',
    abbr: 'BTC',
    serverList: [
      'electrum1.cipig.net:10000',
      'electrum2.cipig.net:10000'
    ],
  },*/
  btg: {
    address: '173.212.225.176',
    port: 10052,
    proto: 'tcp',
    abbr: 'BTG',
    txfee: 10000,
    serverList: [
      '173.212.225.176:10052',
      '94.130.224.11:10052'
    ],
  },
  blk: { // pos
    address: 'electrum1.cipig.net',
    port: 10054,
    proto: 'tcp',
    abbr: 'BLK',
    txfee: 10000,
    serverList: [
      'electrum1.cipig.net:10054',
      'electrum2.cipig.net:10054'
    ],
  },
  sib: {
    address: 'electrum1.cipig.net',
    port: 10050,
    proto: 'tcp',
    abbr: 'SIB',
    txfee: 10000,
    serverList: [
      'electrum1.cipig.net:10050',
      'electrum2.cipig.net:10050'
    ],
  },
  bch: {
    address: 'electrum1.cipig.net',
    port: 10051,
    proto: 'tcp',
    abbr: 'BCH',
    txfee: 10000,
    serverList: [
      'electrum1.cipig.net:10051',
      'electrum2.cipig.net:10051'
    ],
  },
  argentum: { // !estimatefee
    address: '173.212.225.176',
    port: 50081,
    proto: 'tcp',
    txfee: 50000,
    abbr: 'ARG',
    serverList: [
      '173.212.225.176:50081',
      '136.243.45.140:50081'
    ],
  },
  chips: { // !estimatefee
    address: 'electrum1.cipig.net',
    port: 10053,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'CHIPS',
    serverList: [
      'electrum1.cipig.net:10053',
      'electrum2.cipig.net:10053'
    ],
  },
  zec: {
    address: '173.212.225.176',
    port: 50032,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'ZEC',
    serverList: [
      '173.212.225.176:50032',
      '136.243.45.140:50032'
    ],
  },
  hush: {
    address: '173.212.225.176',
    port: 50013,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'HUSH',
    serverList: [
      '173.212.225.176:50013',
      '136.243.45.140:50013'
    ],
  },
  xmy: {
    address: 'cetus.cryptap.us',
    port: 50004,
    proto: 'ssl',
    txfee: 5000,
    abbr: 'XMY',
    serverList: [
      'cetus.cryptap.us:50004',
      'kraken.cryptap.us:50004'
    ],
  },
  zcl: {
    address: 'electrum1.cipig.net',
    port: 50055,
    proto: 'tcp',
    txfee: 1000,
    abbr: 'ZCL',
    serverList: [
      'electrum1.cipig.net:10055',
      'electrum2.cipig.net:10055'
    ],
  },
};

electrumServers.crw = electrumServers.crown;
electrumServers.fair = electrumServers.faircoin;
electrumServers.arg = electrumServers.argentum;
electrumServers.ltc = electrumServers.litecoin;
electrumServers.mona = electrumServers.litecoin;
electrumServers.nmc = electrumServers.namecoin;
electrumServers.vtc = electrumServers.vertcoin;
electrumServers.via = electrumServers.viacoin;
electrumServers.doge = electrumServers.dogecoin;

module.exports = electrumServers;