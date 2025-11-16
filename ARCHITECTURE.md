# Lock-In Responsible - Architecture

**Community-Driven Goal Accountability Platform**

## Overview

Lock-In Responsible uses ICP blockchain for immutable goal storage and token rewards, with a **community-based voting system** where users verify each other's goal completions. No external validators needed - the community IS the validation layer.

## System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + TypeScript)              │
│  ┌────────────┐  ┌─────────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Dashboard  │  │ Goals Page  │  │  Voting  │  │ History │ │
│  └────────────┘  └─────────────┘  └──────────┘  └─────────┘ │
│                                                                │
│  Features:                                                     │
│  - Internet Identity Auth (Passwordless)                      │
│  - Create & Submit Goals (Direct to ICP)                      │
│  - Vote on Proofs (Community Voting)                          │
│  - Real-time Leaderboard & Stats                              │
│  - Cyberpunk UI with Tailwind + shadcn/ui                     │
└───────────────────────────────────────────────────────────────┘
                              │
                              │ ICP Agent (Direct Calls)
                              │ @dfinity/agent
                              ↓
                ┌──────────────────────────────┐
                │     ICP CANISTER (Motoko)    │
                │                              │
                │  ┌────────────────────────┐  │
                │  │  Core Data Structures  │  │
                │  ├────────────────────────┤  │
                │  │ • Goals (HashMap)      │  │
                │  │ • Proofs               │  │
                │  │ • Users & Stats        │  │
                │  │ • Verification Reqs    │  │
                │  │ • Validators (Users)   │  │
                │  │ • Reputation Scores    │  │
                │  └────────────────────────┘  │
                │                              │
                │  Core Functions:             │
                │  • createGoal()              │
                │  • submitProof()             │
                │  • submitVote() ←──────────┐ │
                │  • calculateConsensus()    │ │
                │  • distributeRewards()     │ │
                │  • updateReputation()      │ │
                └──────────────────────────────┘
                              │                │
                              ↓                │
            ┌─────────────────────────────┐    │
            │   BOOTSTRAPPING MECHANISM   │    │
            ├─────────────────────────────┤    │
            │ IF eligibleVoters == 0:     │    │
            │   → Auto-approve goal       │    │
            │   → Award 10 tokens         │    │
            │   → Mark user as eligible   │    │
            │ ELSE:                       │    │
            │   → Select 5 random voters  │    │
            │   → Create voting request   │────┘
            └─────────────────────────────┘
                              │
                              ↓
       ┌──────────────────────────────────────────┐
       │      COMMUNITY VOTERS (In-App)          │
       ├──────────────────────────────────────────┤
       │                                          │
       │  User A          User B       User C     │
       │  Rep: +12       Rep: +8       Rep: +5    │
       │  Votes: 25      Votes: 15     Votes: 10  │
       │                                          │
       │  Eligibility: completedGoals > 0         │
       │  Selection: Random from eligible pool    │
       │  Interface: /voting page in frontend     │
       │                                          │
       │  Each voter:                             │
       │  1. Views proof in Voting page           │
       │  2. Clicks Approve 👍 or Reject 👎       │
       │  3. Vote submitted to ICP canister       │
       │  4. Earns tokens if vote matches consensus│
       └──────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  OPTIONAL: AI Validator Nodes (External)           │
│  - Node.js daemons with LLM integration           │
│  - Polls ICP for verification requests            │
│  - Submits automated votes                        │
│  - Not required for basic operation               │
└────────────────────────────────────────────────────┘
```

## Data Flow

### Creating a Goal

```
User → Dashboard → Create Goal Form
         ↓
      Frontend
         ├─ Validate input
         ├─ Connect to ICP with Internet Identity
         └─ Call: icpClient.createGoal(title, description, type, deadline)
         ↓
      ICP Canister (main.mo)
         ├─ Generate unique goal ID
         ├─ Store in goals HashMap (immutable)
         ├─ Initialize status as Pending
         └─ Return goal ID
         ↓
      Frontend
         └─ Display in "Today's Goals" feed

