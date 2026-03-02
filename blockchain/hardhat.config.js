require("dotenv").config();
require("@nomicfoundation/hardhat-verify");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: process.env.SEPOLIA_PRIVATE_KEY
        ? [process.env.SEPOLIA_PRIVATE_KEY]
        : [],
      chainId: 11155111,
    },
  },
  etherscan: {
  apiKey: process.env.ETHERSCAN_API_KEY,
  customChains: [
    {
      network: "sepolia",
      chainId: 11155111,
      urls: {
        apiURL: "https://api.etherscan.io/v2/api",
        browserURL: "https://sepolia.etherscan.io",
      },
    },
  ],
  },
  sourcify: {
  enabled: true
  }
};