import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import {
  Target,
  History,
  Settings,
  Lock,
  LogOut,
  Menu,
  X,
  Users,
  ThumbsUp
} from 'lucide-react';

export default function Dashboard() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: Target, label: 'Goals' },
    { path: '/dashboard/community', icon: Users, label: 'Community' },
    { path: '/dashboard/voting', icon: ThumbsUp, label: 'Voting' },
    { path: '/dashboard/history', icon: History, label: 'History' },
    { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
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
                &gt; LOCK_IN
              </div>
              <div className="text-neon-purple text-[10px] sm:text-xs truncate">
                // Protocol v1.0
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 text-sm font-medium font-mono transition-colors hover:text-neon-cyan ${
                  isActive(item.path) ? 'text-neon-cyan' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="border-2 border-neon-pink/30 hover:border-neon-pink hover:bg-neon-pink/10 transition-all h-9 w-9 sm:h-10 sm:w-10"
            >
              <LogOut className="h-4 w-4 text-neon-pink" />
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden border-2 border-neon-cyan/30 hover:border-neon-cyan hover:bg-neon-cyan/10 h-9 w-9 sm:h-10 sm:w-10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4 text-neon-cyan" /> : <Menu className="h-4 w-4 text-neon-cyan" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-2 border-neon-cyan/30">
            <nav className="container py-4 space-y-2 font-mono">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-neon-cyan/20 text-neon-cyan border-2 border-neon-cyan'
                      : 'text-muted-foreground hover:bg-neon-cyan/10 hover:text-neon-cyan border-2 border-transparent'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-2 text-sm font-medium text-neon-pink hover:bg-neon-pink/10 border-2 border-transparent hover:border-neon-pink"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container py-4 sm:py-6 px-4 max-w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
