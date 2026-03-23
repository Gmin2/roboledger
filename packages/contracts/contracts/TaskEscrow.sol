// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ITaskEscrow} from "./interfaces/ITaskEscrow.sol";
import {TaskTypes} from "./types/TaskTypes.sol";

/// @title TaskEscrow
/// @author RoboLedger
/// @notice Escrow contract for the decentralized robot task marketplace.
///
/// Lifecycle:
///   1. Client calls `createTask` with HBAR attached — funds are locked.
///   2. Client calls `assignTask` to bind a robot to the task.
///   3. Robot calls `completeTask` with a proof hash — funds are released.
///   4. If the deadline elapses without completion, anyone calls `refundTask`.
///
/// Design rationale:
///   - Custom errors over require-strings to reduce deployment and call gas.
///   - Checks-effects-interactions pattern on every state-mutating path.
///   - No admin key or upgradability — the contract is intentionally immutable.
contract TaskEscrow is ITaskEscrow {
    /// @notice Internal storage of all task records, keyed by task identifier.
    mapping(string => TaskTypes.Task) private _tasks;

    /// @inheritdoc ITaskEscrow
    function createTask(
        string calldata taskId,
        uint256 deadline
    ) external payable override {
        if (msg.value == 0) revert ZeroReward();
        if (_tasks[taskId].client != address(0)) revert TaskAlreadyExists();
        if (deadline <= block.timestamp) revert DeadlineNotFuture();

        _tasks[taskId] = TaskTypes.Task({
            client: msg.sender,
            robot: address(0),
            reward: msg.value,
            deadline: deadline,
            proofHash: bytes32(0),
            status: TaskTypes.Status.Open
        });

        emit TaskCreated(taskId, msg.sender, msg.value, deadline);
    }

    /// @inheritdoc ITaskEscrow
    function assignTask(
        string calldata taskId,
        address robot
    ) external override {
        TaskTypes.Task storage task = _tasks[taskId];

        if (task.client != msg.sender) revert OnlyClient();
        if (task.status != TaskTypes.Status.Open) {
            revert InvalidStatus(TaskTypes.Status.Open, task.status);
        }
        if (robot == address(0)) revert InvalidRobotAddress();

        task.robot = robot;
        task.status = TaskTypes.Status.Assigned;

        emit TaskAssigned(taskId, robot);
    }

    /// @inheritdoc ITaskEscrow
    function completeTask(
        string calldata taskId,
        bytes32 proofHash
    ) external override {
        TaskTypes.Task storage task = _tasks[taskId];

        if (task.robot != msg.sender) revert OnlyAssignedRobot();
        if (task.status != TaskTypes.Status.Assigned) {
            revert InvalidStatus(TaskTypes.Status.Assigned, task.status);
        }
        if (block.timestamp > task.deadline) revert DeadlineElapsed();

        // Effects before interactions (CEI pattern).
        task.proofHash = proofHash;
        task.status = TaskTypes.Status.Completed;

        // Interaction: transfer escrowed funds to the robot.
        (bool sent, ) = payable(task.robot).call{value: task.reward}("");
        if (!sent) revert TransferFailed();

        emit TaskCompleted(taskId, task.robot, proofHash);
    }

    /// @inheritdoc ITaskEscrow
    function refundTask(string calldata taskId) external override {
        TaskTypes.Task storage task = _tasks[taskId];

        bool refundable = task.status == TaskTypes.Status.Open
            || task.status == TaskTypes.Status.Assigned;
        if (!refundable) {
            revert InvalidStatus(TaskTypes.Status.Open, task.status);
        }
        if (block.timestamp <= task.deadline) revert DeadlineNotReached();

        // Effects before interactions (CEI pattern).
        task.status = TaskTypes.Status.Refunded;

        (bool sent, ) = payable(task.client).call{value: task.reward}("");
        if (!sent) revert TransferFailed();

        emit TaskRefunded(taskId, task.client);
    }

    /// @inheritdoc ITaskEscrow
    function getTask(
        string calldata taskId
    ) external view override returns (TaskTypes.Task memory task) {
        task = _tasks[taskId];
    }
}
