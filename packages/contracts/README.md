# @roboledger/contracts

Solidity smart contracts implementing the ERC-8004 trust protocol for physical robots on Hedera.

## Contracts

### TaskEscrow

The core marketplace contract. Clients lock HBAR when posting tasks. Robots get paid when they prove completion and validators approve.

- `createTask(taskId, deadline, requiredValidations)` — lock HBAR
- `assignTask(taskId, robot)` — bind a robot to the task
- `validateTask(taskId)` — validator approves (each address once)
- `completeTask(taskId, proofHash)` — release payment (checks validation threshold)
- `refundTask(taskId)` — return HBAR after deadline

Integrates with ReputationRegistry — auto-submits positive feedback on completion, negative on refund.

### ReputationRegistry

ERC-8004 Reputation Registry. Stores on-chain feedback from clients to robots.

- `giveFeedback(robotId, value, decimals, tag1, tag2)` — submit feedback
- `getSummary(robotId, tag)` — aggregate score query
- `revokeFeedback(robotId, index)` — revoke previous feedback
- Tags: `taskSuccess`, `taskFailed`, `deliverySpeed`, `proofQuality`

### ValidationRegistry

ERC-8004 Validation Registry. Tracks independent validator attestations.

- `validationRequest(validator, robotId, requestURI, requestHash)` — request validation
- `validationResponse(requestHash, response, responseURI, responseHash, tag)` — submit assessment (0-100)
- `getSummary(robotId, validators)` — aggregate validation stats

## Structure

```
contracts/
├── interfaces/
│   ├── ITaskEscrow.sol
│   ├── IReputationRegistry.sol
│   └── IValidationRegistry.sol
├── types/
│   ├── TaskTypes.sol
│   ├── ReputationTypes.sol
│   └── ValidationTypes.sol
├── TaskEscrow.sol
├── ReputationRegistry.sol
└── ValidationRegistry.sol
```

## Tests

35 tests covering all three contracts:

```bash
npx hardhat test
```

## Deploy

```bash
npx tsx ../../scripts/deploy-contract.ts
```
