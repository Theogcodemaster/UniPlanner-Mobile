import { User, Award, BookOpen, Calendar, AlertCircle, CheckCircle, Pencil, GraduationCap, TrendingUp, ShieldCheck, PieChart as PieChartIcon } from 'lucide-react';
import { ComprehensiveStudentProfile, createStudentProfile } from '@/lib/student-context';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface StudentProfileProps {
  student: ComprehensiveStudentProfile;
}

export function StudentProfile({ student }: StudentProfileProps) {
  const progressPercentage = (student.completedCredits / student.totalCredits) * 100;
  
  const gpaColor = student.gpa >= 3.5 ? 'text-emerald-600' : student.gpa >= 3.0 ? 'text-blue-600' : 'text-amber-600';
  const gpaBg = student.gpa >= 3.5 ? 'bg-emerald-50' : student.gpa >= 3.0 ? 'bg-blue-50' : 'bg-amber-50';

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: student.name,
    student_id: student.student_id,
    major: student.major,
    minor: student.minor,
    gpa: student.gpa,
    expected_graduation_date: student.expected_graduation_date
  });

  const chartData = [
    { name: 'Completed', value: student.completedCredits, color: '#003366' },
    { name: 'Remaining', value: student.totalCredits - student.completedCredits, color: '#f1f5f9' },
  ];

  const handleSave = async () => {
    try {
      const result = await createStudentProfile({
        ...student,
        ...editForm,
        gpa: Number(editForm.gpa)
      });
      if (result.success) {
        toast.success("Profile updated!");
        setIsEditing(false);
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (e: any) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="p-8 space-y-10">
      {/* Profile Info */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative group">
           <div className="w-24 h-24 rounded-3xl bg-slate-900 flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-slate-900/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              {student.name.split(' ').map(n => n[0]).join('')}
           </div>
           <Dialog open={isEditing} onOpenChange={setIsEditing}>
             <DialogTrigger asChild>
                <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-slate-100 text-slate-400 hover:text-blue-600 hover:scale-110 transition-all">
                   <Pencil className="w-4 h-4" />
                </button>
             </DialogTrigger>
             <DialogContent>
                <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>GPA</Label>
                    <Input type="number" step="0.01" value={editForm.gpa} onChange={(e) => setEditForm({ ...editForm, gpa: parseFloat(e.target.value) })} />
                  </div>
                  <Button onClick={handleSave} className="w-full">Save Changes</Button>
                </div>
             </DialogContent>
           </Dialog>
        </div>
        <div>
           <h2 className="text-xl font-bold text-slate-900 tracking-tight">{student.name}</h2>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{student.student_id}</p>
        </div>
      </div>

      {/* GPA Card */}
      <div className={`rounded-3xl p-6 ${gpaBg} border border-black/5 relative overflow-hidden`}>
         <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
               <span className={`text-[10px] font-bold uppercase tracking-widest ${gpaColor} opacity-70`}>Academic GPA</span>
               <TrendingUp className={`w-4 h-4 ${gpaColor}`} />
            </div>
            <div className="flex items-baseline gap-2">
               <span className={`text-4xl font-black ${gpaColor}`}>{student.gpa.toFixed(2)}</span>
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/50 border border-black/5 ${gpaColor}`}>
                  {student.gpa >= 3.5 ? "Honor's List" : "In Good Standing"}
               </span>
            </div>
         </div>
         <div className="absolute top-0 right-0 p-4 opacity-5">
            <Award className="w-16 h-16" />
         </div>
      </div>

      {/* Progress Mini Chart */}
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Degree Completion</h3>
            <span className="text-xs font-bold text-slate-900">{progressPercentage.toFixed(0)}%</span>
         </div>
         <div className="h-32 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie
                     data={chartData}
                     innerRadius={35}
                     outerRadius={50}
                     startAngle={90}
                     endAngle={450}
                     dataKey="value"
                  >
                     {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                     ))}
                  </Pie>
               </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-lg font-black text-[#003366] leading-none">{student.completedCredits}</span>
               <span className="text-[8px] font-bold text-slate-400 uppercase">Credits</span>
            </div>
         </div>
         <p className="text-[10px] text-center text-slate-500 font-medium">
            {student.totalCredits - student.completedCredits} credits remaining for graduation
         </p>
      </div>

      {/* Details */}
      <div className="space-y-5 pt-4 border-t border-slate-100">
         <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
               <BookOpen className="w-5 h-5" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Major</p>
               <p className="text-sm font-bold text-slate-900 leading-snug mt-0.5">{student.major}</p>
            </div>
         </div>
         <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
               <GraduationCap className="w-5 h-5" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expected Graduation</p>
               <p className="text-sm font-bold text-slate-900 mt-0.5">{student.expected_graduation_date}</p>
            </div>
         </div>
      </div>

      {/* Notices */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
            <ShieldCheck className="w-12 h-12" />
         </div>
         <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Recent Notices</h4>
         <div className="space-y-3 relative z-10">
            <div className="flex gap-2">
               <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
               <p className="text-[11px] font-medium text-slate-300">Bulletin 2021-2025 verified.</p>
            </div>
            <div className="flex gap-2">
               <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
               <p className="text-[11px] font-medium text-slate-300">Fall Registration opens March 15.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
