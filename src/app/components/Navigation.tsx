import { GraduationCap, Calendar, DollarSign, MessageSquare, FileText, Settings, LogOut, Menu, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface NavigationProps {
  activeView: 'planner' | 'finances' | 'advisor' | 'bulletin';
  onViewChange: (view: 'planner' | 'finances' | 'advisor' | 'bulletin') => void;
}

export function Navigation({ activeView, onViewChange }: NavigationProps) {
  const navItems = [
    { id: 'planner' as const, label: 'Map', icon: Calendar },
    { id: 'finances' as const, label: 'Bursar', icon: DollarSign },
    { id: 'advisor' as const, label: 'Advisor', icon: MessageSquare },
    { id: 'bulletin' as const, label: 'Data', icon: FileText },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Session Closed');
      window.location.reload();
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/60 backdrop-blur-xl border-b border-slate-200/50 select-none">
        <div className="mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center shadow-lg shadow-secondary/20 rotate-3 group cursor-pointer hover:rotate-0 transition-transform squishy-button">
               <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div className="hidden sm:block">
               <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none font-serif">UniPlanner</h1>
               <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] border border-primary/20 px-1 rounded">V2.0 PRO</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Southern Caribbean</span>
               </div>
            </div>
          </div>

          {/* Desktop Nav - Pill Style */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-100/50 p-1.5 rounded-2xl border border-zinc-200/50">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-500 squishy-button ${
                    isActive
                      ? 'bg-white text-primary shadow-sm shadow-zinc-200'
                      : 'text-zinc-500 hover:text-primary hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div 
                       layoutId="nav-active" 
                       className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" 
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
             <button className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-all relative squishy-button">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-secondary rounded-full ring-2 ring-white"></span>
             </button>
             <div className="h-6 w-px bg-zinc-200 mx-1 hidden sm:block"></div>
             <button 
               onClick={handleLogout}
               className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all squishy-button"
             >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Sign Out</span>
             </button>
             <button className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/10 squishy-button">
                <Menu className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-18 bg-white/80 backdrop-blur-2xl border border-slate-200/50 rounded-3xl shadow-2xl shadow-slate-900/10 z-[60] flex items-center justify-around px-4">
         {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
               <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 transition-all ${isActive ? 'text-blue-600 scale-110' : 'text-slate-400'}`}
               >
                  <Icon className="w-6 h-6" />
                  <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
               </button>
            );
         })}
      </nav>
    </>
  );
}
