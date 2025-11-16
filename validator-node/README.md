# Validator Node (WIP - Not Functional)

⚠️ **STATUS: INCOMPLETE / WORK IN PROGRESS**

This validator node is **not currently functional** and should be considered a proof-of-concept only.

## What's Not Implemented

### Critical Missing Features:
1. **ICP Actor Integration** - Lines 30-34 in `validator.js` are commented out
   - No actual connection to the canister
   - Cannot fetch verification requests from the blockchain
   - Cannot submit verdicts back to the canister

2. **Verification Request Polling** - Line 47-50 in `validator.js`
   - Currently returns an empty array (mocked)
   - Would need proper IDL definition from canister

3. **Verdict Submission** - Lines 103-108 in `validator.js`
   - Code is commented out
   - Cannot actually submit verdicts to the canister

4. **Proof Download** - Lines 119-126 in `validator.js`
   - Returns mock data only
   - No actual IPFS or storage integration

5. **Anthropic Integration** - Line 94-97 in `llm-verifier.js`
   - Throws "not yet implemented" error

## What IS Implemented

- ✅ OpenAI GPT integration for proof verification
- ✅ Ollama (local LLM) integration
- ✅ LLM prompt engineering for goal verification
- ✅ JSON response parsing with fallback handling
- ✅ Basic polling architecture

## Current System

The main application **does not require** this validator node to function. Instead:
- Community-based voting is handled through the frontend
- Users vote directly on proofs through the Voting page
- The canister manages consensus and verification

## To Make This Functional

To complete this validator node, you would need to:

1. Define the complete IDL for the canister's verification system
2. Implement `getPendingVerificationRequests()` endpoint in canister
3. Implement `submitVerdict()` endpoint in canister
4. Add proper identity/key management for validator authentication
5. Implement IPFS or storage integration for proof downloads
6. Complete Anthropic API integration
7. Add error handling and retry logic
8. Add monitoring and logging

## How to Run (for development only)

```bash
cd validator-node
npm install
cp .env.example .env
# Edit .env with your settings
npm start
```

**Note:** Even if you run this, it won't do anything useful until the above integrations are completed.

## Recommended Approach

For production use, consider:
1. Keeping the community voting system as the primary verification method
2. Using this validator node as an optional "AI assistant" for validators
3. Or completing the implementation as a separate enhancement project

## Dependencies

- `@dfinity/agent` - ICP network communication
- `openai` - OpenAI API client
- `ollama` - Local LLM client
- `dotenv` - Environment configuration
