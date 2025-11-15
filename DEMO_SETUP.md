# Lock-In Responsible - Quick Demo Setup

## Prerequisites (5 minutes)

Install dfx (ICP SDK):
```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
export PATH="$HOME/bin:$PATH"
dfx --version
```

## Quick Demo (15 minutes total)

### Step 1: Deploy ICP Canister (5 min)

```bash
# Start local ICP network
dfx start --clean --background

# Deploy the backend canister
dfx deploy lock_in_backend

# Save the canister ID
export CANISTER_ID=$(dfx canister id lock_in_backend)
echo "Canister ID: $CANISTER_ID"
```

### Step 2: Test Canister via CLI (2 min)

```bash
# Health check
dfx canister call lock_in_backend healthCheck
# Returns: (true)

# Create a test goal
dfx canister call lock_in_backend createGoal '(
  "Complete ICP Demo",
  "Show working blockchain demo",
  variant { Custom },
  1731700000000000000
)'
# Returns: (0 : nat)  <- This is your goal ID

# Get your goals
dfx canister call lock_in_backend getMyGoals
# Returns: (vec { record { ... } })

# Submit proof (earns tokens!)
dfx canister call lock_in_backend submitProof '(0, "Demo completed successfully!")'
# Returns: (true)

# Check token balance
dfx canister call lock_in_backend getMyTokens
# Returns: (10 : nat)  <- You earned 10 tokens!
```

### Step 3: Web Demo - Option A (Simple HTML)

```bash
# Update demo.html with your canister ID
sed -i "s/REPLACE_WITH_YOUR_CANISTER_ID/$CANISTER_ID/g" demo.html

# Serve the demo
python3 -m http.server 8080 &

# Open in browser
echo "Open: http://localhost:8080/demo.html"
```

**Demo flow:**
1. Open http://localhost:8080/demo.html
2. Create a goal → See transaction on blockchain
3. Submit proof → Earn 10 tokens
4. View stats → See completion metrics
5. Check leaderboard → See global rankings

### Step 3: Web Demo - Option B (Full React App)

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env <<EOF
VITE_ICP_CANISTER_ID=$CANISTER_ID
VITE_API_URL=http://localhost:3000/api
EOF

# Start frontend
npm run dev
```

**Demo flow:**
1. Open http://localhost:5173
2. Click "Connect with Internet Identity"
3. Create Internet Identity (first time only)
4. See ICP Integration sidebar with:
   - Token balance
   - Current streak
   - On-chain goals
5. Create goals → Submit proof → Earn tokens
6. Everything stored on blockchain!

## Advanced Demo: Full Stack with Backend AI

If you want to show the **complete system** with AI verification:

### Step 4: Start Node.js Backend (optional)

```bash
cd backend

# Install dependencies
npm install

# Create .env
cp .env.example .env

# Edit .env - add your API keys:
# OPENAI_API_KEY=sk-...
# or
# ANTHROPIC_API_KEY=sk-ant-...

# Init database
npm run db:push

# Start backend
npm run dev
```

Backend runs at: http://localhost:3000

### Step 5: Start ESP32 (optional - hardware demo)

If you have ESP32 hardware:

```bash
cd firmware

# Install PlatformIO
pip install platformio

# Copy config
cp include/config.h.example include/config.h

# Edit config.h with WiFi credentials

# Flash firmware
pio run --target upload

# Monitor
pio device monitor
```

## Demo Script (5 minutes presentation)

### 1. Introduction (30 sec)
> "Lock-In Responsible is a blockchain-powered accountability system. You set goals, lock valuables in a box, and only unlock after proving completion to AI validators."

### 2. Show the Canister (1 min)
```bash
# Show it's running on blockchain
dfx canister call lock_in_backend getInfo
```

> "This smart contract is running on the Internet Computer blockchain. All goals, proofs, and tokens are stored on-chain - permanent and tamper-proof."

### 3. Create Goal (1 min)
- Open demo.html or React app
- Create goal: "Present awesome demo"
- Show transaction confirming on blockchain

### 4. Submit Proof (1 min)
- Submit proof: "Demo completed with live audience!"
- Watch tokens being awarded
- Show updated stats

### 5. Show Features (1.5 min)
- **Token balance**: Earn accountability tokens
- **Streak tracking**: Build daily habits
- **Leaderboard**: Compete globally
- **On-chain storage**: Permanent records
- **Internet Identity**: No passwords needed

### 6. Technical Highlights (30 sec)
> "Built with Motoko smart contracts on ICP, React frontend, optional Node.js backend for AI verification, and ESP32 hardware for physical locks. Everything open source."

## Troubleshooting

### Canister not responding
```bash
# Check if dfx is running
dfx ping

# Restart if needed
dfx stop
dfx start --clean --background
dfx deploy lock_in_backend
```

### Port already in use
```bash
# Use different port
python3 -m http.server 8081
```

### Frontend not connecting
```bash
# Check canister ID in .env
echo $CANISTER_ID
cat frontend/.env

# Rebuild frontend
cd frontend
npm run build
```

## Quick Test Commands

```bash
# Create 5 test goals
for i in {1..5}; do
  dfx canister call lock_in_backend createGoal "(\"Goal $i\", \"Description\", variant { Custom }, 1731700000000000000)"
done

# Complete them all
for i in {0..4}; do
  dfx canister call lock_in_backend submitProof "($i, \"Completed!\")"
done

# Check stats
dfx canister call lock_in_backend getMyStats
# Should show: 5 total goals, 5 completed, 50 tokens!
```

## Deploy to Mainnet (Production Demo)

```bash
# Ensure you have cycles
dfx wallet balance

# Build frontend
cd frontend
npm run build
cd ..

# Deploy to Internet Computer mainnet
dfx deploy --network ic --with-cycles 1000000000000

# Get public URLs
echo "Backend: https://$(dfx canister id lock_in_backend --network ic).ic0.app"
echo "Frontend: https://$(dfx canister id lock_in_frontend --network ic).ic0.app"
```

Your app is now live on the blockchain! 🚀

## Demo Checklist

- [ ] dfx installed and running
- [ ] Canister deployed and working
- [ ] Can create goals via CLI
- [ ] Can submit proof and earn tokens
- [ ] Web demo (HTML or React) working
- [ ] Practiced demo script
- [ ] Backend running (if showing AI features)
- [ ] ESP32 ready (if showing hardware)
- [ ] Screenshots/recording ready as backup

## What Makes This Demo Impressive

1. **Real blockchain** - Not a simulation, actual ICP canister
2. **Instant finality** - Transactions confirm in 2 seconds
3. **No gas fees** - Reverse gas model (canister pays)
4. **Permanent storage** - Data survives canister upgrades
5. **Web3 UX** - Internet Identity = no passwords
6. **Token economy** - Real accountability tokens
7. **Open source** - All code available on GitHub

## Next Steps

- Share your deployed app URL
- Add more goal types
- Integrate with AI backend
- Connect ESP32 hardware
- Deploy to mainnet for production use

Good luck with your demo! 🎯🔒
