export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  stats?: {
    totalGoalsCompleted: number;
    currentStreak: number;
    longestStreak: number;
  };
  preferences?: {
    codeLength: number;
    codeExpiry: number;
    notifications: {
      email: boolean;
      push: boolean;
    };
    llmApiKey?: string;
    llmProvider?: 'openai' | 'anthropic';
  };
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'github_commits' | 'github_pr' | 'github_issues' | 'code_lines' | 'time_based' | 'custom';
  target: number;
  progress: number;
  status: 'pending' | 'in_review' | 'completed' | 'failed';
  dueDate?: string;
  completedAt?: string;
  verifications?: Verification[];
  verificationType: 'manual' | 'github' | 'llm' | 'custom';
  verificationConfig: any;
  createdAt: string;
}

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
