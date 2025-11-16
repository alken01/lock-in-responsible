import { Lock, Shield } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      await login();
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 overflow-x-hidden">
      <Card className="w-full max-w-md border-2 border-neon-cyan/50 shadow-neon-cyan scanlines relative">
        <CardHeader className="space-y-4 pt-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-neon-cyan/20 border-2 border-neon-cyan flex items-center justify-center">
              <Lock className="h-8 w-8 text-neon-cyan" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold text-neon-cyan font-mono">
              &gt; LOCK-IN_RESPONSIBLE
            </CardTitle>
            <CardDescription className="text-base font-mono">
              // Decentralized goal accountability on-chain
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center font-mono">
              // Sign in with Internet Identity
            </p>
            <div className="flex justify-center">
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                size="lg"
                className="w-full max-w-xs bg-neon-cyan text-black hover:shadow-neon-cyan font-mono font-bold"
              >
                <Shield className="mr-2 h-5 w-5" />
                {isLoading ? "> CONNECTING..." : "> LOGIN_WITH_II"}
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-neon-cyan/30">
            <p className="text-xs text-center text-muted-foreground font-mono">
              // Internet Identity: secure, privacy-preserving auth
            </p>
          </div>

          <div className="bg-secondary border-2 border-neon-purple/30 p-4 space-y-2 relative">
            <div className="absolute -top-2 left-2 bg-card px-2 text-neon-purple text-[10px] font-mono border border-neon-purple/30">
              [ HOW IT WORKS ]
            </div>
            <ul className="text-xs space-y-1 text-muted-foreground font-mono mt-2">
              <li className="text-neon-green">
                + Set goals on-chain (immutable)
              </li>
              <li className="text-neon-cyan">+ Submit proof of completion</li>
              <li className="text-neon-purple">
                + AI validators verify proofs
              </li>
              <li className="text-neon-pink">
                + Earn tokens for completed goals
              </li>
              <li className="text-neon-green">+ Build streaks & compete</li>
            </ul>
          </div>

          <div className="bg-secondary border-2 border-neon-cyan/30 p-4 space-y-2 relative">
            <div className="absolute -top-2 left-2 bg-card px-2 text-neon-cyan text-[10px] font-mono border border-neon-cyan/30">
              [ INTERNET IDENTITY ]
            </div>
            <div className="flex items-start gap-2 mt-2">
              <Shield className="h-4 w-4 text-neon-cyan mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">
                  Secure, anonymous auth using device biometrics (fingerprint,
                  Face ID) or security keys. No passwords, no email required.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
