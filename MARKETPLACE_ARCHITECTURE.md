# Lock-In Responsible - Marketplace Architecture

**Accountability Services Marketplace: The App Store for Productivity**

## Vision

Transform Lock-In Responsible from a single accountability platform into a **marketplace ecosystem** where developers can build, monetize, and distribute accountability services that integrate with users' goals.

## Three-Track Hackathon Integration

### 🛒 AI x E-Commerce Track (Primary)
- **Product**: Marketplace for buying/selling accountability services
- **AI Innovation**: Personalized service recommendations based on goal patterns
- **E-commerce**: Crypto/fiat payments, shopping cart, service subscriptions
- **GPU**: Nosana-powered recommendation engine

### 🏕️ CAMP Track (Origin SDK)
- **IP Registration**: Services registered as on-chain IP using Origin SDK
- **Licensing**: Developers can license, remix, and build on services
- **Ownership**: Users own their achievement data and service subscriptions
- **Deployment**: Hybrid ICP + Basecamp architecture

### ☕ Caffeine.ai Track (Rapid Prototyping)
- **UI Prototype**: Build marketplace storefront with Caffeine.ai
- **Demo**: Show rapid development of complex e-commerce flows
- **Integration**: Service browsing, cart, checkout mockups

---

## System Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                  MARKETPLACE FRONTEND                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐     │
│  │   Browse     │  │  My Goals    │  │  Developer  │     │
│  │  Services    │  │  + Services  │  │   Portal    │     │
│  └──────────────┘  └──────────────┘  └─────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────┐       │
│  │     AI Recommendation Engine (Nosana GPU)       │       │
│  │  "Based on your goals, try these 3 services"   │       │
│  └────────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────────┘
                           │
                           ├─── ICP Canister (Marketplace Logic)
                           ├─── Basecamp (Origin SDK - IP Registry)
                           └─── Service Provider APIs

┌────────────────────────────────────────────────────────────┐
│                  ICP CANISTER (Motoko)                      │
│                                                             │
│  Goals System (existing)        Marketplace System (new)   │
│  ├─ Goal CRUD                  ├─ Service Registry         │
│  ├─ Validators                 ├─ User Purchases           │
│  ├─ Verification               ├─ Service Subscriptions    │
│  └─ Tokens/Rewards             ├─ Developer Payouts        │
│                                 ├─ Service Webhooks         │
│                                 └─ Integration API          │
└────────────────────────────────────────────────────────────┘
                           │
                           │ Cross-chain bridge
                           ↓
┌────────────────────────────────────────────────────────────┐
│            BASECAMP (CAMP Network - Origin SDK)             │
│                                                             │
│  Service IP Registry                                       │
│  ├─ Register service as IP                                │
│  ├─ License terms (commercial/non-commercial)             │
│  ├─ Remix permissions                                     │
│  └─ Royalty distribution                                  │
└────────────────────────────────────────────────────────────┘
                           │
                           │ Webhook integrations
                           ↓
┌────────────────────────────────────────────────────────────┐
│               SERVICE PROVIDERS (3rd Party)                 │
│                                                             │
│  Instagram Blocker    App Locker      Custom Validators   │
│  ├─ Block until      ├─ Lock apps    ├─ Code checkers    │
│  │  goal verified    │  based on     ├─ Fitness AI       │
│  └─ OAuth access     │  streak       └─ Writing analysis  │
│                      └─ Screen time                        │
└────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Service Registry (ICP Canister Extension)

**New Motoko Types:**

```motoko
type ServiceId = Nat;
type ServiceCategory = {
  #Blocker;      // Block distractions
  #Validator;    // Custom AI validators
  #Analytics;    // Goal analytics
  #Integration;  // 3rd party integrations
  #Gamification; // Badges, achievements
};

type ServiceStatus = {
  #Active;
  #Deprecated;
  #Suspended;
};

type PricingModel = {
  #Free;
  #OneTime: Nat;      // One-time purchase (tokens)
  #Subscription: Nat;  // Monthly (tokens)
  #PayPerUse: Nat;    // Per activation (tokens)
};

type Service = {
  id: ServiceId;
  developerId: Principal;
  name: Text;
  description: Text;
  category: ServiceCategory;
  pricing: PricingModel;
  webhookUrl: Text;          // Service API endpoint
  originAssetId: ?Text;      // Origin SDK asset ID
  installations: Nat;
  rating: Float;
  status: ServiceStatus;
  createdAt: Timestamp;
};

type UserServiceSubscription = {
  userId: Principal;
  serviceId: ServiceId;
  activatedAt: Timestamp;
  expiresAt: ?Timestamp;     // null for lifetime
  isActive: Bool;
  settings: Text;            // JSON config
};
```

