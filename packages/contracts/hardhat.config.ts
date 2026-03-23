/// Hardhat configuration for the RoboLedger contracts package.
///
/// Targets Hedera Testnet via the Hashio JSON-RPC relay. Requires the
/// `OPERATOR_PRIVATE_KEY_HEX` environment variable to be set for deployment.

import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hedera_testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: process.env.OPERATOR_PRIVATE_KEY_HEX
        ? [process.env.OPERATOR_PRIVATE_KEY_HEX]
        : [],
    },
  },
};

export default config;
