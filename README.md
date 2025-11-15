# Lock-In Responsible

**Decentralized goal accountability with AI-powered verification**

Stop procrastinating. Commit your goals to the blockchain. Get verified by a decentralized network. Earn rewards for discipline.

[![ICP](https://img.shields.io/badge/Built%20on-Internet%20Computer-blue)](https://internetcomputer.org)
[![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## What Is This?

Lock-In Responsible helps you achieve your goals through **cryptographic commitment**, **AI verification**, and **economic incentives**.

### The Problem
- 88% of people fail their New Year's resolutions
- To-do apps don't work because there's no consequence for failure
- You can delete tasks, reset apps, and pretend failures never happened

### The Solution
**Blockchain-immutable goals + Decentralized AI validation = Real accountability**

1. **Create a goal** → Stored on ICP blockchain (can't delete)
2. **Complete it** → Submit proof (screenshot + description)
3. **Get verified** → 5 random AI validators check your proof
4. **Earn rewards** → Receive 10 tokens if 3/5 validators approve
5. **Build streaks** → Compete on the global leaderboard

---

## Key Features

### Immutable Commitment
Goals are stored on the Internet Computer blockchain. You **cannot** delete them, edit them, or pretend they never existed. Public accountability works.

### Decentralized AI Verification
No single point of failure. When you submit proof:
- ICP canister selects 5 random validators from the network
- Each validator runs an LLM (local or API) to analyze your proof
- 3/5 must agree for approval (majority consensus)
- Validators earn fees for correct verdicts, lose reputation for wrong ones

### Economic Security
- **Users**: Pay $0.50 verification fee, earn 10 tokens for completion
- **Validators**: Stake 100 tokens, earn $0.10-0.50 per verification
- **Incentive alignment**: Honest validators get rewarded, dishonest ones get slashed

### Privacy-Preserving Auth
Internet Identity provides passwordless, privacy-preserving authentication. No passwords, no email, no personal data storage.

---

## How It Works

```
1. User creates goal
   ↓
2. Goal stored on ICP (immutable)
   ↓
3. User submits proof (screenshot + text)
   ↓
4. ICP canister selects 5 random validators
   ↓
5. Each validator analyzes proof with LLM
   ↓
6. Validators submit verdicts (verified: yes/no, confidence: 0-100)
   ↓
7. ICP calculates consensus (3/5 = approved)
   ↓
8. Correct validators paid, wrong ones slashed
   ↓
9. User earns 10 tokens if approved
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design.

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| **Smart Contract** | Motoko (ICP) |
| **Frontend** | React + TypeScript + Vite |
| **Backend** | Node.js + Express (for heavy processing) |
| **Validators** | Node.js + Ollama/OpenAI/Anthropic |
| **Auth** | Internet Identity, Google OAuth |
| **Storage** | ICP stable memory, S3/IPFS for proofs |

---

## Project Structure

```
lock-in-responsible/
├── canister/                # ICP canister (Motoko smart contract)
│   └── main.mo              # Goals, validators, consensus, tokens
│
├── frontend/                # React web app
│   ├── src/components/      # UI components
│   ├── src/pages/           # Goals, History, Settings
│   └── src/lib/icp-api.ts   # ICP SDK integration
│
├── backend/                 # Node.js helper service
│   └── src/                 # File uploads, LLM proxy, GitHub API
│
├── validator-node/          # Validator daemon (runs on validator's machine)
│   └── src/                 # Polls ICP, verifies proofs, submits verdicts
│
├── ARCHITECTURE.md          # Detailed system architecture
└── README.md                # This file
```

---

## Quick Start

### 1. Deploy ICP Canister

```bash
# Install ICP SDK
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Start local network
dfx start --background

# Deploy canister
dfx deploy lock_in_backend

# Get canister ID
dfx canister id lock_in_backend
```

### 2. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Run Backend (Optional)

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run db:migrate
npm run dev
```

### 4. Run Validator Node (Optional - for validators)

See [validator-node/README.md](validator-node/README.md) for validator setup.

---

## Use Cases

- **Writing**: "Write 1000 words today"
- **Coding**: "Commit code for 30 minutes"
- **Learning**: "Study for 2 hours"
- **Fitness**: "Work out for 45 minutes"
- **Productivity**: "Complete project milestone"

---

## Economics

### For Users
- **Create goal**: Free (ICP cycles)
- **Verification fee**: $0.50 per proof
- **Completion reward**: 10 tokens
- **Streak bonus**: Compete on leaderboard

### For Validators
- **Stake**: 100 tokens minimum
- **Earnings**: $0.10-0.50 per verification
- **Requirements**: 99%+ uptime
- **Slashing**: Wrong verdicts = -reputation

### Token Flow
```
User pays $0.50
    ↓
ICP holds fee
    ↓
5 validators verify
    ↓
3/5 agree = approved
    ↓
Correct validators split fee ($0.16 each)
User earns 10 tokens
```

---

## Why This Works

### Psychological Principles
1. **Commitment Device**: Public goals you can't delete
2. **Loss Aversion**: Verification fees + reputation loss
3. **Immediate Rewards**: Tokens earned instantly
4. **Social Proof**: Global leaderboard competition

### Technical Innovation
1. **Decentralized Verification**: No single trusted party
2. **Economic Security**: Validators staked and slashed
3. **Transparent**: All verdicts on-chain
4. **Scalable**: More validators = more capacity

---

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Complete system architecture
- [validator-node/README.md](validator-node/README.md) - Run a validator node

---

## License

MIT License

---

## Built With

- Internet Computer Protocol (DFINITY)
- OpenAI, Anthropic, Ollama (AI verification)
- React, TypeScript, Vite, shadcn/ui

---

**Stop procrastinating. Start achieving. Lock in your commitment today.** 🎯
