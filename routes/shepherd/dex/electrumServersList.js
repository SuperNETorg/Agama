// TODO: merge with spv mode

const electrumServersList = {
  "ARG": [{"173.212.225.176": 50081},{"136.243.45.140": 50081}],
  "BET": [{"electrum2.cipig.net":10012},{"electrum1.cipig.net":10012}],
  "BTC": [{"electrum2.cipig.net":10000},{"electrum1.cipig.net":10000}],
  "BOTS": [{"electrum2.cipig.net":10007},{"electrum1.cipig.net":10007}],
  "CHIPS": [{"173.212.225.176": 50076},{"136.243.45.140": 50076}],
  "COQUI": [{"electrum2.cipig.net":10011},{"electrum1.cipig.net":10011}],
  "CRW": [{"173.212.225.176": 50041},{"136.243.45.140": 50041}],
  "CRYPTO": [{"electrum2.cipig.net":10008},{"electrum1.cipig.net":10008}],
  "DASH": [{"173.212.225.176": 50098},{"136.243.45.140": 50098}],
  "DEX": [{"electrum2.cipig.net":10006},{"electrum1.cipig.net":10006}],
  "DGB": [{"136.243.45.140": 50022},{"173.212.225.176": 50022}],
  "DOGE": [{"173.212.225.176": 50015},{"136.243.45.140": 50015}],
  "EMC2": [{"173.212.225.176": 50079},{"136.243.45.140": 50079}],
  "FAIR": [{"173.212.225.176": 50005},{"136.243.45.140": 50005}],
  "HODL": [{"electrum2.cipig.net":10009},{"electrum1.cipig.net":10009}],
  "HUSH": [{"173.212.225.176": 50013},{"136.243.45.140": 50013}],
  "JUMBLR": [{"electrum2.cipig.net": 10004},{"electrum1.cipig.net": 10004}],
  "KMD": [{"electrum2.cipig.net":10001},{"electrum1.cipig.net":10001}],
  "LTC": [{"173.212.225.176": 50012},{"136.243.45.140": 50012}],
  "MNZ": [{"electrum2.cipig.net":10002},{"electrum1.cipig.net":10002}],
  "MONA": [{"173.212.225.176": 50002},{"136.243.45.140": 50002}],
  "MSHARK": [{"electrum2.cipig.net": 10013},{"electrum1.cipig.net": 10013}],
  "NMC": [{"173.212.225.176": 50036},{"136.243.45.140": 50036}],
  "PANGEA": [{"electrum2.cipig.net": 10010},{"electrum1.cipig.net": 10010}],
  "REVS": [{"electrum2.cipig.net": 10003},{"electrum1.cipig.net": 10003}],
  "SUPERNET": [{"electrum2.cipig.net": 10005},{"electrum1.cipig.net": 10005}],
  "VIA": [{"173.212.225.176": 50033},{"136.243.45.140": 50033}],
  "VTC": [{"173.212.225.176": 50088},{"136.243.45.140": 50088}],
  "WLC": [{"electrum2.cipig.net": 10014},{"electrum1.cipig.net": 10014}],
  "ZEC": [{"173.212.225.176": 50032},{"136.243.45.140": 50032}]
};

module.exports = (shepherd) => {
  shepherd.electrumServersList = electrumServersList;
  return shepherd;
};