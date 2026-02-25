import { useState } from 'react';
import { Plus, AlertTriangle, BookOpen, Info, Target, Sparkles, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SemesterColumn } from '@/app/components/SemesterColumn';

interface Student {
  id: string;
  name: string;
  major: string;
  gpa: number;
}

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: string;
  prerequisites?: string[];
  corequisites?: string[];
  hasLabFee?: boolean;
  department: string;
  status: 'completed' | 'in-progress' | 'planned' | 'available';
  grade?: string;
}

interface SemesterPlannerProps {
  student: Student;
}

const mockCourses: Course[] = [
  { id: 'c1', code: 'CPTR150', name: 'Introduction to Programming I', credits: 3, semester: 'Fall 2023', department: 'Computer Science', status: 'completed', grade: 'A' },
  { id: 'c2', code: 'MATH141', name: 'Calculus I', credits: 4, semester: 'Fall 2023', department: 'Mathematics', status: 'completed', grade: 'B+' },
  { id: 'c3', code: 'ENGL101', name: 'English Composition I', credits: 3, semester: 'Fall 2023', department: 'English', status: 'completed', grade: 'A-' },
  { id: 'c4', code: 'HIST101', name: 'World Civilization', credits: 3, semester: 'Fall 2023', department: 'History', status: 'completed', grade: 'B' },
  { id: 'c5', code: 'RELB101', name: 'Old Testament Survey', credits: 2, semester: 'Fall 2023', department: 'Religion', status: 'completed', grade: 'A' },
  { id: 'c6', code: 'CPTR210', name: 'Introduction to Programming II', credits: 3, semester: 'Spring 2024', prerequisites: ['CPTR150'], department: 'Computer Science', status: 'in-progress' },
  { id: 'c7', code: 'CPTR215', name: 'Computer Organization', credits: 3, semester: 'Spring 2024', hasLabFee: true, department: 'Computer Science', status: 'in-progress' },
  { id: 'c8', code: 'MATH142', name: 'Calculus II', credits: 4, semester: 'Spring 2024', prerequisites: ['MATH141'], department: 'Mathematics', status: 'in-progress' },
  { id: 'c9', code: 'ENGL102', name: 'English Composition II', credits: 3, semester: 'Spring 2024', prerequisites: ['ENGL101'], department: 'English', status: 'in-progress' },
  { id: 'c10', code: 'RELB102', name: 'New Testament Survey', credits: 2, semester: 'Spring 2024', department: 'Religion', status: 'in-progress' },
  { id: 'c11', code: 'CPTR360', name: 'Data Structures', credits: 3, semester: 'Fall 2024', prerequisites: ['CPTR210'], department: 'Computer Science', status: 'planned' },
  { id: 'c12', code: 'CPTR280', name: 'Database Systems', credits: 3, semester: 'Fall 2024', prerequisites: ['CPTR210'], hasLabFee: true, department: 'Computer Science', status: 'planned' },
  { id: 'c13', code: 'MATH245', name: 'Discrete Mathematics', credits: 3, semester: 'Fall 2024', prerequisites: ['MATH141'], department: 'Mathematics', status: 'planned' },
  { id: 'c14', code: 'PHYS201', name: 'Physics for Scientists I', credits: 4, semester: 'Fall 2024', hasLabFee: true, department: 'Physics', status: 'planned' },
  { id: 'c15', code: 'COMM101', name: 'Public Speaking', credits: 3, semester: 'Fall 2024', department: 'Communications', status: 'planned' },
];

