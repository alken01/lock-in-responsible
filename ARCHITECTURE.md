# Lock-In Responsible - Architecture

**Decentralized Goal Verification Network**

## Overview

Lock-In Responsible uses a hybrid blockchain architecture combining ICP (Internet Computer) for decentralized goal storage and token rewards, with a distributed validator network for AI-powered verification.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  - Internet Identity Auth                                   │
│  - Create Goals (Direct to ICP)                            │
│  - Submit Proofs (Via Backend + ICP)                       │
│  - View Leaderboard (Direct from ICP)                      │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         │ Direct ICP Calls                  │ Backend API
         │ (Most operations)                  │ (Heavy processing)
         ↓                                    ↓
┌──────────────────────┐          ┌──────────────────────┐
│   ICP CANISTER       │          │   BACKEND (Node.js)  │
│   (Motoko)           │←─────────│                      │
│                      │  Callback│  - File uploads      │
│ - Goal storage       │          │  - LLM proxy         │
│ - Token rewards      │          │  - GitHub API        │
│ - Validator registry │          │                      │
│ - Consensus logic    │          └──────────────────────┘
│ - Leaderboard        │
└──────────────────────┘
         │
         │ Broadcasts
         │ Verification
         │ Requests
         ↓
┌────────────────────────────────────────────────────────┐
│           VALIDATOR NETWORK (Distributed)              │
│                                                        │
│  Validator Node 1     Validator Node 2    Node 3     │
│  ├─ Local Llama      ├─ OpenAI API      ├─ Claude   │
│  ├─ Stake: 100      ├─ Stake: 100       ├─ Stake: 100│
│  └─ Rep: +15        └─ Rep: +22          └─ Rep: +8  │
│                                                        │
│  Each validator:                                      │
│  1. Polls ICP for verification requests              │
│  2. Analyzes proof with LLM                          │
│  3. Submits verdict to ICP                           │
│  4. Gets paid if verdict matches consensus           │
└────────────────────────────────────────────────────────┘
```

## Data Flow

### Creating a Goal

```
User → Frontend → ICP Canister
                    ├─ Store goal (immutable)
                    ├─ Assign goal ID
                    └─ Return confirmation

Result: Goal stored on blockchain, cannot be deleted
```

### Verifying a Goal

```
1. User submits proof
   Frontend → Backend
   └─ Upload screenshot to storage
   └─ Create verification request → ICP Canister

2. ICP selects 5 random validators
   ICP Canister → Validator Network
   └─ Broadcast request to selected validators

3. Validators verify
   Each Validator:
   ├─ Download proof
   ├─ Run LLM analysis
   └─ Submit verdict to ICP
      {
        verified: true/false,
        confidence: 0-100,
        reasoning: "..."
      }

4. Consensus & Rewards
   ICP Canister (when 3+ verdicts received):
   ├─ Calculate majority (3/5 = approved)
   ├─ Pay validators who matched consensus
   ├─ Slash reputation of wrong validators
   └─ Mark goal complete + award tokens if approved
```

## Components

### 1. Frontend (`/frontend`)
- **Tech**: React + TypeScript + Vite
- **Auth**: Internet Identity (ICP)
- **Communication**:
  - Direct ICP calls for goals, tokens, leaderboard
  - Backend API for proof submission
- **Features**:
  - Create goals
  - Submit proofs
  - View verification status
  - Check token balance
  - View leaderboard

### 2. ICP Canister (`/src/lock_in_backend`)
- **Tech**: Motoko (ICP smart contract)
- **Storage**: Persistent on-chain
- **Responsibilities**:
  - Goal CRUD (immutable)
  - Validator registry
  - Verification request management
  - Consensus calculation
  - Token distribution
  - Reputation tracking
  - Leaderboard

**Key Functions**:
```motoko
createGoal()                    // Store goal on-chain
createVerificationRequest()     // Request verification
submitVerdict()                 // Validator submits decision
getPendingRequests()            // Validators poll for work
calculateConsensus()            // Compute majority + rewards
```

### 3. Backend (`/backend`)
- **Tech**: Node.js + Express + Prisma
- **Purpose**: Heavy processing & integrations
- **Responsibilities**:
  - File/image uploads (screenshots)
  - Proof storage (S3/IPFS)
  - LLM API proxy (optional)
  - GitHub API integration
  - Email notifications
  - Analytics

**When Used**:
- Only for operations that need processing
- NOT used for reading goals/tokens
- Acts as helper service to ICP

### 4. Validator Node (`/validator-node`)
- **Tech**: Node.js + LLM libraries
- **Purpose**: Decentralized verification
- **Runs**: On validator's own infrastructure
- **LLM Options**:
  - Local: Ollama (Llama, Mistral, etc.)
  - API: OpenAI, Anthropic
- **Process**:
  1. Poll ICP for pending requests
  2. Verify proof with LLM
  3. Submit verdict
  4. Earn rewards for correct verdicts

## Economics

### For Users:
- **Create Goal**: Free (ICP cycles)
- **Submit Proof**: $0.50 verification fee
- **Complete Goal**: Earn 10 tokens
- **Build Streak**: Compete on leaderboard

### For Validators:
- **Stake**: 100 tokens to join
- **Earn**: $0.10-0.50 per verification
- **Requirements**: 99%+ uptime
- **Slashing**: Wrong verdicts = -reputation

### Token Flow:
```
User pays $0.50 verification fee
    ↓
ICP Canister holds fee
    ↓
5 validators submit verdicts
    ↓
Consensus: 3/5 verified = APPROVED
    ↓
Fee split among 3 correct validators = $0.16 each
User earns 10 tokens for completing goal
```

## Consensus Mechanism

**Majority Voting (3/5)**:
- 5 validators randomly selected
- Each submits: verified (yes/no), confidence (0-100), reasoning
- Consensus = majority (≥3 same verdict)
- Correct validators: +reputation, +payment
- Wrong validators: -reputation
- Goal approved if majority = verified

**Example**:
```
Goal: "Code for 2 hours"
Proof: Screenshot + "Worked on my project"

Validator 1: ✅ Verified (95% confidence)
Validator 2: ✅ Verified (88% confidence)
Validator 3: ✅ Verified (92% confidence)
Validator 4: ❌ Rejected (30% confidence)
Validator 5: ✅ Verified (85% confidence)

Result: 4/5 verified = APPROVED
- Validators 1,2,3,5: Get paid
- Validator 4: Loses reputation
- User: Goal marked complete, earns 10 tokens
```

## Security

- **Immutable Goals**: Stored on blockchain, can't be deleted
- **Decentralized Verification**: No single verifier
- **Economic Security**: Validators staked, slashed for dishonesty
- **Transparent**: All verdicts on-chain
- **Internet Identity**: Passwordless, privacy-preserving

## Scalability

- **Horizontal**: More validators = more capacity
- **Efficient**: Validators only verify assigned requests
- **Parallel**: Multiple verifications simultaneously
- **On-Chain State**: Minimal (only critical data)

## Future Enhancements

1. **Specialized Validators**: Code, fitness, writing experts
2. **Tiered Staking**: Higher stake = more assignments
3. **Delegation**: Stake with validators, earn passive income
4. **NFT Achievements**: On-chain badges for streaks
5. **DAO Governance**: Validators vote on network changes