Result: Goal permanently stored on blockchain, cannot be deleted
```

### Submitting Proof & Verification Flow

```
1. USER SUBMITS PROOF
   User → Goals Page → Click "Submit Proof"
      ↓
   Frontend
      └─ Call: icpClient.submitProof(goalId, proofText)
      ↓
   ICP Canister (main.mo:226-301)
      ├─ Validate goal exists and belongs to user
      ├─ Store proof text
      └─ Check: getEligibleValidatorsCount()
            │
            ├─── IF COUNT = 0 (No eligible voters yet)
            │    │
            │    └─→ BOOTSTRAPPING PATH:
            │        ├─ Auto-approve goal immediately
            │        ├─ Award 10 tokens to user
            │        ├─ Update user stats:
            │        │  • completedGoals++
            │        │  • currentStreak++
            │        │  • longestStreak (if applicable)
            │        ├─ Mark user as eligible voter
            │        └─ Return success
            │
            └─── IF COUNT > 0 (Voters available)
                 │
                 └─→ COMMUNITY VOTING PATH:
                     ├─ Create verification request
                     ├─ Select 5 random voters from users with completedGoals > 0
                     ├─ Store verification request
                     └─ Status remains "Pending"

2. VOTERS SEE REQUEST
   Voters → Navigate to /voting page
      ↓
   Frontend (Voting.tsx)
      ├─ Polls ICP every 5 seconds
      └─ Call: icpClient.getPendingVerificationRequests()
      ↓
   ICP Canister
      └─ Returns requests where user is selected validator
      ↓
   Frontend
      └─ Displays proof text with Approve/Reject buttons

3. VOTERS SUBMIT VOTES
   Voter → Clicks 👍 Approve or 👎 Reject
      ↓
   Frontend
      └─ Call: icpClient.submitVote(requestId, approved)
      ↓
   ICP Canister (main.mo:356-390)
      ├─ Validate voter is selected for this request
      ├─ Store vote (approved: bool)
      └─ Check if consensus threshold reached (3/5 votes)

4. CONSENSUS & REWARDS
   ICP Canister (main.mo:608-720)
   When 3+ votes received:
      ├─ Calculate majority vote
      ├─ Determine consensus (approved vs rejected)
      │
      ├─ Update Reputations:
      │  ├─ Voters who matched consensus: +1 reputation
      │  └─ Voters who voted wrong: -1 reputation
      │
      ├─ Distribute Verification Fee:
      │  └─ Split among correct voters
      │     Example: 0.50 tokens / 4 correct voters = 0.125 each
      │
      ├─ IF MAJORITY APPROVED:
      │  ├─ Mark goal as Completed
      │  ├─ Award 10 tokens to goal creator
      │  ├─ Update user stats (completedGoals++, streak++)
      │  └─ Mark user as eligible voter
      │
      └─ IF MAJORITY REJECTED:
         ├─ Mark goal as Failed
         └─ Update user stats (failedGoals++, reset streak)
```

## Components

### 1. Frontend (`/frontend`)

**Tech Stack**:
- React 18.3.1 + TypeScript 5.4.3
- Vite 5.2.6 (Build tool)
- Tailwind CSS 3.4.3 + shadcn/ui
- Zustand 4.5.2 (State management)
- TanStack React Query 5.28.4 (Data fetching)
- React Router v6 (Routing)
- @dfinity/agent, @dfinity/auth-client (ICP integration)

**Key Pages**:
- `src/pages/Login.tsx` - Internet Identity authentication
- `src/pages/Dashboard.tsx` - Main layout with stats & navigation
- `src/pages/Goals.tsx` - Create goals, submit proofs, view personal goals
- `src/pages/Voting.tsx` - Vote on pending verification requests (community voting)
- `src/pages/History.tsx` - View goal history with on-chain proof
- `src/pages/Community.tsx` - Global feed of all users' goals

**Core Library**:
- `src/lib/icp-api.ts` - Complete ICP canister integration

**Features**:
- Internet Identity auth (passwordless, privacy-preserving)
- Create immutable goals on blockchain
- Submit text proofs for completed goals
- **Community voting interface** - Vote on other users' proofs
- Real-time verification status (polls every 5 seconds)
- Token balance & leaderboard
- Cyberpunk-themed UI with neon colors
- Mobile-responsive design

### 2. ICP Canister (`/canister`)

**Tech**: Motoko (ICP smart contract language)
**File**: `canister/main.mo` (750 lines)
**Storage**: Persistent on-chain using stable memory

**Core Data Structures**:
```motoko
// Goal storage
goals: HashMap<Text, Goal>

