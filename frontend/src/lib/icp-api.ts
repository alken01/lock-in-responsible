import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';

// ICP Playground Configuration
const CANISTER_ID = import.meta.env.VITE_CANISTER_ID;
const ICP_HOST = import.meta.env.VITE_HOST;
const II_PROVIDER = import.meta.env.VITE_II_PROVIDER;
const ICP_LEDGER_CANISTER_ID = import.meta.env.VITE_ICP_LEDGER_CANISTER_ID;

// IDL (Interface Definition Language) for the canister
const idlFactory = ({ IDL }: any) => {
  const GoalType = IDL.Variant({
    'Custom': IDL.Null,
    'Coding': IDL.Null,
    'Fitness': IDL.Null,
    'Study': IDL.Null,
    'Work': IDL.Null,
  });

  const GoalStatus = IDL.Variant({
    'Pending': IDL.Null,
    'InReview': IDL.Null,
    'Completed': IDL.Null,
    'Failed': IDL.Null,
    'Verified': IDL.Null,
  });

  const Goal = IDL.Record({
    'id': IDL.Nat,
    'userId': IDL.Principal,
    'title': IDL.Text,
    'description': IDL.Text,
    'goalType': GoalType,
    'deadline': IDL.Int,
    'createdAt': IDL.Int,
    'status': GoalStatus,
    'proof': IDL.Opt(IDL.Text),
    'tokensReward': IDL.Nat,
  });

  const UserStats = IDL.Record({
    'totalGoals': IDL.Nat,
    'completedGoals': IDL.Nat,
    'failedGoals': IDL.Nat,
    'currentStreak': IDL.Nat,
    'longestStreak': IDL.Nat,
    'totalTokens': IDL.Nat,
  });

  return IDL.Service({
    'createGoal': IDL.Func(
      [IDL.Text, IDL.Text, GoalType, IDL.Int],
      [IDL.Nat],
      [],
    ),
    'submitProof': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
    'failGoal': IDL.Func([IDL.Nat], [IDL.Bool], []),
    'getMyGoals': IDL.Func([], [IDL.Vec(Goal)], ['query']),
    'getAllGoals': IDL.Func([], [IDL.Vec(Goal)], ['query']),
    'getGoalsInReview': IDL.Func([], [IDL.Vec(Goal)], ['query']),
    'getUserGoals': IDL.Func([IDL.Principal], [IDL.Vec(Goal)], ['query']),
    'getGoal': IDL.Func([IDL.Nat], [IDL.Opt(Goal)], ['query']),
    'getMyTokens': IDL.Func([], [IDL.Nat], ['query']),
    'getMyStats': IDL.Func([], [UserStats], ['query']),
    'getLeaderboard': IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))], ['query']),
    'verifyGoal': IDL.Func([IDL.Nat], [IDL.Bool], []),
    'healthCheck': IDL.Func([], [IDL.Bool], ['query']),
    'getInfo': IDL.Func(
      [],
      [IDL.Record({
        'totalGoals': IDL.Nat,
        'totalUsers': IDL.Nat,
        'version': IDL.Text,
      })],
      ['query'],
    ),
  });
};

// ICP Ledger IDL
const ledgerIdlFactory = ({ IDL }: any) => {
  const AccountBalanceArgs = IDL.Record({
    account: IDL.Vec(IDL.Nat8),
  });

  const Tokens = IDL.Record({
    e8s: IDL.Nat64,
  });

  return IDL.Service({
    account_balance: IDL.Func([AccountBalanceArgs], [Tokens], ['query']),
  });
};

export interface ICPGoal {
  id: bigint;
  userId: Principal;
  title: string;
  description: string;
  goalType: { Custom?: null; Coding?: null; Fitness?: null; Study?: null; Work?: null };
  deadline: bigint;
  createdAt: bigint;
  status: { Pending?: null; InReview?: null; Completed?: null; Failed?: null; Verified?: null };
  proof: string[] | [];
  tokensReward: bigint;
}

export interface ICPUserStats {
  totalGoals: bigint;
  completedGoals: bigint;
  failedGoals: bigint;
  currentStreak: bigint;
  longestStreak: bigint;
  totalTokens: bigint;
}

class ICPClient {
  private authClient: AuthClient | null = null;
  private actor: any = null;
  private ledgerActor: any = null;
  private agent: HttpAgent | null = null;

  async init() {
    this.authClient = await AuthClient.create();

    console.log(`🌐 Initializing agent - Host: ${ICP_HOST}`);

    this.agent = await HttpAgent.create({
      host: ICP_HOST,
    });

    this.createActor();
  }

  private async createActor() {
    if (!this.agent) return;

    const identity = this.authClient?.getIdentity();
    if (identity) {
      console.log('🔄 Recreating agent with authenticated identity');

      this.agent = await HttpAgent.create({
        host: ICP_HOST,
        identity,
      });
    }

    if (this.agent) {
      console.log('🎭 Creating actor for canister:', CANISTER_ID);
      this.actor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: CANISTER_ID,
      });

