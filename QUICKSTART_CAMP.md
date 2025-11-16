# 🚀 Quick Start: Deploy to Camp Network Testnet in 10 Minutes

This is the fastest way to get Lock-In Responsible running on Camp Network's testnet ("demonet").

## Prerequisites (2 minutes)

1. **Install MetaMask**: https://metamask.io/
2. **Get testnet CAMP tokens**: https://faucet.campnetwork.xyz/
   - Connect wallet
   - Follow @camp_network on X (Twitter)
   - Request tokens (0.1 CAMP every 24h)

## Step 1: Add Camp Network to MetaMask (1 minute)

**Easy Way:**
1. Visit https://chainlist.org/chain/123420001114
2. Click "Connect Wallet" → "Add to MetaMask"
3. Done!

**Manual Way:**
1. Open MetaMask → Click network dropdown → "Add Network"
2. Fill in:
   - Network Name: `Camp Network K2 Testnet`
   - RPC URL: `https://rpc.basecamp.t.raas.gelato.cloud`
   - Chain ID: `123420001114`
   - Currency Symbol: `CAMP`
   - Block Explorer: `https://basecamp.cloud.blockscout.com/`

## Step 2: Setup Project (2 minutes)

```bash
# Navigate to project
cd /home/user/lock-in-responsible

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

## Step 3: Configure Environment (2 minutes)

Edit `.env` file:

```bash
# Get your MetaMask private key:
# MetaMask → Account Details → Export Private Key → Copy
PRIVATE_KEY=your_private_key_here

# Optional: Get Origin SDK Client ID
# Visit https://testnet.campnetwork.xyz/ and connect wallet
VITE_ORIGIN_CLIENT_ID=your_client_id
```

**⚠️ NEVER commit .env to git! It's already in .gitignore**

## Step 4: Write Your Smart Contract (Already Done!)

See the starter contract in `CAMP_TESTNET_GUIDE.md` or create your own in `contracts/LockInResponsible.sol`

For now, you can use a simple test contract:

```bash
mkdir -p contracts
cat > contracts/LockInResponsible.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LockInResponsible {
    uint256 public goalCount;

    mapping(uint256 => string) public goals;

    event GoalCreated(uint256 indexed id, string title);

    function createGoal(string memory _title) public returns (uint256) {
        uint256 id = goalCount++;
        goals[id] = _title;
        emit GoalCreated(id, _title);
        return id;
    }

    function getGoal(uint256 _id) public view returns (string memory) {
        return goals[_id];
    }
}
EOF
```

## Step 5: Deploy to Camp Testnet (2 minutes)

```bash
# Compile contract
npm run compile

# Deploy to Camp testnet
npm run deploy:testnet
```

You'll see:
```
Deploying LockInResponsible to Camp Network...
LockInResponsible deployed to: 0x1234567890abcdef...
View on explorer: https://basecamp.cloud.blockscout.com/address/0x1234...
```

🎉 **That's it! Your contract is live on Camp Network!**

## Step 6: Verify Your Deployment (1 minute)

Visit the explorer link from the deployment output:
```
https://basecamp.cloud.blockscout.com/address/0x_your_address
```

You should see:
- Your contract address
- Your deployment transaction
- Contract balance

## Step 7: Interact with Your Contract (2 minutes)

```bash
# Open Hardhat console
npm run console:testnet
```

```javascript
// Get contract instance
const Contract = await ethers.getContractFactory("LockInResponsible");
const contract = await Contract.attach("0x_your_deployed_address");

// Create a goal
const tx = await contract.createGoal("Finish Camp Network tutorial");
await tx.wait();

// Get goal count
const count = await contract.goalCount();
console.log("Total goals:", count.toString());

// Get first goal
const goal = await contract.getGoal(0);
console.log("First goal:", goal);
```

---

## 🎯 Next Steps

Now that you have a contract deployed:

1. **See Full Guide**: Read `CAMP_TESTNET_GUIDE.md` for complete implementation
2. **Update Frontend**: Integrate with React (see guide)
3. **Add Origin SDK**: Enable IP provenance features
4. **Join Community**: Visit https://testnet.campnetwork.xyz/ for quests

---

## 🐛 Troubleshooting

**"Insufficient funds"**
→ Get more CAMP: https://faucet.campnetwork.xyz/

**"Network not configured"**
→ Check hardhat.config.js has `campTestnet` network

**"Private key error"**
→ Make sure PRIVATE_KEY in .env has no `0x` prefix

**"Compilation failed"**
→ Run `npm install` to get dependencies

---

## 📚 Useful Commands

```bash
npm run compile          # Compile contracts
npm run deploy:testnet   # Deploy to Camp testnet
npm run console:testnet  # Interactive console
npm run verify           # Verify on block explorer
npm run test            # Run tests
npm run clean           # Clean artifacts
```

---

## 🔗 Important Links

- **Faucet**: https://faucet.campnetwork.xyz/
- **Explorer**: https://basecamp.cloud.blockscout.com/
- **Testnet UI**: https://testnet.campnetwork.xyz/
- **Docs**: https://docs.campnetwork.xyz/
- **Add Network**: https://chainlist.org/chain/123420001114

---

**You're now running on Camp Network! 🏕️**

For production deployment and advanced features, see the full guide: `CAMP_TESTNET_GUIDE.md`