// User statistics and eligibility
type UserStats = {
  totalGoals: Nat;
  completedGoals: Nat;
  failedGoals: Nat;
  currentStreak: Nat;
  longestStreak: Nat;
  tokenBalance: Nat;
}

// Validator tracking (reputation-based)
type Validator = {
  reputation: Int;
  totalVotes: Nat;
  correctVotes: Nat;
  stake: Nat;
}

// Verification requests
type VerificationRequest = {
  id: Text;
  goalId: Text;
  proofText: Text;
  selectedValidators: [Principal];
  votes: [Vote];
  status: VerificationStatus;
  createdAt: Int;
}
```

**Key Functions**:
```motoko
// Goal management
createGoal()                      // Store goal on-chain
submitProof()                     // Submit proof + trigger verification
markGoalAsFailed()                // User marks goal as failed

// Voting system
getEligibleValidatorsCount()      // Check if voters exist (bootstrapping)
selectRandomValidators()          // Select 5 random voters
getPendingVerificationRequests()  // Voters poll for work
submitVote()                      // Voter submits approve/reject

// Consensus & rewards
calculateConsensus()              // Compute majority when 3+ votes
distributeRewards()               // Pay correct voters
updateReputation()                // ±1 reputation based on vote accuracy

// User & stats
getUserStats()                    // Get user's goal history and tokens
getLeaderboard()                  // Top users by completed goals
```

**Bootstrapping Innovation**:
- First users get auto-approved (no voters exist yet)
- Once users complete goals, they become eligible voters
- Creates organic growth of validator pool
- Implemented in `canister/main.mo:247-271`

### 3. Validator Node (`/validator-node`) - OPTIONAL

**Tech**: Node.js (ES Modules)
**Purpose**: Optional AI-powered automated voting
**Status**: Not required for basic operation

**LLM Integration**:
- Local: Ollama (Llama, Mistral, etc.)
- API: OpenAI GPT-4, Anthropic Claude

**Process** (if running):
1. Poll ICP canister for pending verification requests
2. Analyze proof text with LLM
3. Submit automated vote (approve/reject) to ICP
4. Earn tokens for correct votes

**Note**: The web app's community voting interface (`/voting` page) makes this optional. Users vote directly through the UI.

## Economics

### For Users:
- **Create Goal**: Free (minimal ICP cycles paid by canister)
- **Submit Proof**: 0.50 tokens verification fee (held in escrow)
- **Complete Goal**: Earn **10 tokens** (20x return on investment!)
- **Become Voter**: Automatic after completing first goal
- **Build Streak**: Consecutive completions → Leaderboard ranking

### For Community Voters:
- **Eligibility**: Complete 1+ goal (no staking required)
- **Selection**: Random from users with `completedGoals > 0`
- **Earnings**: Share of verification fee (split among correct voters)
- **Reputation System**:
  - Correct vote: **+1 reputation**
  - Wrong vote: **-1 reputation**
  - Higher reputation = potential for more assignments
- **Incentive Alignment**: Voters earn only if they match consensus

### Token Flow Examples:

**Example 1: Bootstrapping (No voters exist)**
```
User submits proof → 0.50 token fee charged
    ↓
ICP checks: getEligibleValidatorsCount() = 0
    ↓
AUTO-APPROVE path:
    ├─ Goal marked Completed
    ├─ User receives 10 tokens immediately
    ├─ User stats updated (completedGoals = 1)
    └─ User becomes eligible voter

Result: First user gets instant approval + 9.50 net gain
```

**Example 2: Community Voting (Voters exist)**
```
User submits proof → 0.50 token fee charged
    ↓
ICP selects 5 random voters
    ↓
Voters vote:
    • Voter A: Approve ✅
    • Voter B: Approve ✅
    • Voter C: Approve ✅
    • Voter D: Approve ✅
    • Voter E: Reject ❌
    ↓
Consensus: 4/5 approved = MAJORITY APPROVED
    ↓
Rewards distributed:
    ├─ Goal creator: +10 tokens (net gain: 9.50 after fee)
    ├─ Voters A, B, C, D: +0.125 tokens each (0.50 / 4)
    │   └─ +1 reputation each
    └─ Voter E: 0 tokens
        └─ -1 reputation

