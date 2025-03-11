require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  networks: {
    polygon_amoy: {
      url: "https://rpc-amoy.polygon.technology", // RPC Amoy
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 80002 // Amoy chainId
    },
    sepolia: {
      url: "https://ethereum-sepolia.blockpi.network/v1/rpc/public",
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 11155111
    }
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY
    }
  }
};