**New Canister Functions:**

```motoko
// Developer functions
registerService(name, description, category, pricing, webhookUrl) : ServiceId
updateService(serviceId, ...) : Bool
deactivateService(serviceId) : Bool

// User functions
purchaseService(serviceId, config) : Bool
activateService(serviceId) : Bool
deactivateUserService(serviceId) : Bool
getMyServices() : [UserServiceSubscription]

// Marketplace queries
listServices(category?) : [Service]
searchServices(query) : [Service]
getServiceDetails(serviceId) : Service
getRecommendedServices(userId) : [Service]  // AI-powered

// Integration hooks (called by services)
notifyServiceEvent(serviceId, eventType, data) : Bool
```

---

### 2. Service Integration API

Services integrate via webhooks. When a user activates a service, the canister calls the service's webhook:

**Goal Created Event:**
```json
POST https://service.example.com/webhook
{
  "event": "goal.created",
  "userId": "principal-hash",
  "goalId": 123,
  "goal": {
    "title": "Code for 2 hours",
    "type": "Coding",
    "deadline": "2024-01-15T23:59:59Z"
  },
  "serviceConfig": {
    "blockedSites": ["instagram.com", "twitter.com"]
  }
}
```

**Goal Verified Event:**
```json
{
  "event": "goal.verified",
  "userId": "principal-hash",
  "goalId": 123,
  "verified": true,
  "streak": 5
}
```

**Service Response:**
```json
{
  "success": true,
  "message": "Instagram unblocked! Great job! 🎉"
}
```

---

### 3. Example Services

#### Service 1: Instagram Blocker

**Description:** Blocks Instagram access until you complete your daily goal

**How it works:**
1. User installs service and grants OAuth access to browser extension
2. Service receives `goal.created` webhook
3. Extension blocks `instagram.com` at DNS/browser level
4. When goal verified, service receives `goal.verified` webhook
5. Extension unblocks Instagram
6. User gets notification: "Instagram unlocked! You earned it! 🎉"

**Pricing:** Free (uses existing verification fees)

**Tech Stack:**
- Chrome/Firefox browser extension
- Backend: Node.js webhook server
- Storage: User OAuth tokens

#### Service 2: Streak-Based App Locker

**Description:** Lock time-wasting apps based on streak performance

**How it works:**
1. Mobile app integration (iOS/Android)
2. User configures which apps to lock (TikTok, games, etc.)
3. Rules: "Lock TikTok if streak < 3"
4. Service polls ICP for user stats
5. Locks/unlocks apps based on rules

**Pricing:** $2.99/month (subscription)

#### Service 3: Custom Code Validator

**Description:** Specialized AI validator for code commits

**How it works:**
1. Developer creates goal: "Commit code for 30 mins"
2. Submits proof: GitHub commit link
3. Custom validator:
   - Fetches commit via GitHub API
   - Analyzes diff size, quality
   - Checks commit time against work session
   - Verifies authenticity
4. Much more accurate than general AI

**Pricing:** $0.10 per verification (pay-per-use)

#### Service 4: Achievement NFT Minter

**Description:** Mint NFTs for milestone achievements

**How it works:**
1. User hits 10-goal streak
2. Service auto-triggers
3. Mints commemorative NFT on Basecamp
4. NFT contains goal history, timestamps, proof hashes
5. Tradeable, displayable, provable

**Pricing:** Free for streaks 1-10, $1 for custom NFTs

---

### 4. AI Recommendation Engine (Nosana GPU)

**Deployment:** LLM running on Nosana infrastructure

**Input:**
```json
{
  "userId": "principal-hash",
  "goalHistory": [
    {"title": "Code for 2 hours", "type": "Coding", "completed": true},
    {"title": "Write 1000 words", "type": "Study", "completed": true},
    {"title": "Work out 30 mins", "type": "Fitness", "completed": false}
  ],
  "currentStreak": 3,
  "failedGoals": 2,
  "availableServices": [...]
}
```

**AI Prompt:**
```
You are a productivity coach analyzing a user's goal patterns.

User stats:
- Completed goals: Coding (5), Study (3), Fitness (2)
- Failed goals: 2 (both Fitness)
- Current streak: 3

Available services:
1. Instagram Blocker - Blocks distractions
2. Fitness AI Validator - Expert fitness verification
3. Code Quality Checker - Validates code commits
4. Streak Protector - Sends reminder notifications

Recommend the top 3 services that would help this user succeed.
Focus on their weak areas (failing fitness goals).
Format: JSON array with service IDs and reasoning.
```

