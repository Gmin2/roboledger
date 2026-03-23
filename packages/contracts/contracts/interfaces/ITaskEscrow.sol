// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {TaskTypes} from "../types/TaskTypes.sol";

/// @title ITaskEscrow
/// @notice Interface for the RoboLedger task escrow contract.
///
/// Integrates with ERC-8004 Reputation and Validation registries:
///   - `completeTask` checks the Validation Registry for sufficient approvals.
///   - Successful completion and refunds both trigger reputation feedback.
interface ITaskEscrow {
    /** Events */

    /// @notice Emitted when a new task is created and HBAR is escrowed.
    event TaskCreated(
        string indexed taskId,
        address indexed client,
        uint256 reward,
        uint256 deadline,
        uint8 requiredValidations
    );

    /// @notice Emitted when a robot is assigned to execute a task.
    event TaskAssigned(string indexed taskId, address indexed robot);

    /// @notice Emitted when a task is marked complete and payment is released.
    event TaskCompleted(
        string indexed taskId,
        address indexed robot,
        bytes32 proofHash
    );

    /// @notice Emitted when escrowed HBAR is returned to the client.
    event TaskRefunded(string indexed taskId, address indexed client);

    /// @notice Emitted when a validator approves a task's proof.
    event TaskValidated(
        string indexed taskId,
        address indexed validator,
        uint8 totalValidations
    );

    /** Errors */

    error ZeroReward();
    error TaskAlreadyExists();
    error DeadlineNotFuture();
    error OnlyClient();
    error InvalidStatus(TaskTypes.Status expected, TaskTypes.Status actual);
    error InvalidRobotAddress();
    error OnlyAssignedRobot();
    error DeadlineElapsed();
    error DeadlineNotReached();
    error TransferFailed();
    error InsufficientValidations(uint8 required, uint8 received);
    error AlreadyValidated();
    error TaskNotAssigned();

    /** External Functions */

    /// @notice Create a task and lock `msg.value` as the reward.
    /// @param taskId               Unique task identifier.
    /// @param deadline             Unix timestamp after which a refund may be triggered.
    /// @param requiredValidations  Number of validator approvals needed (0 = no validation required).
    function createTask(
        string calldata taskId,
        uint256 deadline,
        uint8 requiredValidations
    ) external payable;

    /// @notice Assign a robot to an open task.
    function assignTask(string calldata taskId, address robot) external;

    /// @notice Submit a validation approval for a task's proof.
    /// @dev Any address can validate. Each address can only validate once per task.
    function validateTask(string calldata taskId) external;

    /// @notice Mark a task as completed and release escrowed funds.
    /// @dev Reverts if required validations have not been met.
    function completeTask(string calldata taskId, bytes32 proofHash) external;

    /// @notice Refund escrowed HBAR to the client after the deadline.
    function refundTask(string calldata taskId) external;

    /// @notice Read the full on-chain record for a task.
    function getTask(string calldata taskId) external view returns (TaskTypes.Task memory task);
}
