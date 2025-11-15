# Validator Node

Run a decentralized validator node with local LLM to earn rewards for verifying goal completions.

## Overview

The validator node:
- ✅ Listens for validation requests on the blockchain
- 🤖 Runs local AI models (via Ollama) to verify proof
- 📝 Submits votes to smart contracts
- 💰 Earns rewards for honest validation
- 📊 Builds reputation over time

## Prerequisites

### 1. Ollama (Local LLM Runtime)

Install Ollama:
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Or visit: https://ollama.com/download
```

Pull a model (choose one):
```bash
# Recommended: Fast and efficient
ollama pull llama3.2:3b

# Alternative: More powerful
ollama pull mistral:7b
ollama pull llama3:8b

# Lightweight: For low-end hardware
ollama pull phi3:mini
```

Start Ollama server:
```bash
ollama serve
```

### 2. IPFS (Optional, for uploading)

For reading from IPFS, only a gateway is needed (default: ipfs.io).

For uploading validation reasoning, you can either:
- Run a local IPFS node
- Use web3.storage (free, recommended)
- Use Pinata (free tier available)

#### Option A: Local IPFS Node
```bash
# Install IPFS
# Visit: https://docs.ipfs.tech/install/

# Start IPFS daemon
ipfs daemon
```

#### Option B: web3.storage
1. Sign up at https://web3.storage
2. Get API token
3. Add to `.env`: `WEB3_STORAGE_TOKEN=your_token`

#### Option C: Pinata
1. Sign up at https://pinata.cloud
2. Get JWT token
3. Add to `.env`: `PINATA_JWT=your_jwt`

### 3. Blockchain Wallet

You need a wallet with:
- **Testnet ETH/MATIC** (for gas fees)
- **Validator stake** (minimum 0.1 ETH)

Get testnet tokens:
- Polygon Mumbai: https://faucet.polygon.technology/
- Sepolia: https://sepoliafaucet.com/

## Setup

### 1. Install Dependencies

```bash
cd validator-node
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
VALIDATOR_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY
GOAL_REGISTRY_ADDRESS=0x... # From deployment
VALIDATOR_REGISTRY_ADDRESS=0x... # From deployment
```

### 3. Register as Validator

```bash
# This will stake 0.1 ETH to register
npm run register-validator
```

### 4. Start the Validator Node

```bash
npm start
```

You should see:
```
🚀 Starting Lock-In Responsible Validator Node
============================================================
✅ Ollama connection verified
✅ Registered validator
   Reputation: 500/1000
   Total validations: 0
   Stake: 0.1 ETH
✅ Initialization complete
🎧 Listening for validation requests...
============================================================
📊 Health check server running on port 3001
   http://localhost:3001/health
   http://localhost:3001/stats
```

## How It Works

### Validation Flow

```
1. User submits proof → Smart contract emits event
   ↓
2. Your validator node receives event
   ↓
3. Fetches goal description from IPFS
   ↓
4. Fetches proof data from IPFS
   ↓
5. Runs local LLM (Llama/Mistral) to analyze
   ↓
6. LLM returns: approved/rejected + confidence + reasoning
   ↓
7. Uploads reasoning to IPFS
   ↓
8. Submits vote to blockchain
   ↓
9. If consensus reached (3/5 validators) → goal finalized
   ↓
10. You earn rewards! 💰
```

### Example Validation

```
============================================================
🔍 Processing Validation #42
============================================================
📥 Step 1/5: Fetching goal details...
   Goal: Complete 100 pushups
   Description: Do 100 pushups in one session, record video proof

📥 Step 2/5: Fetching proof from IPFS...
   Proof text length: 156 chars
   Proof images: 2

🤖 Step 3/5: Running LLM validation...
   Running llama3.2:3b...
   Inference completed in 3.42s
   LLM Decision: ✅ APPROVED
   Confidence: 85%
   Reasoning: Video clearly shows user performing 100 consecutive pushups...

📤 Step 4/5: Uploading reasoning to IPFS...
   Reasoning IPFS hash: QmXyz...

