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

  // Mock AI responses based on keywords
  const generateResponse = (userMessage: string): Message => {
    const lowerMessage = userMessage.toLowerCase();
    let content = '';
    let context: Message['context'] = { type: 'general' };

    if (lowerMessage.includes('data structures') || lowerMessage.includes('cptr360')) {
      content = `Based on the Academic Bulletin you uploaded and your current transcript:\n\n**CPTR360 - Data Structures**\n\n✅ **Prerequisites Met:** You have completed CPTR210 (Intro to Programming II) in Spring 2024.\n\n📋 **Course Details:**\n• Credits: 3\n• Typically offered: Fall semesters\n• Prerequisites: CPTR210\n\n✨ **My Recommendation:** You are ready to take Data Structures in Fall 2024. This is a critical course for your CS degree and should be taken as soon as possible to unlock advanced courses like Algorithms (CPTR450) and Operating Systems (CPTR430).\n\n⚠️ **Important Note:** Data Structures has a heavy workload. I recommend not overloading this semester - stick to 15-16 credits maximum.`;
      context = { type: 'prerequisite', courses: ['CPTR360', 'CPTR210'] };
    } else if (lowerMessage.includes('overload') || lowerMessage.includes('18 credits') || lowerMessage.includes('credit')) {
      content = `Based on the Academic Bulletin rules and your current GPA (${student.gpa.toFixed(2)}):\n\n**Credit Load Analysis:**\n\n✅ **Your Status:** With a GPA of ${student.gpa.toFixed(2)}, you ${student.gpa >= 3.0 ? 'may request' : 'require advisor approval for'} course overload.\n\n📋 **Bulletin Policy (Section 3.2.1):**\n• Standard load: 12-15 credits\n• Students with GPA ≥ 3.00: May take up to 18 credits\n• Students with GPA < 3.00: Limited to 15 credits without written approval\n\n${student.gpa >= 3.0 
  ? '✨ **My Recommendation:** You can handle 16-18 credits, but consider the workload of each course. If you\'re taking multiple lab courses or upper-division CS courses, I recommend staying at 15-16 credits.' 
  : '⚠️ **Important:** You would need to submit a Course Overload Request Form to your Academic Advisor (Dr. Sarah Thompson) for approval to exceed 15 credits. This typically requires a strong justification.'}`;
      context = { type: 'credit' };
    } else if (lowerMessage.includes('when') || lowerMessage.includes('sequence') || lowerMessage.includes('order')) {
      content = `Here's the recommended course sequence for Computer Science majors:\n\n**Year 2 (Your Current Year):**\n\n*Fall 2024:*\n• CPTR360 - Data Structures ✓\n• CPTR280 - Database Systems ✓\n• MATH245 - Discrete Mathematics ✓\n• General Education courses\n\n*Spring 2025:*\n• CPTR370 - Algorithms (prereq: CPTR360)\n• CPTR340 - Computer Networks (prereq: CPTR215)\n• CPTR320 - Software Engineering\n• Elective\n\n**Why this matters:** Taking courses in the wrong order can delay graduation. For example, CPTR370 (Algorithms) requires CPTR360, which you're planning for Fall 2024. If you push Data Structures to Spring 2025, you can't take Algorithms until Fall 2025, creating a domino effect.\n\n✨ **Pro Tip:** Always plan 2-3 semesters ahead to avoid scheduling conflicts!`;
      context = { type: 'general', courses: ['CPTR360', 'CPTR370', 'CPTR280'] };
    } else if (lowerMessage.includes('gpa') || lowerMessage.includes('grade')) {
      content = `**GPA and Academic Standing Information:**\n\nYour current GPA: **${student.gpa.toFixed(2)}**\n\n📊 **Academic Standing Levels (per Bulletin Section 4.1):**\n• Dean's List: GPA ≥ 3.50 (top 10% of students)\n• Good Standing: GPA ≥ 2.00\n• Academic Probation: GPA < 2.00\n\n${student.gpa >= 3.5 
  ? '🎉 **Congratulations!** You qualify for Dean\'s List honors! Keep up the excellent work.' 
  : student.gpa >= 3.0 
  ? '✅ **Status:** You\'re in good academic standing with strong performance.' 
  : '⚠️ **Status:** While you\'re in good standing, raising your GPA above 3.0 will give you more flexibility for course overloads and scholarship opportunities.'}\n\n**GPA Impact Calculator:**\nIf you earn all A's this semester (15 credits):\nProjected GPA: **${((student.gpa * 45 + 4.0 * 15) / 60).toFixed(2)}**`;
      context = { type: 'gpa' };
    } else if (lowerMessage.includes('cost') || lowerMessage.includes('fee') || lowerMessage.includes('tuition')) {
      content = `**Financial Information for ${student.major} Students:**\n\n💰 **Current Tuition Rate:** TTD $415 per credit hour\n\n**For a typical 15-credit semester:**\n• Tuition: TTD $6,225\n• General Fees: TTD $1,250\n• Lab Fees (if applicable): TTD $350-700\n• **Estimated Total:** TTD $7,825-8,175\n\n📋 **Additional Costs for CS Majors:**\n• CPTR courses with labs: +$350 lab fee each\n• Required textbooks: ~TTD $800-1,200/semester\n• Software licenses: Provided by USC (free)\n\n✨ **Money-Saving Tips:**\n1. Take 15+ credits per semester (maximize per-credit value)\n2. Use the library's textbook reserve when possible\n3. Apply for departmental scholarships (CS students with GPA > 3.5 qualify)\n\n💡 Check the Financial Calculator tab for a detailed breakdown of your Fall 2024 costs!`;
      context = { type: 'general' };
    } else {
      content = `I understand you're asking about: "${userMessage}"\n\nBased on your profile:\n• Major: ${student.major}\n• Current GPA: ${student.gpa.toFixed(2)}\n• Completed Credits: 45/120\n\nI can provide specific guidance on:\n1. **Course Prerequisites** - "Can I take CPTR360?"\n2. **Credit Load Rules** - "Can I take 18 credits?"\n3. **Course Sequencing** - "What should I take next semester?"\n4. **GPA Requirements** - "What GPA do I need for honors?"\n5. **Financial Planning** - "How much will next semester cost?"\n\nPlease ask a more specific question, and I'll reference the official bulletin to give you accurate advice!`;
      context = { type: 'general' };
    }

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      context
    };
  };

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const aiResponse = generateResponse(input);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
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
              className={`max-w-2xl rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-[#003366] text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
              <div
                className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-white/60' : 'text-gray-500'
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
