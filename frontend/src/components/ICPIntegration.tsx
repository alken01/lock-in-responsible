import { Coins, TrendingUp, Trophy, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { icpClient, icpGoalAPI, icpTokenAPI } from "../lib/icp-api";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

export function ICPIntegration() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<string>("");
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
      setPrincipal(p?.toString() || "");
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
      console.error("Failed to load ICP data:", error);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await icpClient.login();
      await checkAuth();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await icpClient.logout();
    setIsAuthenticated(false);
    setPrincipal("");
    setTokens(0);
    setStats(null);
  };

  if (!isAuthenticated) {
    return (
      <Card className="border-2 border-neon-cyan/50 bg-card shadow-neon-cyan scanlines relative">
        <div className="absolute top-0 left-0 text-neon-cyan text-xs font-mono px-2">
          ┌─ SYSTEM ─┐
        </div>
        <div className="absolute bottom-0 right-0 text-neon-cyan text-xs font-mono px-2">
          └─────────┘
        </div>
        <CardHeader className="pt-6">
          <CardTitle className="flex items-center gap-2 text-neon-cyan">
            <Zap className="h-5 w-5 text-neon-cyan" />
            &gt; ICP_INTEGRATION
          </CardTitle>
          <CardDescription className="text-muted-foreground font-mono text-xs">
            // Connect with Internet Identity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground font-mono">
              <p className="font-semibold mb-2 text-neon-purple">
                &gt; FEATURES:
              </p>
              <ul className="space-y-1 ml-4">
                <li className="text-neon-green">
                  + Decentralized auth (no passwords!)
                </li>
                <li className="text-neon-cyan">+ Earn accountability tokens</li>
                <li className="text-neon-purple">
                  + On-chain proof of achievements
                </li>
                <li className="text-neon-pink">+ Global leaderboard</li>
                <li className="text-neon-cyan">
                  + Permanent, verifiable history
                </li>
              </ul>
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-neon-cyan text-black hover:shadow-neon-cyan font-mono font-bold"
            >
              {loading ? "&gt; CONNECTING..." : "&gt; CONNECT_IDENTITY"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-neon-cyan/50 bg-card shadow-neon-cyan scanlines relative">
        <CardHeader className="pt-6">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-neon-cyan font-mono">
              <Zap className="h-5 w-5 text-neon-cyan" />
              &gt; ICP_BLOCKCHAIN
            </span>
            <Badge
              variant="outline"
              className="bg-neon-green/20 text-neon-green border-2 border-neon-green font-mono"
            >
              [ONLINE]
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Principal ID Display */}
            <div className="p-3 bg-secondary border-2 border-neon-cyan/20">
              <p className="text-[10px] text-muted-foreground font-mono mb-1">// PRINCIPAL_ID</p>
              <p className="text-xs font-mono text-neon-cyan break-all leading-relaxed">{principal}</p>
            </div>

            {/* Token Balance */}
            <div className="p-4 bg-secondary border-2 border-neon-purple/30 relative">
              <div className="absolute -top-2 left-2 bg-card px-2 text-neon-purple text-[10px] font-mono border border-neon-purple/30">
                [ TOKEN BALANCE ]
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neon-purple/20 border-2 border-neon-purple/50">
                    <Coins className="h-6 w-6 text-neon-purple" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">
                      // ACCOUNTABILITY
                    </p>
                    <p className="text-3xl font-bold text-neon-purple font-mono">
                      {tokens}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-mono">TOK</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-secondary border-2 border-neon-purple/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-neon-purple" />
                    <p className="text-xs text-muted-foreground font-mono">
                      Completed
                    </p>
                  </div>
                  <p className="text-xl font-bold text-neon-purple font-mono">
                    {stats.completedGoals}
                  </p>
                </div>
                <div className="p-3 bg-secondary border-2 border-neon-green/30">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-neon-green" />
                    <p className="text-xs text-muted-foreground font-mono">
                      Streak
                    </p>
                  </div>
                  <p className="text-xl font-bold text-neon-green font-mono">
                    {stats.currentStreak}
                  </p>
                </div>
              </div>
            )}

            {/* ICP Goals */}
            {icpGoals.length > 0 && (
              <div className="pt-2">
                <p className="text-sm font-semibold mb-2 text-neon-cyan font-mono">
                  &gt; ON_CHAIN_GOALS ({icpGoals.length})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {icpGoals.slice(0, 5).map((goal) => (
                    <div
                      key={goal.id}
                      className="p-2 bg-secondary rounded border border-primary/20 text-sm font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {goal.title}
                        </span>
                        <Badge
                          variant={
                            goal.status === "Completed"
                              ? "default"
                              : "secondary"
                          }
                          className="font-mono text-xs"
                        >
                          {goal.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Section */}
            <div className="pt-4 border-t-2 border-neon-cyan/20 space-y-4">
              <h3 className="text-sm font-semibold text-neon-purple font-mono">
                &gt; STATS
              </h3>

              {/* Stats Grid */}
              {stats && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-secondary border-2 border-primary/20">
                    <p className="text-xs text-muted-foreground font-mono">
                      Total
                    </p>
                    <p className="text-lg font-bold text-neon-cyan font-mono">
                      {stats.totalGoals}
                    </p>
                  </div>
                  <div className="p-2 bg-secondary border-2 border-destructive/20">
                    <p className="text-xs text-muted-foreground font-mono">
                      Failed
                    </p>
                    <p className="text-lg font-bold text-neon-pink font-mono">
                      {stats.failedGoals}
                    </p>
                  </div>
                  <div className="p-2 bg-secondary border-2 border-neon-green/20">
                    <p className="text-xs text-muted-foreground font-mono">
                      Best
                    </p>
                    <p className="text-lg font-bold text-neon-green font-mono">
                      {stats.longestStreak}
                    </p>
                  </div>
                  <div className="p-2 bg-secondary border-2 border-neon-purple/20">
                    <p className="text-xs text-muted-foreground font-mono">
                      All
                    </p>
                    <p className="text-lg font-bold text-neon-purple font-mono">
                      {stats.totalTokens}
                    </p>
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
