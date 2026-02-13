import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, AlertCircle, CheckCircle, BookOpen, Upload, FileText, X, Settings, Trash2, RefreshCw } from 'lucide-react';
import { extractPdfText, parseGradesToJSON, parseBulletinToJSON, analyzeProgress, generateAdvisorResponse } from '../../lib/ai-agent';
import { ComprehensiveStudentProfile } from '@/lib/student-context';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    type: 'prerequisite' | 'gpa' | 'credit' | 'general';
    courses?: string[];
  };
}

interface AIAdvisorProps {
  student: ComprehensiveStudentProfile;
}

export function AIAdvisor({ student }: AIAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${student.name.split(' ')[0]}! I'm your AI Academic Advisor. \n\nTo give you the best advice, please upload both your **Academic Transcript** and your **Programme Bulletin** (Curriculum).`,
      timestamp: new Date(),
      context: { type: 'general' }
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // File State
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [bulletinFile, setBulletinFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const [agentMode, setAgentMode] = useState<'n8n' | 'local'>('local');
  const [pdfContext, setPdfContext] = useState<string>(''); // For local mode context
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, uploadStatus]);

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
    setUploadStatus('idle');
    setPdfContext(''); // Clear context if files are removed
  };

  const handleClearCache = () => {
    if (window.confirm("Are you sure you want to clear all data and restart the session?")) {
      setTranscriptFile(null);
      setBulletinFile(null);
      setPdfContext('');
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Session Reset. Hello ${student.name.split(' ')[0]}! Please upload your documents again to restart.`,
        timestamp: new Date(),
        context: { type: 'general' }
      }]);
      setUploadStatus('idle');
    }
  };

  const handleGenerateReport = async () => {
    if (!transcriptFile || !bulletinFile) return;

    setUploadStatus('processing');
    setStatusMessage('Initializing...');

    try {
      if (agentMode === 'n8n') {
        // Legacy n8n logic (only supports single file in original code, adapted roughly here)
        // For now, if n8n mode is selected but we have dual files, we might need to stick to single file upload or warn user.
        // Assuming n8n endpoint expects 'file'. We'll send transcript for now as fallback.
        throw new Error("n8n mode not fully supported locally yet.");

      } else {
        // LOCAL MODE LOGIC
        setStatusMessage('Reading Transcript...');
        const transcriptText = await extractPdfText(transcriptFile);

        setStatusMessage('Validating Transcript...');
        const grades = await parseGradesToJSON(transcriptText);

        if (grades.length === 0) {
          throw new Error("Failed to validate transcript. Please ensure you uploaded a valid academic transcript.");
        }

        setStatusMessage('Reading Bulletin...');
        const bulletinText = await extractPdfText(bulletinFile);

        setStatusMessage('Validating Bulletin...');
        const sequence = await parseBulletinToJSON(bulletinText);

        if (sequence.length === 0) {
          throw new Error("Failed to validate bulletin. Please ensure you uploaded a valid programme bulletin.");
        }

        setStatusMessage('Generating Financial Report...');
        const analysis = await analyzeProgress(grades, sequence);

        // Construct Profile Context
        const profileContext = `
        STUDENT PROFILE:
        Name: ${student.name}
        Major: ${student.major}
        Minor: ${student.minor || 'None'}
        GPA: ${student.gpa}
        Housing: ${student.housing_type || 'Unknown'} (Room: ${student.dorm_room_type || 'N/A'})
        Meal Plan: ${student.meal_plan || 'None'}
        `;

        // Store context for chat
        setPdfContext(`
          ${profileContext}\n
          Student Grades JSON:\n${JSON.stringify(grades, null, 2)}\n
          Bulletin Requirements:\n${JSON.stringify(sequence, null, 2)}\n
          Analysis Report:\n${analysis}
        `);

        // Add analysis result as the first message
        setMessages(prev => [{
          id: 'analysis',
          role: 'assistant',
          content: analysis,
          timestamp: new Date(),
          context: { type: 'general' }
        }]);
      }

      setUploadStatus('success');
    } catch (error: any) {
      console.error('Processing error:', error);
      setUploadStatus('error');
      setStatusMessage(error.message || 'An error occurred during processing.');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      let aiContent = '';

      if (agentMode === 'n8n') {
        aiContent = "N8N mode is currently disabled/unstable.";
      } else {
        // LOCAL MODE
        aiContent = await generateAdvisorResponse(
          currentInput,
          pdfContext,
          messages.map(m => ({ role: m.role, content: m.content }))
        );
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
        context: { type: 'general' }
      }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm having trouble connecting to the advisor service. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQuestions = [
    "What course should I prioritize?",
    "How much will next semester cost?",
    "Did I meet the prerequisites for Senior Project?",
    "How does my minor affect my electives?",
    "Did I meet the prerequisites based on my transcript?",
  ];

  // Render Upload UI if not active context (or if explicitly showing memory management)
  // For simplicity, we show the upload UI until success, then minimize it or show "Active Memory"

  return (
    <div className="h-full flex flex-col bg-gray-50 relative">
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
          <Settings className="w-4 h-4 text-gray-500" />
          <select
            value={agentMode}
            onChange={(e) => setAgentMode(e.target.value as 'n8n' | 'local')}
            className="text-sm border-none bg-transparent focus:ring-0 cursor-pointer text-gray-700 font-medium"
          >
            <option value="local">Local Agent (Browser)</option>
            <option value="n8n">n8n Agent (Cloud)</option>
          </select>
        </div>

        <button
          onClick={handleClearCache}
          title="Clear Cache & Restart"
          className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 pt-12"> {/* Added pt-12 to make room for absolute toggle */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#003366] to-[#00509e] rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl text-gray-900">AI Academic Advisor</h2>
              <Sparkles className="w-5 h-5 text-[#FDB515]" />
            </div>
            <p className="text-sm text-gray-600">
              {agentMode === 'local' ? 'Dual-File Analysis & Profile Context' : 'Standard Cloud Agent'}
            </p>
          </div>
        </div>

        {/* Memory / Upload Management Area */}
        <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex flex-col gap-4">
            {/* Upload Zones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Transcript Upload */}
              <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors relative ${transcriptFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-[#003366]'}`}>
                <input type="file" accept=".pdf" onChange={handleFileSelect('transcript')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadStatus === 'processing'} />
                {transcriptFile ? (
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium truncate max-w-[150px]">{transcriptFile.name}</span>
                    <button onClick={(e) => { e.preventDefault(); removeFile('transcript'); }} className="z-10 p-1 hover:bg-green-200 rounded-full"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    <span className="font-medium text-[#003366]">Upload Transcript</span>
                    <p className="text-xs mt-1">Required for grades</p>
                  </div>
                )}
              </div>

              {/* Bulletin Upload */}
              <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors relative ${bulletinFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-[#003366]'}`}>
                <input type="file" accept=".pdf" onChange={handleFileSelect('bulletin')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadStatus === 'processing'} />
                {bulletinFile ? (
                  <div className="flex items-center justify-center gap-2 text-blue-700">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-sm font-medium truncate max-w-[150px]">{bulletinFile.name}</span>
                    <button onClick={(e) => { e.preventDefault(); removeFile('bulletin'); }} className="z-10 p-1 hover:bg-blue-200 rounded-full"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    <span className="font-medium text-[#003366]">Upload Bulletin</span>
                    <p className="text-xs mt-1">Required for curriculum</p>
                  </div>
                )}
              </div>
            </div>

            {/* Generate Button */}
            {(!pdfContext || uploadStatus === 'processing') && (
              <button
                onClick={handleGenerateReport}
                disabled={!transcriptFile || !bulletinFile || uploadStatus === 'processing'}
                className="w-full py-2 bg-[#003366] text-white rounded-lg font-medium hover:bg-[#00254d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploadStatus === 'processing' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {statusMessage || 'Processing...'}
                  </>
                ) : (
                  `Generate Advisor Report`
                )}
              </button>
            )}

            {uploadStatus === 'error' && (
              <div className="text-red-600 text-sm flex items-center gap-2 justify-center">
                <AlertCircle className="w-4 h-4" />
                {statusMessage || 'Analysis failed. Please check your files and try again.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#003366] to-[#00509e] flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            <div className={`max-w-2xl rounded-lg p-4 ${message.role === 'user' ? 'bg-[#003366] text-white' : 'bg-white border border-gray-200'}`}>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-left">
                {message.content}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#003366] to-[#00509e] flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          {messages.length < 3 && !pdfContext && (
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              <p className="text-xs text-center w-full text-gray-500">Upload documents above to enable chat</p>
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={pdfContext ? "Ask about costs, specific courses, or degree progress..." : "Upload files first..."}
              disabled={!pdfContext && agentMode === 'local'}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() || isTyping) || (!pdfContext && agentMode === 'local')}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#00254d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
