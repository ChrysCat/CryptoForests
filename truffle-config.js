// See <http://truffleframework.com/docs/advanced/configuration>
// to customize your Truffle configuration!
const fs = require('fs');
const { join } = require('path');

const HDWalletProvider = require('@truffle/hdwallet-provider');

const mnemonic = fs.readFileSync(".mnemonic").toString().trim();
const mnemonic_rinkeby = fs.readFileSync(".mnemonic_rinkeby").toString().trim();

// curl https://public-node.testnet.rsk.co/2.0.1/ -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}' > .gas-price-testnet.json

const gasPriceTestnetRaw = fs.readFileSync(".minimum-gas-price-testnet.json").toString().trim();
const minimumGasPriceTestnet = parseInt(JSON.parse(gasPriceTestnetRaw).result.minimumGasPrice, 16);
if (typeof minimumGasPriceTestnet !== 'number' || isNaN(minimumGasPriceTestnet)) {
  throw new Error('unable to retrieve network gas price from .gas-price-testnet.json');
}
console.log("Minimum gas price Testnet: " + minimumGasPriceTestnet);


module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */
  contracts_build_directory: join(__dirname, './client/src/json'),
  networks: {
    develop: {
      port: 8545
    },
    testnet: {
      provider: () => new HDWalletProvider(mnemonic, 'https://public-node.testnet.rsk.co', 0, 10, true, "m/44'/37310'/0'/0/"),
      network_id: 31,
      gasPrice: Math.floor(minimumGasPriceTestnet * 1.1),
      networkCheckTimeout: 1e9
    },
    rinkeby: {
      provider: function () {
        const apiKey = '7afa2766c5c14e63b00e0935c24b32b5';
        return new HDWalletProvider(mnemonic_rinkeby, `https://rinkeby.infura.io/v3/${apiKey}`)
      },
      network_id: 4,
      gasPrice: 15000000001,
      skipDryRun: true
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {},

  // Configure your compilers
  compilers: {
    solc: {}
  }
}
