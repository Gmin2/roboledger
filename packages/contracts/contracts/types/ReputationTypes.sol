// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title ReputationTypes
/// @notice Shared type definitions for the ERC-8004 Reputation Registry.
library ReputationTypes {
    /// @notice A single feedback entry from a client to a robot.
    /// @param value         Signed fixed-point score (e.g. 87 with decimals=0 means 87/100).
    /// @param valueDecimals Number of decimal places in `value` (0-18).
    /// @param tag1          Primary categorization tag (e.g. "taskSuccess").
    /// @param tag2          Secondary categorization tag (e.g. "delivery").
    /// @param isRevoked     Whether this feedback has been revoked by the client.
    struct Feedback {
        int128 value;
        uint8 valueDecimals;
        string tag1;
        string tag2;
        bool isRevoked;
    }
}
