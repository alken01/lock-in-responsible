import { ethers } from 'ethers';
import { OllamaClient } from './llm/ollama.js';
import { IPFSClient } from './storage/ipfs.js';
import { logger } from './utils/logger.js';

/**
 * Validator Node - Listens for validation requests and processes them using local LLM
 */
export class ValidatorNode {
  constructor(config) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.address = this.wallet.address;

    // Initialize clients
    this.ollama = new OllamaClient(config.ollamaUrl, config.llmModel);
    this.ipfs = new IPFSClient(config.ipfsGateway);

    // State
    this.isActive = false;
    this.isRunning = false;
    this.reputation = 0;
    this.stats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      totalRewardsEarned: ethers.parseEther('0'),
    };

    // Contract instances
    this.goalRegistry = null;
    this.validatorRegistry = null;

    // Event listeners
    this.eventListeners = [];
  }

  /**
   * Initialize the validator node
   */
  async initialize() {
    logger.info('🔧 Initializing validator node...');
    logger.info(`   Validator address: ${this.address}`);

    // Load contract ABIs
    const { GoalRegistryABI, ValidatorRegistryABI } = await this._loadABIs();

    // Create contract instances
    this.goalRegistry = new ethers.Contract(
      this.config.goalRegistryAddress,
      GoalRegistryABI,
      this.wallet
    );

    this.validatorRegistry = new ethers.Contract(
      this.config.validatorRegistryAddress,
      ValidatorRegistryABI,
      this.wallet
    );

    // Check if registered as validator
    const validatorData = await this.validatorRegistry.getValidator(this.address);
    this.isActive = validatorData.isActive;
    this.reputation = Number(validatorData.reputation);

    if (this.isActive) {
      logger.info(`✅ Registered validator`);
      logger.info(`   Reputation: ${this.reputation}/1000`);
      logger.info(`   Total validations: ${validatorData.totalValidations}`);
      logger.info(`   Stake: ${ethers.formatEther(validatorData.stake)} ETH`);
    } else {
      logger.warn(`⚠️  Not registered as active validator`);
      logger.warn(`   Register with: npm run register-validator`);
    }

    // Test Ollama connection
    await this.ollama.testConnection();

    logger.info('✅ Initialization complete');
  }

  /**
   * Start listening for validation requests
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Validator node already running');
      return;
    }

    if (!this.isActive) {
      logger.error('Cannot start: validator not active');
      logger.error('Please register as validator first');
      return;
    }

    this.isRunning = true;
    logger.info('🎧 Listening for validation requests...');
    logger.info('=' .repeat(60));

    // Listen for ProofSubmitted events
    const filter = this.goalRegistry.filters.ProofSubmitted();

    this.goalRegistry.on(filter, async (goalId, validationId, proofIpfsHash, validators, event) => {
      // Check if this validator was selected
      if (validators.includes(this.address)) {
        logger.info(`\n📬 New validation request received!`);
        logger.info(`   Validation ID: ${validationId}`);
        logger.info(`   Goal ID: ${goalId}`);

        try {
          await this.processValidationRequest(validationId, goalId, proofIpfsHash);
        } catch (error) {
          logger.error(`❌ Error processing validation ${validationId}:`, error);
        }
      }
    });

    // Periodic health check
    setInterval(() => this._healthCheck(), 60000); // Every minute
  }

  /**
   * Stop the validator node
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping validator node...');
    this.isRunning = false;

    // Remove event listeners
    this.goalRegistry.removeAllListeners();

    logger.info('✅ Validator node stopped');
  }

  /**
   * Process a validation request
   */
  async processValidationRequest(validationId, goalId, proofIpfsHash) {
    const startTime = Date.now();

    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`🔍 Processing Validation #${validationId}`);
    logger.info(`${'='.repeat(60)}`);

    try {
      // Step 1: Fetch goal details
      logger.info('📥 Step 1/5: Fetching goal details...');
      const goal = await this.goalRegistry.goals(goalId);
      const goalIpfsHash = goal.ipfsHash;

      // Fetch goal description from IPFS
      const goalData = await this.ipfs.fetchJson(goalIpfsHash);
      logger.info(`   Goal: ${goalData.title}`);
      logger.info(`   Description: ${goalData.description.substring(0, 100)}...`);

      // Step 2: Fetch proof data
      logger.info('📥 Step 2/5: Fetching proof from IPFS...');
      const proofData = await this.ipfs.fetchJson(proofIpfsHash);
      logger.info(`   Proof text length: ${proofData.text?.length || 0} chars`);
      logger.info(`   Proof images: ${proofData.images?.length || 0}`);

      // Step 3: Run LLM validation
      logger.info('🤖 Step 3/5: Running LLM validation...');
      const llmResult = await this.ollama.validateProof({
        goalTitle: goalData.title,
        goalDescription: goalData.description,
        goalType: goalData.type,
        proofText: proofData.text,
        proofImages: proofData.images, // URLs to images
        metadata: {
          validationId: validationId.toString(),
          goalId: goalId.toString(),
        },
      });

      logger.info(`   LLM Decision: ${llmResult.approved ? '✅ APPROVED' : '❌ REJECTED'}`);
      logger.info(`   Confidence: ${llmResult.confidence}%`);
      logger.info(`   Reasoning: ${llmResult.reasoning.substring(0, 100)}...`);

      // Step 4: Upload reasoning to IPFS
      logger.info('📤 Step 4/5: Uploading reasoning to IPFS...');
      const reasoningIpfsHash = await this.ipfs.uploadJson({
        validationId: validationId.toString(),
        validator: this.address,
        approved: llmResult.approved,
        confidence: llmResult.confidence,
        reasoning: llmResult.reasoning,
        timestamp: Date.now(),
        llmModel: this.config.llmModel,
      });
      logger.info(`   Reasoning IPFS hash: ${reasoningIpfsHash}`);

      // Step 5: Submit vote to blockchain
      logger.info('📝 Step 5/5: Submitting vote to blockchain...');
      const tx = await this.goalRegistry.castVote(
        validationId,
        llmResult.approved,
        llmResult.confidence,
        reasoningIpfsHash
      );

      logger.info(`   Transaction hash: ${tx.hash}`);
      logger.info(`   ⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        logger.info(`   ✅ Vote submitted successfully!`);
        logger.info(`   Block number: ${receipt.blockNumber}`);
        logger.info(`   Gas used: ${receipt.gasUsed.toString()}`);

        this.stats.totalValidations++;
        if (llmResult.approved) {
          this.stats.successfulValidations++;
        }
      } else {
        logger.error(`   ❌ Transaction failed`);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`\n⏱️  Total processing time: ${duration}s`);
      logger.info(`${'='.repeat(60)}\n`);

    } catch (error) {
      logger.error(`❌ Error in validation process:`, error);
      logger.error(`   Validation ID: ${validationId}`);
      logger.error(`   Goal ID: ${goalId}`);

      this.stats.failedValidations++;
    }
  }

  /**
   * Get validator statistics
   */
  getStats() {
    return {
      validator: this.address,
      isActive: this.isActive,
      reputation: this.reputation,
      stats: {
        ...this.stats,
        totalRewardsEarned: ethers.formatEther(this.stats.totalRewardsEarned),
        successRate: this.stats.totalValidations > 0
          ? ((this.stats.successfulValidations / this.stats.totalValidations) * 100).toFixed(2) + '%'
          : '0%',
      },
    };
  }

  /**
   * Periodic health check
   */
  async _healthCheck() {
    try {
      // Check blockchain connection
      const blockNumber = await this.provider.getBlockNumber();

      // Check Ollama connection
      await this.ollama.testConnection();

      // Update validator stats
      const validatorData = await this.validatorRegistry.getValidator(this.address);
      this.reputation = Number(validatorData.reputation);
      this.isActive = validatorData.isActive;

      logger.info(`💓 Health check: Block ${blockNumber}, Reputation ${this.reputation}`);

    } catch (error) {
      logger.error('❌ Health check failed:', error);
    }
  }

  /**
   * Load contract ABIs (simplified for now)
   */
  async _loadABIs() {
    // In production, load from compiled contract artifacts
    // For now, return minimal ABIs with the functions we need

    const GoalRegistryABI = [
      'event ProofSubmitted(uint256 indexed goalId, uint256 indexed validationId, string proofIpfsHash, address[] validators)',
      'function goals(uint256) view returns (address user, uint256 goalId, string ipfsHash, uint256 stakeAmount, uint256 deadline, bytes32 deviceId, uint8 status, uint256 createdAt)',
      'function castVote(uint256 validationId, bool approved, uint8 confidence, string reasoningIpfsHash) returns ()',
      'function getValidationDetails(uint256) view returns (uint256 goalId, string proofIpfsHash, address[] validators, uint256 approvalCount, uint256 rejectionCount, uint8 status)',
    ];

    const ValidatorRegistryABI = [
      'function getValidator(address) view returns (uint256 stake, uint256 reputation, uint256 totalValidations, uint256 successfulValidations, uint256 totalRewardsEarned, bool isActive, string metadata)',
      'function registerValidator(string metadata) payable',
      'function isActiveValidator(address) view returns (bool)',
    ];

    return { GoalRegistryABI, ValidatorRegistryABI };
  }
}
