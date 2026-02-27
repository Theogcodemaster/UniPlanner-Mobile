import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Sparkles, AlertCircle, FileText, Trash2, RefreshCw, File, MessageSquare, ChevronRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  extractPdfText,
  processDocuments,
  generateAdvisorResponse,
  StudentGrade,
  AIProvider,
} from '../../lib/ai-agent';
import { Course } from '../../data/course-sequence';
import { ComprehensiveStudentProfile } from '../../lib/student-context';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAdvisorProps {
  student: ComprehensiveStudentProfile;
}

// Extended cache now stores parsed JSON so re-visits skip LLM calls entirely
interface CachedDocs {
  transcriptText: string;
  transcriptName: string;
  bulletinText: string;
  bulletinName: string;
  analysis: string;
  grades: StudentGrade[];
  sequence: Course[];
  chatContext: string;
  emphasis: string; // invalidate cache when emphasis changes
}

type UploadStatus = 'idle' | 'extracting' | 'review' | 'analyzing' | 'success' | 'error';

const EMPHASIS_OPTIONS = ['Core', 'Software Systems', 'Information Systems'] as const;

const WELCOME_MESSAGE = (firstName: string): Message => ({
  id: 'welcome',
  role: 'assistant',
  content: `Hello ${firstName}! I'm your AI Academic Advisor.\n\nTo give you the best advice, please upload both your **Academic Transcript** and your **Programme Bulletin**.`,
  timestamp: new Date(),
});

