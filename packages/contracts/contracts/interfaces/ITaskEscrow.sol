// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {TaskTypes} from "../types/TaskTypes.sol";

/// @title ITaskEscrow
/// @notice Interface for the RoboLedger task escrow contract.
///
/// Defines the external surface through which clients create tasks, operators
/// assign robots, robots submit completion proofs, and anyone may trigger
/// deadline-based refunds.  All state-mutating operations emit a
/// corresponding event for off-chain indexing.
interface ITaskEscrow {
    /** Events */

    /// @notice Emitted when a new task is created and HBAR is escrowed.
    /// @param taskId   Unique task identifier.
    /// @param client   Address of the funding client.
    /// @param reward   Amount of HBAR locked (wei/tinybar).
    /// @param deadline Unix timestamp after which the task becomes refundable.
    event TaskCreated(
        string indexed taskId,
        address indexed client,
        uint256 reward,
        uint256 deadline
    );

    /// @notice Emitted when a robot is assigned to execute a task.
    /// @param taskId Unique task identifier.
    /// @param robot  Address of the assigned robot operator.
    event TaskAssigned(string indexed taskId, address indexed robot);

    /// @notice Emitted when a task is marked complete and payment is released.
    /// @param taskId    Unique task identifier.
    /// @param robot     Address of the completing robot.
    /// @param proofHash Keccak-256 digest of the off-chain proof payload.
    event TaskCompleted(
        string indexed taskId,
        address indexed robot,
        bytes32 proofHash
    );

    /// @notice Emitted when escrowed HBAR is returned to the client.
    /// @param taskId Unique task identifier.
    /// @param client Address receiving the refund.
    event TaskRefunded(string indexed taskId, address indexed client);

    /** Errors */

    /// @notice Reward must be greater than zero.
    error ZeroReward();

    /// @notice A task with the given identifier already exists.
    error TaskAlreadyExists();

    /// @notice The supplied deadline is not in the future.
    error DeadlineNotFuture();

    /// @notice Caller is not the task's client.
    error OnlyClient();

    /// @notice The task is not in the expected lifecycle state.
    /// @param expected The status the operation requires.
    /// @param actual   The current status of the task.
    error InvalidStatus(TaskTypes.Status expected, TaskTypes.Status actual);

    /// @notice The supplied robot address is the zero address.
    error InvalidRobotAddress();

    /// @notice Caller is not the assigned robot.
    error OnlyAssignedRobot();

    /// @notice The task deadline has already elapsed.
    error DeadlineElapsed();

    /// @notice The task deadline has not yet elapsed (refund not available).
    error DeadlineNotReached();

    /// @notice Native token transfer failed.
    error TransferFailed();

    /** External Functions */

    /// @notice Create a task and lock `msg.value` as the reward.
    /// @param taskId   Unique task identifier.
    /// @param deadline Unix timestamp after which a refund may be triggered.
    function createTask(string calldata taskId, uint256 deadline) external payable;

    /// @notice Assign a robot to an open task.
    /// @param taskId Unique task identifier.
    /// @param robot  Address of the robot operator.
    function assignTask(string calldata taskId, address robot) external;

    /// @notice Mark a task as completed and release escrowed funds.
    /// @param taskId    Unique task identifier.
    /// @param proofHash Keccak-256 digest of the off-chain proof payload.
    function completeTask(string calldata taskId, bytes32 proofHash) external;

    /// @notice Refund escrowed HBAR to the client after the deadline.
    /// @param taskId Unique task identifier.
    function refundTask(string calldata taskId) external;

    /// @notice Read the full on-chain record for a task.
    /// @param taskId Unique task identifier.
    /// @return task  The stored task struct.
    function getTask(string calldata taskId) external view returns (TaskTypes.Task memory task);
}
