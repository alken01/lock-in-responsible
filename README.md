# Lock-In Responsible

**Decentralized goal accountability with AI-powered verification and IP ownership**

Commit your goals to the blockchain. Get verified by AI. **Own your productivity methodologies as IP.**

[![ICP](https://img.shields.io/badge/Built%20on-Internet%20Computer-blue)](https://internetcomputer.org)
[![Camp Network](https://img.shields.io/badge/IP_Layer-Camp_Network-purple)](https://campnetwork.xyz)
[![Origin SDK](https://img.shields.io/badge/SDK-Origin-blue)](https://docs.campnetwork.xyz)
[![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## What Is This?

Lock-In Responsible helps you achieve your goals through **cryptographic commitment**, **AI verification**, **IP ownership**, and **economic incentives**.

**🌟 Featured at WAIB Summit AI x Web3 Hackathon - CAMP Network Track**

### The Problem
- 88% of people fail their New Year's resolutions
- To-do apps don't work because there's no consequence for failure
- You can delete tasks, reset apps, and pretend failures never happened
- **Nobody owns or earns from their successful productivity methodologies**

### The Solution
**Blockchain-immutable goals + AI verification + IP ownership = Real accountability + Creator economy**

1. **Create a goal** → Stored on ICP blockchain (can't delete)
2. **Complete it** → Submit text proof
3. **Get verified** → AI + community consensus validates your proof
4. **Earn rewards** → Receive 10 tokens if approved
5. **Register as IP** → Your successful goal becomes sellable IP on Camp Network via Origin SDK
6. **Earn royalties** → Others license your methodology, you earn passive income

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
│   └── main.mo        # Goals, voting, consensus, tokens
├── frontend/          # React + TypeScript web app
│   ├── src/pages/    # Goals, Voting, Dashboard, History
│   ├── src/lib/      # ICP integration & utilities
│   └── src/store/    # State management (Zustand)
├── validator-node/    # Optional: AI validator daemon
└── dfx.json          # ICP configuration
```

### Running Everything

```bash
# Terminal 1: Start ICP local network
dfx start --clean

# Terminal 2: Deploy canister & run frontend
dfx deploy lock_in_backend
cd frontend && npm install && npm run dev

# Optional: Run an AI validator node
cd validator-node && npm install && npm start
```

**Note**: The validator node is optional. Users with completed goals can vote on proofs directly through the web interface!

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

### Community-Based Verification Flow

```
1. User creates goal
   ↓
2. Goal stored on ICP blockchain (immutable)
   ↓
3. User completes goal and submits text proof
   ↓
4. ICP canister checks for eligible voters
   │
   ├─ NO VOTERS? → Auto-approve (bootstrapping)
   │                ├─ Award 10 tokens immediately
   │                └─ Goal marked complete
   │
   └─ VOTERS EXIST? → Create verification request
                      ↓
5. System selects 5 random voters (users with completed goals)
   ↓
6. Voters review proof in Voting page
   ↓
7. Each voter submits: Approve 👍 or Reject 👎
   ↓
8. Consensus: 3/5 votes needed for approval
   ↓
9. Rewards distributed:
   ├─ Correct voters: +1 reputation, split verification fee
   ├─ Wrong voters: -1 reputation
   └─ Goal creator: 10 tokens (if approved)
```

### Key Innovation: Bootstrapping Mechanism
First-time users get **auto-approved** when no voters exist yet. Once users complete goals, they become eligible voters, creating an organic validator pool!

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design.

---

## 💡 Technology Stack

| Component | Technology |
|-----------|------------|
| **Smart Contract** | Motoko (ICP) |
| **IP Layer** | **Camp Network Origin SDK** ⭐ |
| **Frontend** | React 18 + TypeScript + Vite |
| **UI Framework** | Tailwind CSS + shadcn/ui (Radix UI) |
| **State Management** | Zustand + TanStack React Query |
| **Routing** | React Router v6 |
| **AI Verification** | OpenAI/Anthropic/Ollama |
| **Auth** | Internet Identity (Passwordless) |
| **Storage** | ICP stable memory |
| **Deployment** | Vercel (Frontend) + ICP Network (Backend) |

### 🆕 Camp Network Integration

**Origin SDK** enables:
- **IP Registration**: Goal templates registered as on-chain intellectual property
- **Creator Royalties**: Earn tokens when others license your methodologies
- **IP Marketplace**: Browse and purchase proven productivity frameworks
- **Remix & Derive**: Fork successful goals and create your own variants

This makes Lock-In the **first platform where productivity methodologies are ownable, tradeable IP assets**.

---

## 📝 Use Cases

- **Writing**: "Write 1000 words today"
- **Coding**: "Commit code for 30 minutes"
- **Learning**: "Study for 2 hours"
- **Fitness**: "Work out for 45 minutes"
- **Productivity**: "Complete project milestone"

---

## 🌐 Deploying to Production

### Prerequisites
- ICP cycles (fuel for canister operations)
- Get free cycles: https://faucet.dfinity.org
- Vercel account (for frontend hosting)

### Step 1: Deploy Backend to IC Mainnet

```bash
# Deploy canister to ICP mainnet
dfx deploy --network ic lock_in_backend

# Get your mainnet canister ID
dfx canister id lock_in_backend --network ic
```

### Step 2: Deploy Frontend to Vercel

```bash
cd frontend

# Create production .env
echo "VITE_ICP_CANISTER_ID=<your-mainnet-canister-id>" > .env
echo "VITE_ICP_NETWORK=production" >> .env
echo 'VITE_APP_NAME="Lock-In Responsible"' >> .env

# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy to Vercel
vercel deploy --prod
```

### Important: Vercel Configuration

The project includes `frontend/vercel.json` for proper SPA routing:
- Fixes 404 errors on page refresh
- Enables direct URL access to all routes
- Already configured - no changes needed!

### Post-Deployment

1. Test Internet Identity login on production
2. Create a test goal and verify the flow
3. Monitor canister cycles: `dfx canister status lock_in_backend --network ic`

---

## 💰 Economics

### For Users
- **Create goal**: Free (minimal ICP cycles)
- **Verification fee**: 0.50 tokens per proof
- **Completion reward**: 10 tokens (20x return!)
- **Become a voter**: Complete 1+ goals
- **Streak bonus**: Compete on global leaderboard

### For Community Voters
- **No stake required**: Any user with completed goals can vote
- **Earnings**: Split verification fee among correct voters
- **Example**: 4 correct voters → 0.125 tokens each
- **Reputation system**:
  - Correct vote: +1 reputation
  - Wrong vote: -1 reputation
- **Rewards**: Higher reputation = more voting opportunities

### Token Flow Example
```
User submits proof → 0.50 token fee
5 voters selected → Each votes
Consensus: 4 approve, 1 reject
Majority = Approved ✅
→ Goal creator: +10 tokens
→ 4 correct voters: +0.125 tokens each
→ 1 wrong voter: -1 reputation
```

---

## 📚 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Complete system architecture and design decisions

---

## 🤝 Why This Works

### Psychological Principles
1. **Commitment Device**: Public goals you can't delete or hide
2. **Loss Aversion**: Verification fees create skin in the game
3. **Immediate Rewards**: 10 tokens earned instantly upon approval
4. **Social Proof**: Global leaderboard & community feed
5. **Gamification**: Streaks, reputation, and token rewards

### Technical Innovation
1. **Community-Driven Verification**: Democratic voting by peers
2. **Bootstrapping Mechanism**: Auto-approval for first users solves cold-start problem
3. **Economic Incentives**: Voters earn tokens for accurate verdicts
4. **Reputation System**: Track record of voting accuracy on-chain
5. **Transparent**: All goals, proofs, and votes stored on blockchain
6. **Scalable**: More users = larger voter pool = better security
7. **No Gatekeeping**: Any user who completes a goal can vote

---

## 📄 License

MIT License

---

## 🙏 Built With

- **Blockchain**: Internet Computer Protocol (DFINITY)
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand, TanStack React Query
- **Auth**: Internet Identity
- **AI (Optional)**: OpenAI, Anthropic, Ollama
- **Deployment**: Vercel + ICP Network

---

## 🆕 Recent Updates

### ✅ Camp Network Origin SDK Integration (LATEST)
- **IP-registered goal templates** - Own your productivity methodologies
- **Creator royalties** - Earn tokens when others license your goals
- **IP marketplace** - Buy/sell proven goal frameworks
- **Origin SDK badges** - Visual indicators for IP-registered content
- **WAIB Summit Hackathon submission** - CAMP Network Track

### ✅ AI-Powered Verification
- Advanced AI analysis of proof submissions
- Combined with community voting for consensus
- Prevents gaming and ensures legitimacy

### ✅ Community-Based Voting
- Any user with completed goals can vote on proofs
- Democratic peer verification system
- Reputation tracking for voting accuracy

### ✅ Auto-Approval Bootstrapping
- First-time users get auto-approved when no voters exist
- Solves chicken-and-egg problem for new platforms
- Automatic transition to community voting as user base grows

---

**Stop procrastinating. Start achieving. Lock in your commitment today.** 🎯
