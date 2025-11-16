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
  const { principal, logout } = useAuthStore();
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
    <div className="min-h-screen bg-background pixel-grid">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-neon-cyan bg-background scanlines">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Lock className="h-6 w-6 text-neon-cyan" />
            <div className="font-mono">
              <div className="text-neon-cyan font-bold text-lg">
                &gt; LOCK_IN_RESPONSIBLE
              </div>
              <div className="text-neon-purple text-xs">
                // Accountability Protocol v1.0
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

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm font-mono">
              <span className="text-muted-foreground">USER:</span>
              <span className="font-medium text-xs text-neon-purple">{principal?.toString().slice(0, 10)}...</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hidden md:flex border-2 border-neon-pink/30 hover:border-neon-pink hover:bg-neon-pink/10 transition-all"
            >
              <LogOut className="h-4 w-4 text-neon-pink" />
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden border-2 border-neon-cyan/30 hover:border-neon-cyan hover:bg-neon-cyan/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-neon-cyan" /> : <Menu className="h-5 w-5 text-neon-cyan" />}
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
      <main className="container py-6 px-4">
        <Outlet />
      </main>
    </div>
  );
}
