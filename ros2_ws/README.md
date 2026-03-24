# RoboLedger ROS2 Workspace

ROS2 Jazzy packages that bridge physical robots to the Hedera task marketplace.

## Packages

### roboledger_interfaces

Custom ROS2 message and service definitions.

| Type | Name | Purpose |
|------|------|---------|
| msg | `TaskPost` | Task posted by a client (requirements, location, reward) |
| msg | `TaskBid` | Bid submitted by a robot (ETA, signature) |
| msg | `ProofData` | Proof-of-completion evidence (GPS, sensor, photo hashes) |
| msg | `TaskStatus` | Current task lifecycle state |
| msg | `TxStatus` | Hedera transaction status (pending/in_block/finalized/failed) |
| srv | `GetRobotInfo` | Query robot account info from mirror node |

### roboledger_ros2

Bridge nodes connecting ROS2 to Hedera.

**bridge_node** — Subscribes to `/roboledger/proof_data`, hashes sensor fields with SHA-256, calls the TypeScript CLI via subprocess to submit proof messages to HCS. Includes retry logic (3 attempts, 5s delay) and failure logging to `/tmp/roboledger_failures.jsonl`.

**task_node** — Polls the Hedera mirror node REST API every 5 seconds for new task and bid messages on HCS topics. Decodes base64 message content, publishes `TaskPost` messages to `/roboledger/available_tasks` and status updates to `/roboledger/task_status`.

### roboledger_simulator

Mock robot fleet for demo and testing.

**mock_robot** — Publishes simulated GPS and velocity data at 1Hz. Linearly interpolates position from start to destination coordinates.

**task_executor** — Subscribes to available tasks, checks capability match, bids if qualified, simulates execution (10s), then publishes proof data. Three instances run with different capabilities:
- Robot 1: `delivery`, `outdoor`
- Robot 2: `delivery`, `indoor`
- Robot 3: `inspection`, `outdoor`

## Build

```bash
colcon build
source install/setup.bash
```

## Run

```bash
# Launch 3-robot fleet simulator
ros2 launch roboledger_simulator sim_fleet.launch.py

# Launch bridge + task nodes (in separate terminal)
ros2 launch roboledger_ros2 roboledger.launch.py
```

## Configuration

Copy and fill `src/roboledger_ros2/config/robot_config.example.yaml` to `robot_config.yaml` with your testnet IDs and keys.

## Topics

| Topic | Type | Direction |
|-------|------|-----------|
| `/roboledger/available_tasks` | TaskPost | task_node → simulators |
| `/roboledger/proof_data` | ProofData | simulators → bridge_node |
| `/roboledger/tx_status` | TxStatus | bridge_node → all |
| `/roboledger/task_status` | TaskStatus | task_node → all |
| `/roboledger/bid_outbox` | TaskBid | simulators → bridge_node |
| `/{robot_id}/gps` | String (JSON) | mock_robot → all |
| `/{robot_id}/cmd_vel` | Twist | mock_robot → all |
