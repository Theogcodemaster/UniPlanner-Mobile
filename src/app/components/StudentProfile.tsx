import { User, Award, BookOpen, Calendar, AlertCircle, CheckCircle, Pencil } from 'lucide-react';
import { ComprehensiveStudentProfile, createStudentProfile } from '@/lib/student-context';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';

interface StudentProfileProps {
  student: ComprehensiveStudentProfile;
}

export function StudentProfile({ student }: StudentProfileProps) {
  const progressPercentage = (student.completedCredits / student.totalCredits) * 100;
  const gpaColor = student.gpa >= 3.5 ? 'text-green-600' : student.gpa >= 3.0 ? 'text-yellow-600' : 'text-orange-600';

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: student.name,
    student_id: student.student_id,
    major: student.major,
    minor: student.minor,
    gpa: student.gpa,
    expected_graduation_date: student.expected_graduation_date
  });

  const handleSave = async () => {
    try {
      const result = await createStudentProfile({
        id: student.id,
        student_id: editForm.student_id,
        name: editForm.name,
        major: editForm.major,
        minor: editForm.minor,
        student_type: student.student_type,
        program_name: editForm.major,
        housing_type: student.housing_type,
        meal_plan: student.meal_plan,
        dorm_room_type: student.dorm_room_type,
        expected_graduation_date: editForm.expected_graduation_date,
        gpa: Number(editForm.gpa)
      });

      if (result.success) {
        toast.success("Profile updated! Refreshing...");
        setIsEditing(false);
        // Brief delay so user can see the toast and console logs are preserved
        setTimeout(() => window.location.reload(), 2000);
      } else {
        const errMsg = result.error?.message || JSON.stringify(result.error);
        toast.error(`Failed to update profile: ${errMsg}`);
        console.error('Profile update failed:', result.error);
      }
    } catch (e: any) {
      toast.error(`Failed to update profile: ${e?.message || e}`);
      console.error('Unexpected error:', e);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Student Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-[#003366] flex items-center justify-center text-white text-2xl">
          {student.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl text-gray-900">{student.name}</h2>
              <p className="text-sm text-gray-600">ID: {student.student_id}</p>
              <p className="text-sm text-gray-600">{student.currentSemester}</p>
            </div>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setEditForm({
                  name: student.name,
                  student_id: student.student_id,
                  major: student.major,
                  minor: student.minor,
                  gpa: student.gpa,
                  expected_graduation_date: student.expected_graduation_date
                })}>
                  <Pencil className="h-4 w-4 text-gray-500" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>Update your academic information below.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="student_id">Student ID</Label>
                    <Input id="student_id" value={editForm.student_id} onChange={(e) => setEditForm({ ...editForm, student_id: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="major">Major</Label>
                    <Input id="major" value={editForm.major} onChange={(e) => setEditForm({ ...editForm, major: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="minor">Minor</Label>
                    <Input id="minor" value={editForm.minor} onChange={(e) => setEditForm({ ...editForm, minor: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gpa">GPA</Label>
                    <Input id="gpa" type="number" step="0.01" value={editForm.gpa} onChange={(e) => setEditForm({ ...editForm, gpa: parseFloat(e.target.value) })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="grad_date">Expected Graduation</Label>
                    <Input id="grad_date" type="month" value={editForm.expected_graduation_date} onChange={(e) => setEditForm({ ...editForm, expected_graduation_date: e.target.value })} />
                  </div>
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
            <p className="text-gray-900">{student.expected_graduation_date}</p>
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
