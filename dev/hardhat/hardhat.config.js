require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TEQOIN_RPC_URL = process.env.TEQOIN_RPC_URL || "https://rpc.teqoin.io";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    teqoinTestnet: {
      url: TEQOIN_RPC_URL,
      chainId: 420377,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  }
};
