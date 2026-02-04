import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  major: string;
  gpa: number;
}

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
  student: Student;
}

export function AIAdvisor({ student }: AIAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${student.name.split(' ')[0]}! I'm your AI Academic Advisor powered by the USC Academic Bulletin. I can help you with:\n\n• Course selection and sequencing\n• Prerequisite validation\n• Credit load recommendations\n• Degree requirement tracking\n\nWhat would you like to know about your academic plan?`,
      timestamp: new Date(),
      context: { type: 'general' }
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);



  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
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
      const response = await fetch('https://uni-ai-rag.work.gd/webhook/advisor-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatInput: currentInput }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch response from advisor: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      console.log('Raw webhook response:', text);

      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.warn('Response was not JSON, using raw text');
        data = { output: text };
      }

      const aiResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        // Support various common webhook response formats
        content: data.output || data.text || data.message || JSON.stringify(data),
        timestamp: new Date(),
        context: { type: 'general' }
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error fetching advisor response:', error);
      const errorResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting to the advisor service right now. Please try again later.",
        timestamp: new Date(),
        context: { type: 'general' }
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQuestions = [
    "Can I take Data Structures this semester?",
    "What's the course sequence for CS majors?",
    "Can I take 18 credits with my GPA?",
    "How much will Fall 2024 cost?"
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
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
              Context-aware guidance powered by your USC Academic Bulletin
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <BookOpen className="w-4 h-4" />
              <span>Bulletin: CS 2021-2025</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <CheckCircle className="w-3 h-3" />
              <span>Verified & Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="bg-white border-b border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-3">Quick Questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setInput(q)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 rounded-lg transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#003366] to-[#00509e] flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            <div
              className={`max-w-2xl rounded-lg p-4 ${message.role === 'user'
                  ? 'bg-[#003366] text-white'
                  : 'bg-white border border-gray-200'
                }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
              <div
                className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/60' : 'text-gray-500'
                  }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-[#FDB515] flex items-center justify-center flex-shrink-0 text-[#003366] text-sm">
                {student.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#003366] to-[#00509e] flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about prerequisites, credit loads, course sequences..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#00254d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            AI responses are based on your uploaded bulletin and current transcript. Always verify critical decisions with your advisor.
          </p>
        </div>
      </div>
    </div>
  );
}