Result: Goal approved, correct voters paid, wrong voter penalized
```

**Example 3: Rejection**
```
Consensus: 3/5 rejected = MAJORITY REJECTED
    ↓
    ├─ Goal marked Failed
    ├─ User receives 0 tokens (lost 0.50 fee)
    ├─ User streak reset to 0
    ├─ Correct voters (who voted reject): Split 0.50 fee
    └─ Wrong voters (who voted approve): -1 reputation
```

## Consensus Mechanism

### Simple Majority Voting (3/5)

**How It Works**:
1. **Voter Selection**: 5 random users with `completedGoals > 0`
2. **Voting**: Each voter submits binary vote (Approve or Reject)
3. **Threshold**: Minimum 3 votes needed for consensus
4. **Calculation**: Count approve vs reject votes
5. **Result**: Majority determines outcome

**Consensus Logic** (from `canister/main.mo:608-720`):
```motoko
// Count votes
var approveCount = 0;
var rejectCount = 0;

for (vote in votes) {
  if (vote.verified) { approveCount += 1 }
  else { rejectCount += 1 }
};

// Determine majority
let totalVotes = approveCount + rejectCount;
if (totalVotes < CONSENSUS_THRESHOLD) {
  return; // Wait for more votes
};

let isApproved = approveCount > rejectCount;
let majorityVote = if (isApproved) true else false;

// Distribute rewards & update reputations
for (vote in votes) {
  if (vote.verified == majorityVote) {
    // Correct voter
    validator.reputation += 1;
    validator.correctVotes += 1;
    // Receive share of verification fee
  } else {
    // Wrong voter
    validator.reputation -= 1;
  }
};
```

**Example Scenarios**:

**Scenario 1: Clear Approval**
```
Goal: "Exercise for 30 minutes"
Proof: "Went for a run, tracked on my fitness app"

Vote Results:
  • Voter 1: Approve ✅
  • Voter 2: Approve ✅
  • Voter 3: Approve ✅
  • Voter 4: Approve ✅
  • Voter 5: Reject ❌

Consensus: 4 Approve, 1 Reject → APPROVED
  ├─ Goal creator: +10 tokens, goal marked Completed
  ├─ Voters 1-4: +0.125 tokens each, +1 reputation
  └─ Voter 5: 0 tokens, -1 reputation
```

**Scenario 2: Rejection**
```
Goal: "Study for 2 hours"
Proof: "Watched TV" (obviously fake)

Vote Results:
  • Voter 1: Reject ❌
  • Voter 2: Reject ❌
  • Voter 3: Reject ❌
  • Voter 4: Approve ✅
  • Voter 5: Reject ❌

Consensus: 1 Approve, 4 Reject → REJECTED
  ├─ Goal marked Failed
  ├─ Goal creator: 0 tokens, streak reset, lost 0.50 fee
  ├─ Voters 1,2,3,5: +0.125 tokens each, +1 reputation
  └─ Voter 4: 0 tokens, -1 reputation
```

**Scenario 3: Split Decision (Edge Case)**
```
Goal: "Write 1000 words"
Proof: "Wrote draft of blog post" (ambiguous)

Vote Results:
  • Voter 1: Approve ✅
  • Voter 2: Approve ✅
  • Voter 3: Approve ✅
  • Voter 4: Reject ❌
  • Voter 5: Reject ❌

Consensus: 3 Approve, 2 Reject → APPROVED (majority wins)
  ├─ Goal creator: +10 tokens, goal marked Completed
  ├─ Voters 1,2,3: +0.167 tokens each, +1 reputation
  └─ Voters 4,5: 0 tokens, -1 reputation
