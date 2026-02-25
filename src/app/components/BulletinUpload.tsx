import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Copy, Download, Eye, Trash2, ShieldCheck, Database } from 'lucide-react';

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
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-6 h-6 text-[#003366]" />
              Data Import
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Upload your Bulletin and Transcript to sync your degree audit.
            </p>
          </div>
          <div className="flex gap-2">
             <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm">
                View History
             </button>
             <button className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#00254d] text-sm font-medium transition-colors shadow-md shadow-blue-900/20">
                Sync Now
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Bulletin Upload Section */}
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
               <div>
                 <h3 className="font-semibold text-slate-900">Academic Bulletin</h3>
                 <p className="text-xs text-slate-500 mt-0.5">Defines your degree requirements</p>
               </div>
               <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ShieldCheck className="w-4 h-4" /></div>
             </div>

             <div className="p-6 flex-1 flex flex-col justify-center">
               {!bulletinUploaded ? (
                 <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-[#003366] hover:bg-slate-50 transition-all cursor-pointer group">
                   <input
                     type="file"
                     accept=".pdf"
                     onChange={handleBulletinUpload}
                     className="hidden"
                     id="bulletin-upload"
                   />
                   <label htmlFor="bulletin-upload" className="cursor-pointer block">
                     <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform text-slate-400 group-hover:text-[#003366]">
                       <Upload className="w-6 h-6" />
                     </div>
                     <p className="font-medium text-slate-900 mb-1">Click to upload PDF</p>
                     <p className="text-xs text-slate-500">Max 50MB</p>
                   </label>
                 </div>
               ) : (
                 <div className="space-y-4">
                   <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                     <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-600"><FileText className="w-5 h-5" /></div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-semibold text-emerald-900 truncate">USC_CS_Bulletin_2021-2025.pdf</p>
                       <p className="text-xs text-emerald-700 mt-0.5">Verified • 247 pages parsed</p>
                       
                       <div className="mt-3 flex gap-2">
                         <button className="text-xs px-3 py-1.5 bg-white text-slate-700 rounded-md border border-slate-200 hover:bg-slate-50 flex items-center gap-1 transition-colors">
                           <Eye className="w-3 h-3" /> Preview
                         </button>
                         <button onClick={() => setBulletinUploaded(false)} className="text-xs px-3 py-1.5 bg-white text-red-600 rounded-md border border-red-200 hover:bg-red-50 flex items-center gap-1 transition-colors">
                           <Trash2 className="w-3 h-3" /> Remove
                         </button>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Extracted Rules</p>
                     <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {parsedRules.map((rule, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/30 transition-colors">
                            {rule.verified ? <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
                            <div>
                               <p className="text-xs font-medium text-slate-900">{rule.course}</p>
                               <p className="text-[10px] text-slate-500 mt-0.5">Prereq: {rule.prerequisites.join(', ') || 'None'}</p>
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
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
               <div>
                 <h3 className="font-semibold text-slate-900">Transcript Parser</h3>
                 <p className="text-xs text-slate-500 mt-0.5">Syncs your completed grades</p>
               </div>
               <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><FileText className="w-4 h-4" /></div>
             </div>

             <div className="p-6 flex-1 flex flex-col">
               {!transcriptParsed ? (
                 <div className="space-y-4 flex-1 flex flex-col">
                   <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex gap-3 text-xs text-blue-800">
                     <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                     <div>
                       <span className="font-semibold">Instructions:</span> Log in to Aeorion, go to Transcript, Copy All (Ctrl+A), and paste below.
                     </div>
                   </div>

                   <div className="relative flex-1">
                     <textarea
                       value={transcriptText}
                       onChange={(e) => setTranscriptText(e.target.value)}
                       placeholder="Paste transcript text here..."
                       className="w-full h-full min-h-[160px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366] font-mono text-xs resize-none"
                     />
                     <button
                       onClick={() => setTranscriptText(mockTranscriptData)}
                       className="absolute bottom-3 right-3 text-xs px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 flex items-center gap-1 shadow-sm"
                     >
                       <Copy className="w-3 h-3" /> Sample
                     </button>
                   </div>

                   <button
                     onClick={handleTranscriptParse}
                     disabled={!transcriptText.trim()}
                     className="w-full py-2.5 bg-[#003366] text-white rounded-lg hover:bg-[#00254d] transition-all shadow-md shadow-blue-900/10 disabled:opacity-50 disabled:shadow-none font-medium flex items-center justify-center gap-2"
                   >
                     <Database className="w-4 h-4" /> Parse Data
                   </button>
                 </div>
               ) : (
                 <div className="space-y-4 h-full flex flex-col">
                   <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-100 rounded-full text-emerald-600"><CheckCircle className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">Success!</p>
                          <p className="text-xs text-emerald-700">15 courses extracted</p>
                        </div>
                      </div>
                      <button onClick={() => setTranscriptParsed(false)} className="text-xs text-emerald-700 hover:text-emerald-900 font-medium">Reset</button>
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
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-white shadow-sm transition-colors">
                            <div>
                               <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-700">{course.code}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${course.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {course.grade}
                                  </span>
                               </div>
                               <p className="text-xs text-slate-500 mt-0.5">{course.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>

                   <button className="w-full py-2.5 bg-[#003366] text-white rounded-lg hover:bg-[#00254d] transition-all shadow-md shadow-blue-900/10 font-medium">
                     Apply to Degree Planner
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
