import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { icpTokenAPI } from '../lib/icp-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Shield, LogOut, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const { principal, logout } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['icp-stats'],
    queryFn: icpTokenAPI.getStats,
    enabled: !!principal,
  });

  const { data: tokenBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ['icp-tokens'],
    queryFn: icpTokenAPI.getBalance,
    enabled: !!principal,
  });

  const handleCopyPrincipal = () => {
    if (principal) {
      navigator.clipboard.writeText(principal.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Your on-chain identity and statistics
        </p>
      </div>

      {/* Identity */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Internet Identity</CardTitle>
              <CardDescription>Your blockchain identity</CardDescription>
            </div>
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Principal ID</label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                {principal?.toString() || 'Not authenticated'}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyPrincipal}
                disabled={!principal}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This is your unique, anonymous identity on the Internet Computer. It cannot be changed and is tied to your authentication method.
            </p>
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Token Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Token Balance</CardTitle>
          <CardDescription>Your earned accountability tokens</CardDescription>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div>
              <div className="text-4xl font-bold">{tokenBalance || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">Total tokens earned</div>
              <p className="text-xs text-muted-foreground mt-4">
                Earn 10 tokens for each completed and verified goal
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Your Statistics</CardTitle>
          <CardDescription>On-chain goal completion data</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <p className="text-muted-foreground">Loading stats...</p>
          ) : stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">{stats.totalGoals}</div>
                <div className="text-xs text-muted-foreground">Total Goals</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.completedGoals}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.failedGoals}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.currentStreak}</div>
                <div className="text-xs text-muted-foreground">Current Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.longestStreak}</div>
                <div className="text-xs text-muted-foreground">Longest Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalTokens}</div>
                <div className="text-xs text-muted-foreground">Total Tokens</div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No stats available</p>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-6">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            🔐 Privacy & Security
          </h4>
          <ul className="text-xs space-y-1 text-blue-700 dark:text-blue-300">
            <li>• Your Principal ID is pseudonymous - no email or personal data</li>
            <li>• All goals and stats are stored on the blockchain (immutable)</li>
            <li>• Validators verify your proofs using decentralized AI</li>
            <li>• You control your identity with your device's biometrics</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