// ─── Component ────────────────────────────────────────────────────────────────
export function AIAdvisor({ student }: AIAdvisorProps) {
  const firstName = student.name.split(' ')[0];
  const cacheKey = `advisor_cache_${student.student_id}`;

  // ── State ──────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE(firstName)]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [bulletinFile, setBulletinFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [pdfContext, setPdfContext] = useState('');
  const [cachedDocs, setCachedDocs] = useState<CachedDocs | null>(null);
  const [selectedEmphasis, setSelectedEmphasis] = useState('');
  const [selectedModel, setSelectedModel] = useState<AIProvider>(
    (localStorage.getItem('advisor_model') as AIProvider) || 'groq'
  );
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugTab, setDebugTab] = useState<'transcript' | 'bulletin'>('transcript');
  const [isEditing, setIsEditing] = useState(false);
  const [localTranscriptText, setLocalTranscriptText] = useState('');
  const [localBulletinText, setLocalBulletinText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'What course should I prioritize?',
    'Check my prerequisites',
    'Calculate my remaining credits',
    'Change my emphasis',
  ];

  // ── Scroll ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Load cache on mount / student change ───────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(cacheKey);
    if (!saved) {
      setCachedDocs(null);
      setUploadStatus('idle');
      setPdfContext('');
      return;
    }
    try {
      const parsed = JSON.parse(saved) as CachedDocs;
      setCachedDocs(parsed);
      setSelectedEmphasis(parsed.emphasis || '');
      setPdfContext(parsed.chatContext || '');
      setLocalTranscriptText(parsed.transcriptText || '');
      setLocalBulletinText(parsed.bulletinText || '');
      setUploadStatus('success');
      setStatusMessage('Documents loaded from cache');
    } catch {
      localStorage.removeItem(cacheKey);
    }
  }, [student.student_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-analyze when emphasis changes (uses useCallback to avoid stale closure) ──
  const handleGenerateReport = useCallback(async (
    overrideTranscript?: string,
    overrideBulletin?: string
  ) => {
    const tText = overrideTranscript ?? localTranscriptText;
    const bText = overrideBulletin ?? localBulletinText;

    if (!tText || !bText) {
      setUploadStatus('error');
      setStatusMessage('Missing document text. Please re-upload.');
      return;
    }

    try {
      setUploadStatus('analyzing');
      setStatusMessage('AI is analyzing your documents...');

      // processDocuments runs parseGrades + parseBulletin in parallel
      const { grades, sequence, analysis, chatContext } = await processDocuments(
        tText,
        bText,
        selectedEmphasis,
        student,
        selectedModel
      );

      setPdfContext(chatContext);
      setUploadStatus('success');
      setStatusMessage('Analysis complete!');

      const newCache: CachedDocs = {
        transcriptText: tText,
        transcriptName: cachedDocs?.transcriptName || transcriptFile?.name || 'Transcript',
        bulletinText: bText,
        bulletinName: cachedDocs?.bulletinName || bulletinFile?.name || 'Bulletin',
        analysis,
        grades,
        sequence,
        chatContext,
        emphasis: selectedEmphasis,
      };
      localStorage.setItem(cacheKey, JSON.stringify(newCache));
      setCachedDocs(newCache);

      setMessages(prev => {
        // Replace previous analysis message if it exists, otherwise append
        const withoutOldAnalysis = prev.filter(m => m.id !== 'analysis');
        return [...withoutOldAnalysis, {
          id: 'analysis',
          role: 'assistant',
          content: analysis,
          timestamp: new Date(),
        }];
      });
    } catch (error: any) {
      console.error('[AIAdvisor] Report generation error:', error);
      setUploadStatus('error');
      setStatusMessage(error.message || 'Error processing documents');
    }
  }, [localTranscriptText, localBulletinText, selectedEmphasis, selectedModel, student, cachedDocs, transcriptFile, bulletinFile, cacheKey]);

  // Re-analyze when emphasis changes — now safe from stale closures
  useEffect(() => {
    if (pdfContext && selectedEmphasis && (localTranscriptText || cachedDocs?.transcriptText)) {
      handleGenerateReport();
    }
  }, [selectedEmphasis]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFileSelect = (type: 'transcript' | 'bulletin') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (type === 'transcript') setTranscriptFile(file);
      else setBulletinFile(file);
      setUploadStatus('idle');
    };

  const removeFile = (type: 'transcript' | 'bulletin') => {
    if (type === 'transcript') { setTranscriptFile(null); setLocalTranscriptText(''); }
    else { setBulletinFile(null); setLocalBulletinText(''); }
    setCachedDocs(null);
    setPdfContext('');
    setUploadStatus('idle');
    localStorage.removeItem(cacheKey);
  };

  // ── Step 1: Extract PDF text ───────────────────────────────────────────────
  const handleExtractDocuments = async () => {
    try {
      setUploadStatus('extracting');
      setStatusMessage('Reading PDF documents...');

      // Run both extractions in parallel if both files are new
      const [tText, bText] = await Promise.all([
        transcriptFile ? extractPdfText(transcriptFile) : Promise.resolve(localTranscriptText),
        bulletinFile ? extractPdfText(bulletinFile) : Promise.resolve(localBulletinText),
      ]);

      if (!tText || !bText) throw new Error('Could not extract text from one or both documents.');

      setLocalTranscriptText(tText);
      setLocalBulletinText(bText);
      setUploadStatus('review');
      setStatusMessage('Review the extracted text, then proceed to analysis.');
      setShowDebugModal(true);
    } catch (error: any) {
      setUploadStatus('error');
      setStatusMessage(error.message || 'Error extracting PDF text');
    }
  };

  // ── Send a chat message (streaming for Groq) ───────────────────────────────
  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride ?? input;
    if (!textToSend.trim() || !pdfContext) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Create an empty assistant message to stream into
    const assistantId = `ai-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }]);

    try {
      await generateAdvisorResponse(
        textToSend,
        pdfContext,
        messages.map(m => ({ role: m.role, content: m.content })),
        selectedModel,
        // onChunk: append each token to the assistant message in real time
        (chunk) => {
          setMessages(prev => prev.map(m =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          ));
        }
      );
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: "I'm having trouble connecting. Please try again." }
          : m
      ));
    } finally {
      setIsTyping(false);
    }
  };

  // ── Misc handlers ──────────────────────────────────────────────────────────
  const clearHistory = () => {
    setMessages([WELCOME_MESSAGE(firstName)]);
    setPdfContext('');
    setTranscriptFile(null);
    setBulletinFile(null);
    setLocalTranscriptText('');
    setLocalBulletinText('');
    setUploadStatus('idle');
    setStatusMessage('');
    setCachedDocs(null);
    localStorage.removeItem(cacheKey);
  };

  const setModelWithPersistence = (model: AIProvider) => {
    setSelectedModel(model);
    localStorage.setItem('advisor_model', model);
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const hasTranscript = !!(transcriptFile || cachedDocs?.transcriptText || localTranscriptText);
  const hasBulletin = !!(bulletinFile || cachedDocs?.bulletinText || localBulletinText);
  const canProceed = hasTranscript && hasBulletin && !!selectedEmphasis;
  const isProcessing = uploadStatus === 'extracting' || uploadStatus === 'analyzing';

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col relative bg-slate-50/30">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Academic Advisor</h2>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">AI Powered • Online</span>
            </div>
          </div>
        </div>

        {/* Model switcher */}
        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 scale-90 sm:scale-100 origin-right">
          {([
            { id: 'groq', label: 'Server 1', Icon: Sparkles },
            { id: 'gemini', label: 'Server 2', Icon: Bot },
            { id: 'bytez', label: 'Server 3', Icon: Zap },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setModelWithPersistence(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 ${selectedModel === id
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={clearHistory}
          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          title="Clear History"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">

        {/* Upload Hub — hidden once context is ready */}
        {(!pdfContext || isProcessing) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <FileText className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Initialize Your Advisor</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">
                Upload your academic documents to provide context for personalized advice.
              </p>

              {/* File drop zones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {([
                  {
                    type: 'transcript' as const,
                    label: 'Academic Transcript',
                    readyLabel: 'Transcript Ready',
                    cachedLabel: 'Transcript (Cached)',
                    file: transcriptFile,
                    cached: cachedDocs?.transcriptText,
                    name: transcriptFile?.name || cachedDocs?.transcriptName,
                    activeColor: 'border-emerald-500 bg-emerald-50/50',
                    iconColor: 'bg-emerald-100 text-emerald-600',
                    nameColor: 'text-emerald-600',
                    Icon: FileText,
                  },
                  {
                    type: 'bulletin' as const,
                    label: 'Programme Bulletin',
                    readyLabel: 'Bulletin Ready',
                    cachedLabel: 'Bulletin (Cached)',
                    file: bulletinFile,
                    cached: cachedDocs?.bulletinText,
                    name: bulletinFile?.name || cachedDocs?.bulletinName,
                    activeColor: 'border-blue-500 bg-blue-50/50',
                    iconColor: 'bg-blue-100 text-blue-600',
                    nameColor: 'text-blue-600',
                    Icon: File,
                  },
                ]).map(({ type, label, readyLabel, cachedLabel, file, cached, name, activeColor, iconColor, nameColor, Icon }) => (
                  <div
                    key={type}
                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${file || cached ? activeColor : 'border-slate-200 hover:border-blue-500 hover:bg-slate-50'
                      }`}
                  >
                    {(file || cached) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(type); }}
                        className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors z-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect(type)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${file || cached ? iconColor : 'bg-slate-100 text-slate-400'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                      {file ? readyLabel : cached ? cachedLabel : label}
                    </p>
                    {name && (
                      <p className={`text-[10px] mt-1 font-bold truncate px-4 ${nameColor}`}>{name}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Emphasis selector */}
              {hasBulletin && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Target Emphasis</p>
                  <div className="flex flex-wrap gap-2">
                    {EMPHASIS_OPTIONS.map(emp => (
                      <button
                        key={emp}
                        onClick={() => setSelectedEmphasis(emp)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedEmphasis === emp
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400'
                          }`}
                      >
                        {emp}
                      </button>
                    ))}
                    <input
                      type="text"
                      placeholder="Other..."
                      value={EMPHASIS_OPTIONS.includes(selectedEmphasis as any) ? '' : selectedEmphasis}
                      onChange={e => setSelectedEmphasis(e.target.value)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-200 w-32 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              )}

              {/* Action button */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={uploadStatus === 'review'
                    ? () => handleGenerateReport()
                    : handleExtractDocuments}
                  disabled={!canProceed || isProcessing}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${!canProceed
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0'
                    }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{statusMessage}</span>
                    </>
                  ) : uploadStatus === 'review' ? (
                    <><Sparkles className="w-5 h-5" /><span>Proceed to AI Analysis</span></>
                  ) : (
                    <><FileText className="w-5 h-5" /><span>1. Extract PDF Data</span></>
                  )}
                </button>

                {canProceed && !selectedEmphasis && (
                  <p className="text-[10px] text-center font-bold text-amber-600 uppercase tracking-tighter animate-pulse">
                    Please select or enter an Emphasis above to proceed
                  </p>
                )}

                {uploadStatus === 'success' && (
                  <div className="flex flex-col items-center gap-1 mt-2">
                    <button
                      onClick={() => setShowDebugModal(true)}
                      className="flex items-center justify-center gap-2 text-[10px] text-slate-400 hover:text-blue-500 transition-colors uppercase font-bold tracking-widest"
                    >
                      <Zap className="w-3 h-3" />
                      View / Edit Raw Extraction
                    </button>
                    <p className="text-[9px] text-slate-400 italic">
                      Advice seems off? Review and correct the extraction above.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Chat messages ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <AnimatePresence>
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center shadow-md ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
                  }`}>
                  {message.role === 'user' ? <MessageSquare className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-5 text-sm leading-relaxed shadow-sm ${message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                  }`}>
                  {message.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <div className="prose prose-sm prose-slate max-w-none prose-headings:font-bold prose-strong:text-slate-900 prose-strong:font-bold">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ ...p }) => <p className="mb-3 last:mb-0" {...p} />,
                          h1: ({ ...p }) => <h1 className="text-lg font-bold mb-2" {...p} />,
                          h2: ({ ...p }) => <h2 className="text-md font-bold mb-2" {...p} />,
                          h3: ({ ...p }) => <h3 className="text-sm font-bold mb-2" {...p} />,
                          ul: ({ ...p }) => <ul className="list-disc pl-4 mb-3 space-y-1" {...p} />,
                          ol: ({ ...p }) => <ol className="list-decimal pl-4 mb-3 space-y-1" {...p} />,
                          li: ({ ...p }) => <li className="mb-1" {...p} />,
                          strong: ({ ...p }) => <strong className="font-bold text-slate-900" {...p} />,
                          em: ({ ...p }) => <em className="italic" {...p} />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator — only shown when streaming hasn't started yet */}
          {isTyping && messages[messages.length - 1]?.content === '' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                {selectedModel === 'groq' ? <Sparkles className="w-5 h-5 text-blue-400" /> :
                  selectedModel === 'bytez' ? <Zap className="w-5 h-5 text-yellow-400" /> :
                    <Bot className="w-5 h-5 text-emerald-400" />}
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-6 py-4 shadow-sm flex flex-col gap-2">
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {selectedModel === 'groq' ? 'Groq is thinking…' : selectedModel === 'bytez' ? 'Bytez is processing…' : 'Gemini is processing…'}
                </span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* ── Input dock ─────────────────────────────────────────────────────── */}
      <div className="p-6 bg-white border-t border-slate-100 relative z-20">
        <div className="max-w-4xl mx-auto space-y-4">
          {pdfContext && messages.length < 5 && (
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 hover:bg-blue-100 transition-all flex items-center gap-1 group"
                >
                  {prompt}
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0" />
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={pdfContext ? 'Ask about your graduation, costs, or courses…' : 'Upload documents to unlock chat…'}
              disabled={!pdfContext || isTyping}
              className="flex-1 h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700 disabled:opacity-50"
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

      {/* ── Debug / Raw Text Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showDebugModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDebugModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-10"
            >
              {/* Modal header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">Raw PDF Extraction</h2>
                    <p className="text-xs text-slate-500">Review and edit what the AI receives</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(e => !e)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isEditing ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {isEditing ? 'Stop Editing' : 'Edit Text'}
                  </button>
                  <button
                    onClick={() => setShowDebugModal(false)}
                    className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                    aria-label="Close"
                  >
                    <AlertCircle className="w-6 h-6 rotate-45" />
                  </button>
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex p-2 bg-slate-100/50 border-b border-slate-200">
                {(['transcript', 'bulletin'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDebugTab(tab)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${debugTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    {tab === 'transcript' ? 'Transcript Text' : 'Bulletin Text'}
                  </button>
                ))}
              </div>

              {/* Text area */}
              <div className="flex-1 overflow-auto bg-slate-950 font-mono text-[11px] leading-relaxed">
                {isEditing ? (
                  <textarea
                    value={debugTab === 'transcript' ? localTranscriptText : localBulletinText}
                    onChange={e => debugTab === 'transcript'
                      ? setLocalTranscriptText(e.target.value)
                      : setLocalBulletinText(e.target.value)}
                    className="w-full h-full p-6 bg-transparent text-emerald-400 border-none outline-none resize-none focus:ring-0"
                    placeholder={`Edit your ${debugTab} text here…`}
                    spellCheck={false}
                  />
                ) : (
                  <pre className="p-6 text-emerald-400 whitespace-pre-wrap select-text">
                    {(debugTab === 'transcript' ? localTranscriptText : localBulletinText) || `No ${debugTab} data available`}
                  </pre>
                )}
              </div>

              {/* Modal footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-4">
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isEditing
                      ? 'Editing raw data — changes are used in the next analysis run.'
                      : 'This is exactly what the AI receives. Edit if the extraction looks wrong.'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    {debugTab === 'transcript' ? cachedDocs?.transcriptName : cachedDocs?.bulletinName}
                  </p>
                </div>
                {isEditing && (
                  <button
                    onClick={() => {
                      setShowDebugModal(false);
                      setIsEditing(false);
                      handleGenerateReport(localTranscriptText, localBulletinText);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Save & Re-analyze
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
