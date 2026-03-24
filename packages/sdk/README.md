# @roboledger/sdk

TypeScript SDK for the RoboLedger protocol on Hedera.

Wraps `@hashgraph/sdk` with domain-specific methods for the robot task marketplace. All Hedera interactions go through this SDK — pages and CLI never import `@hashgraph/sdk` directly.

## Modules

| Module | Functions | Purpose |
|--------|-----------|---------|
| `client` | `createClient()` | Hedera testnet client factory |
| `robot` | `mintRobot()`, `verifyRobot()` | Mint NFT identity, check KYC status |
| `task` | `postTask()`, `bidOnTask()`, `listenToTasks()` | HCS marketplace messaging |
| `proof` | `submitProof()` | Stream proof-of-completion to HCS |
| `payment` | `createEscrow()`, `settlePayment()`, `refundPayment()` | Smart contract escrow lifecycle |
| `payment` | `validateTask()` | Multi-party validation approval |
| `payment` | `queryReputation()` | On-chain reputation queries |

## Usage

```typescript
import { createClient, postTask, bidOnTask, submitProof, createEscrow } from '@roboledger/sdk';

const client = createClient('0.0.12345', '0x...');

await postTask(client, topicId, {
  taskId: 'task-001',
  requirements: ['delivery', 'outdoor'],
  location: { fromLat: 37.77, fromLng: -122.42, toLat: 37.78, toLng: -122.41 },
  rewardHbar: 5,
  deadline: '2026-03-25T00:00:00Z',
});
```

## Build

```bash
pnpm build   # outputs to dist/
```
