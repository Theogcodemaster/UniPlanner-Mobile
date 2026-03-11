import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Copy, Eye, Trash2, ShieldCheck, Database } from 'lucide-react';

interface ParsedRule {
  course: string;
  prerequisites: string[];
  credits: number;
  verified: boolean;
}

export function BulletinUpload() {
  const [bulletinUploaded, setBulletinUploaded] = useState(true);
  const [transcriptText, setTranscriptText] = useState('');
  const [transcriptParsed, setTranscriptParsed] = useState(false);

  const parsedRules: ParsedRule[] = [
    { course: 'CPTR360 - Data Structures', prerequisites: ['CPTR210'], credits: 3, verified: true },
    { course: 'CPTR370 - Algorithms', prerequisites: ['CPTR360', 'MATH245'], credits: 3, verified: true },
    { course: 'CPTR280 - Database Systems', prerequisites: ['CPTR210'], credits: 3, verified: true },
    { course: 'CPTR430 - Operating Systems', prerequisites: ['CPTR360', 'CPTR215'], credits: 3, verified: true },
    { course: 'CPTR450 - Software Engineering', prerequisites: ['CPTR360'], credits: 3, verified: true },
    { course: 'MATH245 - Discrete Mathematics', prerequisites: ['MATH141'], credits: 3, verified: true },
    { course: 'CPTR340 - Computer Networks', prerequisites: ['CPTR215'], credits: 3, verified: false },
  ];

  const handleBulletinUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTimeout(() => setBulletinUploaded(true), 1000);
    }
  };

  const handleTranscriptParse = () => {
    if (transcriptText.trim()) setTranscriptParsed(true);
  };

  const mockTranscriptData = `UNIVERSITY OF THE SOUTHERN CARIBBEAN
OFFICIAL TRANSCRIPT

Student: Dwayne Headley
ID: 2021-0345
Major: Computer Science

FALL 2023
CPTR150  Introduction to Programming I     3.00  A    4.00
MATH141  Calculus I                        4.00  B+   3.30
ENGL101  English Composition I             3.00  A-   3.70
HIST101  World Civilization                3.00  B    3.00
RELB101  Old Testament Survey              2.00  A    4.00
Semester GPA: 3.53    Credits: 15.00

SPRING 2024 (In Progress)
CPTR210  Introduction to Programming II    3.00  IP
CPTR215  Computer Organization             3.00  IP
MATH142  Calculus II                       4.00  IP
ENGL102  English Composition II            3.00  IP
RELB102  New Testament Survey              2.00  IP
Current Credits: 15.00`;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Database className="w-5 h-5" />
               </div>
               <h2 className="text-3xl font-black text-zinc-900 tracking-tight font-serif">Data Warehouse</h2>
            </div>
            <p className="text-sm font-medium text-zinc-500 mt-1 max-w-2xl leading-relaxed">
              Synchronize your academic progress by uploading official institutional documents.
            </p>
          </div>
          <div className="flex gap-3">
             <button className="px-5 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 text-sm font-bold transition-all shadow-sm squishy-button">
                History
             </button>
             <button className="px-5 py-2.5 bg-primary text-white rounded-xl hover:brightness-110 text-sm font-bold transition-all shadow-lg shadow-primary/20 squishy-button">
                Sync Node
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Bulletin Upload Section */}
           <div className="premium-card overflow-hidden flex flex-col">
             <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
               <div>
                 <h3 className="font-black text-zinc-900 font-serif text-lg">Curriculum Bulletin</h3>
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Academic Prerequisites Node</p>
               </div>
               <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><ShieldCheck className="w-5 h-5" /></div>
             </div>

             <div className="p-8 flex-1 flex flex-col justify-center">
               {!bulletinUploaded ? (
                 <div className="border-2 border-dashed border-zinc-200 rounded-3xl p-10 text-center hover:border-primary hover:bg-zinc-50 transition-all cursor-pointer group">
                   <input
                     type="file"
                     accept=".pdf"
                     onChange={handleBulletinUpload}
                     className="hidden"
                     id="bulletin-upload"
                   />
                   <label htmlFor="bulletin-upload" className="cursor-pointer block">
                     <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform text-zinc-400 group-hover:text-primary">
                       <Upload className="w-8 h-8" />
                     </div>
                     <p className="font-bold text-zinc-900 mb-1">Upload PDF Bulletin</p>
                     <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Max File Size: 50MB</p>
                   </label>
                 </div>
               ) : (
                 <div className="space-y-6">
                   <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-4">
                     <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600"><FileText className="w-6 h-6" /></div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-emerald-900 truncate">USC_CS_Bulletin_2021-2025.pdf</p>
                       <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mt-1">Status: Verified • 247 Nodes Indexed</p>
                       
                       <div className="mt-4 flex gap-2">
                         <button className="text-[10px] px-3 py-1.5 bg-white text-zinc-700 rounded-lg border border-zinc-200 hover:bg-zinc-50 flex items-center gap-1.5 transition-all font-bold uppercase tracking-widest squishy-button">
                           <Eye className="w-3.5 h-3.5" /> Preview
                         </button>
                         <button onClick={() => setBulletinUploaded(false)} className="text-[10px] px-3 py-1.5 bg-white text-red-600 rounded-lg border border-red-200 hover:bg-red-50 flex items-center gap-1.5 transition-all font-bold uppercase tracking-widest squishy-button">
                           <Trash2 className="w-3.5 h-3.5" /> Purge
                         </button>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-3">
                     <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">Extracted Logical Rules</p>
                     <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {parsedRules.map((rule, index) => (
                          <div key={index} className="flex items-start gap-4 p-4 rounded-2xl border border-zinc-100 hover:border-zinc-200 bg-zinc-50/30 transition-all group">
                            {rule.verified ? <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 text-secondary mt-0.5 shrink-0" />}
                            <div>
                               <p className="text-xs font-bold text-zinc-900 group-hover:text-primary transition-colors">{rule.course}</p>
                               <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">Logic: Prereq {rule.prerequisites.join(', ') || 'Direct'}</p>
                            </div>
                          </div>
                        ))}
                     </div>
                   </div>
                 </div>
               )}
             </div>
           </div>

           {/* Transcript Parser Section */}
           <div className="premium-card overflow-hidden flex flex-col">
             <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
               <div>
                 <h3 className="font-black text-zinc-900 font-serif text-lg">Transcript Parser</h3>
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Grade History Synchronization</p>
               </div>
               <div className="p-2.5 bg-secondary/10 text-secondary rounded-xl"><FileText className="w-5 h-5" /></div>
             </div>

             <div className="p-8 flex-1 flex flex-col">
               {!transcriptParsed ? (
                 <div className="space-y-6 flex-1 flex flex-col">
                   <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-4 text-xs text-primary font-medium">
                     <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-secondary" />
                     <div className="leading-relaxed">
                       <span className="font-black uppercase tracking-widest text-[10px] block mb-1">Protocol</span> 
                       Access Aeorion, navigate to Transcript, execute Copy-All (Ctrl+A), and paste the stream below.
                     </div>
                   </div>

                   <div className="relative flex-1">
                     <textarea
                       value={transcriptText}
                       onChange={(e) => setTranscriptText(e.target.value)}
                       placeholder="Paste institutional grade stream here..."
                       className="w-full h-full min-h-[200px] px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 font-mono text-[11px] resize-none custom-scrollbar transition-all"
                     />
                     <button
                       onClick={() => setTranscriptText(mockTranscriptData)}
                       className="absolute bottom-4 right-4 text-[9px] px-2.5 py-1.5 bg-white border border-zinc-200 text-zinc-500 rounded-lg hover:bg-zinc-50 flex items-center gap-1.5 shadow-sm font-black uppercase tracking-widest squishy-button"
                     >
                       <Copy className="w-3 h-3" /> Load Mock
                     </button>
                   </div>

                   <button
                     onClick={handleTranscriptParse}
                     disabled={!transcriptText.trim()}
                     className="w-full py-4 bg-zinc-900 text-white rounded-2xl hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 disabled:opacity-50 disabled:shadow-none font-bold text-sm flex items-center justify-center gap-3 squishy-button"
                   >
                     <Database className="w-5 h-5 text-secondary" /> Execute Parsing
                   </button>
                 </div>
               ) : (
                 <div className="space-y-6 h-full flex flex-col">
                   <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><CheckCircle className="w-5 h-5" /></div>
                        <div>
                          <p className="text-sm font-bold text-emerald-900">Protocol Success</p>
                          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mt-0.5">15 Academic Nodes Synced</p>
                        </div>
                      </div>
                      <button onClick={() => setTranscriptParsed(false)} className="text-[10px] font-black text-emerald-700 hover:text-emerald-900 uppercase tracking-widest squishy-button">Reset</button>
                   </div>

                   <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="space-y-2">
                        {[
                          { code: 'CPTR150', name: 'Intro to Programming I', grade: 'A', status: 'completed' },
                          { code: 'MATH141', name: 'Calculus I', grade: 'B+', status: 'completed' },
                          { code: 'ENGL101', name: 'English Composition I', grade: 'A-', status: 'completed' },
                          { code: 'HIST101', name: 'World Civilization', grade: 'B', status: 'completed' },
                          { code: 'RELB101', name: 'Old Testament Survey', grade: 'A', status: 'completed' },
                          { code: 'CPTR210', name: 'Intro to Programming II', grade: 'IP', status: 'in-progress' },
                        ].map((course, index) => (
                          <div key={index} className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 hover:border-zinc-200 bg-white shadow-sm transition-all group">
                            <div>
                               <div className="flex items-center gap-3">
                                  <span className="text-xs font-black text-zinc-700 font-mono tracking-tighter">{course.code}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest ${course.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'}`}>
                                    {course.grade}
                                  </span>
                               </div>
                               <p className="text-xs font-medium text-zinc-500 mt-1">{course.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>

                   <button className="w-full py-4 bg-primary text-white rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-primary/20 font-bold text-sm squishy-button">
                     Commit to Degree Planner
                   </button>
                 </div>
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
