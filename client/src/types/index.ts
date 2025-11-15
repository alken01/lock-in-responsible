export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  stats?: {
    totalGoalsCompleted: number;
    currentStreak: number;
    longestStreak: number;
    devicesOwned: number;
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

export interface Device {
  id: string;
  name: string;
  macAddress: string;
  status: 'online' | 'offline' | 'error';
  lastSeen?: string;
  firmwareVersion: string;
  batteryLevel?: number;
  lockState: 'locked' | 'unlocked';
  settings: {
    autoLockDelay: number;
    unlockDuration: number;
    buzzerEnabled: boolean;
  };
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'github_commits' | 'github_pr' | 'github_issues' | 'code_lines' | 'time_based' | 'custom';
  target: number;
  progress: number;
  status: 'pending' | 'completed' | 'failed';
  dueDate?: string;
  completedAt?: string;
  deviceId?: string;
  device?: {
    id: string;
    name: string;
  };
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

export interface UnlockCode {
  unlockCode: string;
  expiresAt: string;
  expiresIn: number;
}
