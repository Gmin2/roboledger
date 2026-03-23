// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title TaskTypes
/// @notice Shared type definitions for the RoboLedger task escrow system.
///
/// All structs and enums consumed across interfaces and implementations
/// live here to prevent circular imports and ensure a single source of truth.
library TaskTypes {
    /// @notice Lifecycle states a task may occupy.
    ///
    /// Transitions:
    ///   Open -> Assigned -> Completed
    ///   Open -> Refunded
    ///   Assigned -> Refunded  (after deadline)
    enum Status {
        Open,
        Assigned,
        Completed,
        Refunded
    }

    /// @notice On-chain representation of a single task.
    /// @param client    Address that created and funded the task.
    /// @param robot     Address assigned to execute the task (zero when unassigned).
    /// @param reward    HBAR amount locked as payment (in wei/tinybar).
    /// @param deadline  Unix timestamp beyond which the task is refundable.
    /// @param proofHash Keccak-256 digest of the off-chain completion proof.
    /// @param status    Current lifecycle state.
    struct Task {
        address client;
        address robot;
        uint256 reward;
        uint256 deadline;
        bytes32 proofHash;
        Status status;
    }
}