```

### Key Properties:

1. **Democratic**: Every eligible user has equal voting weight
2. **Incentive-Aligned**: Voters earn only for matching consensus
3. **Sybil-Resistant**: Must complete goals to vote (proof of contribution)
4. **Reputation-Weighted** (future): Higher reputation could = more voting opportunities
5. **Transparent**: All votes stored on-chain and auditable

## Security

### Blockchain-Level Security:
- **Immutable Goals**: Stored on ICP blockchain, cannot be deleted or modified
- **Tamper-Proof History**: All proofs and votes permanently on-chain
- **Internet Identity**: DFINITY's passwordless, privacy-preserving auth
- **Principal-Based Access**: User actions authenticated via cryptographic principals

### Economic Security:
- **Reputation at Stake**: Wrong votes = permanent reputation damage
- **Sybil Resistance**: Must complete goals to become voter (proof of contribution)
- **Incentive Alignment**: Voters earn only for matching consensus
- **No Central Authority**: Consensus is distributed across 5 random voters

### Attack Resistance:

**1. Fake Proofs**:
- Protection: 5 independent voters review each proof
- Result: Obviously fake proofs get rejected by majority

**2. Collusion**:
- Protection: Random voter selection from entire eligible pool
- Mitigation: Would require controlling majority of all users with completed goals
- Future: Reputation weighting can reduce influence of new/low-rep voters

**3. Spam Goals**:
- Protection: 0.50 token fee per proof submission
- Result: Spamming is economically unprofitable

**4. Voter Fatigue**:
- Protection: Voters are randomly selected (not all voters see all requests)
- UI: Clean voting interface with clear approve/reject buttons

**5. Bootstrapping Attack**:
- Issue: First users get auto-approved
- Mitigation: Only applies when `eligibleVoters = 0`
- Transition: Automatic shift to voting once first user completes goal
- Impact: Limited to initial platform seeding

## Scalability

### Current Architecture:
- **Voter Pool Size**: O(total users with completedGoals > 0)
- **Per-Request Load**: Only 5 voters per verification
- **Parallel Processing**: Multiple verifications can occur simultaneously
- **Storage**: Efficient HashMap-based storage in ICP stable memory

### Growth Projections:

**100 Users**:
- Eligible voters: ~30-50 (assuming 30-50% completion rate)
- Verification capacity: High (low collision probability)

**1,000 Users**:
- Eligible voters: ~300-500
- Random selection ensures distribution of voting load
- Each voter sees ~1-2% of verification requests

**10,000+ Users**:
- Large voter pool = strong Sybil resistance
- Low probability of same voter being selected repeatedly
- Potential for reputation-weighted selection

### Bottlenecks & Solutions:

**Potential Issue**: ICP canister storage limits
**Solution**: Implement data archiving for old goals/votes

**Potential Issue**: Voter selection randomness at scale
**Solution**: Use ICP's built-in random number generation (upgradeable to VRF)

**Potential Issue**: Consensus calculation gas costs
**Solution**: Efficient Motoko algorithms, batching if needed

## Future Enhancements

### Phase 1: Enhanced Voting
1. **Confidence Scores**: Voters rate confidence (0-100) alongside approve/reject
2. **Weighted Consensus**: High-confidence votes weighted more heavily
3. **Reputation Decay**: Inactive voters lose reputation over time
4. **Voting Rewards Tiers**: Higher reputation = larger share of fees

### Phase 2: Specialized Domains
1. **Goal Categories**: Coding, Fitness, Study, Work, Custom
2. **Domain Experts**: Users build reputation in specific categories
3. **Category-Specific Voting**: Code goals verified by users with coding completions
4. **Proof Types**: Text, image, video, code commits, API integrations

### Phase 3: Advanced Features
1. **NFT Achievements**: On-chain badges for streaks (7-day, 30-day, 100-day)
2. **Delegation**: Stake tokens with high-reputation voters, earn passive income
3. **DAO Governance**: Token holders vote on:
   - Verification fee amount
   - Token rewards per goal
   - Consensus threshold (3/5 vs 4/5)
   - Reputation system parameters
4. **Leaderboard Tiers**: Bronze, Silver, Gold, Platinum
5. **Social Features**: Follow users, goal templates, accountability partners

### Phase 4: Integrations
1. **GitHub Commits**: Automatic verification for coding goals
2. **Fitness APIs**: Strava, Apple Health, Fitbit integration
3. **Calendar Sync**: Auto-create goals from calendar events
4. **Notion/Todoist**: Import tasks as goals
5. **Slack/Discord Bots**: Goal reminders and updates

### Phase 5: Decentralization
1. **Frontend on ICP**: Deploy frontend as ICP asset canister
2. **Validator Nodes**: Incentivize AI-powered validator nodes for automated verification
3. **Cross-Chain**: Bridge to Ethereum, Solana for broader token utility
4. **Open Source SDK**: Let developers build apps on top of Lock-In protocol