      console.log('💰 Creating ledger actor');
      this.ledgerActor = Actor.createActor(ledgerIdlFactory, {
        agent: this.agent,
        canisterId: ICP_LEDGER_CANISTER_ID,
      });
    }
  }

  async login() {
    if (!this.authClient) await this.init();

    return new Promise<boolean>((resolve, reject) => {
      console.log('🔐 Starting login with provider:', II_PROVIDER);

      this.authClient?.login({
        identityProvider: II_PROVIDER,
        onSuccess: async () => {
          console.log('✅ Login callback triggered - success!');
          await this.createActor();
          const isAuth = await this.isAuthenticated();
          console.log('🔍 Authentication status after login:', isAuth);
          resolve(true);
        },
        onError: (error) => {
          console.error('❌ Login failed:', error);
          reject(error);
        },
      });
    });
  }

  async logout() {
    await this.authClient?.logout();
    this.createActor();
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.authClient) await this.init();
    const isAuth = await this.authClient!.isAuthenticated();
    console.log('🔍 isAuthenticated check:', isAuth);
    return isAuth;
  }

  async getPrincipal(): Promise<Principal | null> {
    if (!this.authClient) await this.init();
    const identity = this.authClient!.getIdentity();
    return identity.getPrincipal();
  }

  // Goal methods
  async createGoal(
    title: string,
    description: string,
    goalType: 'Custom' | 'Coding' | 'Fitness' | 'Study' | 'Work',
    deadline?: Date
  ): Promise<bigint> {
    if (!this.actor) await this.init();
    const goalTypeVariant = { [goalType]: null };

    // Use provided deadline or default to end of today
    const finalDeadline = deadline || new Date();
    if (!deadline) {
      finalDeadline.setHours(23, 59, 59, 999);
    }
    const deadlineNano = BigInt(finalDeadline.getTime() * 1000000);

    return await this.actor.createGoal(title, description, goalTypeVariant, deadlineNano);
  }

  async submitProof(goalId: number, proof: string): Promise<boolean> {
    if (!this.actor) await this.init();
    return await this.actor.submitProof(BigInt(goalId), proof);
  }

  async failGoal(goalId: number): Promise<boolean> {
    if (!this.actor) await this.init();
    return await this.actor.failGoal(BigInt(goalId));
  }

  async getMyGoals(): Promise<ICPGoal[]> {
    if (!this.actor) await this.init();
    return await this.actor.getMyGoals();
  }

  async getAllGoals(): Promise<ICPGoal[]> {
    if (!this.actor) await this.init();
    return await this.actor.getAllGoals();
  }

  async getGoalsInReview(): Promise<ICPGoal[]> {
    if (!this.actor) await this.init();
    return await this.actor.getGoalsInReview();
  }

  async getUserGoals(userId: Principal): Promise<ICPGoal[]> {
    if (!this.actor) await this.init();
    return await this.actor.getUserGoals(userId);
  }

  async getGoal(goalId: number): Promise<ICPGoal | null> {
    if (!this.actor) await this.init();
    const result = await this.actor.getGoal(BigInt(goalId));
    return result.length > 0 ? result[0] : null;
  }

  async getMyTokens(): Promise<bigint> {
    if (!this.actor) await this.init();
    return await this.actor.getMyTokens();
  }

  async getMyStats(): Promise<ICPUserStats> {
    if (!this.actor) await this.init();
    return await this.actor.getMyStats();
  }

  async getLeaderboard(): Promise<Array<[Principal, bigint]>> {
    if (!this.actor) await this.init();
    return await this.actor.getLeaderboard();
  }

  // Verification methods
  async getPendingRequests(): Promise<any[]> {
    if (!this.actor) await this.init();
    return await this.actor.getPendingRequests();
  }

  async submitVerdict(
    requestId: number,
    verified: boolean,
    confidence: number,
    reasoning: string
  ): Promise<boolean> {
    if (!this.actor) await this.init();
    return await this.actor.submitVerdict(BigInt(requestId), verified, BigInt(confidence), reasoning);
  }

  async healthCheck(): Promise<boolean> {
    if (!this.actor) await this.init();
    return await this.actor.healthCheck();
  }

  async getInfo(): Promise<{ totalGoals: bigint; totalUsers: bigint; version: string }> {
    if (!this.actor) await this.init();
    return await this.actor.getInfo();
  }

  // Helper function to convert Principal to Account Identifier
  private principalToAccountIdentifier(principal: Principal): Uint8Array {
    // Simple account identifier: just use the principal bytes
    // Note: In production, you'd use proper account identifier generation with SHA-224
    // and support for subaccounts
    const principalBytes = principal.toUint8Array();
    const account = new Uint8Array(32);
    account.set(principalBytes.slice(0, Math.min(principalBytes.length, 32)));

    return account;
  }

  async getICPBalance(): Promise<number> {
    if (!this.ledgerActor) await this.init();

    try {
      const principal = await this.getPrincipal();
      if (!principal) return 0;

      const accountId = this.principalToAccountIdentifier(principal);
      const balance = await this.ledgerActor.account_balance({
        account: Array.from(accountId),
      });

      // Convert from e8s to ICP (1 ICP = 100,000,000 e8s)
      return Number(balance.e8s) / 100000000;
    } catch (error) {
      console.error('Failed to get ICP balance:', error);
      return 0;
    }
  }
}

