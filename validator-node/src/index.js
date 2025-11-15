#!/usr/bin/env node

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { ValidatorNode } from './validator.js';
import { logger } from './utils/logger.js';
import express from 'express';

dotenv.config();

/**
 * Main entry point for the validator node
 */
async function main() {
  logger.info('🚀 Starting Lock-In Responsible Validator Node');
  logger.info('=' .repeat(60));

  // Validate environment variables
  const requiredEnvVars = [
    'VALIDATOR_PRIVATE_KEY',
    'RPC_URL',
    'GOAL_REGISTRY_ADDRESS',
    'VALIDATOR_REGISTRY_ADDRESS',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      logger.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  // Check if Ollama is running
  try {
    const ollamaCheck = await fetch('http://localhost:11434/api/tags');
    if (!ollamaCheck.ok) {
      throw new Error('Ollama not responding');
    }
    logger.info('✅ Ollama connection verified');
  } catch (error) {
    logger.error('❌ Ollama is not running. Please start Ollama first:');
    logger.error('   ollama serve');
    process.exit(1);
  }

  // Initialize validator node
  const validator = new ValidatorNode({
    privateKey: process.env.VALIDATOR_PRIVATE_KEY,
    rpcUrl: process.env.RPC_URL,
    goalRegistryAddress: process.env.GOAL_REGISTRY_ADDRESS,
    validatorRegistryAddress: process.env.VALIDATOR_REGISTRY_ADDRESS,
    ipfsGateway: process.env.IPFS_GATEWAY || 'https://ipfs.io',
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    llmModel: process.env.LLM_MODEL || 'llama3.2:3b',
  });

  try {
    // Initialize and start the validator
    await validator.initialize();
    await validator.start();

    // Start health check server
    const app = express();
    const port = process.env.PORT || 3001;

    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        validator: validator.address,
        isActive: validator.isActive,
        reputation: validator.reputation,
        totalValidations: validator.stats.totalValidations,
      });
    });

    app.get('/stats', (req, res) => {
      res.json(validator.getStats());
    });

    app.listen(port, () => {
      logger.info(`📊 Health check server running on port ${port}`);
      logger.info(`   http://localhost:${port}/health`);
      logger.info(`   http://localhost:${port}/stats`);
    });

  } catch (error) {
    logger.error('❌ Failed to start validator node:', error);
    process.exit(1);
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('\n⏸️  Shutting down gracefully...');
    await validator.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('\n⏸️  Shutting down gracefully...');
    await validator.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
