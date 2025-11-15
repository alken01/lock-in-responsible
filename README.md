# Lock-In Responsible

**Decentralized goal accountability with AI-powered verification**

Commit your goals to the blockchain. Get verified by a decentralized AI network. Earn rewards for discipline.

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
2. **Complete it** → Submit text proof
3. **Get verified** → 5 random AI validators check your proof
4. **Earn rewards** → Receive 10 tokens if 3/5 validators approve
5. **Build streaks** → Compete on the global leaderboard

---

## 🚀 Quick Start (5 minutes)

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org))
- DFX SDK ([Install ICP SDK](https://internetcomputer.org/docs/current/developer-docs/getting-started/install/))

### Step 1: Install DFX (if not installed)

```bash
# Install the ICP SDK
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Verify installation
dfx --version
```

### Step 2: Start Local ICP Network

```bash
# Start the local replica (blockchain node)
dfx start --clean --background

# This will run on http://localhost:4943
# Keep this running in the background
```

### Step 3: Deploy the Canister

```bash
# Deploy the smart contract to local network
dfx deploy lock_in_backend

# You'll see output like:
# Deployed canisters.
# URLs:
#   Backend canister via Candid interface:
#     lock_in_backend: http://127.0.0.1:4943/?canisterId=XXXXX
```

### Step 4: Update Frontend Configuration

```bash
# Get your canister ID
dfx canister id lock_in_backend

# Copy the output (e.g., rrkah-fqaaa-aaaaa-aaaaq-cai)

# Update frontend/.env with your canister ID
cd frontend
echo "VITE_ICP_CANISTER_ID=$(dfx canister id lock_in_backend)" > .env
echo "VITE_ICP_NETWORK=development" >> .env
echo 'VITE_APP_NAME="Lock-In Responsible"' >> .env
```

### Step 5: Install Frontend Dependencies

```bash
# Still in frontend/
npm install
```

### Step 6: Run the Frontend

```bash
npm run dev

# Frontend will be available at http://localhost:5173
```

### Step 7: Login & Test

1. Open http://localhost:5173
2. Click **"Login with Internet Identity"**
3. A popup will open for local Internet Identity
4. Click **"Create Internet Identity"**
5. Follow the prompts (you can skip adding recovery methods for local testing)
6. You'll be redirected back and logged in!
7. Try creating a goal and submitting proof

---

## 📖 Full Development Setup

### Project Structure

```
lock-in-responsible/
├── canister/           # ICP smart contract (Motoko)
│   └── main.mo        # Goals, validators, consensus, tokens
├── frontend/          # React web app
│   └── src/          # Direct ICP communication
├── validator-node/    # Validator daemon (for validators)
└── dfx.json          # ICP configuration
```

### Running Everything

```bash
# Terminal 1: Start ICP local network
dfx start --clean

# Terminal 2: Deploy canister & run frontend
dfx deploy lock_in_backend
cd frontend && npm install && npm run dev

# Terminal 3 (Optional): Run a validator node
cd validator-node && npm install && npm start
```

### Useful Commands

```bash
# Check if dfx is running
dfx ping

# View deployed canisters
dfx canister id lock_in_backend

# Stop the local network
dfx stop

# View canister logs
dfx canister logs lock_in_backend

# Redeploy after code changes
dfx deploy lock_in_backend

# Reset everything (CAREFUL: deletes all data)
dfx start --clean --background
dfx deploy
```

---

## 🔧 Troubleshooting

### "Login not working"
**Problem**: DFX not running or canister not deployed

**Solution**:
```bash
# 1. Check if dfx is running
dfx ping

# 2. If not, start it
dfx start --background

# 3. Deploy the canister
dfx deploy lock_in_backend

# 4. Update frontend/.env with canister ID
echo "VITE_ICP_CANISTER_ID=$(dfx canister id lock_in_backend)" > frontend/.env
echo "VITE_ICP_NETWORK=development" >> frontend/.env

# 5. Restart frontend
cd frontend && npm run dev
```

### "Cannot connect to canister"
**Problem**: Wrong canister ID in .env

**Solution**:
```bash
# Get the correct ID
dfx canister id lock_in_backend

# Update frontend/.env manually
# VITE_ICP_CANISTER_ID=<your-canister-id>
```

### "Internet Identity popup doesn't open"
**Problem**: Browser blocking popups

**Solution**: Allow popups for localhost:5173 in your browser settings

### "Module not found" errors
**Problem**: Dependencies not installed

**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 How It Works

```
1. User creates goal
   ↓
2. Goal stored on ICP (immutable)
   ↓
3. User submits proof (text description)
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

## 💡 Technology Stack

| Component | Technology |
|-----------|------------|
| **Smart Contract** | Motoko (ICP) |
| **Frontend** | React + TypeScript + Vite |
| **Validators** | Node.js + Ollama/OpenAI/Anthropic |
| **Auth** | Internet Identity |
| **Storage** | ICP stable memory |

---

## 📝 Use Cases

- **Writing**: "Write 1000 words today"
- **Coding**: "Commit code for 30 minutes"
- **Learning**: "Study for 2 hours"
- **Fitness**: "Work out for 45 minutes"
- **Productivity**: "Complete project milestone"

---

## 🌐 Deploying to Mainnet

### Prerequisites
- ICP cycles (fuel for canister operations)
- Get free cycles: https://faucet.dfinity.org

### Deploy to IC Mainnet

```bash
# 1. Deploy to mainnet
dfx deploy --network ic lock_in_backend

# 2. Get your mainnet canister ID
dfx canister id lock_in_backend --network ic

# 3. Update frontend/.env for production
VITE_ICP_CANISTER_ID=<mainnet-canister-id>
VITE_ICP_NETWORK=production

# 4. Build frontend
cd frontend
npm run build

# 5. Deploy frontend (e.g., to Vercel)
vercel deploy
```

---

## 💰 Economics

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

---

## 📚 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Complete system architecture
- [validator-node/README.md](validator-node/README.md) - Run a validator node

---

## 🤝 Why This Works

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

## 📄 License

MIT License

---

## 🙏 Built With

- Internet Computer Protocol (DFINITY)
- OpenAI, Anthropic, Ollama (AI verification)
- React, TypeScript, Vite, shadcn/ui

---

**Stop procrastinating. Start achieving. Lock in your commitment today.** 🎯
