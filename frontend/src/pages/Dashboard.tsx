import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Lock, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

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

      {/* Main Content */}
      <main className="container py-4 sm:py-6 px-4 max-w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
