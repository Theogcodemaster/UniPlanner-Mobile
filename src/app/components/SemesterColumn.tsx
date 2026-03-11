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
  let columnBg = 'bg-zinc-50/50';
  let headerColor = 'text-zinc-600';
  let badgeStyle = 'bg-zinc-200 text-zinc-700';
  let borderColor = 'border-transparent';

  if (status === 'completed') {
    columnBg = 'bg-zinc-50/80';
    badgeStyle = 'bg-emerald-100 text-emerald-800 font-bold';
  } else if (status === 'current') {
    columnBg = 'bg-primary/5';
    headerColor = 'text-primary';
    badgeStyle = 'bg-primary text-white font-bold';
    borderColor = 'border-primary/20';
  }

  if (isOver && canDrop) {
    columnBg = 'bg-primary/10 border-2 border-dashed border-primary/30';
  }

  return (
    <div
      ref={drop}
      className={`w-84 flex-shrink-0 flex flex-col rounded-3xl transition-all duration-300 group ${columnBg} ${borderColor} ${status === 'current' ? 'border-2 shadow-lg shadow-primary/5' : 'border border-zinc-200/50'}`}
    >
      {/* Column Header */}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-black tracking-tight font-serif ${headerColor}`}>{semester}</h3>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-widest ${badgeStyle}`}>
            {status === 'completed' ? 'Done' : status === 'current' ? 'Active' : 'Planned'}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
          <span className="text-zinc-400">Semester Load</span>
          <span className={`${
            isOverload ? 'text-red-600' : isUnderload ? 'text-secondary' : 'text-zinc-700'
          }`}>
            {totalCredits} <span className="text-zinc-400 font-medium">/ 18 Credits</span>
          </span>
        </div>

        {/* Progress Bar for Credits */}
        <div className="mt-3 h-2 w-full bg-zinc-200/50 rounded-full overflow-hidden p-0.5">
           <div 
             className={`h-full rounded-full transition-all duration-500 ${isOverload ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : isUnderload ? 'bg-secondary' : 'bg-primary shadow-[0_0_8px_rgba(0,102,51,0.3)]'}`} 
             style={{ width: `${Math.min((totalCredits / 18) * 100, 100)}%` }}
           />
        </div>

        {creditWarning && (
          <div className="mt-4 bg-amber-50/80 border border-amber-100 rounded-2xl p-3 flex items-start gap-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:8px_8px] opacity-[0.05] pointer-events-none"></div>
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-900 font-medium leading-tight relative z-10">{creditWarning}</p>
          </div>
        )}
      </div>

      {/* Course List Area */}
      <div className="flex-1 px-4 pb-4 space-y-4 overflow-y-auto custom-scrollbar">
        {courses.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-zinc-300 border-2 border-dashed border-zinc-200 rounded-3xl m-2 bg-white/50">
            <Calendar className="w-10 h-10 opacity-20 mb-3" />
            <span className="text-xs font-bold uppercase tracking-widest">No Courses Planned</span>
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
