import { HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { LLMVerifier } from './llm-verifier.js';

export class Validator {
  constructor(config) {
    this.config = config;
    this.agent = null;
    this.actor = null;
    this.llmVerifier = new LLMVerifier(config.llmProvider);
    this.isRunning = false;
    this.activeRequests = new Map();
  }

  async start() {
    console.log('📡 Connecting to ICP network...');

    // Create agent
    const host = this.config.network === 'local'
      ? 'http://localhost:4943'
      : 'https://ic0.app';

    this.agent = new HttpAgent({ host });

    // For local development, fetch root key
    if (this.config.network === 'local') {
      await this.agent.fetchRootKey();
    }

    // TODO: Create actor with proper IDL
    // this.actor = Actor.createActor(idlFactory, {
    //   agent: this.agent,
    //   canisterId: this.config.canisterId,
    // });

    console.log('✅ Connected to ICP');
    console.log('🔄 Starting request listener...');

    this.isRunning = true;
    this.listenForRequests();
  }

  async listenForRequests() {
    while (this.isRunning) {
      try {
        // Poll canister for pending verification requests
        // const requests = await this.actor.getPendingRequests();

        // For now, simulating
        const requests = [];

        for (const request of requests) {
          // Check if we're a selected validator
          if (this.isSelectedValidator(request)) {
            // Process request if not already processing
            if (!this.activeRequests.has(request.id)) {
              this.processRequest(request).catch(err => {
                console.error(`Error processing request ${request.id}:`, err);
              });
            }
          }
        }

        // Wait before next poll
        await this.sleep(this.config.pollInterval);

      } catch (error) {
        console.error('Error in request listener:', error);
        await this.sleep(this.config.pollInterval);
      }
    }
  }

  isSelectedValidator(request) {
    // Check if our principal is in the selected validators list
    const ourPrincipal = this.agent.getPrincipal();
    return request.validators.some(v =>
      v.toText() === ourPrincipal.toText()
    );
  }

  async processRequest(request) {
    console.log(`\n🔍 Processing verification request: ${request.id}`);
    this.activeRequests.set(request.id, Date.now());

    try {
      // 1. Download proof data
      console.log('📥 Downloading proof...');
      const proof = await this.downloadProof(request.proofUrl);

      // 2. Verify with LLM
      console.log(`🤖 Verifying with ${this.config.llmProvider}...`);
      const verdict = await this.llmVerifier.verify(request.goal, proof);

      console.log('📊 Verdict:', {
        verified: verdict.verified,
        confidence: verdict.confidence,
        reasoning: verdict.reasoning.substring(0, 100) + '...'
      });

      // 3. Submit verdict to canister
      console.log('📤 Submitting verdict to ICP...');
      // await this.actor.submitVerdict(
      //   request.id,
      //   verdict.verified,
      //   verdict.confidence,
      //   verdict.reasoning
      // );

      console.log('✅ Verdict submitted successfully!');

    } catch (error) {
      console.error('❌ Failed to process request:', error);
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  async downloadProof(proofUrl) {
    // Download proof from IPFS/HTTP
    // For now, return mock data
    return {
      text: "I coded for 2 hours on my project",
      screenshot: null
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    console.log('🛑 Stopping validator node...');
    this.isRunning = false;
  }
}