**Output:**
```json
{
  "recommendations": [
    {
      "serviceId": 2,
      "reason": "You've failed 2 fitness goals. This AI specializes in verifying workouts and can catch photo/proof cheating.",
      "confidence": 0.92
    },
    {
      "serviceId": 4,
      "reason": "Your streak is at 3. Streak Protector sends timely reminders before deadlines to help you maintain momentum.",
      "confidence": 0.87
    },
    {
      "serviceId": 1,
      "reason": "Block Instagram during work hours to help you focus on coding and writing goals.",
      "confidence": 0.78
    }
  ]
}
```

**Implementation:**
- Deploy Llama 3.2 or Mistral on Nosana Dashboard
- Frontend calls recommendation API endpoint
- Cache results for 24 hours
- Re-run when new goals completed

---

### 5. Origin SDK Integration (CAMP Track)

**Service IP Registration Flow:**

```javascript
import { OriginClient } from '@camp/origin-sdk';

// Developer registers their service
const registerServiceAsIP = async (service) => {
  const origin = new OriginClient({ network: 'basecamp-testnet' });

  // Register service as IP asset
  const asset = await origin.registerAsset({
    name: service.name,
    description: service.description,
    assetType: 'service',
    metadata: {
      category: service.category,
      webhookUrl: service.webhookUrl,
      icpCanisterId: CANISTER_ID,
      icpServiceId: service.id
    }
  });

  // Set licensing terms
  await origin.setLicense(asset.id, {
    type: 'commercial',
    allowRemix: true,
    royaltyRate: 0.10, // 10% to original creator
    terms: 'Developers can fork and modify this service'
  });

  return asset.id;
};

// User purchases service subscription
const purchaseServiceSubscription = async (serviceId, userId) => {
  const origin = new OriginClient();

  // Record on-chain ownership
  const license = await origin.createLicense({
    assetId: service.originAssetId,
    licenseeId: userId,
    term: '1 year',
    price: service.pricing.amount
  });

  // Store in ICP canister too
  await icpCanister.purchaseService(serviceId, license.id);
};
```

**Service Remixing Example:**

```javascript
// Developer forks "Instagram Blocker" to create "TikTok Blocker"
const remixService = async (originalServiceId) => {
  const origin = new OriginClient();

  // Create derivative work
  const derivative = await origin.createDerivative({
    parentAssetId: originalService.originAssetId,
    name: 'TikTok Blocker',
    modifications: 'Changed blocked domain from Instagram to TikTok',
    attribution: 'Based on Instagram Blocker by @original-dev'
  });

  // 10% of revenue goes to original creator automatically
  await origin.setRoyaltyDistribution(derivative.id, {
    parent: 0.10,
    creator: 0.90
  });
};
```

---

### 6. Payment Integration

**Token Economics:**

1. **User Purchases Service:**
   - Pay with Lock-In tokens (earned from goals)
   - Or convert ICP → Tokens at market rate
   - Or use Origin SDK for Basecamp token payments

2. **Developer Revenue:**
   - 70% to developer
   - 20% to Lock-In platform
   - 10% to service infrastructure (webhooks, hosting)

3. **Subscription Management:**
   - Monthly auto-renewal from token balance
   - Low balance warning: "Top up tokens to keep services active"
   - Grace period: 7 days before service deactivation

**Payment Flow:**

```motoko
public shared(msg) func purchaseService(serviceId: ServiceId) : async Bool {
  let caller = msg.caller;

  switch (services.get(serviceId)) {
    case (?service) {
      let userBalance = Option.get(userTokens.get(caller), 0);
      let price = getPriceForService(service);

      if (userBalance < price) {
        return false; // Insufficient funds
      };

      // Deduct tokens
      userTokens.put(caller, userBalance - price);

      // Pay developer (70%)
      let developerPayout = (price * 70) / 100;
      let devBalance = Option.get(userTokens.get(service.developerId), 0);
      userTokens.put(service.developerId, devBalance + developerPayout);

      // Create subscription
      let subscription = {
        userId = caller;
        serviceId = serviceId;
        activatedAt = Time.now();
        expiresAt = ?(Time.now() + 30_days);
        isActive = true;
        settings = "{}";
      };

      userServiceSubscriptions.put(subscriptionKey(caller, serviceId), subscription);

      // Call service webhook
      ignore notifyService(serviceId, "subscription.created", caller);

      true
    };
    case null { false };
  }
}
```

---

### 7. Marketplace UI (React Components)

**New Pages:**

