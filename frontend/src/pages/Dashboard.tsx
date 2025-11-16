import { Lock, LogOut } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../store/authStore";

export default function Dashboard() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="border-2 border-neon-pink/30 hover:border-neon-pink hover:bg-neon-pink/10 transition-all"
            >
              <LogOut className="h-4 w-4 text-neon-pink" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 px-4">
        <Outlet />
      </main>
    </div>
  );
}
