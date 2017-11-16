let electrumServers = {
  /*zcash: {
    address: '173.212.225.176',
    port: 50032,
    proto: 'tcp',
  },*/
  revs: { // !estimatefee
    address: '173.212.225.176',
    port: 50050,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'REVS',
    serverList: [
      '173.212.225.176:50050',
      '136.243.45.140:50050'
    ],
  },
  mnz: { // !estimatefee
    address: '173.212.225.176',
    port: 10002,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'MNZ',
    serverList: [
      '173.212.225.176:10002',
      '136.243.45.140:10002',
      '18.216.195.109:10002',
      '52.41.58.116:10002',
      '52.67.48.29:10002',
      '13.124.87.194:10002',
      '52.63.107.102:10002'
    ],
  },
  wlc: { // !estimatefee
    address: '173.212.225.176',
    port: 50052,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'WLC',
    serverList: [
      '173.212.225.176:50052',
      '136.243.45.140:50052'
    ],
  },
  jumblr: { // !estimatefee
    address: '173.212.225.176',
    port: 50051,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'JUMBLR',
    serverList: [
      '173.212.225.176:50051',
      '136.243.45.140:50051'
    ],
  },
  komodo: { // !estimatefee
    address: '173.212.225.176',
    port: 10001,
    proto: 'tcp',
    txfee: 10000,
    abbr: 'KMD',
    serverList: [
      '173.212.225.176:10001',
      '136.243.45.140:10001',
      '18.216.195.109:10001',
      '52.41.58.116:10001',
      '52.67.48.29:10001',
      '13.124.87.194:10001',
      '52.63.107.102:10001'
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