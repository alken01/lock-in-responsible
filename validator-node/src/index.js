import dotenv from 'dotenv';
import { Validator } from './validator.js';

dotenv.config();

async function main() {
  console.log('🚀 Starting Lock-In Validator Node...');

  const config = {
    canisterId: process.env.CANISTER_ID,
    network: process.env.NETWORK || 'local',
    llmProvider: process.env.LLM_PROVIDER || 'ollama',
    pollInterval: parseInt(process.env.POLL_INTERVAL || '5000'),
    verdictTimeout: parseInt(process.env.VERDICT_TIMEOUT || '60000'),
  };

  console.log('⚙️  Configuration:', {
    ...config,
    canisterId: config.canisterId?.substring(0, 10) + '...',
  });

  const validator = new Validator(config);

  try {
    await validator.start();
    console.log('✅ Validator node is running!');
  } catch (error) {
    console.error('❌ Failed to start validator:', error);
    process.exit(1);
  }
}

main();
