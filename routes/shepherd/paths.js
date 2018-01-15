const path = require('path');
const fixPath = require('fix-path');
const os = require('os');

module.exports = (shepherd) => {
  shepherd.pathsAgama = () => {
    switch (os.platform()) {
      case 'darwin':
        fixPath();
        shepherd.agamaDir = `${process.env.HOME}/Library/Application Support/Agama`;
        break;

      case 'linux':
        shepherd.agamaDir = `${process.env.HOME}/.agama`;
        break;

      case 'win32':
        shepherd.agamaDir = `${process.env.APPDATA}/Agama`;
        shepherd.agamaDir = path.normalize(shepherd.agamaDir);
        break;
    }
  }

  shepherd.pathsDaemons = () => {
    switch (os.platform()) {
      case 'darwin':
        fixPath();
        shepherd.agamaTestDir = `${process.env.HOME}/Library/Application Support/Agama/test`,
        shepherd.komododBin = path.join(__dirname, '../../assets/bin/osx/komodod'),
        shepherd.komodocliBin = path.join(__dirname, '../../assets/bin/osx/komodo-cli'),
        shepherd.komodoDir = shepherd.appConfig.dataDir.length ? shepherd.appConfig.dataDir : `${process.env.HOME}/Library/Application Support/Komodo`,
        shepherd.zcashdBin = '/Applications/ZCashSwingWalletUI.app/Contents/MacOS/zcashd',
        shepherd.zcashcliBin = '/Applications/ZCashSwingWalletUI.app/Contents/MacOS/zcash-cli',
        shepherd.zcashDir = `${process.env.HOME}/Library/Application Support/Zcash`,
        shepherd.zcashParamsDir = `${process.env.HOME}/Library/Application Support/ZcashParams`,
        shepherd.chipsBin = path.join(__dirname, '../../assets/bin/osx/chipsd'),
        shepherd.chipscliBin = path.join(__dirname, '../../assets/bin/osx/chips-cli'),
        shepherd.chipsDir = `${process.env.HOME}/Library/Application Support/Chips`,
        shepherd.coindRootDir = path.join(__dirname, '../../assets/bin/osx/dex/coind'),
        shepherd.mmBin = path.join(__dirname, '../../node_modules/marketmaker/bin/darwin/x64/marketmaker');
        break;

      case 'linux':
        shepherd.agamaTestDir = `${process.env.HOME}/.agama/test`,
        shepherd.komododBin = path.join(__dirname, '../../assets/bin/linux64/komodod'),
        shepherd.komodocliBin = path.join(__dirname, '../../assets/bin/linux64/komodo-cli'),
        shepherd.komodoDir = shepherd.appConfig.dataDir.length ? shepherd.appConfig.dataDir : `${process.env.HOME}/.komodo`,
        shepherd.zcashParamsDir = `${process.env.HOME}/.zcash-params`,
        shepherd.chipsBin = path.join(__dirname, '../../assets/bin/linux64/chipsd'),
        shepherd.chipscliBin = path.join(__dirname, '../../assets/bin/linux64/chips-cli'),
        shepherd.chipsDir = `${process.env.HOME}/.chips`,
        shepherd.coindRootDir = path.join(__dirname, '../../assets/bin/linux64/dex/coind'),
        shepherd.mmBin = path.join(__dirname, '../../node_modules/marketmaker/bin/linux/x64/marketmaker');
        break;

      case 'win32':
        shepherd.agamaTestDir = `${process.env.APPDATA}/Agama/test`;
        shepherd.agamaTestDir = path.normalize(shepherd.agamaTestDir);
        shepherd.komododBin = path.join(__dirname, '../../assets/bin/win64/komodod.exe'),
        shepherd.komododBin = path.normalize(shepherd.komododBin),
        shepherd.komodocliBin = path.join(__dirname, '../../assets/bin/win64/komodo-cli.exe'),
        shepherd.komodocliBin = path.normalize(shepherd.komodocliBin),
        shepherd.komodoDir = shepherd.appConfig.dataDir.length ? shepherd.appConfig.dataDir : `${process.env.APPDATA}/Komodo`,
        shepherd.komodoDir = path.normalize(shepherd.komodoDir);
        shepherd.chipsBin = path.join(__dirname, '../../assets/bin/win64/chipsd.exe'),
        shepherd.chipsBin = path.normalize(shepherd.chipsBin),
        shepherd.chipscliBin = path.join(__dirname, '../../assets/bin/win64/chips-cli.exe'),
        shepherd.chipscliBin = path.normalize(shepherd.chipscliBin),
        shepherd.chipsDir = `${process.env.APPDATA}/Chips`,
        shepherd.chipsDir = path.normalize(shepherd.chipsDir);
        shepherd.zcashParamsDir = `${process.env.APPDATA}/ZcashParams`;
        shepherd.zcashParamsDir = path.normalize(shepherd.zcashParamsDir);
        shepherd.coindRootDir = path.join(__dirname, '../../assets/bin/osx/dex/coind');
        shepherd.coindRootDir = path.normalize(shepherd.coindRootDir);
        shepherd.mmBin = path.join(__dirname, '../../node_modules/marketmaker/bin/win32/x64/marketmaker.exe');
        shepherd.mmBin = path.normalize(shepherd.mmBin);
        break;
    }
  }

  return shepherd;
};