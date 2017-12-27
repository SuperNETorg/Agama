const appConfig = {
  config: { // default config
    host: '127.0.0.1',
    agamaPort: 17777,
    maxDescriptors: {
      darwin: 90000,
      linux: 1000000,
    },
    dev: false,
    debug: false,
    roundValues: false,
    experimentalFeatures: false,
    dataDir: '',
    dex: {
      walletUnlockTimeout: 3600,
    },
    cliStopTimeout: 1000,
    failedRPCAttemptsThreshold: 10,
    stopNativeDaemonsOnQuit: true,
    lang: 'EN',
  },
  schema: {
    host: {
      display: true,
      type: 'string',
      displayName: 'Hostname',
      info: 'Application hostname',
    },
    agamaPort: {
      display: true,
      type: 'number',
      displayName: 'Agama Port',
      info: 'Agama HTTP port. Required to run GUI.',
    },
    maxDescriptors: {
      display: false,
      displayName: 'Max Descriptors per Process',
      darwin: {
        display: true,
        displayName: 'MacOS (Darwin)',
        type: 'number',
      },
      linux: {
        display: true,
        displayName: 'Linux',
        type: 'number',
      },
    },
    dev: {
      display: true,
      initDisplay: true,
      displayName: 'Developer mode',
      info: 'Enable developer mode',
      type: 'boolean',
    },
    debug: {
      display: true,
      initDisplay: true,
      displayName: 'Debug',
      info: 'Enable debug output',
      type: 'boolean',
    },
    roundValues: {
      display: true,
      displayName: 'Enable amount rounding',
      info: 'Round \"dust\" amounts to save screen space',
      type: 'boolean',
    },
    experimentalFeatures: {
      display: true,
      initDisplay: true,
      displayName: 'Enable experimental features',
      type: 'boolean',
    },
    dataDir: {
      display: true,
      initDisplay: true,
      displayName: 'Komodo data directory',
      info: 'The data directory is the location where Komodo data files are stored, including the wallet data file',
      type: 'folder',
    },
    dex: {
      display: false,
      displayName: 'dex',
      walletUnlockTimeout: {
        display: true,
        displayName: 'walletUnlockTimeout',
        type: 'number',
      },
    },
    cliStopTimeout: {
      display: true,
      displayName: 'CLI stop timeout',
      info: 'Timeout between consequent CLI stop commands',
      type: 'number',
    },
    stopNativeDaemonsOnQuit: {
      display: true,
      displayName: 'Stop native daemons on app quit',
      info: 'If set to false agama will run in detached coin daemon mode',
      type: 'boolean',
    },
    failedRPCAttemptsThreshold: {
      display: true,
      displayName: 'Failed RPC connect attempts threshold',
      info: 'Number of allowed consequent RPC connect failures before the app marks native coin daemon as not running properly',
      type: 'number',
    },
    lang: {
      display: true,
      displayName: 'Language',
      type: 'select',
      data: [
        { name: 'EN', label: 'English' },
        { name: 'DE', label: 'German' }
      ],
    },
  },
};

module.exports = appConfig;