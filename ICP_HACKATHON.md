# 🚀 Lock-In Responsible - ICP Hackathon Edition

**Goal-based accountability system powered by the Internet Computer Protocol (ICP)**

[![ICP](https://img.shields.io/badge/Built%20on-Internet%20Computer-blue)](https://internetcomputer.org)
[![Motoko](https://img.shields.io/badge/Smart%20Contracts-Motoko-orange)](https://internetcomputer.org/docs/current/developer-docs/build/cdks/motoko-dfinity/motoko)

---

## 🎯 What Makes This Project ICP-Native?

### **Blockchain Features Implemented:**

1. **🔐 Internet Identity Authentication**
   - Decentralized authentication (no Google OAuth dependency)
   - Privacy-preserving login
   - User owns their identity

2. **🪙 On-Chain Token Rewards**
   - Earn "Accountability Tokens" for completing goals
   - Transparent, verifiable reward system
   - Stored permanently on the blockchain

3. **📊 Immutable Goal Tracking**
   - All goals stored on-chain in canisters
   - Permanent, tamper-proof achievement history
   - Cryptographically verifiable proof of completion

4. **🏆 Global Leaderboard**
   - Compare your progress with other users
   - Public accountability
   - Built on decentralized infrastructure

5. **⚡ Hybrid Architecture**
   - Frontend hosted on ICP (decentralized)
   - Backend canisters (Motoko smart contracts)
   - Traditional Node.js API for AI verification (optional)
   - ESP32 hardware integration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Internet Computer Protocol                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌────────────────────┐                │
│  │   Frontend   │◄────────▶│  Motoko Canister   │                │
│  │  (ICP Host)  │         │  (Smart Contract)  │                │
│  │              │         │                    │                │
│  │ - React App  │         │ - Goal Storage     │                │
│  │ - Internet ID│         │ - Token Rewards    │                │
│  │ - ICP Agent  │         │ - User Stats       │                │
│  └──────────────┘         │ - Leaderboard      │                │
│                           └────────────────────┘                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌────────────────┐         ┌────────────────┐
│  Node.js API   │         │  ESP32 Lock    │
│  (AI Verify)   │         │  (Hardware)    │
└────────────────┘         └────────────────┘
```

---

## 🚀 Quick Start (Hackathon Setup)

### **Prerequisites**

1. **DFX SDK** (ICP CLI)
   ```bash
   sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
   ```

2. **Node.js 20+**
   ```bash
   node --version  # Should be 20+
   ```

3. **Cycles** (for mainnet deployment)
   - Get free cycles: https://faucet.dfinity.org/

---

## 📦 Installation & Deployment

### **Option 1: Local Development (Recommended for Testing)**

```bash
# 1. Clone the repository
git clone <your-repo>
cd lock-in-responsible

# 2. Install frontend dependencies
cd frontend
npm install
cd ..

# 3. Build frontend
cd frontend
npm run build
cd ..

# 4. Start local ICP replica
dfx start --clean --background

# 5. Deploy canisters locally
dfx deploy

# 6. Get canister IDs
dfx canister id lock_in_backend
dfx canister id lock_in_frontend

# 7. Open in browser
# Frontend URL: http://127.0.0.1:8000/?canisterId=<frontend_canister_id>
```

### **Option 2: Mainnet Deployment (For Hackathon Submission)**

```bash
# 1. Ensure you have cycles
dfx wallet balance

# 2. Build everything
cd frontend && npm run build && cd ..

# 3. Deploy to Internet Computer mainnet
dfx deploy --network ic --with-cycles 1000000000000

# 4. Get your mainnet URLs
echo "Backend: https://$(dfx canister id lock_in_backend --network ic).ic0.app"
echo "Frontend: https://$(dfx canister id lock_in_frontend --network ic).ic0.app"
```

### **Quick Deploy Script**

We've included a deployment script for convenience:

```bash
# Make it executable (first time only)
chmod +x deploy-icp.sh

# Run deployment
./deploy-icp.sh
```

---

## 🔧 Configuration

### **Frontend Environment Variables**

Create `frontend/.env.icp`:

```env
# Your Node.js backend (optional - for AI verification)
VITE_API_URL=http://localhost:3000/api

# Google OAuth (optional - for hybrid mode)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# ICP Backend Canister ID (set after deployment)
VITE_ICP_CANISTER_ID=<your_canister_id>
```

After deploying, update `VITE_ICP_CANISTER_ID` with the backend canister ID from deployment output.

---

## 💡 Key Features for Judges

### **1. Decentralized Identity**
- Users log in with **Internet Identity** (no passwords!)
- Privacy-preserving authentication
- Principal-based access control

### **2. On-Chain Goal Management**
```motoko
// Goals are stored permanently on ICP
public shared(msg) func createGoal(
  title: Text,
  description: Text,
  goalType: GoalType,
  deadline: Timestamp
) : async GoalId
```

### **3. Token Economy**
- Users earn 10 tokens per completed goal
- Streak bonuses
- Transparent, on-chain token balance
- Future: Trade tokens, unlock features, stake for accountability

### **4. Verifiable Achievements**
- All goal completions are on-chain
- Immutable proof storage
- Cryptographic verification
- Export achievements as verifiable credentials

### **5. Global Leaderboard**
```motoko
// Public leaderboard of accountability champions
public query func getLeaderboard() : async [(Principal, Nat)]
```

---

## 🎨 User Experience

### **Demo Flow**

1. **Visit the app** (local or mainnet URL)
2. **Click "Connect with Internet Identity"**
3. **Create an Internet Identity** (if first time)
4. **View the ICP Integration sidebar** showing:
   - Your accountability token balance
   - Current streak
   - On-chain goals
5. **Create a goal** - it's stored on the blockchain!
6. **Complete goals** - earn tokens automatically
7. **Check the leaderboard** - see global rankings

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| **Smart Contracts** | Motoko (ICP native) |
| **Frontend** | React + TypeScript + Vite |
| **UI Components** | shadcn/ui + Tailwind CSS |
| **Authentication** | Internet Identity |
| **ICP SDK** | @dfinity/agent, @dfinity/auth-client |
| **Backend (Optional)** | Node.js + Express |
| **AI Verification** | OpenAI / Anthropic APIs |
| **Hardware** | ESP32 + Servo Lock |
| **Database (Off-chain)** | Prisma + SQLite |

---

## 📊 Canister API Reference

### **Goal Management**

```typescript
// Create a goal
createGoal(title: string, description: string, goalType: GoalType, deadline: Date)
  → returns GoalId

// Get my goals
getMyGoals()
  → returns Goal[]

// Submit proof of completion
submitProof(goalId: number, proof: string)
  → returns bool (and awards tokens!)

// Mark goal as failed
failGoal(goalId: number)
  → returns bool (resets streak)
```

### **Token & Stats**

```typescript
// Get token balance
getMyTokens()
  → returns number

// Get personal stats
getMyStats()
  → returns {
      totalGoals: number,
      completedGoals: number,
      currentStreak: number,
      longestStreak: number,
      totalTokens: number
    }

// Get global leaderboard
getLeaderboard()
  → returns Array<[Principal, number]>
```

---

## 🎯 Hackathon Highlights

### **What We Built in 1 Day:**

✅ **Full ICP integration** - Smart contracts in Motoko
✅ **Internet Identity auth** - Decentralized login
✅ **On-chain token economy** - Earn tokens for goals
✅ **Immutable goal storage** - Blockchain-backed accountability
✅ **React frontend with ICP** - Seamless Web3 UX
✅ **Hybrid architecture** - Best of both worlds
✅ **Hardware integration** - ESP32 physical locks

### **Future Enhancements:**

🔮 **NFT Achievement Badges** - Mint NFTs for milestones (ICRC-7)
🔮 **DAO Verification** - Community votes on proof validity
🔮 **Token Staking** - Lock tokens for bigger commitments
🔮 **Cross-Canister Calls** - Integrate with other ICP dapps
🔮 **Decentralized Storage** - Store proof images on ICP
🔮 **Social Features** - Follow friends, accountability groups

---

## 🧪 Testing

```bash
# Test local deployment
dfx canister call lock_in_backend healthCheck
# Should return: (true)

# Create a test goal
dfx canister call lock_in_backend createGoal '(
  "Test Goal",
  "Testing ICP integration",
  variant { Custom },
  1700000000000000000
)'
# Returns: (0 : nat)  // Goal ID

# Get your goals
dfx canister call lock_in_backend getMyGoals
# Returns array of goals

# Check token balance
dfx canister call lock_in_backend getMyTokens
# Returns: (0 : nat)  // Initial balance

# Submit proof (earns tokens!)
dfx canister call lock_in_backend submitProof '(0, "I did it!")'
# Returns: (true)

# Check tokens again
dfx canister call lock_in_backend getMyTokens
# Returns: (10 : nat)  // Earned 10 tokens!
```

---

## 📸 Screenshots & Demo

**Main Dashboard with ICP Integration:**
- Shows token balance, streak, on-chain goals
- Internet Identity login badge
- Real-time sync with blockchain

**Leaderboard:**
- Global rankings by token count
- Public accountability

**Goal Creation:**
- Submit to both Node.js API and ICP canister
- Dual tracking for redundancy

---

## 🏆 Why This Wins the Hackathon

1. **Real-World Utility** ✅
   - Solves procrastination problem
   - Actually useful beyond the hackathon

2. **Full-Stack ICP** ✅
   - Frontend hosted on ICP
   - Smart contracts in Motoko
   - Internet Identity integration

3. **Innovative Use Case** ✅
   - Combines blockchain + IoT + AI
   - Physical lock controlled by smart contracts
   - Gamification with tokens

4. **Production-Ready** ✅
   - Clean code architecture
   - Error handling
   - Stable storage for upgrades
   - Comprehensive documentation

5. **Unique Value Prop** ✅
   - Verifiable accountability on-chain
   - Can't cheat your way out
   - Public commitment = better results

---

## 🤝 Team & Contact

Built with ❤️ for the ICP Hackathon

- **GitHub:** [Your GitHub]
- **Demo:** [Mainnet URL after deployment]
- **Video:** [Demo video link]

---

## 📄 License

MIT License - See [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

- **DFINITY Foundation** - Internet Computer Protocol
- **Motoko Team** - Amazing language for canisters
- **Internet Identity** - Seamless Web3 auth

---

**Ready to deploy? Run `./deploy-icp.sh` and let's go! 🚀**
