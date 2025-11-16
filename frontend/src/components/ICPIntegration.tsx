import { useEffect, useState } from 'react';
import { icpClient, icpTokenAPI, icpGoalAPI } from '../lib/icp-api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Coins, Trophy, TrendingUp, Zap } from 'lucide-react';

export function ICPIntegration() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<string>('');
  const [tokens, setTokens] = useState<number>(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [icpGoals, setIcpGoals] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authenticated = await icpClient.isAuthenticated();
    setIsAuthenticated(authenticated);

    if (authenticated) {
      const p = await icpClient.getPrincipal();
      setPrincipal(p?.toString() || '');
      await loadData();
    }
  };

  const loadData = async () => {
    try {
      const [tokenBalance, userStats, goals] = await Promise.all([
        icpTokenAPI.getBalance(),
        icpTokenAPI.getStats(),
        icpGoalAPI.list(),
      ]);
      setTokens(tokenBalance);
      setStats(userStats);
      setIcpGoals(goals);
    } catch (error) {
      console.error('Failed to load ICP data:', error);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await icpClient.login();
      await checkAuth();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await icpClient.logout();
    setIsAuthenticated(false);
    setPrincipal('');
    setTokens(0);
    setStats(null);
  };


  if (!isAuthenticated) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Internet Computer (ICP) Integration
          </CardTitle>
          <CardDescription>
            Connect with Internet Identity to unlock blockchain-powered features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="font-semibold mb-2">What you get:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>🔒 Decentralized authentication (no passwords!)</li>
                <li>🪙 Earn accountability tokens for completing goals</li>
                <li>📊 On-chain proof of your achievements</li>
                <li>🏆 Global leaderboard</li>
                <li>💎 Permanent, verifiable goal history</li>
              </ul>
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? 'Connecting...' : 'Connect with Internet Identity'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              ICP Blockchain Integration
            </span>
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              Connected
            </Badge>
          </CardTitle>
          <CardDescription className="font-mono text-xs">
            Principal: {principal.substring(0, 20)}...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Token Balance */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Coins className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Accountability Tokens</p>
                  <p className="text-2xl font-bold text-yellow-600">{tokens}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-blue-600" />
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                  <p className="text-xl font-bold">{stats.completedGoals}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <p className="text-xs text-gray-600">Current Streak</p>
                  </div>
                  <p className="text-xl font-bold">{stats.currentStreak}</p>
                </div>
              </div>
            )}

            {/* ICP Goals */}
            {icpGoals.length > 0 && (
              <div className="pt-2">
                <p className="text-sm font-semibold mb-2">On-Chain Goals ({icpGoals.length})</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {icpGoals.slice(0, 5).map((goal) => (
                    <div key={goal.id} className="p-2 bg-white rounded border text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{goal.title}</span>
                        <Badge variant={goal.status === 'Completed' ? 'default' : 'secondary'}>
                          {goal.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Section */}
            <div className="pt-4 border-t space-y-4">
              <h3 className="text-sm font-semibold">Settings</h3>

              {/* Principal ID */}
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-gray-600 mb-1">Principal ID</p>
                <p className="text-xs font-mono break-all">{principal}</p>
              </div>

              {/* Stats Grid */}
              {stats && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white rounded border">
                    <p className="text-xs text-gray-600">Total Goals</p>
                    <p className="text-lg font-bold">{stats.totalGoals}</p>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <p className="text-xs text-gray-600">Failed</p>
                    <p className="text-lg font-bold">{stats.failedGoals}</p>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <p className="text-xs text-gray-600">Longest Streak</p>
                    <p className="text-lg font-bold">{stats.longestStreak}</p>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <p className="text-xs text-gray-600">Total Tokens</p>
                    <p className="text-lg font-bold">{stats.totalTokens}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export function to sync goal to ICP from other components
export { icpGoalAPI };
