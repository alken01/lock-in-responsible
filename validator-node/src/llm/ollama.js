import axios from 'axios';
import { logger } from '../utils/logger.js';

/**
 * Ollama Client - Interfaces with local Ollama instance for LLM validation
 */
export class OllamaClient {
  constructor(baseUrl = 'http://localhost:11434', model = 'llama3.2:3b') {
    this.baseUrl = baseUrl;
    this.model = model;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 60000, // 60 second timeout for LLM inference
    });
  }

  /**
   * Test connection to Ollama
   */
  async testConnection() {
    try {
      const response = await this.client.get('/api/tags');
      const models = response.data.models || [];
      const hasModel = models.some(m => m.name === this.model);

      if (!hasModel) {
        logger.warn(`⚠️  Model ${this.model} not found. Available models:`);
        models.forEach(m => logger.warn(`   - ${m.name}`));
        logger.warn(`   Run: ollama pull ${this.model}`);
      } else {
        logger.info(`✅ Ollama connected (model: ${this.model})`);
      }

      return true;
    } catch (error) {
      logger.error('❌ Failed to connect to Ollama:', error.message);
      throw error;
    }
  }

  /**
   * Validate proof using local LLM
   */
  async validateProof(data) {
    const {
      goalTitle,
      goalDescription,
      goalType,
      proofText,
      proofImages = [],
      metadata = {},
    } = data;

    logger.info(`   Running ${this.model}...`);

    // Construct prompt
    const prompt = this._buildValidationPrompt(
      goalTitle,
      goalDescription,
      goalType,
      proofText,
      proofImages
    );

    try {
      const startTime = Date.now();

      // Call Ollama API
      const response = await this.client.post('/api/generate', {
        model: this.model,
        prompt: prompt,
        stream: false,
        format: 'json', // Request JSON response
        options: {
          temperature: 0.3, // Lower temperature for more consistent judgments
          top_p: 0.9,
        },
      });

      const inference Time = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`   Inference completed in ${inferenceTime}s`);

      // Parse LLM response
      const result = this._parseResponse(response.data.response);

      return {
        approved: result.approved,
        confidence: result.confidence,
        reasoning: result.reasoning,
        manipulationDetected: result.manipulation_detected || false,
        metadata: {
          ...metadata,
          model: this.model,
          inferenceTime: `${inferenceTime}s`,
          rawResponse: response.data.response,
        },
      };

    } catch (error) {
      logger.error('❌ LLM validation error:', error.message);

      // Return conservative default (reject with low confidence)
      return {
        approved: false,
        confidence: 0,
        reasoning: `Error during LLM validation: ${error.message}. Defaulting to rejection for safety.`,
        manipulationDetected: false,
        metadata: {
          ...metadata,
          error: error.message,
        },
      };
    }
  }

  /**
   * Build validation prompt
   */
  _buildValidationPrompt(goalTitle, goalDescription, goalType, proofText, proofImages) {
    return `You are an objective, impartial validator in a decentralized accountability network.
Your role is to verify whether submitted proof genuinely demonstrates completion of a stated goal.
Be strict but fair. The user has staked money on this, so accuracy is critical.

GOAL INFORMATION:
Title: ${goalTitle}
Description: ${goalDescription}
Type: ${goalType}

USER'S SUBMITTED PROOF:
${proofText}

${proofImages.length > 0 ? `PROOF INCLUDES ${proofImages.length} IMAGES (URLs provided below)` : 'NO IMAGES PROVIDED'}
${proofImages.map((url, i) => `Image ${i + 1}: ${url}`).join('\n')}

VALIDATION TASK:
Analyze the proof and determine:
1. Does the proof genuinely demonstrate completion of the stated goal?
2. Is there evidence of manipulation, fakery, or dishonesty?
3. What is your confidence level (0-100)?
4. Provide clear, specific reasoning for your decision.

IMPORTANT GUIDELINES:
- Be objective and impartial
- Look for specific, concrete evidence
- Screenshots can be faked - consider this
- Time-based claims need timestamps or other verification
- Generic statements without specific evidence should be questioned
- If proof is ambiguous, err on the side of requiring more evidence (reject)
- Your confidence should reflect certainty: 100 = absolutely certain, 50 = unclear, 0 = no confidence

RESPOND ONLY IN THIS JSON FORMAT:
{
  "approved": true or false,
  "confidence": 0-100,
  "reasoning": "Specific explanation of your decision (2-3 sentences)",
  "manipulation_detected": true or false
}

JSON RESPONSE:`;
  }

  /**
   * Parse LLM response
   */
  _parseResponse(rawResponse) {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(rawResponse);

      // Validate required fields
      if (typeof parsed.approved !== 'boolean') {
        throw new Error('Missing or invalid "approved" field');
      }

      return {
        approved: parsed.approved,
        confidence: this._normalizeConfidence(parsed.confidence),
        reasoning: parsed.reasoning || 'No reasoning provided',
        manipulation_detected: parsed.manipulation_detected || false,
      };

    } catch (error) {
      logger.warn('⚠️  Failed to parse LLM response as JSON, attempting text parsing...');

      // Fallback: parse from text
      const approved = /approved.*true|approve|yes|valid|completed/i.test(rawResponse);
      const confidenceMatch = rawResponse.match(/confidence.*?(\d+)/i);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;

      return {
        approved,
        confidence: this._normalizeConfidence(confidence),
        reasoning: rawResponse.substring(0, 500), // Use first 500 chars as reasoning
        manipulation_detected: /manipulation|fake|fraud|dishonest/i.test(rawResponse),
      };
    }
  }

  /**
   * Normalize confidence to 0-100 range
   */
  _normalizeConfidence(value) {
    const num = parseInt(value);
    if (isNaN(num)) return 50; // Default to middle
    return Math.max(0, Math.min(100, num));
  }

  /**
   * Get available models
   */
  async listModels() {
    try {
      const response = await this.client.get('/api/tags');
      return response.data.models || [];
    } catch (error) {
      logger.error('Failed to list models:', error.message);
      return [];
    }
  }

  /**
   * Pull a model (download)
   */
  async pullModel(modelName) {
    logger.info(`Pulling model: ${modelName}...`);

    try {
      const response = await this.client.post('/api/pull', {
        name: modelName,
        stream: false,
      });

      logger.info(`✅ Model ${modelName} pulled successfully`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to pull model:`, error.message);
      return false;
    }
  }
}
