# @roboledger/cli

Thin CLI bridge that wraps the TypeScript SDK for subprocess calls from Python ROS2 nodes.

The ROS2 bridge nodes are Python but the Hedera SDK is TypeScript. This CLI bridges the gap — Python calls `node cli.js <command> <json>` via subprocess and reads JSON from stdout.

## Commands

```bash
node dist/cli.js submit-proof '{"task_id":"t1","robot_id":"0.0.123","gps_hash":"abc"}'
node dist/cli.js bid-task '{"task_id":"t1","robot_id":"0.0.123","eta":15}'
node dist/cli.js post-task '{"taskId":"t1","requirements":["delivery"],"rewardHbar":5}'
node dist/cli.js get-tasks
node dist/cli.js get-robot-info 0.0.12345
```

## Output

- Success: JSON to stdout, exit code 0
- Failure: JSON error to stderr, exit code 1

## Build

```bash
pnpm build   # outputs to dist/cli.js
```
