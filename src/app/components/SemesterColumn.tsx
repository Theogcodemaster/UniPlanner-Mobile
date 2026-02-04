import { useDrop } from 'react-dnd';
import { CourseCard } from '@/app/components/CourseCard';
import { AlertCircle } from 'lucide-react';

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

  let borderColor = 'border-gray-300';
  let bgColor = 'bg-white';
  let headerBg = 'bg-gray-50';

  if (status === 'completed') {
    borderColor = 'border-green-300';
    headerBg = 'bg-green-50';
  } else if (status === 'current') {
    borderColor = 'border-blue-300';
    headerBg = 'bg-blue-50';
  }

  if (isOver && canDrop) {
    borderColor = 'border-[#FDB515] border-2';
    bgColor = 'bg-yellow-50';
  }

  return (
    <div
      ref={drop}
      className={`w-80 flex-shrink-0 rounded-lg border-2 ${borderColor} ${bgColor} flex flex-col transition-all duration-200`}
    >
      {/* Header */}
      <div className={`${headerBg} px-4 py-3 rounded-t-lg border-b border-gray-200`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-900">{semester}</h3>
          <span className={`px-2 py-1 rounded text-xs ${
            status === 'completed' ? 'bg-green-100 text-green-700' :
            status === 'current' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {status === 'completed' ? 'Completed' : status === 'current' ? 'In Progress' : 'Planned'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Credits:</span>
          <span className={`${
            isOverload ? 'text-red-600' : isUnderload ? 'text-yellow-600' : 'text-gray-900'
          }`}>
            {totalCredits} credits
          </span>
        </div>
      </div>

      {/* Warnings */}
      {creditWarning && (
        <div className="mx-4 mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-800">{creditWarning}</p>
        </div>
      )}

      {/* Course List */}
      <div className="flex-1 p-4 space-y-3 min-h-[400px]">
        {courses.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Drop courses here
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

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 rounded-b-lg border-t border-gray-200 text-xs text-gray-600">
        {courses.length} {courses.length === 1 ? 'course' : 'courses'}
      </div>
    </div>
  );
}
