import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation } from '@/app/components/Navigation';
import { StudentProfile } from '@/app/components/StudentProfile';
import { SemesterPlanner } from '@/app/components/SemesterPlanner';
import { FinancialCalculator } from '@/app/components/FinancialCalculator';
import { AIAdvisor } from '@/app/components/AIAdvisor';
import { BulletinUpload } from '@/app/components/BulletinUpload';
import { Login } from '@/app/components/Login';
import { Onboarding } from '@/app/components/Onboarding';
import { Skeleton } from '@/app/components/ui/skeleton';
import { fetchUserProfile, ComprehensiveStudentProfile } from '@/lib/student-context';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { toast, Toaster } from 'sonner';

// Default Fallback
const defaultStudent: ComprehensiveStudentProfile = {
  id: 'mock-id',
  student_id: '2021-0345',
  name: 'Dwayne Headley',
  major: 'Computer Science',
  minor: 'Mathematics',
  gpa: 3.45,
  housing_type: 'dorm',
  meal_plan: 'three_meal',
  dorm_room_type: 'single',
  program_name: 'BSc Computing',
  expected_graduation_date: 'May 2025',
  completedCredits: 45,
  totalCredits: 120,
  currentSemester: 'Year 3, Semester 1',
  advisorName: 'Dr. John Doe'
};

function AppLoading() {
  return (
    <div className="h-screen flex flex-col bg-slate-50 p-6 gap-6">
      <Skeleton className="h-16 w-full rounded-2xl" />
      <div className="flex-1 flex gap-6 max-w-[1600px] mx-auto w-full">
        <Skeleton className="hidden lg:block w-80 h-full rounded-2xl" />
        <Skeleton className="flex-1 h-full rounded-2xl" />
      </div>
    </div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState<'planner' | 'finances' | 'advisor' | 'bulletin'>('planner');
  const [student, setStudent] = useState<ComprehensiveStudentProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email && !session.user.email.endsWith('@stu.usc.edu.tt')) {
        await supabase.auth.signOut();
        toast.error('Only @stu.usc.edu.tt emails are allowed.');
        setSession(null);
        setLoading(false);
        return;
      }
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email && !session.user.email.endsWith('@stu.usc.edu.tt')) {
        await supabase.auth.signOut();
        toast.error('Only @stu.usc.edu.tt emails are allowed.');
        setSession(null);
        setStudent(null);
        setLoading(false);
        return;
      }
      setSession(session);
      if (session) loadProfile(session.user.id);
      else {
        setStudent(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    setLoading(true);
    const profile = await fetchUserProfile(userId);
    if (profile) {
      setStudent(profile);
      setShowOnboarding(false);
    } else {
      setStudent(null);
      setShowOnboarding(true);
    }
    // Artificial delay for premium feel of loading
    setTimeout(() => setLoading(false), 800);
  }

  const handleOnboardingComplete = async () => {
    if (session) await loadProfile(session.user.id);
  };

  if (loading) return <AppLoading />;
  if (!session) return <Login />;
  if (showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-slate-50/50 selection:bg-blue-100 selection:text-blue-900">
        <Navigation activeView={activeView} onViewChange={setActiveView} />

        <div className="flex-1 flex overflow-hidden p-4 md:p-6 gap-6 max-w-[1600px] mx-auto w-full">
          {/* Sidebar */}
          <motion.aside 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="hidden lg:block w-80 flex-shrink-0"
          >
            <div className="h-full overflow-y-auto rounded-2xl bg-white border border-slate-200/60 shadow-sm shadow-slate-200/50">
              <StudentProfile student={student || defaultStudent} />
            </div>
          </motion.aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-hidden flex flex-col rounded-2xl bg-white border border-slate-200/60 shadow-sm shadow-slate-200/50 relative">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="relative z-10 h-full overflow-y-auto custom-scrollbar"
              >
                {activeView === 'planner' && <SemesterPlanner student={student || defaultStudent} />}
                {activeView === 'finances' && <FinancialCalculator />}
                {activeView === 'advisor' && <AIAdvisor student={student || defaultStudent} />}
                {activeView === 'bulletin' && <BulletinUpload />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <Toaster position="bottom-right" richColors closeButton />
    </DndProvider>
  );
}
