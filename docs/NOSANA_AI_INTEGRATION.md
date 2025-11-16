# Nosana AI Integration Guide

**AI-Powered Service Recommendations using Nosana GPU**

## Overview

This guide shows how to deploy an LLM on Nosana's GPU infrastructure to power personalized service recommendations in the Lock-In Responsible marketplace.

---

## What is Nosana?

Nosana provides decentralized GPU compute for AI workloads on Solana. Instead of paying for expensive cloud GPUs, you can deploy LLMs on Nosana's distributed network.

**Benefits:**
- ✅ **Decentralized**: No single point of failure
- ✅ **Cost-effective**: Pay-per-use GPU time
- ✅ **Fast**: High-performance NVIDIA GPUs
- ✅ **Open**: Deploy any model (Llama, Mistral, etc.)

---

## Installation

```bash
# Install Nosana SDK
npm install @nosana/sdk

# Or use CLI for deployments
npm install -g @nosana/cli
```

---

## Setup

### 1. Create Nosana Account

1. Visit https://dashboard.nosana.com/
2. Sign up with wallet (Phantom, Solflare, etc.)
3. Get API key from dashboard

### 2. Fund Your Account

You need $NOS tokens for GPU compute:

1. Visit Nosana Dashboard
2. Purchase $NOS or get testnet tokens
3. Deposit to your account

### 3. Environment Variables

Add to `frontend/.env`:

```env
VITE_NOSANA_API_KEY=your_api_key_here
VITE_NOSANA_ENDPOINT=https://api.nosana.com/inference
VITE_NOSANA_MODEL=meta-llama/Llama-3.2-3B-Instruct
```

---

## Deployment Options

### Option 1: Nosana Dashboard (Easiest)

1. **Go to Dashboard**: https://dashboard.nosana.com/deployments/create

2. **Select Model**:
   - Llama 3.2 3B (fast, cheap)
   - Llama 3.2 11B (better quality)
   - Mistral 7B (balanced)

3. **Configure Deployment**:
   ```yaml
   name: lock-in-recommendations
   model: meta-llama/Llama-3.2-3B-Instruct
   gpu: NVIDIA T4
   max_tokens: 512
   temperature: 0.7
   ```

4. **Deploy**: Click "Deploy" and copy endpoint URL

5. **Get Endpoint**:
   ```
   https://inference.nosana.com/v1/deployments/{deployment-id}/chat/completions
   ```

### Option 2: Nosana CLI

```bash
# Login
nosana login

# Deploy model
nosana deploy --model meta-llama/Llama-3.2-3B-Instruct \
              --name lock-in-recommendations \
              --gpu nvidia-t4

# Get deployment info
nosana deployments list

# Test inference
nosana infer --deployment-id {id} \
             --prompt "Recommend productivity services for someone failing fitness goals"
```

### Option 3: Nosana SDK (Programmatic)

```typescript
import { Client } from '@nosana/sdk';

const nosana = new Client({
  solana: {
    network: 'mainnet', // or 'devnet'
  },
  apiKey: process.env.NOSANA_API_KEY,
});

// Deploy model
const deployment = await nosana.deployments.create({
  name: 'lock-in-recommendations',
  model: 'meta-llama/Llama-3.2-3B-Instruct',
  gpu: 'nvidia-t4',
  config: {
    max_tokens: 512,
    temperature: 0.7,
  },
});

console.log('Deployment ID:', deployment.id);
console.log('Endpoint:', deployment.endpoint);
```

---

## Implementation

### 1. Create Recommendation Service

**File: `frontend/src/services/ai-recommendations.ts`**

