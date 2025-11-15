import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';

const getCanisterId = () => {
// Canister ID (will be set after deployment)
  const isLocal = import.meta.env.MODE === 'development';
  return isLocal
    ? (import.meta.env.VITE_ICP_CANISTER_ID_LOCAL)
    : import.meta.env.VITE_ICP_CANISTER_ID;
};

const CANISTER_ID = getCanisterId();

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

export interface ICPGoal {
  id: bigint;
  userId: Principal;
  title: string;
  description: string;
  goalType: { Custom?: null; Coding?: null; Fitness?: null; Study?: null; Work?: null };
  deadline: bigint;
  createdAt: bigint;
  status: { Pending?: null; Completed?: null; Failed?: null; Verified?: null };
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
  private agent: HttpAgent | null = null;

  async init() {
    this.authClient = await AuthClient.create();

    // Determine if local or mainnet
    const isLocal = import.meta.env.MODE === 'development';
    const host = isLocal
      ? import.meta.env.VITE_ICP_HOST_LOCAL
      : import.meta.env.VITE_ICP_HOST_MAINNET;

    this.agent = new HttpAgent({ host });

    // Fetch root key for local development
    if (isLocal) {
      await this.agent.fetchRootKey().catch(console.error);
    }

    this.createActor();
  }

  private createActor() {
    if (!this.agent) return;

    const identity = this.authClient?.getIdentity();
    if (identity) {
      const isLocal = import.meta.env.MODE === 'development';
      const host = isLocal
        ? import.meta.env.VITE_ICP_HOST_LOCAL
        : import.meta.env.VITE_ICP_HOST_MAINNET;

      this.agent = new HttpAgent({
        host,
        identity,
      });

      if (import.meta.env.MODE === 'development') {
        this.agent.fetchRootKey().catch(console.error);
      }
    }

    this.actor = Actor.createActor(idlFactory, {
      agent: this.agent,
      canisterId: CANISTER_ID,
    });
  }

  async login() {
    if (!this.authClient) await this.init();

    return new Promise<boolean>((resolve, reject) => {
      const isLocal = import.meta.env.MODE === 'development';
      const identityProvider = isLocal
        ? import.meta.env.VITE_II_PROVIDER_LOCAL
        : import.meta.env.VITE_II_PROVIDER_MAINNET;

      this.authClient?.login({
        identityProvider,
        onSuccess: () => {
          this.createActor();
          resolve(true);
        },
        onError: (error) => {
          console.error('Login failed:', error);
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
    return await this.authClient!.isAuthenticated();
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
    deadline: Date
  ): Promise<bigint> {
    if (!this.actor) await this.init();
    const goalTypeVariant = { [goalType]: null };
    const deadlineNano = BigInt(deadline.getTime() * 1000000);
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

  async healthCheck(): Promise<boolean> {
    if (!this.actor) await this.init();
    return await this.actor.healthCheck();
  }

  async getInfo(): Promise<{ totalGoals: bigint; totalUsers: bigint; version: string }> {
    if (!this.actor) await this.init();
    return await this.actor.getInfo();
  }
}

// Singleton instance
export const icpClient = new ICPClient();

// Helper functions
export const icpGoalAPI = {
  create: async (title: string, description: string, goalType: any, deadline: Date) => {
    const goalId = await icpClient.createGoal(title, description, goalType, deadline);
    return Number(goalId);
  },

  list: async () => {
    const goals = await icpClient.getMyGoals();
    return goals.map(g => ({
      id: Number(g.id),
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
    return await icpClient.submitProof(goalId, proof);
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
