module.exports = (shepherd) => {
  shepherd.pathsAgama = () => {
    switch (shepherd.os.platform()) {
      case 'darwin':
        shepherd.fixPath();
        shepherd.agamaDir = `${process.env.HOME}/Library/Application Support/Agama`;
        break;

      case 'linux':
        shepherd.agamaDir = `${process.env.HOME}/.agama`;
        break;

      case 'win32':
        shepherd.agamaDir = `${process.env.APPDATA}/Agama`;
        shepherd.agamaDir = shepherd.path.normalize(shepherd.agamaDir);
        break;
    }
  }

  shepherd.pathsDaemons = () => {
    switch (shepherd.os.platform()) {
      case 'darwin':
        shepherd.fixPath();
        shepherd.agamaTestDir = `${process.env.HOME}/Library/Application Support/Agama/test`,
        shepherd.komododBin = shepherd.path.join(__dirname, '../../assets/bin/osx/komodod'),
        shepherd.komodocliBin = shepherd.path.join(__dirname, '../../assets/bin/osx/komodo-cli'),
        shepherd.komodoDir = shepherd.appConfig.dataDir.length ? shepherd.appConfig.dataDir : `${process.env.HOME}/Library/Application Support/Komodo`,
        shepherd.zcashdBin = '/Applications/ZCashSwingWalletUI.app/Contents/MacOS/zcashd',
        shepherd.zcashcliBin = '/Applications/ZCashSwingWalletUI.app/Contents/MacOS/zcash-cli',
        shepherd.zcashDir = `${process.env.HOME}/Library/Application Support/Zcash`,
        shepherd.zcashParamsDir = `${process.env.HOME}/Library/Application Support/ZcashParams`,
        shepherd.chipsBin = shepherd.path.join(__dirname, '../../assets/bin/osx/chipsd'),
        shepherd.chipscliBin = shepherd.path.join(__dirname, '../../assets/bin/osx/chips-cli'),
        shepherd.chipsDir = `${process.env.HOME}/Library/Application Support/Chips`,
        shepherd.coindRootDir = shepherd.path.join(__dirname, '../../assets/bin/osx/dex/coind');
        break;

      case 'linux':
        shepherd.agamaTestDir = `${process.env.HOME}/.agama/test`,
        shepherd.komododBin = shepherd.path.join(__dirname, '../../assets/bin/linux64/komodod'),
        shepherd.komodocliBin = shepherd.path.join(__dirname, '../../assets/bin/linux64/komodo-cli'),
        shepherd.komodoDir = shepherd.appConfig.dataDir.length ? shepherd.appConfig.dataDir : `${process.env.HOME}/.komodo`,
        shepherd.zcashParamsDir = `${process.env.HOME}/.zcash-params`,
        shepherd.chipsBin = shepherd.path.join(__dirname, '../../assets/bin/linux64/chipsd'),
        shepherd.chipscliBin = shepherd.path.join(__dirname, '../../assets/bin/linux64/chips-cli'),
        shepherd.chipsDir = `${process.env.HOME}/.chips`,
        shepherd.coindRootDir = shepherd.path.join(__dirname, '../../assets/bin/linux64/dex/coind');
        break;

      case 'win32':
        shepherd.agamaTestDir = `${process.env.APPDATA}/Agama/test`;
        shepherd.agamaTestDir = shepherd.path.normalize(shepherd.agamaTestDir);
        shepherd.komododBin = shepherd.path.join(__dirname, '../../assets/bin/win64/komodod.exe'),
        shepherd.komododBin = shepherd.path.normalize(shepherd.komododBin),
        shepherd.komodocliBin = shepherd.path.join(__dirname, '../../assets/bin/win64/komodo-cli.exe'),
        shepherd.komodocliBin = shepherd.path.normalize(shepherd.komodocliBin),
        shepherd.komodoDir = shepherd.appConfig.dataDir.length ? shepherd.appConfig.dataDir : `${process.env.APPDATA}/Komodo`,
        shepherd.komodoDir = shepherd.path.normalize(shepherd.komodoDir);
        shepherd.chipsBin = shepherd.path.join(__dirname, '../../assets/bin/win64/chipsd.exe'),
        shepherd.chipsBin = shepherd.path.normalize(shepherd.chipsBin),
        shepherd.chipscliBin = shepherd.path.join(__dirname, '../../assets/bin/win64/chips-cli.exe'),
        shepherd.chipscliBin = shepherd.path.normalize(shepherd.chipscliBin),
        shepherd.chipsDir = `${process.env.APPDATA}/Chips`,
        shepherd.chipsDir = shepherd.path.normalize(shepherd.chipsDir);
        shepherd.zcashParamsDir = `${process.env.APPDATA}/ZcashParams`;
        shepherd.zcashParamsDir = shepherd.path.normalize(shepherd.zcashParamsDir);
        shepherd.coindRootDir = shepherd.path.join(__dirname, '../../assets/bin/osx/dex/coind');
        shepherd.coindRootDir = shepherd.path.normalize(shepherd.coindRootDir);
        break;
    }
  }

  return shepherd;
};