```typescript
interface UserGoalHistory {
  goalType: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

interface UserStats {
  currentStreak: number;
  failedGoals: number;
  completedGoals: number;
}

interface ServiceRecommendation {
  serviceId: number;
  serviceName: string;
  reason: string;
  confidence: number;
}

export class AIRecommendationService {
  private endpoint: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.endpoint = import.meta.env.VITE_NOSANA_ENDPOINT;
    this.apiKey = import.meta.env.VITE_NOSANA_API_KEY;
    this.model = import.meta.env.VITE_NOSANA_MODEL;
  }

  /**
   * Generate AI-powered service recommendations
   */
  async getRecommendations(
    goalHistory: UserGoalHistory[],
    userStats: UserStats,
    availableServices: Array<{ id: number; name: string; category: string; description: string }>
  ): Promise<ServiceRecommendation[]> {
    // Build prompt
    const prompt = this.buildRecommendationPrompt(goalHistory, userStats, availableServices);

    // Call Nosana inference
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a productivity coach AI that recommends accountability services based on user behavior. Always respond with valid JSON only, no additional text.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 512,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Nosana API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON response
    const parsed = JSON.parse(content);
    return parsed.recommendations;
  }

  /**
   * Build recommendation prompt
   */
  private buildRecommendationPrompt(
    goalHistory: UserGoalHistory[],
    stats: UserStats,
    services: Array<{ id: number; name: string; category: string; description: string }>
  ): string {
    // Analyze goal patterns
    const goalTypes: Record<string, { completed: number; failed: number }> = {};
    goalHistory.forEach((goal) => {
      if (!goalTypes[goal.goalType]) {
        goalTypes[goal.goalType] = { completed: 0, failed: 0 };
      }
      if (goal.completed) {
        goalTypes[goal.goalType].completed++;
      } else {
        goalTypes[goal.goalType].failed++;
      }
    });

    // Build services list
    const servicesList = services
      .map(
        (s, i) =>
          `${i + 1}. ${s.name} (ID: ${s.id})
   Category: ${s.category}
   Description: ${s.description}`
      )
      .join('\n\n');

    return `Analyze this user's goal patterns and recommend the top 3 services that would help them succeed.

USER STATS:
- Current streak: ${stats.currentStreak}
- Completed goals: ${stats.completedGoals}
- Failed goals: ${stats.failedGoals}

GOAL PATTERNS:
${Object.entries(goalTypes)
  .map(
    ([type, counts]) =>
      `- ${type}: ${counts.completed} completed, ${counts.failed} failed (${
        counts.failed > 0 ? Math.round((counts.failed / (counts.completed + counts.failed)) * 100) : 0
      }% failure rate)`
  )
  .join('\n')}

AVAILABLE SERVICES:
${servicesList}

TASK:
1. Identify the user's weak areas (high failure rates)
2. Recommend 3 services that address their specific challenges
3. Explain why each service would help
4. Assign confidence score (0.0-1.0)

Respond with JSON in this exact format:
{
  "recommendations": [
    {
      "serviceId": 1,
      "serviceName": "Service Name",
      "reason": "Why this service helps the user (1-2 sentences)",
      "confidence": 0.95
    }
  ]
}`;
  }
}

// Singleton instance
export const aiRecommendations = new AIRecommendationService();
```

### 2. Create React Hook

**File: `frontend/src/hooks/useAIRecommendations.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { aiRecommendations } from '../services/ai-recommendations';
import { icpTokenAPI } from '../lib/icp-api';

export const useAIRecommendations = (
  goalHistory: any[],
  availableServices: any[],
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['ai-recommendations', goalHistory.length],
    queryFn: async () => {
      // Get user stats
      const stats = await icpTokenAPI.getStats();

      // Call AI service
      const recommendations = await aiRecommendations.getRecommendations(
        goalHistory,
        stats,
        availableServices
      );

      return recommendations;
    },
    enabled: enabled && goalHistory.length > 0 && availableServices.length > 0,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    cacheTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
};
```

### 3. Use in Marketplace UI

**File: `frontend/src/pages/Marketplace.tsx`**

