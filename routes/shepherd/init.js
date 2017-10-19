module.exports = (shepherd) => {
  shepherd.readVersionFile = () => {
    // read app version
    const rootLocation = shepherd.path.join(__dirname, '../../');
    const localVersionFile = shepherd.fs.readFileSync(`${rootLocation}version`, 'utf8');

    return localVersionFile;
  }

  shepherd.createAgamaDirs = () => {
    if (!shepherd.fs.existsSync(shepherd.agamaDir)) {
      shepherd.fs.mkdirSync(shepherd.agamaDir);

      if (shepherd.fs.existsSync(shepherd.agamaDir)) {
        shepherd.log(`created agama folder at ${shepherd.agamaDir}`);
        shepherd.writeLog(`created agama folder at ${shepherd.agamaDir}`);
      }
    } else {
      shepherd.log('agama folder already exists');
    }

    if (!shepherd.fs.existsSync(`${shepherd.agamaDir}/shepherd`)) {
      shepherd.fs.mkdirSync(`${shepherd.agamaDir}/shepherd`);

      if (shepherd.fs.existsSync(`${shepherd.agamaDir}/shepherd`)) {
        shepherd.log(`created shepherd folder at ${shepherd.agamaDir}/shepherd`);
        shepherd.writeLog(`create shepherd folder at ${shepherd.agamaDir}/shepherd`);
      }
    } else {
      shepherd.log('agama/shepherd folder already exists');
    }

    if (!shepherd.fs.existsSync(`${shepherd.agamaDir}/shepherd/pin`)) {
      shepherd.fs.mkdirSync(`${shepherd.agamaDir}/shepherd/pin`);

      if (shepherd.fs.existsSync(`${shepherd.agamaDir}/shepherd/pin`)) {
        shepherd.log(`created pin folder at ${shepherd.agamaDir}/shepherd/pin`);
        shepherd.writeLog(`create pin folder at ${shepherd.agamaDir}/shepherd/pin`);
      }
    } else {
      shepherd.log('shepherd/pin folder already exists');
    }

    if (!shepherd.fs.existsSync(shepherd.zcashParamsDir)) {
      shepherd.fs.mkdirSync(shepherd.zcashParamsDir);
    } else {
      shepherd.log('zcashparams folder already exists');
    }
  }

  return shepherd;
};