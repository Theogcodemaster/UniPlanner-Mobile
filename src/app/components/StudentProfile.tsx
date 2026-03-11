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
  
  const gpaColor = student.gpa >= 3.5 ? 'text-emerald-600' : student.gpa >= 3.0 ? 'text-primary' : 'text-amber-600';
  const gpaBg = student.gpa >= 3.5 ? 'bg-emerald-50' : student.gpa >= 3.0 ? 'bg-primary/5' : 'bg-amber-50';

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
    { name: 'Completed', value: student.completedCredits, color: '#006633' },
    { name: 'Remaining', value: student.totalCredits - student.completedCredits, color: '#F4F4F5' },
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
    <div className="p-8 space-y-12">
      {/* Profile Info */}
      <div className="flex flex-col items-center text-center space-y-5">
        <div className="relative group">
           <div className="w-28 h-28 rounded-[2rem] bg-primary flex items-center justify-center text-white text-4xl font-bold shadow-2xl shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform duration-700 squishy-button font-serif">
              {student.name.split(' ').map(n => n[0]).join('')}
           </div>
           <Dialog open={isEditing} onOpenChange={setIsEditing}>
             <DialogTrigger asChild>
                <button className="absolute -bottom-2 -right-2 p-2.5 bg-white rounded-2xl shadow-xl border border-zinc-100 text-zinc-400 hover:text-primary hover:scale-110 transition-all squishy-button">
                   <Pencil className="w-4 h-4" />
                </button>
             </DialogTrigger>
             <DialogContent className="rounded-3xl">
                <DialogHeader><DialogTitle className="font-serif text-2xl">Edit Profile</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Full Name</Label>
                    <Input className="rounded-xl border-zinc-200" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">GPA</Label>
                    <Input className="rounded-xl border-zinc-200" type="number" step="0.01" value={editForm.gpa} onChange={(e) => setEditForm({ ...editForm, gpa: parseFloat(e.target.value) })} />
                  </div>
                  <Button onClick={handleSave} className="w-full rounded-xl bg-primary hover:bg-primary/90 squishy-button">Save Changes</Button>
                </div>
             </DialogContent>
           </Dialog>
        </div>
        <div>
           <h2 className="text-2xl font-black text-zinc-900 tracking-tight font-serif">{student.name}</h2>
           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-2">{student.student_id}</p>
        </div>
      </div>

      {/* GPA Card */}
      <div className={`rounded-[2rem] p-7 ${gpaBg} border border-black/5 relative overflow-hidden group hover:shadow-xl transition-all duration-500`}>
         <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.03] pointer-events-none"></div>
         <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
               <span className={`text-[10px] font-black uppercase tracking-widest ${gpaColor} opacity-70`}>Academic GPA</span>
               <TrendingUp className={`w-4 h-4 ${gpaColor}`} />
            </div>
            <div className="flex items-baseline gap-3">
               <span className={`text-5xl font-black ${gpaColor} font-serif`}>{student.gpa.toFixed(2)}</span>
               <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg bg-white/60 border border-black/5 ${gpaColor} uppercase tracking-widest`}>
                  {student.gpa >= 3.5 ? "Honor's List" : "Good Standing"}
               </span>
            </div>
         </div>
         <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
            <Award className="w-24 h-24" />
         </div>
      </div>

      {/* Progress Mini Chart */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Degree Progress</h3>
            <span className="text-xs font-black text-zinc-900 font-serif text-lg">{progressPercentage.toFixed(0)}%</span>
         </div>
         <div className="h-40 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie
                     data={chartData}
                     innerRadius={45}
                     outerRadius={65}
                     startAngle={90}
                     endAngle={450}
                     dataKey="value"
                     paddingAngle={2}
                  >
                     {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                     ))}
                  </Pie>
               </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-2xl font-black text-primary leading-none font-serif">{student.completedCredits}</span>
               <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mt-1">Credits</span>
            </div>
         </div>
         <p className="text-[10px] text-center text-zinc-500 font-bold uppercase tracking-widest">
            {student.totalCredits - student.completedCredits} credits remaining
         </p>
      </div>

      {/* Details */}
      <div className="space-y-6 pt-6 border-t border-zinc-100">
         <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 text-primary flex items-center justify-center shrink-0 shadow-sm border border-zinc-200/50">
               <BookOpen className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Major</p>
               <p className="text-base font-bold text-zinc-900 leading-snug mt-1 font-serif">{student.major}</p>
            </div>
         </div>
         <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 text-secondary flex items-center justify-center shrink-0 shadow-sm border border-zinc-200/50">
               <GraduationCap className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Expected Graduation</p>
               <p className="text-base font-bold text-zinc-900 mt-1 font-serif">{student.expected_graduation_date}</p>
            </div>
         </div>
      </div>

      {/* Notices */}
      <div className="bg-zinc-900 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-zinc-900/20">
         <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none"></div>
         <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-1000">
            <ShieldCheck className="w-16 h-16" />
         </div>
         <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-5">Institutional Notices</h4>
         <div className="space-y-4 relative z-10">
            <div className="flex gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
               <p className="text-[12px] font-medium text-zinc-300">Curriculum Bulletin 2021-2025 verified.</p>
            </div>
            <div className="flex gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 shrink-0 shadow-[0_0_8px_rgba(253,181,21,0.5)]" />
               <p className="text-[12px] font-medium text-zinc-300">Fall Registration opens March 15.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
