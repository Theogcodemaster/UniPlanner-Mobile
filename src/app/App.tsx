import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Navigation } from '@/app/components/Navigation';
import { StudentProfile } from '@/app/components/StudentProfile';
import { SemesterPlanner } from '@/app/components/SemesterPlanner';
import { FinancialCalculator } from '@/app/components/FinancialCalculator';
import { AIAdvisor } from '@/app/components/AIAdvisor';
import { BulletinUpload } from '@/app/components/BulletinUpload';

// Mock student data
const mockStudent = {
  id: '2021-0345',
  name: 'Dwayne Headley',
  major: 'Computer Science',
  minor: 'Mathematics',
  gpa: 3.45,
  completedCredits: 45,
  totalCredits: 120,
  expectedGraduation: 'May 2025',
  advisorName: 'Dr. Sarah Thompson',
  currentSemester: 'Spring 2024',
};

export default function App() {
  const [activeView, setActiveView] = useState<'planner' | 'finances' | 'advisor' | 'bulletin'>('planner');

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <Navigation activeView={activeView} onViewChange={setActiveView} />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Student Profile */}
          <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <StudentProfile student={mockStudent} />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto">
            {activeView === 'planner' && <SemesterPlanner student={mockStudent} />}
            {activeView === 'finances' && <FinancialCalculator />}
            {activeView === 'advisor' && <AIAdvisor student={mockStudent} />}
            {activeView === 'bulletin' && <BulletinUpload />}
          </main>
        </div>
      </div>
    </DndProvider>
  );
}
