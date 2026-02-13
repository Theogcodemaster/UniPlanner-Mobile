import { GraduationCap, Calendar, DollarSign, MessageSquare, FileText, Settings, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface NavigationProps {
  activeView: 'planner' | 'finances' | 'advisor' | 'bulletin';
  onViewChange: (view: 'planner' | 'finances' | 'advisor' | 'bulletin') => void;
}

export function Navigation({ activeView, onViewChange }: NavigationProps) {
  const navItems = [
    { id: 'planner' as const, label: 'Degree Planner', icon: Calendar },
    { id: 'finances' as const, label: 'Financial Calculator', icon: DollarSign },
    { id: 'advisor' as const, label: 'AI Advisor', icon: MessageSquare },
    { id: 'bulletin' as const, label: 'Bulletin Upload', icon: FileText },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      // Force reload to update app state to logged out
      window.location.reload();
    } catch (error) {
      console.error('Logout error', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <header className="bg-[#003366] text-white shadow-lg sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="bg-[#FDB515] p-2 rounded-lg">
              <GraduationCap className="w-8 h-8 text-[#003366]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">UniPlanner</h1>
              <p className="text-xs text-blue-200">University of the Southern Caribbean</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive
                        ? 'bg-[#FDB515] text-[#003366] font-medium shadow-md'
                        : 'text-white hover:bg-white/10 hover:text-[#FDB515]'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="h-8 w-px bg-blue-800 mx-2"></div>

            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg text-white hover:bg-white/10 hover:text-[#FDB515] transition-colors" title="Settings">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-white hover:bg-red-500/20 hover:text-red-300 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
