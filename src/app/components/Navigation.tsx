import { GraduationCap, Calendar, DollarSign, MessageSquare, FileText, Settings } from 'lucide-react';

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

  return (
    <header className="bg-[#003366] text-white shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="bg-[#FDB515] p-2 rounded-lg">
              <GraduationCap className="w-8 h-8 text-[#003366]" />
            </div>
            <div>
              <h1 className="text-xl text-white">UniPlanner</h1>
              <p className="text-sm text-white/80">University of the Southern Caribbean</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#FDB515] text-[#003366]'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button className="ml-4 p-2 rounded-lg text-white hover:bg-white/10 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
