import OpenAI from 'openai';
import { Ollama } from 'ollama';

export class LLMVerifier {
  constructor(provider) {
    this.provider = provider;

    if (provider === 'openai') {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } else if (provider === 'ollama') {
      this.client = new Ollama({
        host: process.env.OLLAMA_HOST || 'http://localhost:11434'
      });
    }
  }

  async verify(goal, proof) {
    const prompt = this.buildPrompt(goal, proof);

    let response;

    if (this.provider === 'openai') {
      response = await this.verifyWithOpenAI(prompt);
    } else if (this.provider === 'ollama') {
      response = await this.verifyWithOllama(prompt);
    } else if (this.provider === 'anthropic') {
      response = await this.verifyWithAnthropic(prompt);
    } else {
      throw new Error(`Unknown LLM provider: ${this.provider}`);
    }

    return this.parseResponse(response);
  }

  buildPrompt(goal, proof) {
    return `You are a goal verification AI. Analyze if the provided proof demonstrates that the user completed their goal.

Goal Details:
- Title: ${goal.title}
- Description: ${goal.description}
- Type: ${goal.goalType}
- Target: ${goal.target}

Proof Submitted:
- Text: ${proof.text}
- Screenshot: ${proof.screenshot ? 'Provided' : 'None'}

Instructions:
1. Carefully analyze the proof against the goal requirements
2. Determine if the goal was genuinely completed
3. Assign a confidence score (0-100)
4. Provide clear reasoning

Respond ONLY in this JSON format:
{
  "verified": true or false,
  "confidence": 0-100,
  "reasoning": "Your detailed analysis here"
}`;
  }

  async verifyWithOpenAI(prompt) {
    const completion = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert goal verification AI. Always respond in valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    return completion.choices[0].message.content;
  }

  async verifyWithOllama(prompt) {
    const response = await this.client.generate({
      model: process.env.OLLAMA_MODEL || 'llama3',
      prompt: prompt,
      stream: false
    });

    return response.response;
  }

  async verifyWithAnthropic(prompt) {
    // TODO: Implement Anthropic API
    throw new Error('Anthropic not yet implemented');
  }

  parseResponse(response) {
    try {
      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          verified: parsed.verified || false,
          confidence: Math.min(100, Math.max(0, parsed.confidence || 0)),
          reasoning: parsed.reasoning || 'No reasoning provided'
        };
      }
    } catch (error) {
      console.warn('Failed to parse LLM response:', error);
    }

    // Fallback: conservative rejection
    return {
      verified: false,
      confidence: 0,
      reasoning: 'Failed to parse verification response'
    };
  }
}