1. **`/marketplace`** - Service browser
   - Featured services
   - Categories (Blockers, Validators, Analytics, etc.)
   - Search bar
   - "Recommended for you" section (AI-powered)

2. **`/marketplace/service/:id`** - Service details
   - Description, screenshots, demo video
   - Pricing
   - Reviews & ratings
   - "Install" / "Subscribe" button
   - Developer info

3. **`/marketplace/my-services`** - User's installed services
   - Active subscriptions
   - Settings/configuration per service
   - Usage stats
   - Renewal dates

4. **`/marketplace/developer`** - Developer portal
   - Register new service
   - Manage existing services
   - View revenue analytics
   - API documentation
   - Webhook logs

**Component Structure:**

```tsx
// ServiceCard.tsx
interface ServiceCardProps {
  service: Service;
  isInstalled: boolean;
  onInstall: () => void;
}

// ServiceBrowser.tsx
const ServiceBrowser = () => {
  const { data: services } = useQuery(['marketplace-services']);
  const { data: recommendations } = useQuery(['ai-recommendations']);

  return (
    <div>
      <h2>Recommended for You</h2>
      <ServiceGrid services={recommendations} />

      <h2>Browse by Category</h2>
      <CategoryFilter />
      <ServiceGrid services={services} />
    </div>
  );
};

// DeveloperDashboard.tsx
const DeveloperDashboard = () => {
  const { data: myServices } = useQuery(['my-developer-services']);
  const { data: revenue } = useQuery(['developer-revenue']);

  return (
    <div>
      <RevenueChart data={revenue} />
      <ServiceList services={myServices} />
      <Button onClick={registerNewService}>Register New Service</Button>
    </div>
  );
};
```

---

## Demo Scenarios

### Scenario 1: AI x E-Commerce Track

**User Journey:**

1. **Sarah creates a coding goal:** "Commit code for 30 minutes today"
2. **AI recommends services:**
   - "Instagram Blocker" (blocks Instagram until goal complete)
   - "Code Quality Validator" (expert code verification)
   - "GitHub Integration" (auto-imports commits as proof)
3. **Sarah browses marketplace**, reads reviews, sees pricing
4. **Purchases Instagram Blocker** (5 tokens/month)
5. **Configures settings:** Grants browser extension access
6. **Instagram is immediately blocked**
7. **Sarah codes for 30 mins**, submits commit link as proof
8. **AI validators verify** → Goal approved
9. **Instagram automatically unblocks** → Push notification: "You earned Instagram time! 🎉"
10. **Leaderboard updates** with new streak

**E-Commerce Features Demonstrated:**
- Product discovery (marketplace)
- AI recommendations (Nosana LLM)
- Shopping cart (token-based payments)
- Subscription management
- Service integration (webhooks)
- User dashboard (my services)

---

### Scenario 2: CAMP Track (Origin SDK)

**Developer Journey:**

1. **Dev builds "Focus Timer" service** (Pomodoro timer tied to goals)
2. **Registers service on ICP marketplace**
3. **Registers as IP on Basecamp** using Origin SDK:
   ```javascript
   const asset = await origin.registerAsset({
     name: 'Focus Timer',
     assetType: 'service',
     license: 'commercial-remix'
   });
   ```
4. **Sets licensing terms:** Allow remixes, 10% royalty
5. **Users purchase subscriptions** (recorded on both ICP + Basecamp)
6. **Another dev remixes** to create "Focus Timer + Music"
7. **Original dev earns 10% royalty** on derivative automatically
8. **Service builds reputation** → Used in 500+ goals
9. **Developer earns passive income** from original IP

**CAMP Features Demonstrated:**
- IP registration (Origin SDK)
- Licensing terms (commercial, remix permissions)
- Royalty distribution
- Ownership provenance
- Cross-chain integration (ICP ↔ Basecamp)

---

### Scenario 3: Caffeine.ai Track (Rapid Prototyping)

**On-site Demo:**

1. **Live-build marketplace UI** using Caffeine.ai prompts:
   - "Create a product listing page with cards showing service name, description, price, and install button"
   - "Add a search bar with category filters"
   - "Create a shopping cart that tracks selected services and shows total cost"
   - "Build a checkout flow with payment confirmation"
2. **Show complex features built instantly:**
   - Multi-step forms (service registration)
   - Dashboard with analytics
   - User authentication
   - Data persistence (purchases, subscriptions)
3. **Deploy live demo URL** on Vercel
4. **Demonstrate in 3-minute presentation:**
   - Problem: "Productivity tools are fragmented"
   - Solution: "One marketplace for all accountability services"
   - Demo: Browse → Recommend → Purchase → Activate
   - Tech: "Built in 2 days with Caffeine.ai"

