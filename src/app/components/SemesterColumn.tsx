import { useDrop } from 'react-dnd';
import { CourseCard } from '@/app/components/CourseCard';
import { AlertCircle, Calendar } from 'lucide-react';

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

interface SemesterColumnProps {
  semester: string;
  courses: Course[];
  totalCredits: number;
  onMoveCourse: (courseId: string, toSemester: string) => void;
  checkPrerequisites: (course: Course, targetSemester: string) => { valid: boolean; message?: string };
  creditWarning?: string;
  allCourses: Course[];
}

export function SemesterColumn({
  semester,
  courses,
  totalCredits,
  onMoveCourse,
  checkPrerequisites,
  creditWarning,
  allCourses,
}: SemesterColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'course',
    drop: (item: { course: Course }) => {
      const prereqCheck = checkPrerequisites(item.course, semester);
      if (prereqCheck.valid) {
        onMoveCourse(item.course.id, semester);
      } else {
        alert(prereqCheck.message);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [semester, onMoveCourse, checkPrerequisites]);

  const getSemesterStatus = () => {
    if (semester.includes('2023')) return 'completed';
    if (semester.includes('Spring 2024')) return 'current';
    return 'future';
  };

  const status = getSemesterStatus();
  const isOverload = totalCredits > 18;
  const isUnderload = totalCredits > 0 && totalCredits < 12;

  // Modern Column Styling
  let columnBg = 'bg-slate-50/50';
  let headerColor = 'text-slate-600';
  let badgeStyle = 'bg-slate-200 text-slate-700';
  let borderColor = 'border-transparent';

  if (status === 'completed') {
    columnBg = 'bg-slate-50/80';
    badgeStyle = 'bg-emerald-100 text-emerald-700';
  } else if (status === 'current') {
    columnBg = 'bg-blue-50/30';
    headerColor = 'text-blue-900';
    badgeStyle = 'bg-blue-100 text-blue-700';
    borderColor = 'border-blue-200';
  }

  if (isOver && canDrop) {
    columnBg = 'bg-blue-50 border-2 border-dashed border-blue-300';
  }

  return (
    <div
      ref={drop}
      className={`w-80 flex-shrink-0 flex flex-col rounded-2xl transition-all duration-200 group ${columnBg} ${borderColor} ${status === 'current' ? 'border' : ''}`}
    >
      {/* Column Header */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold ${headerColor}`}>{semester}</h3>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${badgeStyle}`}>
            {status === 'completed' ? 'Done' : status === 'current' ? 'Current' : 'Planned'}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-slate-400">Credits</span>
          <span className={`${
            isOverload ? 'text-red-600' : isUnderload ? 'text-amber-600' : 'text-slate-700'
          }`}>
            {totalCredits} / 18
          </span>
        </div>

        {/* Progress Bar for Credits */}
        <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
           <div 
             className={`h-full rounded-full ${isOverload ? 'bg-red-500' : isUnderload ? 'bg-amber-400' : 'bg-emerald-500'}`} 
             style={{ width: `${Math.min((totalCredits / 18) * 100, 100)}%` }}
           />
        </div>

        {creditWarning && (
          <div className="mt-3 bg-amber-50/50 border border-amber-100 rounded-lg p-2 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-800 leading-tight">{creditWarning}</p>
          </div>
        )}
      </div>

      {/* Course List Area */}
      <div className="flex-1 px-3 pb-3 space-y-3 overflow-y-auto custom-scrollbar">
        {courses.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl m-2">
            <Calendar className="w-8 h-8 opacity-20 mb-2" />
            <span className="text-xs font-medium">No courses</span>
          </div>
        ) : (
          courses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              allCourses={allCourses}
              currentSemester={semester}
            />
          ))
        )}
      </div>
    </div>
  );
}
