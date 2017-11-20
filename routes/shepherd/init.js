const fs = require('fs-extra');
const path = require('path');

module.exports = (shepherd) => {
  shepherd.readVersionFile = () => {
    // read app version
    const rootLocation = path.join(__dirname, '../../');
    const localVersionFile = fs.readFileSync(`${rootLocation}version`, 'utf8');

    return localVersionFile;
  }

  shepherd.createAgamaDirs = () => {
    const rootLocation = path.join(__dirname, '../../');

    fs.readdir(rootLocation, (err, items) => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].substr(0, 3) === 'gen') {
          console.log(items[i]);
          fs.unlinkSync(rootLocation + items[i]);
        }
      }
    });

    if (!fs.existsSync(shepherd.agamaDir)) {
      fs.mkdirSync(shepherd.agamaDir);

      if (fs.existsSync(shepherd.agamaDir)) {
        shepherd.log(`created agama folder at ${shepherd.agamaDir}`);
        shepherd.writeLog(`created agama folder at ${shepherd.agamaDir}`);
      }
    } else {
      shepherd.log('agama folder already exists');
    }

    if (!fs.existsSync(`${shepherd.agamaDir}/shepherd`)) {
      fs.mkdirSync(`${shepherd.agamaDir}/shepherd`);

      if (fs.existsSync(`${shepherd.agamaDir}/shepherd`)) {
        shepherd.log(`created shepherd folder at ${shepherd.agamaDir}/shepherd`);
        shepherd.writeLog(`create shepherd folder at ${shepherd.agamaDir}/shepherd`);
      }
    } else {
      shepherd.log('agama/shepherd folder already exists');
    }

    if (!fs.existsSync(`${shepherd.agamaDir}/shepherd/pin`)) {
      fs.mkdirSync(`${shepherd.agamaDir}/shepherd/pin`);

      if (fs.existsSync(`${shepherd.agamaDir}/shepherd/pin`)) {
        shepherd.log(`created pin folder at ${shepherd.agamaDir}/shepherd/pin`);
        shepherd.writeLog(`create pin folder at ${shepherd.agamaDir}/shepherd/pin`);
      }
    } else {
      shepherd.log('shepherd/pin folder already exists');
    }

    if (!fs.existsSync(shepherd.zcashParamsDir)) {
      fs.mkdirSync(shepherd.zcashParamsDir);
    } else {
      shepherd.log('zcashparams folder already exists');
    }
  }

  return shepherd;
};