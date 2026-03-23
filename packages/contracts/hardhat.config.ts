/// Hardhat configuration for the RoboLedger contracts package.
///
/// Targets Hedera Testnet via the Hashio JSON-RPC relay. Requires the
/// `OPERATOR_PRIVATE_KEY_HEX` environment variable to be set for deployment.

import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "../../.env") });

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
      /** Hedera requires explicit gas configuration via JSON-RPC relay. */
      gas: 3_000_000,
      gasPrice: 1_200_000_000_000,
      timeout: 120_000,
    },
  },
};

export default config;
