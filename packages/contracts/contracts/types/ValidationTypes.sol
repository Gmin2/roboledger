// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title ValidationTypes
/// @notice Shared type definitions for the ERC-8004 Validation Registry.
library ValidationTypes {
    /// @notice On-chain record of a validation response.
    /// @param validatorAddress Address of the validator contract or EOA.
    /// @param robotId          NFT token ID or account identifier of the robot.
    /// @param response         Validation result (0 = failed, 100 = passed, intermediate allowed).
    /// @param responseHash     Keccak-256 commitment to off-chain evidence.
    /// @param tag              Custom categorization (e.g. "delivery-proof", "gps-verified").
    /// @param lastUpdate       Block timestamp of the most recent response update.
    struct ValidationRecord {
        address validatorAddress;
        uint256 robotId;
        uint8 response;
        bytes32 responseHash;
        string tag;
        uint256 lastUpdate;
    }
}
