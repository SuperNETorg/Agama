'use strict'
var bitcoin = require('bitcoinjs-lib');

var networks = exports;
Object.keys(bitcoin.networks).forEach((key) => {
  networks[key] = bitcoin.networks[key];
});

networks.litecoin = {
  messagePrefix: '\x19Litecoin Signed Message:\n',
  bip32: {
    public: 0x019da462,
    private: 0x019d9cfe
  },
  pubKeyHash: 0x30,
  scriptHash: 0x32,
  wif: 0xb0,
  dustThreshold: 0, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
}

networks.dogecoin = {
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bip32: {
    public: 0x02facafd,
    private: 0x02fac398,
  },
  pubKeyHash: 0x1e,
  scriptHash: 0x16,
  wif: 0x9e,
  dustThreshold: 0 // https://github.com/dogecoin/dogecoin/blob/v1.7.1/src/core.h#L155-L160
};

// https://github.com/monacoinproject/monacoin/blob/master-0.10/src/chainparams.cpp#L161
networks.monacoin = {
  messagePrefix: '\x19Monacoin Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x32,
  scriptHash: 0x05,
  wif: 0xB2,
  dustThreshold: 546, // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/core.h#L151-L162
};


// https://github.com/gamecredits-project/GameCredits/blob/master/src/chainparams.cpp#L136
networks.game = {
  messagePrefix: '\x19GameCredits Signed Message:\n',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
  dustThreshold: 546, // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/core.h#L151-L162
};

// https://github.com/dashpay/dash/blob/master/src/chainparams.cpp#L171
networks.dash = {
  messagePrefix: '\x19DarkCoin Signed Message:\n',
  bip32: {
    public: 0x02fe52f8,
    private: 0x02fe52cc,
  },
  pubKeyHash: 0x4c,
  scriptHash: 0x10,
  wif: 0xcc,
  dustThreshold: 5460, // https://github.com/dashpay/dash/blob/v0.12.0.x/src/primitives/transaction.h#L144-L155
};

// https://github.com/zcoinofficial/zcoin/blob/c93eccb39b07a6132cb3d787ac18be406b24c3fa/src/base58.h#L275
networks.zcoin = {
  messagePrefix: '\x19ZCoin Signed Message:\n',
  bip32: {
    public: 0x0488b21e, // todo
    private: 0x0488ade4, // todo
  },
  pubKeyHash: 0x52,
  scriptHash: 0x07,
  wif: 0x52 + 128,
  dustThreshold: 1000, // https://github.com/zcoinofficial/zcoin/blob/f755f95a036eedfef7c96bcfb6769cb79278939f/src/main.h#L59
};

// https://raw.githubusercontent.com/jl777/komodo/beta/src/chainparams.cpp
networks.komodo = {
  messagePrefix: '\x19Komodo Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x3c,
  scriptHash: 0x55,
  wif: 0xbc,
  dustThreshold: 1000,
};

networks.viacoin = {
  messagePrefix: '\x19Viacoin Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x47,
  scriptHash: 0x21,
  wif: 0xc7,
  dustThreshold: 1000,
};

networks.vertcoin = {
  messagePrefix: '\x19Vertcoin Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x47,
  scriptHash: 0x5,
  wif: 0x80,
  dustThreshold: 1000,
};

networks.namecoin = {
  messagePrefix: '\x19Namecoin Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x34,
  scriptHash: 0xd,
  wif: 0xb4,
  dustThreshold: 1000,
};

networks.faircoin = {
  messagePrefix: '\x19Faircoin Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x5f,
  scriptHash: 0x24,
  wif: 0xdf,
  dustThreshold: 1000,
};

networks.digibyte = {
  messagePrefix: '\x19Digibyte Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x1e,
  scriptHash: 0x5,
  wif: 0x80,
  dustThreshold: 1000,
};

networks.crown = {
  messagePrefix: '\x19Crown Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x0,
  scriptHash: 0x1c,
  wif: 0x80,
  dustThreshold: 1000,
};

networks.argentum = {
  messagePrefix: '\x19Argentum Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x17,
  scriptHash: 0x5,
  wif: 0x97,
  dustThreshold: 1000,
};

networks.chips = {
  messagePrefix: '\x19Chips Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x3c,
  scriptHash: 0x55,
  wif: 0xbc,
  dustThreshold: 1000,
};

networks.btg = {
  messagePrefix: '\x19BitcoinGold Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x26,
  scriptHash: 0x17,
  wif: 0x80,
  dustThreshold: 1000,
};

networks.bch = {
  messagePrefix: '\x19BitcoinCash Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x0,
  scriptHash: 0x5,
  wif: 0x80,
  dustThreshold: 1000,
};

networks.blk = {
  messagePrefix: '\x19BlackCoin Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x19,
  scriptHash: 0x55,
  wif: 0x99,
  dustThreshold: 1000,
};

networks.sib = {
  messagePrefix: '\x19SibCoin Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x3f,
  scriptHash: 0x28,
  wif: 0x80,
  dustThreshold: 1000,
};

networks.zcash = {
  messagePrefix: '\x19Zcash Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x05358394,
  },
  pubKeyHash: 0x1cb8,
  scriptHash: 0x1cbd,
  wif: 0x80,
  dustThreshold: 1000,
};

networks.hush = {
  messagePrefix: '\Hush Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x1cb8,
  scriptHash: 0x1cbd,
  wif: 0x80,
  dustThreshold: 1000,
};

networks.btc = networks.bitcoin;
networks.crw = networks.crown;
networks.dgb = networks.digibyte;
networks.arg = networks.argentum;
networks.zec = networks.zcash;