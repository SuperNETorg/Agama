module.exports = (shepherd) => {
  /*
   *  type: GET
   *  params: coin, type
   *  TODO: reorganize to work with coind
   */
  shepherd.get('/kick', (req, res, next) => {
    const _coin = req.query.coin;
    const _type = req.query.type;

    if (!_coin) {
      const errorObj = {
        msg: 'error',
        result: 'no coin name provided',
      };

      res.end(JSON.stringify(errorObj));
    }

    if (!_type) {
      const errorObj = {
        msg: 'error',
        result: 'no type provided',
      };

      res.end(JSON.stringify(errorObj));
    }

    const kickStartDirs = {
      soft: [
        {
          name: 'DB/[coin]',
          type: 'pattern',
          match: 'balancecrc.',
        },
        {
          name: 'DB/[coin]/utxoaddrs',
          type: 'file',
        },
        {
          name: 'DB/[coin]/accounts',
          type: 'folder',
        },
        {
          name: 'DB/[coin]/fastfind',
          type: 'folder',
        },
        {
          name: 'tmp/[coin]',
          type: 'folder',
        }
      ],
      hard: [
        {
          name: 'DB/[coin]',
          type: 'pattern',
          match: 'balancecrc.',
        },
        {
          name: 'DB/[coin]/utxoaddrs',
          type: 'file',
        },
        {
          name: 'DB/[coin]',
          type: 'pattern',
          match: 'utxoaddrs.',
        },
        {
          name: 'DB/[coin]/accounts',
          type: 'folder',
        },
        {
          name: 'DB/[coin]/fastfind',
          type: 'folder',
        },
        {
          name: 'DB/[coin]/spends',
          type: 'folder',
        },
        {
          name: 'tmp/[coin]',
          type: 'folder',
        }
      ],
      brutal: [ // delete all coin related data
        {
          name: 'DB/[coin]',
          type: 'folder',
        },
        {
          name: 'DB/purgeable/[coin]',
          type: 'folder',
        },
        {
          name: 'DB/ro/[coin]',
          type: 'folder',
        },
        {
          name: 'tmp/[coin]',
          type: 'folder',
        }
      ]
    };

    if (_coin &&
        _type) {
      for (let i = 0; i < kickStartDirs[_type].length; i++) {
        let currentKickItem = kickStartDirs[_type][i];

        shepherd.log('deleting ' + currentKickItem.type + (currentKickItem.match ? ' ' + currentKickItem.match : '') + ' ' + iguanaDir + '/' + currentKickItem.name.replace('[coin]', _coin));
        if (currentKickItem.type === 'folder' ||
            currentKickItem.type === 'file') {
          /*rimraf(`${iguanaDir}/${currentKickItem.name.replace('[coin]', _coin)}`, function(err) {
            if (err) {
              shepherd.writeLog(`kickstart err: ${err}`);
              shepherd.log(`kickstart err: ${err}`);
            }
          });*/
        } else if (currentKickItem.type === 'pattern') {
          let dirItems = shepherd.fs.readdirSync(`${iguanaDir}/currentKickItem.name.replace('[coin]', _coin)`);

          if (dirItems &&
              dirItems.length) {
            for (let j = 0; j < dirItems.length; j++) {
              if (dirItems[j].indexOf(currentKickItem.match) > -1) {
                /*rimraf(`${iguanaDir}/${currentKickItem.name.replace('[coin]', _coin)}/${dirItems[j]}`, function(err) {
                  if (err) {
                    shepherd.writeLog(`kickstart err: ${err}`);
                    shepherd.log(`kickstart err: ${err}`);
                  }
                });*/

                shepherd.log(`deleting ${dirItems[j]}`);
              }
            }
          }
        }
      }

      const successObj = {
        msg: 'success',
        result: 'kickstart: brutal is executed',
      };

      res.end(JSON.stringify(successObj));
    }
  });

  return shepherd;
};