```typescript
import { useAIRecommendations } from '../hooks/useAIRecommendations';
import { useQuery } from '@tanstack/react-query';
import { icpGoalAPI } from '../lib/icp-api';

export const Marketplace = () => {
  // Fetch user's goal history
  const { data: goals = [] } = useQuery({
    queryKey: ['icp-goals'],
    queryFn: icpGoalAPI.list,
  });

  // Fetch available services
  const { data: services = [] } = useQuery({
    queryKey: ['marketplace-services'],
    queryFn: async () => {
      // TODO: Replace with actual marketplace API
      return [
        {
          id: 1,
          name: 'Instagram Blocker',
          category: 'Blocker',
          description: 'Blocks Instagram until you complete your daily goal',
        },
        {
          id: 2,
          name: 'Fitness AI Validator',
          category: 'Validator',
          description: 'Expert AI that verifies workout proofs with high accuracy',
        },
        {
          id: 3,
          name: 'Streak Protector',
          category: 'Gamification',
          description: 'Sends reminder notifications before goal deadlines',
        },
        {
          id: 4,
          name: 'Code Quality Checker',
          category: 'Validator',
          description: 'Analyzes code commits for quality and authenticity',
        },
      ];
    },
  });

  // Get AI recommendations
  const { data: recommendations = [], isLoading: loadingRecs } = useAIRecommendations(
    goals,
    services,
    goals.length > 0 && services.length > 0
  );

  return (
    <div className="marketplace">
      <h1>Service Marketplace</h1>

      {/* AI Recommendations Section */}
      <section className="recommendations">
        <h2>Recommended for You</h2>
        {loadingRecs ? (
          <p>Analyzing your goals with AI...</p>
        ) : recommendations.length > 0 ? (
          <div className="recommendation-grid">
            {recommendations.map((rec) => (
              <ServiceCard
                key={rec.serviceId}
                service={services.find((s) => s.id === rec.serviceId)}
                recommendation={rec}
              />
            ))}
          </div>
        ) : (
          <p>Complete a few goals to get personalized recommendations!</p>
        )}
      </section>

      {/* All Services */}
      <section className="all-services">
        <h2>Browse All Services</h2>
        <div className="service-grid">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>
    </div>
  );
};

const ServiceCard = ({ service, recommendation }: any) => {
  return (
    <div className="service-card">
      <h3>{service.name}</h3>
      <p className="category">{service.category}</p>
      <p className="description">{service.description}</p>

      {recommendation && (
        <div className="ai-recommendation">
          <p className="reason">
            <strong>Why we recommend this:</strong> {recommendation.reason}
          </p>
          <p className="confidence">
            AI Confidence: {Math.round(recommendation.confidence * 100)}%
          </p>
        </div>
      )}

      <button>Install Service</button>
    </div>
  );
};
```

---

## Cost Optimization

### 1. Cache Recommendations

```typescript
// Cache for 24 hours to avoid repeated API calls
staleTime: 1000 * 60 * 60 * 24,
cacheTime: 1000 * 60 * 60 * 24 * 7,
```

### 2. Trigger Only When Needed

```typescript
// Only call AI when:
// - User has completed at least 3 goals
// - Services available
// - Not already cached
enabled: goals.length >= 3 && services.length > 0,
```

### 3. Use Smaller Model for Speed

```env
# Fast & cheap
VITE_NOSANA_MODEL=meta-llama/Llama-3.2-3B-Instruct

# Better quality but slower
VITE_NOSANA_MODEL=meta-llama/Llama-3.2-11B-Instruct
```

---

## Alternative: Self-Hosted Ollama (Free)

If you want to avoid Nosana costs during development, run Ollama locally:

### 1. Install Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

### 2. Pull Model

```bash
ollama pull llama3.2:3b
```

### 3. Run Server

```bash
ollama serve
# Runs on http://localhost:11434
```

### 4. Update Endpoint

```env
VITE_NOSANA_ENDPOINT=http://localhost:11434/api/chat
VITE_NOSANA_MODEL=llama3.2:3b
```

### 5. Modify API Call

