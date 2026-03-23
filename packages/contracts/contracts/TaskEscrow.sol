// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title TaskEscrow
/// @notice Escrow contract for robotic task management on Hedera.
///
/// Clients create tasks by locking HBAR as a reward. Once a robot is assigned
/// and submits a valid proof-of-completion before the deadline, the escrowed
/// funds are released to the robot. If the deadline passes without completion,
/// anyone may trigger a refund back to the client.
contract TaskEscrow {
    // -----------------------------------------------------------------------
    // Types
    // -----------------------------------------------------------------------

    /// @notice Lifecycle states of a task.
    enum TaskStatus {
        Open,
        Assigned,
        Completed,
        Refunded
    }

    /// @notice On-chain representation of a single task.
    struct Task {
        address client;
        address robot;
        uint256 reward;
        uint256 deadline;
        bytes32 proofHash;
        TaskStatus status;
    }

    // -----------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------

    /// @notice Map of task ID to its on-chain task record.
    mapping(string => Task) public tasks;

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    /// @notice Emitted when a new task is created and funds are escrowed.
    /// @param taskId  Unique identifier for the task.
    /// @param client  Address of the client who created the task.
    /// @param reward  Amount of HBAR locked as reward (in wei).
    /// @param deadline Unix timestamp after which a refund may be claimed.
    event TaskCreated(
        string indexed taskId,
        address indexed client,
        uint256 reward,
        uint256 deadline
    );

    /// @notice Emitted when a robot is assigned to a task.
    /// @param taskId Unique identifier for the task.
    /// @param robot  Address of the assigned robot operator.
    event TaskAssigned(string indexed taskId, address indexed robot);

    /// @notice Emitted when a task is completed and payment is released.
    /// @param taskId    Unique identifier for the task.
    /// @param robot     Address of the robot that completed the task.
    /// @param proofHash Keccak-256 hash of the off-chain proof payload.
    event TaskCompleted(
        string indexed taskId,
        address indexed robot,
        bytes32 proofHash
    );

    /// @notice Emitted when escrowed funds are refunded to the client.
    /// @param taskId Unique identifier for the task.
    /// @param client Address of the client receiving the refund.
    event TaskRefunded(string indexed taskId, address indexed client);

    // -----------------------------------------------------------------------
    // External / Public Functions
    // -----------------------------------------------------------------------

    /// @notice Create a new task and lock the sent HBAR as the reward.
    /// @dev Reverts if `msg.value` is zero or if a task with `taskId` already exists.
    /// @param taskId   Unique identifier for the task.
    /// @param deadline Unix timestamp after which a refund becomes available.
    function createTask(string calldata taskId, uint256 deadline) external payable {
        require(msg.value > 0, "Reward must be > 0");
        require(tasks[taskId].client == address(0), "Task already exists");
        require(deadline > block.timestamp, "Deadline must be in the future");

        tasks[taskId] = Task({
            client: msg.sender,
            robot: address(0),
            reward: msg.value,
            deadline: deadline,
            proofHash: bytes32(0),
            status: TaskStatus.Open
        });

        emit TaskCreated(taskId, msg.sender, msg.value, deadline);
    }

    /// @notice Assign a robot to an open task.
    /// @dev Only the original client may call this. Reverts if the task is not `Open`.
    /// @param taskId Unique identifier for the task.
    /// @param robot  Address of the robot operator to assign.
    function assignTask(string calldata taskId, address robot) external {
        Task storage task = tasks[taskId];
        require(task.client == msg.sender, "Only client can assign");
        require(task.status == TaskStatus.Open, "Task not open");
        require(robot != address(0), "Invalid robot address");

        task.robot = robot;
        task.status = TaskStatus.Assigned;

        emit TaskAssigned(taskId, robot);
    }

    /// @notice Mark a task as completed and release payment to the robot.
    /// @dev Only the assigned robot may call this. Reverts if the deadline has passed.
    /// @param taskId    Unique identifier for the task.
    /// @param proofHash Keccak-256 hash of the off-chain completion proof.
    function completeTask(string calldata taskId, bytes32 proofHash) external {
        Task storage task = tasks[taskId];
        require(task.robot == msg.sender, "Only assigned robot");
        require(task.status == TaskStatus.Assigned, "Task not assigned");
        require(block.timestamp <= task.deadline, "Deadline passed");

        task.proofHash = proofHash;
        task.status = TaskStatus.Completed;

        (bool sent, ) = payable(task.robot).call{value: task.reward}("");
        require(sent, "Payment failed");

        emit TaskCompleted(taskId, task.robot, proofHash);
    }

    /// @notice Refund escrowed HBAR to the client after the deadline.
    /// @dev Anyone may call this once the deadline has elapsed and the task is
    ///      still in the `Open` or `Assigned` state.
    /// @param taskId Unique identifier for the task.
    function refundTask(string calldata taskId) external {
        Task storage task = tasks[taskId];
        require(
            task.status == TaskStatus.Open || task.status == TaskStatus.Assigned,
            "Task not refundable"
        );
        require(block.timestamp > task.deadline, "Deadline not reached");

        task.status = TaskStatus.Refunded;

        (bool sent, ) = payable(task.client).call{value: task.reward}("");
        require(sent, "Refund failed");

        emit TaskRefunded(taskId, task.client);
    }

    /// @notice Retrieve the full on-chain record for a task.
    /// @param taskId Unique identifier for the task.
    /// @return client    Address of the task creator.
    /// @return robot     Address of the assigned robot (zero if unassigned).
    /// @return reward    Escrowed reward amount in wei.
    /// @return deadline  Unix timestamp of the task deadline.
    /// @return proofHash Proof hash (zero if not yet completed).
    /// @return status    Current lifecycle status.
    function getTask(string calldata taskId)
        external
        view
        returns (
            address client,
            address robot,
            uint256 reward,
            uint256 deadline,
            bytes32 proofHash,
            TaskStatus status
        )
    {
        Task storage task = tasks[taskId];
        return (
            task.client,
            task.robot,
            task.reward,
            task.deadline,
            task.proofHash,
            task.status
        );
    }
}
