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
  const [icpBalance, setIcpBalance] = useState<number>(0);
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
      const [tokenBalance, icpBal, userStats, goals] = await Promise.all([
        icpTokenAPI.getBalance(),
        icpTokenAPI.getICPBalance(),
        icpTokenAPI.getStats(),
        icpGoalAPI.list(),
      ]);
      setTokens(tokenBalance);
      setIcpBalance(icpBal);
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
            <div className="p-3 bg-secondary border-2 border-neon-cyan/30 relative">
              <div className="absolute -top-2 left-2 bg-card px-2 text-neon-cyan text-[10px] font-mono border border-neon-cyan/30">
                [ PRINCIPAL ]
              </div>
              <p className="text-[10px] text-muted-foreground font-mono mb-1 mt-2">
                // IDENTITY
              </p>
              <p className="text-xs font-mono text-neon-cyan break-all leading-relaxed">
                {principal}
              </p>
            </div>

            {/* Balances Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* ICP Balance */}
              <div className="p-3 sm:p-4 bg-secondary border-2 border-neon-cyan/30 relative">
                <div className="absolute -top-2 left-2 bg-card px-2 text-neon-cyan text-[10px] font-mono border border-neon-cyan/30">
                  [ ICP ]
                </div>
                <div className="mt-2">
                  <div className="flex items-center gap-1 sm:gap-2 mb-2">
                    <div className="p-1 sm:p-1.5 bg-neon-cyan/20 border-2 border-neon-cyan/50">
                      <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-neon-cyan" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      // BAL
                    </p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-neon-cyan font-mono break-all">
                    {icpBalance.toFixed(4)}
                  </p>
                </div>
              </div>

              {/* Token Balance */}
              <div className="p-3 sm:p-4 bg-secondary border-2 border-neon-purple/30 relative">
                <div className="absolute -top-2 left-2 bg-card px-2 text-neon-purple text-[10px] font-mono border border-neon-purple/30">
                  [ TOK ]
                </div>
                <div className="mt-2">
                  <div className="flex items-center gap-1 sm:gap-2 mb-2">
                    <div className="p-1 sm:p-1.5 bg-neon-purple/20 border-2 border-neon-purple/50">
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-neon-purple" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      // EARN
                    </p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-neon-purple font-mono">
                    {tokens}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            {stats && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-secondary border-2 border-neon-purple/30 relative">
                  <div className="absolute -top-2 left-2 bg-card px-2 text-neon-purple text-[10px] font-mono border border-neon-purple/30">
                    [ DONE ]
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1">
                      <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-neon-purple" />
                      <p className="text-[10px] text-muted-foreground font-mono">
                        // GOALS
                      </p>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-neon-purple font-mono">
                      {stats.completedGoals}
                    </p>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-secondary border-2 border-neon-green/30 relative">
                  <div className="absolute -top-2 left-2 bg-card px-2 text-neon-green text-[10px] font-mono border border-neon-green/30">
                    [ STREAK ]
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-neon-green" />
                      <p className="text-[10px] text-muted-foreground font-mono">
                        // NOW
                      </p>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-neon-green font-mono">
                      {stats.currentStreak}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ICP Goals */}
            {icpGoals.length > 0 && (
              <div className="pt-2">
                <p className="text-sm font-semibold mb-2 text-neon-cyan font-mono">
                  &gt; ON_CHAIN_GOALS // {icpGoals.length} TOTAL
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {icpGoals.slice(0, 5).map((goal) => (
                    <div
                      key={goal.id}
                      className="p-2 bg-secondary border-2 border-neon-cyan/20 text-sm font-mono"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {goal.title}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 border ${
                            goal.status === "Completed"
                              ? "border-neon-green text-neon-green bg-neon-green/10"
                              : goal.status === "Failed"
                              ? "border-neon-pink text-neon-pink bg-neon-pink/10"
                              : "border-neon-cyan text-neon-cyan bg-neon-cyan/10"
                          }`}
                        >
                          [{goal.status.toUpperCase()}]
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export function to sync goal to ICP from other components
export { icpGoalAPI };
