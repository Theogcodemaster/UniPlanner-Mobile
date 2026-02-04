import { User, Award, BookOpen, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  major: string;
  minor: string;
  gpa: number;
  completedCredits: number;
  totalCredits: number;
  expectedGraduation: string;
  advisorName: string;
  currentSemester: string;
}

interface StudentProfileProps {
  student: Student;
}

export function StudentProfile({ student }: StudentProfileProps) {
  const progressPercentage = (student.completedCredits / student.totalCredits) * 100;
  const gpaColor = student.gpa >= 3.5 ? 'text-green-600' : student.gpa >= 3.0 ? 'text-yellow-600' : 'text-orange-600';

  return (
    <div className="p-6 space-y-6">
      {/* Student Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-[#003366] flex items-center justify-center text-white text-2xl">
          {student.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1">
          <h2 className="text-xl text-gray-900">{student.name}</h2>
          <p className="text-sm text-gray-600">ID: {student.id}</p>
          <p className="text-sm text-gray-600">{student.currentSemester}</p>
        </div>
      </div>

      {/* Academic Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <BookOpen className="w-5 h-5 text-[#003366]" />
          <div>
            <p className="text-gray-600">Major</p>
            <p className="text-gray-900">{student.major}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Award className="w-5 h-5 text-[#003366]" />
          <div>
            <p className="text-gray-600">Minor</p>
            <p className="text-gray-900">{student.minor}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <User className="w-5 h-5 text-[#003366]" />
          <div>
            <p className="text-gray-600">Academic Advisor</p>
            <p className="text-gray-900">{student.advisorName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="w-5 h-5 text-[#003366]" />
          <div>
            <p className="text-gray-600">Expected Graduation</p>
            <p className="text-gray-900">{student.expectedGraduation}</p>
          </div>
        </div>
      </div>

      {/* GPA Card */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Current GPA</span>
          <Award className={`w-5 h-5 ${gpaColor}`} />
        </div>
        <div className={`text-3xl ${gpaColor}`}>
          {student.gpa.toFixed(2)}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {student.gpa >= 3.5 ? 'Dean\'s List Status' : student.gpa >= 3.0 ? 'Good Standing' : 'Academic Warning'}
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Degree Progress</span>
          <span className="text-gray-900">{student.completedCredits} / {student.totalCredits} credits</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-[#003366] h-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">{progressPercentage.toFixed(0)}% Complete</p>
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        <h3 className="text-sm text-gray-900">Important Notices</h3>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
          <div className="text-xs">
            <p className="text-green-900">Bulletin Verified</p>
            <p className="text-green-700">CS Bulletin 2021-2025 active</p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div className="text-xs">
            <p className="text-yellow-900">Registration Opens</p>
            <p className="text-yellow-700">Fall 2024: March 15, 2024</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-blue-600">Current Semester</p>
          <p className="text-lg text-blue-900">15 Credits</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <p className="text-xs text-purple-600">Remaining</p>
          <p className="text-lg text-purple-900">75 Credits</p>
        </div>
      </div>
    </div>
  );
}
