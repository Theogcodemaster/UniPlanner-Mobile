import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, AlertCircle, FileText, Trash2, RefreshCw, Upload, File, MessageSquare, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractPdfText, parseGradesToJSON, parseBulletinToJSON, analyzeProgress, generateAdvisorResponse } from '../../lib/ai-agent';
import { ComprehensiveStudentProfile } from '@/lib/student-context';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAdvisorProps {
  student: ComprehensiveStudentProfile;
}

export function AIAdvisor({ student }: AIAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${student.name.split(' ')[0]}! I'm your AI Academic Advisor. \n\nTo give you the best advice, please upload both your **Academic Transcript** and your **Programme Bulletin**.`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [bulletinFile, setBulletinFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [pdfContext, setPdfContext] = useState<string>(''); 
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
     "What course should I prioritize?",
     "Check my prerequisites",
     "Calculate my remaining credits",
     "How to improve my GPA?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleFileSelect = (type: 'transcript' | 'bulletin') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'transcript') setTranscriptFile(e.target.files[0]);
      if (type === 'bulletin') setBulletinFile(e.target.files[0]);
      setUploadStatus('idle');
    }
  };

  const removeFile = (type: 'transcript' | 'bulletin') => {
    if (type === 'transcript') setTranscriptFile(null);
    if (type === 'bulletin') setBulletinFile(null);
    setPdfContext('');
  };

  const handleGenerateReport = async () => {
    if (!transcriptFile || !bulletinFile) return;
    setUploadStatus('processing');
    setStatusMessage('Reading Documents...');
    try {
        const transcriptText = await extractPdfText(transcriptFile);
        const grades = await parseGradesToJSON(transcriptText);
        const bulletinText = await extractPdfText(bulletinFile);
        const sequence = await parseBulletinToJSON(bulletinText);
        const analysis = await analyzeProgress(grades, sequence);

        setPdfContext(`Student Profile: ${JSON.stringify(student)}\nGrades: ${JSON.stringify(grades)}\nBulletin: ${JSON.stringify(sequence)}\nAnalysis: ${analysis}`);
        setMessages(prev => [...prev, {
          id: 'analysis',
          role: 'assistant',
          content: analysis,
          timestamp: new Date(),
        }]);
        setUploadStatus('success');
    } catch (error: any) {
      setUploadStatus('error');
      setStatusMessage('Analysis failed. Try again.');
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const aiContent = await generateAdvisorResponse(textToSend, pdfContext, messages.map(m => ({ role: m.role, content: m.content })));
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: aiContent, timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: "I'm offline right now.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative bg-slate-50/30">
      {/* Header */}
      <div className="p-8 pb-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#003366] to-[#0055aa] flex items-center justify-center shadow-lg shadow-blue-900/20 rotate-3">
                <Bot className="w-6 h-6 text-white -rotate-3" />
             </div>
             <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">AI Advisor</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Assistant</span>
                </div>
             </div>
          </div>
          <button onClick={() => window.location.reload()} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
        
        {/* Upload Hub */}
        {(!pdfContext || uploadStatus === 'processing') && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden"
           >
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <FileText className="w-32 h-32" />
             </div>
             
             <div className="relative z-10">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Initialize Your Advisor</h3>
                <p className="text-sm text-slate-500 mb-8 font-medium">Upload your academic documents to provide context for personalized advice.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                   {/* Transcript */}
                   <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${transcriptFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-blue-500 hover:bg-slate-50'}`}>
                      <input type="file" accept=".pdf" onChange={handleFileSelect('transcript')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${transcriptFile ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                         <FileText className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">{transcriptFile ? 'Transcript Ready' : 'Academic Transcript'}</p>
                      {transcriptFile && <p className="text-[10px] text-emerald-600 mt-1 font-bold truncate px-4">{transcriptFile.name}</p>}
                   </div>

                   {/* Bulletin */}
                   <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${bulletinFile ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-500 hover:bg-slate-50'}`}>
                      <input type="file" accept=".pdf" onChange={handleFileSelect('bulletin')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${bulletinFile ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                         <File className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">{bulletinFile ? 'Bulletin Ready' : 'Programme Bulletin'}</p>
                      {bulletinFile && <p className="text-[10px] text-blue-600 mt-1 font-bold truncate px-4">{bulletinFile.name}</p>}
                   </div>
                </div>

                <button
                   onClick={handleGenerateReport}
                   disabled={!transcriptFile || !bulletinFile || uploadStatus === 'processing'}
                   className="w-full h-14 bg-[#003366] text-white rounded-2xl font-bold shadow-xl shadow-blue-900/20 hover:bg-[#00254d] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                   {uploadStatus === 'processing' ? (
                     <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span>{statusMessage}</span>
                     </div>
                   ) : (
                     <>
                        <Sparkles className="w-5 h-5" />
                        Generate AI Context
                     </>
                   )}
                </button>
             </div>
           </motion.div>
        )}

        {/* Chat Stream */}
        <div className="flex flex-col gap-6">
          <AnimatePresence>
            {messages.map((message, i) => (
              <motion.div 
                key={message.id}
                initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center shadow-md ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                   {message.role === 'user' ? <MessageSquare className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-5 text-sm leading-relaxed shadow-sm ${message.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                   <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-6 py-4 shadow-sm flex gap-1.5 items-center">
                   {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                   ))}
                </div>
             </motion.div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Dock */}
      <div className="p-6 bg-white border-t border-slate-100 relative z-20">
         <div className="max-w-4xl mx-auto space-y-4">
            {/* Suggested Prompts */}
            {pdfContext && messages.length < 5 && (
               <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map(prompt => (
                     <button 
                        key={prompt} 
                        onClick={() => handleSend(prompt)}
                        className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 hover:bg-blue-100 transition-all flex items-center gap-1 group"
                     >
                        {prompt} <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0" />
                     </button>
                  ))}
               </div>
            )}

            <div className="flex gap-3">
               <input
                 type="text"
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                 placeholder={pdfContext ? "Ask about your graduation, costs, or courses..." : "Upload documents to unlock chat..."}
                 disabled={!pdfContext}
                 className="flex-1 h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700"
               />
               <button
                 onClick={() => handleSend()}
                 disabled={!input.trim() || !pdfContext || isTyping}
                 className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg"
               >
                 <Send className="w-6 h-6" />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
