# ICP Canisters for Lock-In Responsible

Decentralized storage, AI validation, and Ethereum bridge running on the Internet Computer.

## Overview

This directory contains three ICP canisters:

1. **Storage Canister** - Stores goal descriptions and proof submissions (replaces IPFS)
2. **AI Validator Canister** - Performs AI validation using HTTPS outcalls to LLM APIs
3. **Bridge Canister** - Enables Ethereum <-> ICP communication using threshold ECDSA

## Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (ICP Hosted)         │
│         https://your-app.ic0.app        │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│          Storage Canister               │
│  - Store goal descriptions              │
│  - Store proof submissions              │
│  - Store validation reasoning           │
│  - Query user's goals/proofs            │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│        AI Validator Canister            │
│  - Validate proof using LLM             │
│  - HTTPS outcalls to OpenAI/Anthropic   │
│  - Or run simple on-chain validation    │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│          Bridge Canister                │
│  - Sign Ethereum transactions           │
│  - Submit votes to GoalRegistry         │
│  - Poll Ethereum for events             │
│  - Threshold ECDSA integration          │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         Ethereum (Polygon)              │
│  - GoalRegistry.sol                     │
│  - ValidatorRegistry.sol                │
│  - Handle staking & rewards             │
└─────────────────────────────────────────┘
```

## Prerequisites

### Install dfx (ICP SDK)

```bash
# Install dfx
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Verify installation
dfx --version
```

### Get Cycles (for deployment)

ICP canisters need cycles to run (similar to gas on Ethereum).

#### Option 1: Free Cycles for Development
```bash
# Use the cycles faucet
dfx wallet balance
```

#### Option 2: Convert ICP to Cycles
1. Get ICP from an exchange
2. Convert to cycles: https://internetcomputer.org/docs/current/developer-docs/setup/cycles

## Setup

### 1. Start Local Replica

```bash
cd icp-canisters

# Start local ICP node
dfx start --background

# Clean start (if needed)
dfx start --clean --background
```

### 2. Deploy Canisters

```bash
# Deploy all canisters locally
dfx deploy

# Or deploy individually
dfx deploy storage
dfx deploy ai_validator
dfx deploy bridge
```

You should see:
```
Deploying: storage
Creating canister storage...
Installing code for canister storage...
Deployed canisters:
  storage: be2us-64aaa-aaaaa-qaabq-cai
  ai_validator: bkyz2-fmaaa-aaaaa-qaaaq-cai
  bridge: bd3sg-teaaa-aaaaa-qaaba-cai
```

### 3. Configure Canisters

```bash
# Set AI API keys (for AI validator)
dfx canister call ai_validator setApiKeys '(
  "sk-your-openai-key",
  "sk-ant-your-anthropic-key",
  "openai"
)'

# Set Ethereum GoalRegistry address (for bridge)
dfx canister call bridge setGoalRegistry '("0x...")'
```

## Usage Examples

### Store a Goal

```bash
dfx canister call storage storeGoal '(
  1,
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "Complete 100 pushups",
  "Do 100 pushups in one session",
  "fitness",
  100
)'
```

Response:
```
(1 : nat)
```

### Store Proof Submission

```bash
dfx canister call storage storeProof '(
  1,
  "I completed 100 pushups today. Here is the proof...",
  vec { "QmXyz123..."; "QmAbc456..." }
)'
```

Response:
```
("1" : text)
```

### Get Goal Data

```bash
dfx canister call storage getGoal '(1)'
```

Response:
```
(
  opt record {
    goalId = 1;
    userId = principal "xxxxx-xxxxx-xxxxx";
    ethAddress = "0x742d35Cc...";
    title = "Complete 100 pushups";
    description = "Do 100 pushups in one session";
    goalType = "fitness";
    target = 100;
    createdAt = 1701234567890123456;
  }
)
```

### Validate Proof with AI

```bash
dfx canister call ai_validator validateProof '(
  record {
    title = "Complete 100 pushups";
    description = "Do 100 pushups in one session";
    goalType = "fitness";
  },
  record {
    proofText = "I completed 100 pushups today...";
    imageHashes = vec { "QmXyz..." };
  }
)'
```

Response:
```
(
  record {
    approved = true;
    confidence = 85 : nat8;
    reasoning = "Proof demonstrates clear completion...";
    manipulationDetected = false;
  }
)
```

### Get Statistics

```bash
# Storage stats
dfx canister call storage getStats

# AI validator stats
dfx canister call ai_validator getStats

# Bridge stats
dfx canister call bridge getStats
```

## Deploy to Mainnet

### 1. Get Cycles

You need cycles to deploy to mainnet. See "Get Cycles" section above.

### 2. Deploy

```bash
# Deploy to mainnet
dfx deploy --network ic

# Check canister IDs
dfx canister --network ic id storage
dfx canister --network ic id ai_validator
dfx canister --network ic id bridge
```

### 3. Top Up Cycles

```bash
# Check balance
dfx canister --network ic status storage

# Add cycles
dfx canister --network ic deposit-cycles 1000000000000 storage
```

### 4. Configure for Production

```bash
# Set production API keys
dfx canister --network ic call ai_validator setApiKeys '(
  "sk-prod-openai-key",
  "sk-ant-prod-anthropic-key",
  "openai"
)'

