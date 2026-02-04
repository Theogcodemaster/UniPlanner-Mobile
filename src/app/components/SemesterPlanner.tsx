import { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
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

// Mock course data
const mockCourses: Course[] = [
  // Fall 2023 (Completed)
  { id: 'c1', code: 'CPTR150', name: 'Introduction to Programming I', credits: 3, semester: 'Fall 2023', department: 'Computer Science', status: 'completed', grade: 'A' },
  { id: 'c2', code: 'MATH141', name: 'Calculus I', credits: 4, semester: 'Fall 2023', department: 'Mathematics', status: 'completed', grade: 'B+' },
  { id: 'c3', code: 'ENGL101', name: 'English Composition I', credits: 3, semester: 'Fall 2023', department: 'English', status: 'completed', grade: 'A-' },
  { id: 'c4', code: 'HIST101', name: 'World Civilization', credits: 3, semester: 'Fall 2023', department: 'History', status: 'completed', grade: 'B' },
  { id: 'c5', code: 'RELB101', name: 'Old Testament Survey', credits: 2, semester: 'Fall 2023', department: 'Religion', status: 'completed', grade: 'A' },
  
  // Spring 2024 (In Progress)
  { id: 'c6', code: 'CPTR210', name: 'Introduction to Programming II', credits: 3, semester: 'Spring 2024', prerequisites: ['CPTR150'], department: 'Computer Science', status: 'in-progress' },
  { id: 'c7', code: 'CPTR215', name: 'Computer Organization', credits: 3, semester: 'Spring 2024', hasLabFee: true, department: 'Computer Science', status: 'in-progress' },
  { id: 'c8', code: 'MATH142', name: 'Calculus II', credits: 4, semester: 'Spring 2024', prerequisites: ['MATH141'], department: 'Mathematics', status: 'in-progress' },
  { id: 'c9', code: 'ENGL102', name: 'English Composition II', credits: 3, semester: 'Spring 2024', prerequisites: ['ENGL101'], department: 'English', status: 'in-progress' },
  { id: 'c10', code: 'RELB102', name: 'New Testament Survey', credits: 2, semester: 'Spring 2024', department: 'Religion', status: 'in-progress' },
  
  // Fall 2024 (Planned)
  { id: 'c11', code: 'CPTR360', name: 'Data Structures', credits: 3, semester: 'Fall 2024', prerequisites: ['CPTR210'], department: 'Computer Science', status: 'planned' },
  { id: 'c12', code: 'CPTR280', name: 'Database Systems', credits: 3, semester: 'Fall 2024', prerequisites: ['CPTR210'], hasLabFee: true, department: 'Computer Science', status: 'planned' },
  { id: 'c13', code: 'MATH245', name: 'Discrete Mathematics', credits: 3, semester: 'Fall 2024', prerequisites: ['MATH141'], department: 'Mathematics', status: 'planned' },
  { id: 'c14', code: 'PHYS201', name: 'Physics for Scientists I', credits: 4, semester: 'Fall 2024', hasLabFee: true, department: 'Physics', status: 'planned' },
  { id: 'c15', code: 'COMM101', name: 'Public Speaking', credits: 3, semester: 'Fall 2024', department: 'Communications', status: 'planned' },
];

export function SemesterPlanner({ student }: SemesterPlannerProps) {
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

  const semesters = [
    'Fall 2023',
    'Spring 2024',
    'Fall 2024',
    'Spring 2025',
    'Fall 2025',
    'Spring 2026',
  ];

  const getCoursesBySemester = (semester: string) => {
    return courses.filter(c => c.semester === semester);
  };

  const getTotalCredits = (semester: string) => {
    return getCoursesBySemester(semester).reduce((sum, c) => sum + c.credits, 0);
  };

  const moveCourse = (courseId: string, toSemester: string) => {
    setCourses(prev => prev.map(c => 
      c.id === courseId ? { ...c, semester: toSemester } : c
    ));
  };

  // Check if moving a course would violate prerequisites
  const checkPrerequisites = (course: Course, targetSemester: string): { valid: boolean; message?: string } => {
    if (!course.prerequisites || course.prerequisites.length === 0) {
      return { valid: true };
    }

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

  // Check if semester credit load is valid
  const checkCreditLoad = (semester: string, additionalCredits: number = 0): { valid: boolean; warning?: string } => {
    const total = getTotalCredits(semester) + additionalCredits;
    
    if (total > 18) {
      return { 
        valid: false, 
        warning: `Credit overload detected (${total} credits). Students with GPA below 3.00 are restricted to 15-18 credits per semester.` 
      };
    }
    
    if (total > 15 && student.gpa < 3.0) {
      return { 
        valid: false, 
        warning: `Your GPA (${student.gpa.toFixed(2)}) requires advisor approval for ${total} credits. Maximum allowed is 15 credits.` 
      };
    }

    if (total < 12 && semester.includes('2024') || semester.includes('2025')) {
      return { 
        valid: true, 
        warning: `${total} credits is below full-time status (12 credits). This may affect financial aid and student status.` 
      };
    }

    return { valid: true };
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-gray-900">Degree Planner</h2>
            <p className="text-sm text-gray-600 mt-1">
              Drag and drop courses to plan your academic journey. The system will validate prerequisites and credit limits.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#00254d] transition-colors">
            <Plus className="w-5 h-5" />
            Add Course
          </button>
        </div>

        {/* GPA Warning */}
        {student.gpa < 3.0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-900">Academic Standing Notice</p>
              <p className="text-sm text-yellow-700 mt-1">
                Based on your current GPA ({student.gpa.toFixed(2)}), you are limited to 15 credits per semester. 
                Taking more requires written approval from your academic advisor.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Semester Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="h-full flex gap-4 p-6 min-w-max">
          {semesters.map((semester) => {
            const semesterCourses = getCoursesBySemester(semester);
            const totalCredits = getTotalCredits(semester);
            const creditCheck = checkCreditLoad(semester);

            return (
              <SemesterColumn
                key={semester}
                semester={semester}
                courses={semesterCourses}
                totalCredits={totalCredits}
                onMoveCourse={moveCourse}
                checkPrerequisites={checkPrerequisites}
                creditWarning={creditCheck.warning}
                allCourses={courses}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