```typescript
// For local Ollama, use different API format
const response = await fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama3.2:3b',
    messages: [{ role: 'user', content: prompt }],
    stream: false,
    format: 'json',
  }),
});
```

---

## Demo Video Script (AI x E-Commerce Track)

**2-5 minute demo showing:**

1. **Problem** (30s):
   - "Productivity tool marketplaces have no personalization"
   - "Users waste time browsing irrelevant services"

2. **Solution** (1m):
   - "AI analyzes your goal patterns and recommends perfect services"
   - Show architecture: User data → Nosana GPU → Recommendations

3. **Demo** (2m):
   - **User A**: Failing fitness goals
     - AI recommends: Fitness AI Validator, Streak Protector
     - Explain reasoning shown to user
   - **User B**: Succeeding at coding, failing at focus
     - AI recommends: Instagram Blocker, Pomodoro Timer
   - **Show live inference**: Open Network tab, show API call to Nosana

4. **Impact** (30s):
   - "Users find relevant services faster"
   - "Higher conversion rate for developers"
   - "Decentralized AI = no vendor lock-in"

5. **Tech** (30s):
   - "Llama 3.2 on Nosana GPU"
   - "React + TanStack Query for caching"
   - Show code snippet

---

## Monitoring & Analytics

### Track Recommendation Quality

```typescript
// Log recommendations for analysis
const logRecommendation = async (
  userId: string,
  recommendations: ServiceRecommendation[],
  userAction: 'viewed' | 'installed' | 'ignored'
) => {
  await fetch('/api/analytics/recommendations', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      recommendations,
      action: userAction,
      timestamp: new Date().toISOString(),
    }),
  });
};

// Track clicks
<button
  onClick={() => {
    logRecommendation(userId, recommendations, 'installed');
    handleInstall(service.id);
  }}
>
  Install Service
</button>;
```

### Measure Success Rate

```sql
-- PostgreSQL analytics
SELECT
  service_id,
  COUNT(*) as total_recommendations,
  SUM(CASE WHEN action = 'installed' THEN 1 ELSE 0 END) as installs,
  (SUM(CASE WHEN action = 'installed' THEN 1 ELSE 0 END)::float / COUNT(*)) as conversion_rate
FROM recommendation_logs
GROUP BY service_id
ORDER BY conversion_rate DESC;
```

---

## Troubleshooting

### Error: "Nosana API error: 401"

- Check API key is correct
- Ensure API key is funded with $NOS

### Error: "Model not found"

- Verify model name matches Nosana's available models
- Check deployment status on dashboard

### Slow Response Times

- Use smaller model (3B instead of 11B)
- Reduce max_tokens
- Enable caching aggressively

### JSON Parsing Errors

- Add `response_format: { type: 'json_object' }` to API call
- Improve system prompt: "Respond with valid JSON only"
- Add fallback parsing with try/catch

---

## Production Checklist

- [ ] Deploy model on Nosana Dashboard
- [ ] Get production API key
- [ ] Fund account with sufficient $NOS
- [ ] Set up recommendation caching (Redis or in-memory)
- [ ] Implement rate limiting (max 1 req/user/hour)
- [ ] Add analytics tracking
- [ ] Monitor GPU costs
- [ ] Set up error alerting
- [ ] Test with real user data
- [ ] Prepare fallback (return top services if AI fails)

---

## Resources

- **Nosana Dashboard**: https://dashboard.nosana.com/
- **Nosana SDK**: https://github.com/nosana-ci/nosana-sdk
- **Nosana CLI**: https://github.com/nosana-ci/nosana-cli
- **Agent Challenge**: https://github.com/nosana-ci/agent-challenge/
- **Ollama (Local)**: https://ollama.com

---

## Next Steps

1. ✅ Install Nosana SDK
2. ✅ Deploy model on Nosana Dashboard
3. ✅ Create recommendation service
4. ✅ Build React hook
5. → Integrate into marketplace UI
6. → Test recommendations with real users
7. → Record demo video
8. → Submit to AI x E-Commerce track!
