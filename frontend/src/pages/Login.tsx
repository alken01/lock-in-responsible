import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Lock, Shield } from 'lucide-react';

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      await login();
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold">Lock-In Responsible</CardTitle>
            <CardDescription className="text-base">
              Decentralized goal accountability on the blockchain
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Sign in with Internet Identity for secure, passwordless authentication
            </p>
            <div className="flex justify-center">
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                size="lg"
                className="w-full max-w-xs"
              >
                <Shield className="mr-2 h-5 w-5" />
                {isLoading ? 'Connecting...' : 'Login with Internet Identity'}
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Internet Identity is a secure, privacy-preserving authentication service powered by the Internet Computer
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium">How it works:</h4>
            <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
              <li>Set goals and commit them on-chain (immutable)</li>
              <li>Complete your goal and submit text proof</li>
              <li>Decentralized validators verify with AI</li>
              <li>Earn tokens for completed goals</li>
              <li>Build streaks and compete on the leaderboard</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  What is Internet Identity?
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  A secure, anonymous authentication system that uses your device's biometrics (fingerprint, Face ID) or security keys. No passwords, no email required.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
