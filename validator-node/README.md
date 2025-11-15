# Lock-In Validator Node

Decentralized validator node for the Lock-In Responsible network.

## Overview

Validators earn rewards by verifying goal completions using AI/LLM analysis. The network uses consensus to ensure honest verification.

## How It Works

1. **Listen** - Node polls ICP canister for verification requests
2. **Verify** - Uses LLM (local or API) to analyze proof
3. **Submit** - Sends verdict (verified/rejected + confidence) to canister
4. **Earn** - Get paid if verdict matches consensus (3/5 majority)

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start validator
npm start
```

## LLM Providers

### Option 1: Ollama (Local, Free)
```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull model
ollama pull llama3

# Set in .env
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3
```

### Option 2: OpenAI (API, Paid)
```bash
# Set in .env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### Option 3: Anthropic Claude (API, Paid)
```bash
# Set in .env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

## Economics

- **Stake**: 100 tokens to become validator
- **Reward**: ~$0.10-0.50 per verification
- **Slashing**: Wrong verdicts = reputation loss
- **Uptime**: 99%+ required

## Verification Process

```javascript
// 1. Receive request
{
  id: "req_123",
  goalId: "goal_456",
  goal: {
    title: "Code for 2 hours",
    type: "coding"
  },
  proof: {
    text: "Worked on my project",
    screenshot: "ipfs://..."
  }
}

// 2. LLM Analysis
const verdict = await llm.verify(goal, proof);

// 3. Submit verdict
{
  verified: true,
  confidence: 95,
  reasoning: "Screenshot shows VS Code with 2hr git log"
}

// 4. Consensus (3/5 verified = approved)
```

## Commands

```bash
npm start          # Start validator node
npm run dev        # Development mode with auto-restart
```

## Monitoring

The validator logs all activity:
- 🔍 Processing requests
- 🤖 LLM verdicts
- ✅ Successful submissions
- ❌ Errors

## Requirements

- Node.js 18+
- ICP canister deployed
- LLM access (local or API)
- Stable internet connection
