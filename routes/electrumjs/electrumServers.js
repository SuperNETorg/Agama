let electrumServers = {
  /*zcash: {
    address: '173.212.225.176',
    port: 50032,
    proto: 'tcp',
  },*/
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
  },
  viacoin: { // !estimatefee
    address: 'vialectrum.bitops.me',
    port: 50002,
    proto: 'ssl',
    txfee: 100000,
    abbr: 'VIA',
  },
  vertcoin: {
    address: '173.212.225.176',
    port: 50088,
    proto: 'tcp',
    txfee: 100000,
    abbr: 'VTC',
  },
  namecoin: {
    address: '173.212.225.176',
    port: 50036,
    proto: 'tcp',
    txfee: 100000,
    abbr: 'NMC',
  },
  monacoin: { // !estimatefee
    address: '173.212.225.176',
    port: 50002,
    proto: 'tcp',
    txfee: 100000,
    abbr: 'MONA',
  },
  litecoin: {
    address: '173.212.225.176',
    port: 50012,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'LTC',
  },
  faircoin: {
    address: '173.212.225.176',
    port: 50005,
    proto: 'tcp',
    txfee: 1000000,
    abbr: 'FAIR',
  },
  digibyte: {
    address: '173.212.225.176',
    port: 50022,
    proto: 'tcp',
    txfee: 100000,
    abbr: 'DGB',
  },
  dash: {
    address: '173.212.225.176',
    port: 50098,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'DASH',
  },
  crown: {
    address: '173.212.225.176',
    port: 50041,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'CRW',
  },
  bitcoin: {
    address: '173.212.225.176',
    port: 50001,
    proto: 'tcp',
    abbr: 'BTC',
  },
  argentum: { // !estimatefee
    address: '173.212.225.176',
    port: 50081,
    proto: 'tcp',
    txfee: 50000,
    abbr: 'ARG',
  },
  chips: { // !estimatefee
    address: '173.212.225.176',
    port: 50076,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'CHIPS',
    serverList: [
      '173.212.225.176:50076',
      '136.243.45.140:50076'
    ],
  },
};

module.exports = electrumServers;