/// Deploy script for the TaskEscrow contract.
///
/// Usage:
///   npx hardhat run scripts/deploy.ts --network hedera_testnet

import { ethers } from "hardhat";

/// Deploy TaskEscrow and log the resulting contract address.
async function main(): Promise<void> {
  const factory = await ethers.getContractFactory("TaskEscrow");
  const escrow = await factory.deploy();
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log(`TaskEscrow deployed to: ${address}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
