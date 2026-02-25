import { useDrag } from 'react-dnd';
import { GripVertical, AlertTriangle, CheckCircle2, Clock, Beaker, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

interface CourseCardProps {
  course: Course;
  allCourses: Course[];
  currentSemester: string;
}

export function CourseCard({ course, allCourses, currentSemester }: CourseCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'course',
    item: { course },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [course]);

  const checkPrerequisitesMet = () => {
    if (!course.prerequisites || course.prerequisites.length === 0) return { met: true, missing: [] };
    const semesters = ['Fall 2023', 'Spring 2024', 'Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026'];
    const currentIndex = semesters.indexOf(currentSemester);
    const missing: string[] = [];
    for (const prereqCode of course.prerequisites) {
      const prereqCourse = allCourses.find(c => c.code === prereqCode);
      if (!prereqCourse || semesters.indexOf(prereqCourse.semester) >= currentIndex) {
        missing.push(prereqCode);
      }
    }
    return { met: missing.length === 0, missing };
  };

  const prereqCheck = checkPrerequisitesMet();
  const hasPrereqIssue = !prereqCheck.met && course.status !== 'completed';

  let cardBg = 'bg-white';
  let accentColor = 'bg-slate-300';
  let statusIcon = <Info className="w-4 h-4 text-slate-400" />;

  if (course.status === 'completed') {
    cardBg = 'bg-white border-emerald-100';
    accentColor = 'bg-emerald-500';
    statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  } else if (course.status === 'in-progress') {
    cardBg = 'bg-white border-blue-200 shadow-md ring-1 ring-blue-50';
    accentColor = 'bg-blue-500';
    statusIcon = <Clock className="w-4 h-4 text-blue-500" />;
  } else if (hasPrereqIssue) {
    cardBg = 'bg-red-50/50 border-red-200';
    accentColor = 'bg-red-500';
    statusIcon = <AlertTriangle className="w-4 h-4 text-red-500" />;
  }

  return (
    <div
      ref={drag}
      className={`relative group rounded-2xl p-4 border transition-all duration-300 cursor-grab active:cursor-grabbing hover:shadow-xl hover:shadow-slate-200/50 ${cardBg} ${
        isDragging ? 'opacity-40 scale-95 rotate-2' : 'opacity-100'
      }`}
    >
      {/* Dynamic Left Accent */}
      <div className={`absolute left-0 top-4 bottom-4 w-1.5 rounded-r-full ${accentColor} opacity-20 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{course.code}</span>
                {statusIcon}
             </div>
             {course.grade && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200 shadow-sm leading-none">
                  {course.grade}
                </span>
             )}
          </div>
          
          <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-[#003366] transition-colors mb-3">
            {course.name}
          </h4>

          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 border border-slate-200/50">{course.credits} Credits</span>
            {course.hasLabFee && (
              <span className="flex items-center gap-1.5 text-amber-600">
                <Beaker className="w-3 h-3" /> Lab Fee
              </span>
            )}
          </div>

           <AnimatePresence>
             {hasPrereqIssue && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-red-100/50"
              >
                <p className="text-[10px] font-bold text-red-600 leading-tight uppercase tracking-wider">
                  Missing Prereq: <span className="text-red-900">{prereqCheck.missing.join(', ')}</span>
                </p>
              </motion.div>
            )}
           </AnimatePresence>
        </div>

        <div className="text-slate-200 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-center">
           <GripVertical className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