---

## Technical Implementation Plan

### Phase 1: Core Marketplace (Days 1-2)

**Backend (Motoko):**
- [ ] Add Service types to canister
- [ ] Implement service registry functions
- [ ] Add user subscription management
- [ ] Build webhook notification system

**Frontend (React):**
- [ ] Create marketplace routes
- [ ] Build ServiceCard, ServiceGrid components
- [ ] Implement service browser page
- [ ] Add purchase flow UI

### Phase 2: AI Recommendations (Day 2)

**Nosana Integration:**
- [ ] Deploy LLM on Nosana Dashboard
- [ ] Create recommendation prompt template
- [ ] Build API endpoint for recommendations
- [ ] Integrate into frontend marketplace

### Phase 3: Origin SDK (Day 3)

**Basecamp Integration:**
- [ ] Set up Origin SDK client
- [ ] Implement service IP registration
- [ ] Add licensing logic
- [ ] Build cross-chain sync (ICP ↔ Basecamp)

### Phase 4: Example Services (Days 3-4)

**Instagram Blocker:**
- [ ] Build Chrome extension
- [ ] Create webhook backend
- [ ] Implement OAuth flow
- [ ] Test full integration

**Streak-Based App Locker:**
- [ ] Create service mockup/demo
- [ ] Build webhook handler
- [ ] Demo configuration UI

### Phase 5: Caffeine.ai Prototype (Day 4)

**Rapid Prototyping:**
- [ ] Create Caffeine.ai account
- [ ] Prototype marketplace storefront
- [ ] Build demo flows
- [ ] Deploy live URL

### Phase 6: Polish & Demos (Day 5)

**Final Integration:**
- [ ] Test all three tracks end-to-end
- [ ] Record demo videos (2-5 mins each)
- [ ] Prepare on-site presentation (3 mins)
- [ ] Create Twitter posts
- [ ] Deploy to production

---

## Deliverables Checklist

### AI x E-Commerce Track
- [ ] Live marketplace with service listings
- [ ] AI recommendation engine (Nosana GPU)
- [ ] Working purchase/subscription flow
- [ ] Payment integration (tokens)
- [ ] Example service integration (Instagram Blocker)
- [ ] 2-5 min demo video
- [ ] Twitter post (@WAIBSUMMIT + tags)

### CAMP Track
- [ ] Origin SDK integration
- [ ] Service IP registration on Basecamp
- [ ] Licensing & royalty system
- [ ] Deployed to Basecamp testnet
- [ ] GitHub repo (open-source)
- [ ] 2-5 min demo video
- [ ] Twitter post (@campnetworkxyz @WAIBSUMMIT)

### Caffeine.ai Track
- [ ] Marketplace UI built with Caffeine.ai
- [ ] Live demo URL
- [ ] 3-min on-site presentation
- [ ] Short description + pitch video
- [ ] Twitter post (@WAIBSUMMIT @icp_Belgium)

---

## Success Metrics

**User Value:**
- Users discover relevant services faster (AI recommendations)
- Higher goal completion rate (service integrations help accountability)
- More engaging experience (gamification, NFTs, streaks)

**Developer Value:**
- New monetization opportunities (sell services)
- IP ownership and protection (Origin SDK)
- Access to engaged user base (goal-oriented users)

**Platform Value:**
- Network effects (more services → more users → more developers)
- Revenue from marketplace fees (20% platform cut)
- Competitive moat (ecosystem lock-in)

---

## Resources & Links

**CAMP Track:**
- Origin SDK Docs: https://docs.campnetwork.xyz/
- Starter Guide: https://campaignlabs.notion.site/Origin-starter-page-23ff70f4732880e29fe5e97276499060
- Examples: https://campaignlabs.notion.site/DR-How-is-Origin-relevant-to-me-238f70f473288017b956fb5dab8f74cd

**AI x E-Commerce / Nosana:**
- Nosana Dashboard: https://dashboard.nosana.com/deployments/create
- Nosana SDK: https://github.com/nosana-ci/nosana-sdk
- Nosana CLI: https://github.com/nosana-ci/nosana-cli
- Agent Starter: https://github.com/nosana-ci/agent-challenge/

**Caffeine.ai:**
- Create account: https://caffeine.ai
- Expect workshop on Day 1 at hackathon

---

## Next Steps

1. ✅ Architecture designed
2. → Research Origin SDK integration
3. → Research Nosana GPU setup
4. → Start building Motoko marketplace functions
5. → Create example service (Instagram Blocker)
6. → Build frontend marketplace UI
7. → Integrate AI recommendations
8. → Deploy & demo!
