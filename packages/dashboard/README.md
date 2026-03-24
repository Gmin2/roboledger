# RoboLedger Dashboard

React/Vite web dashboard with live Hedera testnet data and architecture presentation.

## Pages

| Route | Page | Data Source |
|-------|------|-------------|
| `/` | Landing page | Static (hero + sections) |
| `/fleet` | Fleet registry | Mirror Node (NFTs, balances) + ReputationRegistry contract |
| `/tasks` | Task marketplace | HCS topics (tasks + bids), auto-refreshes every 10s |
| `/proofs` | Proof stream | HCS proofs topic, auto-refreshes every 10s |
| `/trust` | ERC-8004 registries | Mirror Node + contract queries |
| `/demo` | Live demo | Executes real Hedera transactions from browser |
| `/archi` | Architecture presentation | Static (scroll-spy + ReactFlow diagrams) |

## Hedera Integration

All SDK interactions are isolated in `src/lib/`:

| File | Purpose |
|------|---------|
| `hedera-config.ts` | Reads from `VITE_*` env vars |
| `hedera-mirror.ts` | Mirror Node REST API (fetch NFTs, tasks, proofs, balances) |
| `hedera-contracts.ts` | Contract queries via `@hashgraph/sdk` (task state, reputation) |
| `hedera-demo.ts` | Full demo transaction sequence |

Pages never import `@hashgraph/sdk` directly.

## Setup

```bash
cp .env.example .env   # add your VITE_* testnet credentials
pnpm dev               # starts at http://localhost:5173
```

## Build

```bash
pnpm build
```
