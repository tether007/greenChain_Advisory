const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
      gas: 6721975,
      gasPrice: 20000000000
    },
    yellow: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC,
        process.env.YELLOW_RPC_URL || 'https://rpc.yellow.network'
      ),
      network_id: parseInt(process.env.YELLOW_NETWORK_ID || '42420'),
      gas: 6000000,
      gasPrice: 10000000000
    },
    sepolia: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC,
        `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
      ),
      network_id: 11155111,
      gas: 4500000,
      gasPrice: 10000000000
    }
  },
  compilers: {
    solc: {
      version: "0.8.20",
      docker: false,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  contracts_directory: './contracts/',
  contracts_build_directory: './build/contracts/'
};
