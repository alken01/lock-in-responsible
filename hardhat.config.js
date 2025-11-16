require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  networks: {
    // Camp K2 Testnet (Main) - "Demonet"
    campTestnet: {
      url: process.env.CAMP_TESTNET_RPC_URL || "https://rpc.basecamp.t.raas.gelato.cloud",
      chainId: 123420001114,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto"
    },

    // Camp Testnet V2 (Alternative)
    campTestnetV2: {
      url: "https://rpc-campnetwork.xyz",
      chainId: 325000,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto"
    },

    // Local development (for testing)
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },

  etherscan: {
    apiKey: {
      campTestnet: process.env.CAMP_EXPLORER_API_KEY || "placeholder"
    },
    customChains: [
      {
        network: "campTestnet",
        chainId: 123420001114,
        urls: {
          apiURL: "https://basecamp.cloud.blockscout.com/api",
          browserURL: "https://basecamp.cloud.blockscout.com"
        }
      }
    ]
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
