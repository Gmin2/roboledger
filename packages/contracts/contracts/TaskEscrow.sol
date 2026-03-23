// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ITaskEscrow} from "./interfaces/ITaskEscrow.sol";
import {IReputationRegistry} from "./interfaces/IReputationRegistry.sol";
import {TaskTypes} from "./types/TaskTypes.sol";

/// @title TaskEscrow
/// @author RoboLedger
/// @notice Escrow contract integrating ERC-8004 reputation and validation.
///
/// Lifecycle:
///   1. Client calls `createTask` with HBAR + validation requirements.
///   2. Client calls `assignTask` to bind a robot.
///   3. Validators call `validateTask` to approve the robot's proof.
///   4. Robot calls `completeTask` — contract checks validation threshold,
///      releases HBAR, and submits positive reputation feedback.
///   5. On deadline refund, negative reputation feedback is submitted.
///
/// The contract holds a reference to the ReputationRegistry and
/// auto-submits feedback on settlement and refund. Validation is tracked
/// internally (per-task validator set) for gas efficiency.
contract TaskEscrow is ITaskEscrow {
    /// @notice Internal storage of all task records.
    mapping(string => TaskTypes.Task) private _tasks;

    /// @notice Track which addresses have validated each task.
    mapping(string => mapping(address => bool)) private _hasValidated;

    /// @notice Reference to the ERC-8004 Reputation Registry.
    IReputationRegistry public immutable reputationRegistry;

    /// @param reputationRegistry_ Address of the deployed ReputationRegistry.
    ///        Pass address(0) to disable automatic reputation feedback.
    constructor(address reputationRegistry_) {
        reputationRegistry = IReputationRegistry(reputationRegistry_);
    }

    /// @inheritdoc ITaskEscrow
    function createTask(
        string calldata taskId,
        uint256 deadline,
        uint8 requiredValidations
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
            status: TaskTypes.Status.Open,
            requiredValidations: requiredValidations,
            receivedValidations: 0
        });

        emit TaskCreated(taskId, msg.sender, msg.value, deadline, requiredValidations);
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
    function validateTask(string calldata taskId) external override {
        TaskTypes.Task storage task = _tasks[taskId];

        if (task.status != TaskTypes.Status.Assigned) revert TaskNotAssigned();
        if (_hasValidated[taskId][msg.sender]) revert AlreadyValidated();

        _hasValidated[taskId][msg.sender] = true;
        task.receivedValidations++;

        emit TaskValidated(taskId, msg.sender, task.receivedValidations);
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
        if (task.receivedValidations < task.requiredValidations) {
            revert InsufficientValidations(
                task.requiredValidations,
                task.receivedValidations
            );
        }

        /// Effects before interactions (CEI pattern).
        task.proofHash = proofHash;
        task.status = TaskTypes.Status.Completed;

        /// Submit positive reputation feedback if registry is configured.
        _submitFeedback(task.robot, task.client, 100, "taskSuccess");

        /// Interaction: transfer escrowed funds to the robot.
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

        /// Effects before interactions (CEI pattern).
        task.status = TaskTypes.Status.Refunded;

        /// Submit negative reputation feedback if a robot was assigned.
        if (task.robot != address(0)) {
            _submitFeedback(task.robot, task.client, 0, "taskFailed");
        }

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

    /// @notice Check whether an address has validated a specific task.
    function hasValidated(
        string calldata taskId,
        address validator
    ) external view returns (bool) {
        return _hasValidated[taskId][validator];
    }

    /// @notice Submit reputation feedback, silently skipping if registry is address(0).
    function _submitFeedback(
        address robotId,
        address clientAddress,
        int128 score,
        string memory tag
    ) private {
        if (address(reputationRegistry) == address(0)) return;

        /// Use try/catch so reputation failure never blocks payment.
        try reputationRegistry.giveFeedback(robotId, score, 0, tag, "") {
            // Feedback submitted.
        } catch {
            // Reputation failure must not block escrow settlement.
        }
    }
}