// Singleton instance
export const icpClient = new ICPClient();

// Helper functions
export const icpGoalAPI = {
  create: async (title: string, description: string, goalType: any, deadline?: Date) => {
    const goalId = await icpClient.createGoal(title, description, goalType, deadline);
    return Number(goalId);
  },

  list: async () => {
    console.log('📋 Fetching goals from canister...');
    const goals = await icpClient.getMyGoals();
    console.log('📋 Raw goals from canister:', goals);
    const mapped = goals.map(g => ({
      id: Number(g.id),
      userId: g.userId.toString(),
      title: g.title,
      description: g.description,
      goalType: Object.keys(g.goalType)[0],
      deadline: new Date(Number(g.deadline) / 1000000),
      createdAt: new Date(Number(g.createdAt) / 1000000),
      status: Object.keys(g.status)[0],
      proof: g.proof.length > 0 ? g.proof[0] : null,
      tokensReward: Number(g.tokensReward),
    }));
    console.log('📋 Mapped goals:', mapped);
    return mapped;
  },

  listAll: async () => {
    console.log('🌍 Fetching all goals from canister...');
    const goals = await icpClient.getAllGoals();
    console.log('🌍 Raw all goals from canister:', goals);
    const mapped = goals.map(g => ({
      id: Number(g.id),
      userId: g.userId.toString(),
      title: g.title,
      description: g.description,
      goalType: Object.keys(g.goalType)[0],
      deadline: new Date(Number(g.deadline) / 1000000),
      createdAt: new Date(Number(g.createdAt) / 1000000),
      status: Object.keys(g.status)[0],
      proof: g.proof.length > 0 ? g.proof[0] : null,
      tokensReward: Number(g.tokensReward),
    }));
    console.log('🌍 Mapped all goals:', mapped);
    return mapped;
  },

  listInReview: async () => {
    console.log('🔍 Fetching goals in review from canister...');
    const goals = await icpClient.getGoalsInReview();
    console.log('🔍 Raw goals in review from canister:', goals);
    const mapped = goals.map(g => ({
      id: Number(g.id),
      userId: g.userId.toString(),
      title: g.title,
      description: g.description,
      goalType: Object.keys(g.goalType)[0],
      deadline: new Date(Number(g.deadline) / 1000000),
      createdAt: new Date(Number(g.createdAt) / 1000000),
      status: Object.keys(g.status)[0],
      proof: g.proof.length > 0 ? g.proof[0] : null,
      tokensReward: Number(g.tokensReward),
    }));
    console.log('🔍 Mapped goals in review:', mapped);
    return mapped;
  },

  listByUser: async (userId: string) => {
    console.log('👤 Fetching user goals from canister...');
    const principal = Principal.fromText(userId);
    const goals = await icpClient.getUserGoals(principal);
    return goals.map(g => ({
      id: Number(g.id),
      userId: g.userId.toString(),
      title: g.title,
      description: g.description,
      goalType: Object.keys(g.goalType)[0],
      deadline: new Date(Number(g.deadline) / 1000000),
      createdAt: new Date(Number(g.createdAt) / 1000000),
      status: Object.keys(g.status)[0],
      proof: g.proof.length > 0 ? g.proof[0] : null,
      tokensReward: Number(g.tokensReward),
    }));
  },

  submitProof: async (goalId: number, proof: string) => {
    console.log('🎯 Submitting proof for goal:', goalId, 'proof:', proof);
    try {
      const result = await icpClient.submitProof(goalId, proof);
      console.log('🎯 Submit proof result:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to submit proof:', error);
      throw error;
    }
  },

  fail: async (goalId: number) => {
    return await icpClient.failGoal(goalId);
  },
};

export const icpTokenAPI = {
  getBalance: async () => {
    const balance = await icpClient.getMyTokens();
    return Number(balance);
  },

  getICPBalance: async () => {
    return await icpClient.getICPBalance();
  },

  getStats: async () => {
    const stats = await icpClient.getMyStats();
    return {
      totalGoals: Number(stats.totalGoals),
      completedGoals: Number(stats.completedGoals),
      failedGoals: Number(stats.failedGoals),
      currentStreak: Number(stats.currentStreak),
      longestStreak: Number(stats.longestStreak),
      totalTokens: Number(stats.totalTokens),
    };
  },

  getLeaderboard: async () => {
    const leaderboard = await icpClient.getLeaderboard();
    return leaderboard.map(([principal, tokens]) => ({
      principal: principal.toString(),
      tokens: Number(tokens),
    }));
  },
};
