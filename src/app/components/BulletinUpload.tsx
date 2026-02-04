import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Copy, Download, Eye, Trash2 } from 'lucide-react';

interface ParsedRule {
  course: string;
  prerequisites: string[];
  credits: number;
  verified: boolean;
}

export function BulletinUpload() {
  const [bulletinUploaded, setBulletinUploaded] = useState(true); // Mock as already uploaded
  const [transcriptText, setTranscriptText] = useState('');
  const [transcriptParsed, setTranscriptParsed] = useState(false);

  // Mock parsed bulletin rules
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
      // Simulate upload
      setTimeout(() => {
        setBulletinUploaded(true);
      }, 1000);
    }
  };

  const handleTranscriptParse = () => {
    if (transcriptText.trim()) {
      setTranscriptParsed(true);
    }
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
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#003366] rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl text-gray-900">Bulletin & Transcript Upload</h2>
              <p className="text-sm text-gray-600">
                Upload your Academic Bulletin and paste your transcript for intelligent course planning
              </p>
            </div>
          </div>
        </div>

        {/* Bulletin Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg text-gray-900">Academic Bulletin Upload</h3>
            <p className="text-sm text-gray-600 mt-1">
              Upload your specific degree bulletin PDF for accurate prerequisite validation
            </p>
          </div>

          <div className="p-6">
            {!bulletinUploaded ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#003366] transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleBulletinUpload}
                  className="hidden"
                  id="bulletin-upload"
                />
                <label htmlFor="bulletin-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-900 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    Academic Bulletin PDF (max 50MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Uploaded File Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-green-900">
                        USC_CS_Bulletin_2021-2025.pdf
                      </p>
                      <button className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-green-700">
                      Uploaded on Jan 15, 2024 • 8.4 MB • 247 pages parsed
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button className="text-xs px-3 py-1 bg-white text-green-700 rounded border border-green-200 hover:bg-green-50 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Preview
                      </button>
                      <button className="text-xs px-3 py-1 bg-white text-green-700 rounded border border-green-200 hover:bg-green-50 flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>

                {/* Parsed Rules Section */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-gray-900">Extracted Course Rules</h4>
                    <span className="text-sm text-gray-600">
                      {parsedRules.filter(r => r.verified).length}/{parsedRules.length} verified
                    </span>
                  </div>

                  <div className="space-y-2">
                    {parsedRules.map((rule, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 ${
                          rule.verified
                            ? 'bg-white border-gray-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm text-gray-900">{rule.course}</p>
                              {rule.verified ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600">
                              Prerequisites: {rule.prerequisites.length > 0 ? rule.prerequisites.join(', ') : 'None'} • 
                              {rule.credits} credits
                            </p>
                          </div>
                          {!rule.verified && (
                            <div className="flex gap-2">
                              <button className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                                Confirm
                              </button>
                              <button className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transcript Scraper Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg text-gray-900">Transcript Scraper</h3>
            <p className="text-sm text-gray-600 mt-1">
              Paste your transcript text from Aeorion for automatic parsing
            </p>
          </div>

          <div className="p-6">
            {!transcriptParsed ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="mb-2">How to use the Transcript Scraper:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Log in to Aeorion Student Portal</li>
                      <li>Navigate to Academics → Transcript</li>
                      <li>Press Ctrl+A (or Cmd+A) to select all text</li>
                      <li>Press Ctrl+C (or Cmd+C) to copy</li>
                      <li>Paste below and click Parse</li>
                    </ol>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value)}
                    placeholder="Paste your raw transcript text here..."
                    className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366] font-mono text-sm"
                  />
                  <button
                    onClick={() => setTranscriptText(mockTranscriptData)}
                    className="absolute top-3 right-3 text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Use Sample
                  </button>
                </div>

                <button
                  onClick={handleTranscriptParse}
                  disabled={!transcriptText.trim()}
                  className="w-full px-4 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#00254d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Parse Transcript
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-green-900">
                      Transcript Successfully Parsed!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Extracted 10 completed courses and 5 in-progress courses
                    </p>
                  </div>
                  <button
                    onClick={() => setTranscriptParsed(false)}
                    className="text-sm text-green-700 hover:text-green-800"
                  >
                    Re-parse
                  </button>
                </div>

                {/* Parsed Courses */}
                <div>
                  <h4 className="text-gray-900 mb-3">Extracted Courses</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { code: 'CPTR150', name: 'Intro to Programming I', grade: 'A', credits: 3, status: 'completed' },
                      { code: 'MATH141', name: 'Calculus I', grade: 'B+', credits: 4, status: 'completed' },
                      { code: 'ENGL101', name: 'English Composition I', grade: 'A-', credits: 3, status: 'completed' },
                      { code: 'HIST101', name: 'World Civilization', grade: 'B', credits: 3, status: 'completed' },
                      { code: 'RELB101', name: 'Old Testament Survey', grade: 'A', credits: 2, status: 'completed' },
                      { code: 'CPTR210', name: 'Intro to Programming II', grade: 'IP', credits: 3, status: 'in-progress' },
                    ].map((course, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-3 ${
                          course.status === 'completed'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-900">{course.code}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            course.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {course.grade}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{course.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{course.credits} credits</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full px-4 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#00254d] transition-colors">
                  Import to Degree Planner
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-gradient-to-br from-[#003366] to-[#00509e] rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-xl mb-4">How UniPlanner Uses Your Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <CheckCircle className="w-6 h-6 mb-2" />
              <h4 className="text-sm mb-1">Prerequisite Validation</h4>
              <p className="text-xs text-white/80">
                Real-time checks against official bulletin requirements
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <CheckCircle className="w-6 h-6 mb-2" />
              <h4 className="text-sm mb-1">AI Context</h4>
              <p className="text-xs text-white/80">
                Powers intelligent responses in the AI Advisor
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <CheckCircle className="w-6 h-6 mb-2" />
              <h4 className="text-sm mb-1">Automatic Updates</h4>
              <p className="text-xs text-white/80">
                Keeps your degree map synced with completed courses
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
