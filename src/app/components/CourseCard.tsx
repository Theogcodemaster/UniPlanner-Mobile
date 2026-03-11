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
  let accentColor = 'bg-zinc-200';
  let statusIcon = <Info className="w-4 h-4 text-zinc-400" />;

  if (course.status === 'completed') {
    cardBg = 'bg-white border-emerald-100/50';
    accentColor = 'bg-emerald-500';
    statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  } else if (course.status === 'in-progress') {
    cardBg = 'bg-white border-primary/20 shadow-md ring-1 ring-primary/5';
    accentColor = 'bg-primary';
    statusIcon = <Clock className="w-4 h-4 text-primary" />;
  } else if (hasPrereqIssue) {
    cardBg = 'bg-red-50/30 border-red-200';
    accentColor = 'bg-red-500';
    statusIcon = <AlertTriangle className="w-4 h-4 text-red-500" />;
  }

  return (
    <div
      ref={drag}
      className={`relative group rounded-2xl p-4 border transition-all duration-400 cursor-grab active:cursor-grabbing hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 ${cardBg} ${
        isDragging ? 'opacity-40 scale-95 rotate-2' : 'opacity-100'
      }`}
    >
      {/* Dynamic Left Accent */}
      <div className={`absolute left-0 top-4 bottom-4 w-1.5 rounded-r-full ${accentColor} opacity-10 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">{course.code}</span>
                {statusIcon}
             </div>
             {course.grade && (
                <span className="text-[11px] font-black px-2 py-0.5 bg-zinc-100 text-zinc-900 rounded-lg border border-zinc-200 shadow-sm leading-none font-serif">
                  {course.grade}
                </span>
             )}
          </div>
          
          <h4 className="text-base font-bold text-zinc-800 leading-snug group-hover:text-primary transition-colors mb-4 font-serif">
            {course.name}
          </h4>

          <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <span className="bg-zinc-100/50 px-2.5 py-1 rounded-lg text-zinc-600 border border-zinc-200/50">{course.credits} Credits</span>
            {course.hasLabFee && (
              <span className="flex items-center gap-1.5 text-secondary bg-secondary/10 px-2 py-0.5 rounded-lg border border-secondary/20 font-black">
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
                className="mt-4 pt-4 border-t border-red-100/30"
              >
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                   <p className="text-[10px] font-black text-red-600 leading-tight uppercase tracking-widest">
                    Missing Prereq: <span className="text-red-900">{prereqCheck.missing.join(', ')}</span>
                   </p>
                </div>
              </motion.div>
            )}
           </AnimatePresence>
        </div>

        <div className="text-zinc-200 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-center">
           <GripVertical className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
