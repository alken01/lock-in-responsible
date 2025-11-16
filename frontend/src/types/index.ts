import { Principal } from '@dfinity/principal';

// Match the canister's GoalType enum
export type GoalType = 'Custom' | 'Coding' | 'Fitness' | 'Study' | 'Work';

// Match the canister's GoalStatus enum
export type GoalStatus = 'Pending' | 'InReview' | 'Completed' | 'Failed' | 'Verified';

// Match the canister's Goal type
export interface Goal {
  id: bigint | string; // Support both for compatibility
  userId: Principal | string;
  title: string;
  description: string;
  goalType: GoalType;
  deadline: bigint | number;
  createdAt: bigint | number;
  status: GoalStatus;
  proof?: string;
  tokensReward: bigint | number;
}

// Match the canister's UserStats type
export interface UserStats {
  totalGoals: bigint | number;
  completedGoals: bigint | number;
  failedGoals: bigint | number;
  currentStreak: bigint | number;
  longestStreak: bigint | number;
  totalTokens: bigint | number;
}

// Verification types for the voting system
export interface Verification {
  id: string;
  goalId: string;
  status: 'pending' | 'verified' | 'rejected';
  proofType: string;
  proofUrl?: string;
  proofText?: string;
  confidence?: number;
  feedback?: string;
  verifiedAt?: string;
  createdAt: string;
}