# Set production GoalRegistry address
dfx canister --network ic call bridge setGoalRegistry '("0x...")'
```

## Frontend Integration

### 1. Install Agent

```bash
cd ../frontend
npm install @dfinity/agent @dfinity/candid @dfinity/principal
```

### 2. Import Declarations

```javascript
// frontend/src/lib/icp.ts
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory as storageIdl } from "../../icp-canisters/declarations/storage";
import { idlFactory as aiValidatorIdl } from "../../icp-canisters/declarations/ai_validator";

const agent = new HttpAgent({
  host: process.env.VITE_ICP_HOST || "https://ic0.app",
});

// For local development, disable certificate verification
if (process.env.NODE_ENV !== "production") {
  agent.fetchRootKey();
}

export const storageActor = Actor.createActor(storageIdl, {
  agent,
  canisterId: process.env.VITE_STORAGE_CANISTER_ID,
});

export const aiValidatorActor = Actor.createActor(aiValidatorIdl, {
  agent,
  canisterId: process.env.VITE_AI_VALIDATOR_CANISTER_ID,
});
```

### 3. Use in React

```typescript
// Store goal on ICP instead of IPFS
async function createGoal(goalData) {
  // 1. Store goal metadata on ICP
  const goalId = await storageActor.storeGoal(
    goalData.id,
    userAddress,
    goalData.title,
    goalData.description,
    goalData.type,
    goalData.target
  );

  // 2. Create goal on Ethereum (with ICP canister ID as reference)
  await goalRegistryContract.createGoal(
    `icp:storage:${goalId}`, // Reference to ICP storage
    deadline,
    deviceId,
    { value: stakeAmount }
  );
}

// Submit proof to ICP
async function submitProof(goalId, proofText, images) {
  // Upload to ICP
  const proofId = await storageActor.storeProof(
    goalId,
    proofText,
    images
  );

  // Submit to Ethereum
  await goalRegistryContract.submitProof(
    goalId,
    `icp:storage:${proofId}`
  );
}
```

## Cost Comparison

### Traditional Stack (IPFS + AWS):
- IPFS Pinning: ~$0.15/GB/month
- AWS EC2: ~$10/month
- Total: **~$10-15/month**

### ICP Stack:
- Storage: ~$5/GB/year (12x cheaper!)
- Compute: ~$0.50/month
- Total: **~$0.50-1/month**

### Example:
- 1000 goals with proofs (avg 100KB each) = 100MB
- ICP cost: ~$0.04/month
- IPFS cost: ~$15/month
- **Savings: 99.7%**

## Monitoring

### Check Canister Status

```bash
# Status
dfx canister status storage
dfx canister status ai_validator
dfx canister status bridge

# Cycles balance
dfx canister call storage getCyclesBalance
```

### View Logs

```bash
# Not available yet in ICP, but coming soon
# For now, use query calls to get stats
dfx canister call storage getStats
```

## Upgrading Canisters

ICP canisters can be upgraded without losing data (thanks to stable storage).

```bash
# Make changes to src/storage/main.mo

# Upgrade the canister
dfx deploy storage --mode upgrade

# Or for all canisters
dfx deploy --mode upgrade
```

## Security Considerations

### Access Control

Add proper access control to sensitive functions:

```motoko
import Principal "mo:base/Principal";

actor Storage {
  stable var owner: Principal = Principal.fromText("...");

  public shared(msg) func setApiKeys(...) : async () {
    assert(msg.caller == owner);
    // ...
  };
}
```

### Cycles Management

Monitor cycles to prevent canister from running out:

```bash
# Set up monitoring
dfx canister update-settings storage --add-controller $(dfx identity get-principal)

# Enable freezing threshold (canister stops before running out)
dfx canister update-settings storage --freezing-threshold 2592000
```

## Troubleshooting

### Canister out of cycles
```
Error: Canister has insufficient cycles
```
**Solution**: Top up cycles
```bash
dfx canister deposit-cycles 1000000000000 storage
```

### Cannot connect to replica
```
Error: Connection refused
```
**Solution**: Start local replica
```bash
dfx start --background
```

### Upgrade failed
```
Error: Stable memory incompatible
```
**Solution**: Use proper upgrade hooks in Motoko code

## Advanced: Threshold ECDSA

The bridge canister can sign Ethereum transactions using ICP's threshold ECDSA.

### Enable on Mainnet

```bash
# Get ECDSA public key
dfx canister --network ic call bridge getEthereumAddress

# This returns an Ethereum address that the canister controls
# Fund this address with ETH for gas fees
```

### Sign Transaction

```motoko
// In bridge canister
let txHash = await submitValidationToEthereum(
  validationId,
  approved,
  confidence,
  reasoningHash
);
```

## Resources

- [ICP Documentation](https://internetcomputer.org/docs)
- [Motoko Language Guide](https://internetcomputer.org/docs/current/motoko/main/motoko)
- [Threshold ECDSA](https://internetcomputer.org/docs/current/developer-docs/integrations/t-ecdsa/)
- [HTTPS Outcalls](https://internetcomputer.org/docs/current/developer-docs/integrations/https-outcalls/)

## Next Steps

1. Implement HTTPS outcalls in AI validator
2. Implement threshold ECDSA signing in bridge
3. Add proper error handling
4. Add access control
5. Deploy frontend to ICP
6. Set up monitoring and alerts

## License

MIT
