import { useDrag } from 'react-dnd';
import { GripVertical, AlertTriangle, CheckCircle, Clock, Beaker } from 'lucide-react';

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

  // Check if prerequisites are met
  const checkPrerequisitesMet = () => {
    if (!course.prerequisites || course.prerequisites.length === 0) {
      return { met: true, missing: [] };
    }

    const semesters = ['Fall 2023', 'Spring 2024', 'Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026'];
    const currentIndex = semesters.indexOf(currentSemester);

    const missing: string[] = [];
    for (const prereqCode of course.prerequisites) {
      const prereqCourse = allCourses.find(c => c.code === prereqCode);
      if (!prereqCourse) {
        missing.push(prereqCode);
        continue;
      }

      const prereqIndex = semesters.indexOf(prereqCourse.semester);
      if (prereqIndex >= currentIndex) {
        missing.push(prereqCode);
      }
    }

    return { met: missing.length === 0, missing };
  };

  const prereqCheck = checkPrerequisitesMet();
  const hasPrereqIssue = !prereqCheck.met && course.status !== 'completed';

  let cardBg = 'bg-white';
  let borderColor = 'border-gray-200';
  let statusIcon = null;

  if (course.status === 'completed') {
    cardBg = 'bg-green-50';
    borderColor = 'border-green-200';
    statusIcon = <CheckCircle className="w-4 h-4 text-green-600" />;
  } else if (course.status === 'in-progress') {
    cardBg = 'bg-blue-50';
    borderColor = 'border-blue-200';
    statusIcon = <Clock className="w-4 h-4 text-blue-600" />;
  } else if (hasPrereqIssue) {
    cardBg = 'bg-red-50';
    borderColor = 'border-red-300';
    statusIcon = <AlertTriangle className="w-4 h-4 text-red-600" />;
  }

  return (
    <div
      ref={drag}
      className={`${cardBg} border ${borderColor} rounded-lg p-3 cursor-move transition-all hover:shadow-md ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {/* Course Code and Status */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900">{course.code}</span>
              {statusIcon}
            </div>
            {course.grade && (
              <span className="text-xs px-2 py-0.5 bg-white rounded border border-gray-200">
                {course.grade}
              </span>
            )}
          </div>

          {/* Course Name */}
          <p className="text-sm text-gray-700 mb-2 line-clamp-2">{course.name}</p>

          {/* Course Details */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-3">
              <span>{course.credits} credits</span>
              {course.hasLabFee && (
                <span className="flex items-center gap-1 text-orange-600">
                  <Beaker className="w-3 h-3" />
                  Lab Fee
                </span>
              )}
            </div>
          </div>

          {/* Prerequisites Warning */}
          {hasPrereqIssue && (
            <div className="mt-2 pt-2 border-t border-red-200">
              <div className="flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-red-700">
                  <p>Missing: {prereqCheck.missing.join(', ')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Prerequisites Info (for planned courses) */}
          {course.prerequisites && course.prerequisites.length > 0 && !hasPrereqIssue && course.status === 'planned' && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Prereq: {course.prerequisites.join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}