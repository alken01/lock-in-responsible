import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Lock, LogOut, Target, CheckCircle, Users, History, Settings as SettingsIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { icpClient } from '../lib/icp-api';
import { useToast } from '../components/ui/use-toast';
import { useEffect, useRef } from 'react';

export default function Dashboard() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const previousCountRef = useRef<number>(0);

  // Query for pending verification requests
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: async () => {
      const requests = await icpClient.getPendingRequests();
      return requests;
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const pendingCount = pendingRequests.length;

  // Show toast notification when new verification requests appear
  useEffect(() => {
    // Skip on initial mount
    if (previousCountRef.current === 0 && pendingCount === 0) {
      previousCountRef.current = pendingCount;
      return;
    }

    // Show notification if count increased
    if (pendingCount > previousCountRef.current) {
      const newRequests = pendingCount - previousCountRef.current;
      toast({
        title: "🔔 New Verification Request" + (newRequests > 1 ? "s" : ""),
        description: `You have ${newRequests} new proof${newRequests > 1 ? 's' : ''} to verify. Click the Voting tab to review.`,
      });
    }

    previousCountRef.current = pendingCount;
  }, [pendingCount, toast]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background pixel-grid overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-neon-cyan bg-background scanlines overflow-x-hidden">
        <div className="container flex h-16 items-center justify-between px-4 max-w-full">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-neon-cyan flex-shrink-0" />
            <div className="font-mono min-w-0">
              <div className="text-neon-cyan font-bold text-sm sm:text-lg truncate">
                &gt; LOCK_IN_RESPONSIBLE
              </div>
              <div className="text-neon-purple text-[10px] sm:text-xs truncate">
                // Accountability Protocol v1.0
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="border-2 border-neon-pink/30 hover:border-neon-pink hover:bg-neon-pink/10 transition-all h-9 w-9 sm:h-10 sm:w-10"
            >
              <LogOut className="h-4 w-4 text-neon-pink" />
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b-2 border-neon-cyan/30 bg-background/95 backdrop-blur sticky top-16 z-40">
        <div className="container px-4 max-w-full">
          <div className="flex items-center gap-1 overflow-x-auto">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-neon-cyan text-neon-cyan'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-neon-cyan/50'
                }`
              }
            >
              <Target className="h-4 w-4" />
              <span>Goals</span>
            </NavLink>

            <NavLink
              to="/dashboard/voting"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-neon-cyan text-neon-cyan'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-neon-cyan/50'
                }`
              }
            >
              <CheckCircle className="h-4 w-4" />
              <span>Voting</span>
              {pendingCount > 0 && (
                <Badge className="bg-neon-pink text-white ml-1 px-2">
                  {pendingCount}
                </Badge>
              )}
            </NavLink>

            <NavLink
              to="/dashboard/community"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-neon-cyan text-neon-cyan'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-neon-cyan/50'
                }`
              }
            >
              <Users className="h-4 w-4" />
              <span>Community</span>
            </NavLink>

            <NavLink
              to="/dashboard/history"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-neon-cyan text-neon-cyan'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-neon-cyan/50'
                }`
              }
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </NavLink>

            <NavLink
              to="/dashboard/settings"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-neon-cyan text-neon-cyan'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-neon-cyan/50'
                }`
              }
            >
              <SettingsIcon className="h-4 w-4" />
              <span>Settings</span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-4 sm:py-6 px-4 max-w-full overflow-x-hidden mt-2">
        <Outlet />
      </main>
    </div>
  );
}