📝 Step 5/5: Submitting vote to blockchain...
   Transaction hash: 0xabc...
   ⏳ Waiting for confirmation...
   ✅ Vote submitted successfully!
   Block number: 12345
   Gas used: 85432

⏱️  Total processing time: 8.73s
============================================================
```

## Rewards

### Earning Mechanism
- **Per validation**: 0.001 ETH + portion of protocol fees
- **Reputation bonus**: Higher reputation → more selections
- **Consensus rewards**: Extra rewards for voting with majority

### Reputation System
- Starts at 500 (out of 1000)
- Increases when your vote matches consensus
- Decreases when you vote against consensus
- Below 100 reputation → automatically deactivated

### Slashing
You lose stake if:
- Consistently vote against consensus (suspected dishonesty)
- Your reputation drops too low
- Malicious behavior detected

## Commands

```bash
# Start validator
npm start

# Development mode (auto-restart)
npm run dev

# Check status
curl http://localhost:3001/health

# View stats
curl http://localhost:3001/stats

# Register as validator
npm run register-validator

# Check available models
ollama list

# Pull new model
ollama pull model-name
```

## Monitoring

### Health Check Endpoint
```bash
GET http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "validator": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "isActive": true,
  "reputation": 587,
  "totalValidations": 42
}
```

### Stats Endpoint
```bash
GET http://localhost:3001/stats
```

Response:
```json
{
  "validator": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "isActive": true,
  "reputation": 587,
  "stats": {
    "totalValidations": 42,
    "successfulValidations": 39,
    "failedValidations": 3,
    "totalRewardsEarned": "0.042",
    "successRate": "92.86%"
  }
}
```

## Troubleshooting

### Ollama not found
```
❌ Ollama is not running. Please start Ollama first:
   ollama serve
```
**Solution**: Start Ollama in another terminal: `ollama serve`

### Model not found
```
⚠️  Model llama3.2:3b not found
```
**Solution**: Pull the model: `ollama pull llama3.2:3b`

### Insufficient stake
```
Error: Insufficient stake. Minimum: 0.1 ETH
```
**Solution**: Ensure your wallet has at least 0.1 ETH + gas

### RPC connection failed
```
❌ Failed to connect to RPC
```
**Solution**:
- Check your `RPC_URL` in `.env`
- Get a free RPC from Alchemy or Infura
- Ensure you have internet connection

### No validation requests
If you're not receiving validation requests:
1. Check you're registered: `await validatorRegistry.isActiveValidator(yourAddress)`
2. Ensure your reputation is > 100
3. Ensure your stake is >= 0.1 ETH
4. Wait for users to submit proofs

## Hardware Requirements

### Minimum:
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Disk**: 20 GB free space
- **Network**: Stable internet (10 Mbps)

### Recommended:
- **CPU**: 8+ cores
- **RAM**: 16 GB
- **Disk**: 50 GB SSD
- **Network**: 50+ Mbps

### LLM Model Sizes:
- `phi3:mini` - 2.3 GB
- `llama3.2:3b` - 2.0 GB
- `mistral:7b` - 4.1 GB
- `llama3:8b` - 4.7 GB

## Security

### Private Key Safety
- Never commit `.env` file
- Use hardware wallet for large stakes
- Consider using a dedicated validator wallet
- Back up your private key securely

### Running in Production
```bash
# Use PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start npm --name "validator" -- start

# Monitor
pm2 monit

# View logs
pm2 logs validator

# Auto-restart on system reboot
pm2 startup
pm2 save
```

## Advanced Configuration

### Custom LLM Prompts
Edit `src/llm/ollama.js` → `_buildValidationPrompt()` to customize how the LLM evaluates proofs.

### Custom IPFS Gateway
If IPFS.io is slow, use alternative gateways:
```env
IPFS_GATEWAY=https://cloudflare-ipfs.com
# or
IPFS_GATEWAY=https://gateway.pinata.cloud
```

### Multiple Validators
Run multiple validator nodes:
1. Use different wallets for each
2. Use different ports: `PORT=3001`, `PORT=3002`, etc.
3. Start each in separate directories

## Contributing

Found a bug or have a feature request? Open an issue!

## License

MIT
