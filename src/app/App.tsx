import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Navigation } from '@/app/components/Navigation';
import { StudentProfile } from '@/app/components/StudentProfile';
import { SemesterPlanner } from '@/app/components/SemesterPlanner';
import { FinancialCalculator } from '@/app/components/FinancialCalculator';
import { AIAdvisor } from '@/app/components/AIAdvisor';
import { BulletinUpload } from '@/app/components/BulletinUpload';
import { Login } from '@/app/components/Login';
import { Onboarding } from '@/app/components/Onboarding';
import { fetchUserProfile, ComprehensiveStudentProfile } from '@/lib/student-context';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { toast, Toaster } from 'sonner';

// Default Fallback (if offline or DB empty) - Keep it for type safety or initial state
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
  expected_graduation_date: 'May 2025'
};

export default function App() {
  const [activeView, setActiveView] = useState<'planner' | 'finances' | 'advisor' | 'bulletin'>('planner');
  const [student, setStudent] = useState<ComprehensiveStudentProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email && !session.user.email.endsWith('@stu.usc.edu.tt')) {
        await supabase.auth.signOut();
        toast.error('Only @stu.usc.edu.tt emails are allowed.');
        setSession(null);
        setLoading(false);
        return;
      }

      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email && !session.user.email.endsWith('@stu.usc.edu.tt')) {
        await supabase.auth.signOut();
        toast.error('Only @stu.usc.edu.tt emails are allowed.');
        setSession(null);
        setStudent(null);
        setLoading(false);
        return;
      }

      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      } else {
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
      // User logged in but no profile -> Onboarding
      setStudent(null);
      setShowOnboarding(true);
    }
    setLoading(false);
  }

  const handleOnboardingComplete = async () => {
    // Re-fetch the profile instead of reloading the entire page
    if (session) {
      await loadProfile(session.user.id);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <Login />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <Navigation activeView={activeView} onViewChange={setActiveView} />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Student Profile */}
          <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            {/* Cast to any if StudentProfile component expects older interface, or update StudentProfile later */}
            <StudentProfile student={student || defaultStudent} />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto">
            {activeView === 'planner' && <SemesterPlanner student={student || defaultStudent} />}
            {activeView === 'finances' && <FinancialCalculator />}
            {activeView === 'advisor' && <AIAdvisor student={student || defaultStudent} />}
            {activeView === 'bulletin' && <BulletinUpload />}
          </main>
        </div>
      </div>
      <Toaster />
    </DndProvider>
  );
}
