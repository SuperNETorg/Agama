const electrumServers = require('../electrumjs/electrumServers');

module.exports = (shepherd) => {
  shepherd.startSPV = (coin) => {
    if (coin === 'KMD+REVS+JUMBLR') {
      shepherd.addElectrumCoin('KMD');
      shepherd.addElectrumCoin('REVS');
      shepherd.addElectrumCoin('JUMBLR');
    } else {
      if (process.argv.indexOf('spvcoins=all/add-all') > -1) {
        for (let key in electrumServers) {
          shepherd.addElectrumCoin(electrumServers[key].abbr);
        }
      } else {
        shepherd.addElectrumCoin(coin);
      }
    }
  }

  shepherd.startKMDNative = (selection, isManual) => {
    if (isManual) {
      shepherd.kmdMainPassiveMode = true;
    }

    if (selection === 'KMD') {
      const herdData = {
        'ac_name': 'komodod',
        'ac_options': [
          '-daemon=0',
          '-addnode=78.47.196.146',
        ],
      };

      const options = {
        url: `http://127.0.0.1:${shepherd.appConfig.agamaPort}/shepherd/herd`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          herd: 'komodod',
          options: herdData,
          token: shepherd.appSessionHash,
        }),
      };

      shepherd.request(options, (error, response, body) => {
        if (response &&
            response.statusCode &&
            response.statusCode === 200) {
          //resolve(body);
        } else {
          //resolve(body);
        }
      });
    } else {
      const herdData = [{
        'ac_name': 'komodod',
        'ac_options': [
          '-daemon=0',
          '-addnode=78.47.196.146',
        ]
      }, {
        'ac_name': 'REVS',
        'ac_options': [
          '-daemon=0',
          '-server',
          `-ac_name=REVS`,
          '-addnode=78.47.196.146',
          '-ac_supply=1300000'
        ]
      }, {
        'ac_name': 'JUMBLR',
        'ac_options': [
          '-daemon=0',
          '-server',
          `-ac_name=JUMBLR`,
          '-addnode=78.47.196.146',
          '-ac_supply=999999'
        ]
      }];

      for (let i = 0; i < herdData.length; i++) {
        setTimeout(() => {
          const options = {
            url: `http://127.0.0.1:${shepherd.appConfig.agamaPort}/shepherd/herd`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              herd: 'komodod',
              options: herdData[i],
              token: shepherd.appSessionHash,
            }),
          };

          shepherd.request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              //resolve(body);
            } else {
              //resolve(body);
            }
          });
        }, 100);
      }
    }
  };

  return shepherd;
};