export function SemesterPlanner({ student }: SemesterPlannerProps) {
  const [courses, setCourses] = useState<Course[]>(mockCourses);

  const semesters = [
    'Fall 2023',
    'Spring 2024',
    'Fall 2024',
    'Spring 2025',
    'Fall 2025',
    'Spring 2026',
  ];

  const getCoursesBySemester = (semester: string) => courses.filter(c => c.semester === semester);
  const getTotalCredits = (semester: string) => getCoursesBySemester(semester).reduce((sum, c) => sum + c.credits, 0);

  const moveCourse = (courseId: string, toSemester: string) => {
    setCourses(prev => prev.map(c => 
      c.id === courseId ? { ...c, semester: toSemester } : c
    ));
  };

  const checkPrerequisites = (course: Course, targetSemester: string): { valid: boolean; message?: string } => {
    if (!course.prerequisites || course.prerequisites.length === 0) return { valid: true };
    const targetIndex = semesters.indexOf(targetSemester);
    const prereqCourses = courses.filter(c => course.prerequisites?.includes(c.code));
    
    for (const prereq of prereqCourses) {
      const prereqIndex = semesters.indexOf(prereq.semester);
      if (prereqIndex >= targetIndex) {
        return { 
          valid: false, 
          message: `${course.code} requires ${prereq.code} as a prerequisite. ${prereq.code} must be taken in an earlier semester.` 
        };
      }
    }
    return { valid: true };
  };

  const checkCreditLoad = (semester: string, additionalCredits: number = 0): { valid: boolean; warning?: string } => {
    const total = getTotalCredits(semester) + additionalCredits;
    if (total > 18) return { valid: false, warning: `Overload: ${total} credits. Max 18.` };
    if (total > 15 && student.gpa < 3.0) return { valid: false, warning: `GPA Warning: Max 15 credits.` };
    return { valid: true };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Dynamic Header */}
      <div className="p-8 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#003366]">
                  <LayoutDashboard className="w-5 h-5" />
               </div>
               <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Map</h2>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Plan your degree with intelligent prerequisite mapping and automated credit auditing.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Curriculum</span>
                <span className="text-xs font-bold text-slate-900">CS Bulletin 2021-2025</span>
             </div>
             <button className="flex items-center gap-2 px-6 py-3 bg-[#003366] text-white rounded-2xl shadow-xl shadow-blue-900/10 hover:bg-[#00254d] hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-sm">
               <Plus className="w-4 h-4" />
               Add Course
             </button>
          </div>
        </div>

        {/* Dynamic Alerts */}
        <AnimatePresence>
          {student.gpa < 3.0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="bg-amber-50 border border-amber-100 rounded-3xl p-5 flex items-start gap-4 overflow-hidden"
            >
              <div className="p-3 bg-amber-100/50 rounded-2xl shrink-0">
                 <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900 leading-none">Credit Restriction Active</p>
                <p className="text-xs text-amber-700 mt-2 font-medium leading-relaxed">
                  Due to your academic standing ({student.gpa.toFixed(2)}), you are limited to 15 credits per semester. Overloads require Dean's approval.
                </p>
              </div>
              <button className="ml-auto text-amber-900/40 hover:text-amber-900">
                 <Info className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Columns Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-8">
        <div className="h-full flex gap-8 min-w-max">
          {semesters.map((semester, index) => {
            const semesterCourses = getCoursesBySemester(semester);
            const totalCredits = getTotalCredits(semester);
            const creditCheck = checkCreditLoad(semester);

            return (
              <motion.div
                key={semester}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="h-full"
              >
                <SemesterColumn
                  semester={semester}
                  courses={semesterCourses}
                  totalCredits={totalCredits}
                  onMoveCourse={moveCourse}
                  checkPrerequisites={checkPrerequisites}
                  creditWarning={creditCheck.warning}
                  allCourses={courses}
                />
              </motion.div>
            );
          })}
          
          {/* Add Semester Placeholder */}
          <div className="w-80 flex-shrink-0 flex flex-col justify-center items-center border-2 border-dashed border-slate-200 rounded-3xl group hover:border-blue-400 hover:bg-slate-50 transition-all cursor-pointer">
             <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Plus className="w-6 h-6" />
             </div>
             <span className="text-sm font-bold text-slate-400 group-hover:text-blue-600">New Semester</span>
          </div>
        </div>
      </div>
    </div>
  );
}
