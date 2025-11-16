# Running Lock-In Responsible on Camp Network Testnet

This guide walks you through deploying and running Lock-In Responsible on Camp Network's testnet ("demonet").

## 🌐 Camp Network Testnet Options

### K2 Testnet (Recommended)
- **Chain ID**: 123420001114
- **Network Name**: basecamp
- **RPC URL**: https://rpc.basecamp.t.raas.gelato.cloud
- **Currency**: CAMP
- **Block Explorer**: https://basecamp.cloud.blockscout.com/
- **Faucet**: https://faucet.campnetwork.xyz/
- **Interactive Testnet**: https://testnet.campnetwork.xyz/

### Testnet V2 (Alternative)
- **Chain ID**: 325000
- **RPC URL**: https://rpc-campnetwork.xyz
- **Currency**: ETH
- **Block Explorer**: https://camp-network-testnet.blockscout.com/

---

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js 18+** installed
2. **MetaMask** or another Web3 wallet
3. **Testnet tokens** from the Camp faucet
4. **Basic Solidity knowledge** (for smart contract development)

---

## 🎯 Step 1: Get Testnet Tokens

### Method 1: Official Camp Faucet (Recommended)

1. Visit **https://faucet.campnetwork.xyz/**
2. Connect your wallet (MetaMask)
3. Link your X (Twitter) account and follow [@camp_network](https://twitter.com/camp_network)
4. Connect your Discord (optional)
5. Click "Request Tokens" - you'll receive 0.1 CAMP/ETH
6. **Wait 24 hours** between requests

### Method 2: ThirdWeb Faucet

1. Visit https://thirdweb.com/camp-network-testnet-v2
2. Scroll to "Faucet" section
3. Click "Get 0.01 ETH"
4. Receive tokens instantly

### Method 3: Summit Series Interactive Testnet

1. Visit https://testnet.campnetwork.xyz/
2. Complete quests in the campsite-themed interface
3. Earn testnet tokens and NUTs (Camp's incentive tokens)

---

## 🔧 Step 2: Add Camp Testnet to MetaMask

### Automatic (ChainList)

1. Visit https://chainlist.org/chain/123420001114
2. Click **"Connect Wallet"**
3. Click **"Add to MetaMask"**
4. Done! Network added automatically

### Manual

1. Open MetaMask
2. Click the **network dropdown** (top right)
3. Click **"Add Network"** → **"Add a network manually"**
4. Fill in the details:

**For K2 Testnet:**
```
Network Name: Camp Network K2 Testnet
RPC URL: https://rpc.basecamp.t.raas.gelato.cloud
Chain ID: 123420001114
Currency Symbol: CAMP
Block Explorer: https://basecamp.cloud.blockscout.com/
```

**For Testnet V2:**
```
Network Name: Camp Network Testnet V2
RPC URL: https://rpc-campnetwork.xyz
Chain ID: 325000
Currency Symbol: ETH
Block Explorer: https://camp-network-testnet.blockscout.com/
```

5. Click **"Save"**
6. Switch to the Camp Network in MetaMask

---

## 🛠️ Step 3: Set Up Development Environment

### Install Hardhat (Solidity Development)

```bash
# Navigate to project root
cd /home/user/lock-in-responsible

# Create contracts directory
mkdir -p contracts

# Install Hardhat and dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-verify
npm install --save-dev @openzeppelin/contracts dotenv

# Initialize Hardhat (if not already done)
npx hardhat init
# Choose: Create a JavaScript project
```

### Create Environment Variables

Create a `.env` file in the project root:

```bash
# Camp Testnet Configuration
CAMP_TESTNET_RPC_URL=https://rpc.basecamp.t.raas.gelato.cloud
CAMP_TESTNET_CHAIN_ID=123420001114

# Your wallet private key (NEVER commit this!)
# Export from MetaMask: Account Details → Export Private Key
PRIVATE_KEY=your_private_key_here

# Block Explorer API key (for contract verification)
CAMP_EXPLORER_API_KEY=your_api_key_if_available

# Origin SDK Client ID (get from Camp Network dashboard)
VITE_ORIGIN_CLIENT_ID=your_origin_client_id
```

**⚠️ IMPORTANT**: Add `.env` to your `.gitignore` to prevent committing secrets!

---

## ⚙️ Step 4: Configure Hardhat for Camp Network

Create/update `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  networks: {
    // Camp K2 Testnet (Main)
    campTestnet: {
      url: process.env.CAMP_TESTNET_RPC_URL || "https://rpc.basecamp.t.raas.gelato.cloud",
      chainId: 123420001114,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto"
    },

    // Camp Testnet V2 (Alternative)
    campTestnetV2: {
      url: "https://rpc-campnetwork.xyz",
      chainId: 325000,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto"
    },

    // Local development (for testing)
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },

  etherscan: {
    apiKey: {
      campTestnet: process.env.CAMP_EXPLORER_API_KEY || "placeholder"
    },
    customChains: [
      {
        network: "campTestnet",
        chainId: 123420001114,
        urls: {
          apiURL: "https://basecamp.cloud.blockscout.com/api",
          browserURL: "https://basecamp.cloud.blockscout.com"
        }
      }
    ]
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
```

---

## 📝 Step 5: Write Solidity Smart Contracts

You'll need to convert your Motoko canister to Solidity. Here's a starter template:

`contracts/LockInResponsible.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LockInResponsible is Ownable, ReentrancyGuard {
    // Enums
    enum GoalType { Custom, Coding, Fitness, Study, Work }
    enum GoalStatus { Pending, Completed, Failed, Verified }
    enum RequestStatus { Pending, Complete, Failed }

    // Structs
    struct Goal {
        uint256 id;
        address userId;
        string title;
        string description;
        GoalType goalType;
        uint256 deadline;
        uint256 createdAt;
        GoalStatus status;
        string proof;
        uint256 tokensReward;
    }

    struct VerificationRequest {
        uint256 id;
        uint256 goalId;
        address userId;
        string proofText;
        address[] selectedValidators;
        uint256 approvals;
        uint256 rejections;
        RequestStatus status;
        uint256 deadline;
    }

    struct UserStats {
        uint256 totalGoals;
        uint256 completedGoals;
        uint256 failedGoals;
        uint256 currentStreak;
        uint256 longestStreak;
        uint256 totalTokens;
    }

    // State variables
    uint256 private nextGoalId;
    uint256 private nextRequestId;

    mapping(uint256 => Goal) public goals;
    mapping(address => uint256[]) public userGoals;
    mapping(address => UserStats) public userStats;
    mapping(address => uint256) public userTokens;
    mapping(uint256 => VerificationRequest) public verificationRequests;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // Constants
    uint256 public constant REWARD_TOKENS = 10;
    uint256 public constant VERIFICATION_FEE = 0.5 ether;
    uint256 public constant VALIDATORS_NEEDED = 5;
    uint256 public constant CONSENSUS_THRESHOLD = 3;

    // Events
    event GoalCreated(uint256 indexed goalId, address indexed user, string title);
    event ProofSubmitted(uint256 indexed goalId, address indexed user);
    event VerificationCreated(uint256 indexed requestId, uint256 indexed goalId);
    event VerdictSubmitted(uint256 indexed requestId, address indexed validator, bool approved);
    event GoalVerified(uint256 indexed goalId, bool approved);

    constructor() Ownable(msg.sender) {}

    // Create a goal
    function createGoal(
        string memory _title,
        string memory _description,
        GoalType _goalType,
        uint256 _deadline
    ) external returns (uint256) {
        uint256 goalId = nextGoalId++;

        goals[goalId] = Goal({
            id: goalId,
            userId: msg.sender,
            title: _title,
            description: _description,
            goalType: _goalType,
            deadline: _deadline,
            createdAt: block.timestamp,
            status: GoalStatus.Pending,
            proof: "",
            tokensReward: REWARD_TOKENS
        });

        userGoals[msg.sender].push(goalId);
        userStats[msg.sender].totalGoals++;

        emit GoalCreated(goalId, msg.sender, _title);
        return goalId;
    }

    // Submit proof for a goal
    function submitProof(uint256 _goalId, string memory _proofText) external payable {
        Goal storage goal = goals[_goalId];
        require(goal.userId == msg.sender, "Not your goal");
        require(goal.status == GoalStatus.Pending, "Goal already processed");
        require(msg.value >= VERIFICATION_FEE, "Insufficient verification fee");

        goal.proof = _proofText;

        // Check if validators exist
        uint256 eligibleValidators = getEligibleValidatorsCount();

        if (eligibleValidators == 0) {
            // Auto-approve (bootstrapping mechanism)
            _approveGoal(_goalId);
        } else {
            // Create verification request
            _createVerificationRequest(_goalId, _proofText);
        }

        emit ProofSubmitted(_goalId, msg.sender);
    }

    // Internal: Create verification request
    function _createVerificationRequest(uint256 _goalId, string memory _proofText) internal {
        uint256 requestId = nextRequestId++;

        // TODO: Implement proper random validator selection
        address[] memory validators = new address[](0);

        verificationRequests[requestId] = VerificationRequest({
            id: requestId,
            goalId: _goalId,
            userId: msg.sender,
            proofText: _proofText,
            selectedValidators: validators,
            approvals: 0,
            rejections: 0,
            status: RequestStatus.Pending,
            deadline: block.timestamp + 5 minutes
        });

        emit VerificationCreated(requestId, _goalId);
    }

    // Submit verdict (vote)
    function submitVerdict(uint256 _requestId, bool _approved) external {
        VerificationRequest storage request = verificationRequests[_requestId];
        require(request.status == RequestStatus.Pending, "Request not pending");
        require(!hasVoted[_requestId][msg.sender], "Already voted");
        require(userStats[msg.sender].completedGoals > 0, "Must have completed goals to vote");

        hasVoted[_requestId][msg.sender] = true;

        if (_approved) {
            request.approvals++;
        } else {
            request.rejections++;
        }

        emit VerdictSubmitted(_requestId, msg.sender, _approved);

        // Check for consensus
        if (request.approvals >= CONSENSUS_THRESHOLD) {
            _finalizeVerification(_requestId, true);
        } else if (request.rejections > (VALIDATORS_NEEDED - CONSENSUS_THRESHOLD)) {
            _finalizeVerification(_requestId, false);
        }
    }

    // Internal: Finalize verification
    function _finalizeVerification(uint256 _requestId, bool _approved) internal {
        VerificationRequest storage request = verificationRequests[_requestId];
        request.status = _approved ? RequestStatus.Complete : RequestStatus.Failed;

        if (_approved) {
            _approveGoal(request.goalId);
        } else {
            _rejectGoal(request.goalId);
        }
    }

    // Internal: Approve goal
    function _approveGoal(uint256 _goalId) internal {
        Goal storage goal = goals[_goalId];
        goal.status = GoalStatus.Verified;

        // Award tokens
        userTokens[goal.userId] += REWARD_TOKENS;
        userStats[goal.userId].totalTokens += REWARD_TOKENS;
        userStats[goal.userId].completedGoals++;

        // Update streak (simplified)
        userStats[goal.userId].currentStreak++;
        if (userStats[goal.userId].currentStreak > userStats[goal.userId].longestStreak) {
            userStats[goal.userId].longestStreak = userStats[goal.userId].currentStreak;
        }

        emit GoalVerified(_goalId, true);
    }

    // Internal: Reject goal
    function _rejectGoal(uint256 _goalId) internal {
        Goal storage goal = goals[_goalId];
        goal.status = GoalStatus.Failed;
        userStats[goal.userId].failedGoals++;
        userStats[goal.userId].currentStreak = 0;

        emit GoalVerified(_goalId, false);
    }

    // Mark goal as failed manually
    function failGoal(uint256 _goalId) external {
        Goal storage goal = goals[_goalId];
        require(goal.userId == msg.sender, "Not your goal");
        require(goal.status == GoalStatus.Pending, "Goal already processed");

        _rejectGoal(_goalId);
    }

    // Get eligible validators count
    function getEligibleValidatorsCount() public view returns (uint256) {
        // TODO: Implement proper validator counting
        return 0;
    }

    // Get user's goals
    function getUserGoals(address _user) external view returns (uint256[] memory) {
        return userGoals[_user];
    }

    // Get goal details
    function getGoal(uint256 _goalId) external view returns (Goal memory) {
        return goals[_goalId];
    }

    // Get user stats
    function getUserStats(address _user) external view returns (UserStats memory) {
        return userStats[_user];
    }
}
```

---

## 🚀 Step 6: Deploy to Camp Testnet

### Compile Contracts

```bash
npx hardhat compile
```

### Create Deployment Script

Create `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying LockInResponsible to Camp Network...");

  const LockInResponsible = await hre.ethers.getContractFactory("LockInResponsible");
  const contract = await LockInResponsible.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("LockInResponsible deployed to:", address);

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: address,
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployment-info.json");
  console.log("\nView on explorer:");
  console.log(`https://basecamp.cloud.blockscout.com/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Deploy!

```bash
# Deploy to Camp K2 Testnet
npx hardhat run scripts/deploy.js --network campTestnet

# OR deploy to Testnet V2
npx hardhat run scripts/deploy.js --network campTestnetV2
```

You should see output like:
```
Deploying LockInResponsible to Camp Network...
LockInResponsible deployed to: 0x1234567890abcdef...
View on explorer: https://basecamp.cloud.blockscout.com/address/0x1234...
```

---

## 🎨 Step 7: Update Frontend for Camp Network

### Install Frontend Dependencies

```bash
cd frontend

# Remove ICP packages (if migrating)
npm uninstall @dfinity/agent @dfinity/auth-client @dfinity/candid @dfinity/principal

# Install Camp/EVM packages
npm install @campnetwork/origin viem wagmi @tanstack/react-query
npm install @rainbow-me/rainbowkit
```

### Configure Wagmi for Camp Network

Create `frontend/src/lib/wagmi-config.ts`:

```typescript
import { createConfig, http } from 'wagmi';
import { WagmiProvider } from 'wagmi';

// Define Camp Network
export const campTestnet = {
  id: 123420001114,
  name: 'Camp Network K2 Testnet',
  network: 'basecamp',
  nativeCurrency: {
    decimals: 18,
    name: 'CAMP',
    symbol: 'CAMP',
  },
  rpcUrls: {
    default: { http: ['https://rpc.basecamp.t.raas.gelato.cloud'] },
    public: { http: ['https://rpc.basecamp.t.raas.gelato.cloud'] },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://basecamp.cloud.blockscout.com',
    },
  },
  testnet: true,
};

export const wagmiConfig = createConfig({
  chains: [campTestnet],
  transports: {
    [campTestnet.id]: http(),
  },
});
```

### Update App.tsx

```tsx
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { CampProvider } from '@campnetwork/origin/react';
import { wagmiConfig } from './lib/wagmi-config';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <CampProvider clientId={import.meta.env.VITE_ORIGIN_CLIENT_ID}>
            {/* Your app components */}
          </CampProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### Update Environment Variables

Create `frontend/.env`:

```bash
# Contract address from deployment
VITE_CONTRACT_ADDRESS=0x_your_deployed_contract_address

# Camp Network RPC
VITE_CAMP_RPC_URL=https://rpc.basecamp.t.raas.gelato.cloud
VITE_CAMP_CHAIN_ID=123420001114

# Origin SDK Client ID
VITE_ORIGIN_CLIENT_ID=your_client_id_from_camp_dashboard

# App config
VITE_APP_NAME="Lock-In Responsible"
```

---

## ✅ Step 8: Test Your Deployment

### Interact with Contract via Hardhat Console

```bash
npx hardhat console --network campTestnet
```

```javascript
// In console
const Contract = await ethers.getContractFactory("LockInResponsible");
const contract = await Contract.attach("0x_your_contract_address");

// Create a test goal
const tx = await contract.createGoal(
  "Complete Solidity tutorial",
  "Finish all 10 modules",
  0, // GoalType.Custom
  Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
);
await tx.wait();
console.log("Goal created!");

// Get user stats
const stats = await contract.getUserStats("0x_your_address");
console.log("Stats:", stats);
```

### Test Frontend

```bash
cd frontend
npm run dev
```

1. Visit http://localhost:5173
2. Connect your MetaMask (should auto-switch to Camp testnet)
3. Create a goal
4. Submit proof
5. Check the block explorer to see your transactions!

---

## 🔍 Verify Contract on Block Explorer

```bash
npx hardhat verify --network campTestnet 0x_your_contract_address
```

This makes your contract source code public and readable on Blockscout.

---

## 📊 Monitor Your Deployment

- **View transactions**: https://basecamp.cloud.blockscout.com/
- **Check wallet balance**: MetaMask on Camp Network
- **Summit Series quests**: https://testnet.campnetwork.xyz/
- **Get more testnet tokens**: https://faucet.campnetwork.xyz/ (every 24h)

---

## 🐛 Troubleshooting

### "Insufficient funds" error
→ Get more CAMP from the faucet: https://faucet.campnetwork.xyz/

### "Network not found"
→ Double-check Chain ID is `123420001114` and RPC URL is correct

### "Transaction failed"
→ Check gas limit, ensure you have enough CAMP for gas

### MetaMask not connecting
→ Manually add the network using the settings in Step 2

### Contract deployment fails
→ Ensure your Solidity version matches (`0.8.20`) and you have testnet CAMP

---

## 🎯 Next Steps

1. **Integrate Origin SDK** for IP provenance (see `ORIGIN_SDK_INTEGRATION.md`)
2. **Add randomness** using Chainlink VRF for validator selection
3. **Optimize gas costs** by using events instead of storage where possible
4. **Add tests** using Hardhat test framework
5. **Deploy to mainnet** when ready (similar process, just change network)

---

## 📚 Additional Resources

- **Camp Network Docs**: https://docs.campnetwork.xyz/
- **Hardhat Docs**: https://hardhat.org/docs
- **Wagmi Docs**: https://wagmi.sh/
- **Origin SDK**: https://docs.campnetwork.xyz/origin-v1/getting-started
- **Camp Discord**: Join for developer support
- **Block Explorer**: https://basecamp.cloud.blockscout.com/

---

**You're now ready to run Lock-In Responsible on Camp Network's testnet!** 🎉

Need help? Check the troubleshooting section or reach out to the Camp Network community.
