import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import config from '../config';
import logger from '../utils/logger';
import { InternalError } from '../utils/errors';

export interface VerificationRequest {
  goalTitle: string;
  goalDescription: string;
  goalType: string;
  target: number;
  proofType: string;
  proofText?: string;
  proofImageUrl?: string;
}

export interface VerificationResult {
  verified: boolean;
  confidence: number; // 0-1
  feedback: string;
  llmProvider: string;
  llmModel: string;
  llmResponse: any;
}

export class LLMService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor() {
    if (config.llm.openai.apiKey) {
      this.openai = new OpenAI({
        apiKey: config.llm.openai.apiKey,
      });
    }

    if (config.llm.anthropic.apiKey) {
      this.anthropic = new Anthropic({
        apiKey: config.llm.anthropic.apiKey,
      });
    }
  }

  async verifyGoal(request: VerificationRequest): Promise<VerificationResult> {
    const provider = config.llm.defaultProvider;

    if (provider === 'openai' && this.openai) {
      return this.verifyWithOpenAI(request);
    } else if (provider === 'anthropic' && this.anthropic) {
      return this.verifyWithAnthropic(request);
    } else {
      throw new InternalError('No LLM provider configured');
    }
  }

  private async verifyWithOpenAI(request: VerificationRequest): Promise<VerificationResult> {
    if (!this.openai) {
      throw new InternalError('OpenAI not configured');
    }

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(request);

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      // If there's an image, add it
      if (request.proofImageUrl) {
        messages.push({
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: request.proofImageUrl,
              },
            },
          ],
        });
      }

      const response = await this.openai.chat.completions.create({
        model: config.llm.openai.model,
        messages,
        max_tokens: config.llm.openai.maxTokens,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || '';

      return this.parseVerificationResponse(content, 'openai', config.llm.openai.model, response);
    } catch (error) {
      logger.error('OpenAI verification failed', { error });
      throw new InternalError('Goal verification failed');
    }
  }

  private async verifyWithAnthropic(request: VerificationRequest): Promise<VerificationResult> {
    if (!this.anthropic) {
      throw new InternalError('Anthropic not configured');
    }

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(request);

      const content: Anthropic.MessageParam['content'] = [];

      // Add text prompt
      content.push({
        type: 'text',
        text: userPrompt,
      });

      // Add image if provided
      if (request.proofImageUrl) {
        // Note: For production, you'd need to fetch the image and convert to base64
        // This is a simplified version
        content.push({
          type: 'image',
          source: {
            type: 'url',
            url: request.proofImageUrl,
          },
        } as any);
      }

      const response = await this.anthropic.messages.create({
        model: config.llm.anthropic.model,
        max_tokens: config.llm.anthropic.maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === 'text');
      const content_text = textContent && textContent.type === 'text' ? textContent.text : '';

      return this.parseVerificationResponse(
        content_text,
        'anthropic',
        config.llm.anthropic.model,
        response
      );
    } catch (error) {
      logger.error('Anthropic verification failed', { error });
      throw new InternalError('Goal verification failed');
    }
  }

  private buildSystemPrompt(): string {
    return `You are a goal verification assistant for the Lock-In Responsible system. Your job is to analyze proof submissions and determine if a user has completed their stated goal.

IMPORTANT INSTRUCTIONS:
1. Be strict but fair in your evaluation
2. Look for signs of manipulation or fake proof
3. Verify that the proof actually matches the goal description
4. Consider the goal type and target when evaluating
5. Return your response in this EXACT JSON format:

{
  "verified": true/false,
  "confidence": 0.0-1.0,
  "feedback": "Detailed explanation of your decision"
}

VERIFICATION CRITERIA:
- For screenshots: Check timestamps, look for editing artifacts, verify content matches goal
- For text descriptions: Assess detail level, consistency, plausibility
- For code commits: Verify commit messages, code quality, relevance
- Confidence should be HIGH (0.8+) only if you're very certain
- Confidence should be MEDIUM (0.5-0.8) if there's some doubt
- Confidence should be LOW (0.0-0.5) if proof is insufficient or suspicious

ANTI-MANIPULATION:
- Watch for screenshot editing
- Check for inconsistent timestamps
- Look for generic/template responses
- Verify specific details match the goal

Be helpful but maintain integrity of the system.`;
  }

  private buildUserPrompt(request: VerificationRequest): string {
    let prompt = `Please verify if the following goal has been completed:\n\n`;
    prompt += `GOAL TITLE: ${request.goalTitle}\n`;
    prompt += `GOAL DESCRIPTION: ${request.goalDescription || 'No description provided'}\n`;
    prompt += `GOAL TYPE: ${request.goalType}\n`;
    prompt += `TARGET: ${request.target}\n\n`;
    prompt += `PROOF TYPE: ${request.proofType}\n`;

    if (request.proofText) {
      prompt += `PROOF TEXT:\n${request.proofText}\n\n`;
    }

    if (request.proofImageUrl) {
      prompt += `(Image proof attached)\n\n`;
    }

    prompt += `Analyze the proof and respond with your verification decision in JSON format.`;

    return prompt;
  }

  private parseVerificationResponse(
    content: string,
    provider: string,
    model: string,
    rawResponse: any
  ): VerificationResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        verified: parsed.verified === true,
        confidence: Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0)),
        feedback: parsed.feedback || 'No feedback provided',
        llmProvider: provider,
        llmModel: model,
        llmResponse: rawResponse,
      };
    } catch (error) {
      logger.error('Failed to parse LLM response', { error, content });

      // Fallback: try to determine verification from keywords
      const lowerContent = content.toLowerCase();
      const verified = lowerContent.includes('verified') || lowerContent.includes('completed');

      return {
        verified,
        confidence: 0.5,
        feedback: content || 'Unable to parse verification response',
        llmProvider: provider,
        llmModel: model,
        llmResponse: rawResponse,
      };
    }
  }
}
