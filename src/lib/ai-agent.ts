import * as pdfjsLib from 'pdfjs-dist';
import { Course } from '../data/course-sequence';
import Bytez from "bytez.js";
import { ComprehensiveStudentProfile } from './student-context';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

// ─── API Keys ────────────────────────────────────────────────────────────────
// SECURITY: Never hardcode API keys. Set these in your .env file.
const GROQ_API_KEY = (import.meta as any).env.VITE_GROQ_API_KEY;
const GEMINI_API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;
const BYTEZ_API_KEY = (import.meta as any).env.VITE_BYTEZ_API_KEY;

if (!GROQ_API_KEY) {
    console.error('[ai-agent] ⚠️  VITE_GROQ_API_KEY is not set. Groq calls will fail.');
}

// ─── Model Tiers ─────────────────────────────────────────────────────────────
// Use the heavy model only for structured document extraction (accuracy matters).
// Use the fast model for all conversational follow-ups (speed matters).
const GROQ_PARSE_MODEL = "llama-3.3-70b-versatile";   // accurate, slower
const GROQ_CHAT_MODEL = "llama-3.1-8b-instant";       // ~5x faster, great for chat

// ─── Types ───────────────────────────────────────────────────────────────────
export interface StudentGrade {
    courseCode: string;
    grade: string;
    semesterTerm: string;
    pageNumber?: number;
}

export interface AdvisorResponse {
    message: string;
    context?: any;
}

export type AIProvider = 'groq' | 'gemini' | 'bytez';

// ─── Grade Helpers ────────────────────────────────────────────────────────────
// Robust regex handles A+, B-, C, P, etc.
const PASSING_GRADE_RE = /^(A|B|C|P)[+-]?$/i;
const FAILING_GRADE_RE = /^(D|F|NP)[+-]?$/i;

const isPassing = (grade: string) => PASSING_GRADE_RE.test(grade.trim());
const isFailing = (grade: string) => FAILING_GRADE_RE.test(grade.trim());

// ─── Retry Wrapper ────────────────────────────────────────────────────────────
/**
 * Retries an async function with exponential backoff.
 * Handles Groq/Gemini rate-limit spikes gracefully.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, label = 'call'): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            if (attempt === retries) throw err;
            const delay = 1000 * Math.pow(2, attempt);
            console.warn(`[ai-agent] ${label} failed (attempt ${attempt + 1}), retrying in ${delay}ms…`, err?.message);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    throw new Error(`[ai-agent] ${label} exhausted all retries`);
}

// ─── Safe JSON Parse ──────────────────────────────────────────────────────────
function safeJsonParse(text: string): any {
    try {
        return JSON.parse(text);
    } catch {
        const mdMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
        if (mdMatch?.[1]) {
            try { return JSON.parse(mdMatch[1]); } catch { /* fall through */ }
        }
        const looseMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (looseMatch?.[0]) {
            try { return JSON.parse(looseMatch[0]); } catch { /* fall through */ }
        }
        throw new Error('Could not extract valid JSON from LLM response');
    }
}

// ─── PDF Text Extraction ──────────────────────────────────────────────────────
export async function extractPdfText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const lines: { [y: number]: any[] } = {};
        textContent.items.forEach((item: any) => {
            const y = Math.round(item.transform[5]);
            if (!lines[y]) lines[y] = [];
            lines[y].push(item);
        });

        const sortedY = Object.keys(lines).map(Number).sort((a, b) => b - a);
        let pageText = '';
        sortedY.forEach(y => {
            const lineItems = lines[y].sort((a: any, b: any) => a.transform[4] - b.transform[4]);
            pageText += lineItems.map((item: any) => item.str).join(' ') + '\n';
        });

        fullText += `Page ${i}:\n${pageText}\n\n`;
    }

    return fullText;
}

// ─── Low-level Groq Fetch (non-streaming) ────────────────────────────────────
async function groqFetch(messages: any[], model: string, jsonMode = false): Promise<string> {
    const body: any = { model, messages, temperature: 0 };
    if (jsonMode) body.response_format = { type: 'json_object' };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Groq API ${response.status}: ${err?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content as string;
}

// ─── Groq Streaming ──────────────────────────────────────────────────────────
/**
 * Streams a Groq chat response, calling onChunk for each token.
 * This is the primary path for all conversational messages.
 */
async function groqStream(
    messages: any[],
    model: string,
    onChunk: (token: string) => void
): Promise<void> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, temperature: 0.7, stream: true }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Groq Stream ${response.status}: ${err?.error?.message || response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') return;
            try {
                const delta = JSON.parse(data).choices?.[0]?.delta?.content;
                if (delta) onChunk(delta);
            } catch {
                // Malformed SSE chunk — skip
            }
        }
    }
}

// ─── Gemini Provider ──────────────────────────────────────────────────────────
async function generateGeminiResponse(messages: { role: string; content: string }[]): Promise<string> {
    if (!GEMINI_API_KEY) throw new Error('VITE_GEMINI_API_KEY is not set');

    const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

    // Prepend system message as the first user turn if present
    const system = messages.find(m => m.role === 'system');
    if (system) {
        contents.unshift({ role: 'user', parts: [{ text: system.content }] });
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
        }
    );

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Gemini Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text as string;
}

// ─── Bytez Provider ───────────────────────────────────────────────────────────
async function generateBytezResponse(messages: { role: string; content: string }[]): Promise<string> {
    if (!BYTEZ_API_KEY) throw new Error('VITE_BYTEZ_API_KEY is not set');

    const sdk = new Bytez(BYTEZ_API_KEY);
    const model = sdk.model('meta-llama/Llama-3.3-70B-Instruct');
    const { error, output } = await model.run(messages);
    if (error) throw new Error(`Bytez SDK Error: ${error}`);

    if (typeof output === 'string') return output;
    const out = output as any;
    return out.content ?? out.text ?? out?.message?.content ?? JSON.stringify(output);
}

// ─── Provider Router ──────────────────────────────────────────────────────────
async function callProvider(
    messages: any[],
    provider: AIProvider,
    model = GROQ_PARSE_MODEL,
    jsonMode = false
): Promise<string> {
    if (provider === 'gemini') return generateGeminiResponse(messages);
    if (provider === 'bytez') return generateBytezResponse(messages);
    return groqFetch(messages, model, jsonMode);
}

// ─── Parse Grades ─────────────────────────────────────────────────────────────
export async function parseGradesToJSON(
    rawText: string,
    provider: AIProvider = 'groq'
): Promise<StudentGrade[]> {
    if (!rawText?.trim()) throw new Error('No transcript text provided. Please re-upload the PDF.');

    const prompt = `
You are a data extraction assistant.
FIRST determine if the text below is an academic transcript or grade report.
If it is NOT a transcript return ONLY: { "error": "Not a transcript" }

If it IS a transcript, extract all course grades and return a JSON array where each object has:
- "courseCode" (e.g. "CS101")
- "grade" (letter grade or "IP" for In Progress)
- "semesterTerm" (e.g. "Fall 2023")
- "pageNumber" (integer from the "Page X:" markers in the text)

TEXT:
${rawText.substring(0, 30000)}`.trim();

    return withRetry(async () => {
        const content = await callProvider([{ role: 'user', content: prompt }], provider, GROQ_PARSE_MODEL, true);
        const result = safeJsonParse(content);
        if (result.error) throw new Error(result.error);
        return Array.isArray(result) ? result : result.grades ?? result.courses ?? [];
    }, 3, 'parseGrades');
}

// ─── Extract Student Info ─────────────────────────────────────────────────────
export async function extractStudentInfo(
    rawText: string,
    provider: AIProvider = 'groq'
): Promise<{ name?: string; studentId?: string; major?: string; minor?: string; gpa?: number }> {
    const prompt = `
You are a data extraction assistant.
Extract the following from this academic transcript and return ONLY a JSON object with keys:
"name", "studentId", "major", "minor", "gpa".
Set any missing field to null. Do not invent data.

TEXT:
${rawText.substring(0, 15000)}`.trim();

    return withRetry(async () => {
        const content = await callProvider([{ role: 'user', content: prompt }], provider, GROQ_PARSE_MODEL, true);
        return JSON.parse(content);
    }, 3, 'extractStudentInfo');
}

// ─── Parse Bulletin ───────────────────────────────────────────────────────────
export async function parseBulletinToJSON(
    rawText: string,
    provider: AIProvider = 'groq'
): Promise<Course[]> {
    if (!rawText?.trim()) throw new Error('No bulletin text provided. Please re-upload the PDF.');

    const prompt = `
You are a data extraction assistant.
FIRST determine if the text is an academic programme bulletin or course catalog.
If it is NOT a bulletin return ONLY: { "error": "Not a bulletin" }

If it IS a bulletin, extract all courses and return a JSON array where each object has:
- "id" (course code, e.g. "CS101")
- "title" (course name)
- "credits" (number, default 3 if unknown)
- "prerequisites" (array of course code strings)
- "semester" (recommended semester 1-8, estimate if unknown)
- "emphasis" (track name, or "Core" if required for all tracks)

TEXT:
${rawText.substring(0, 50000)}`.trim();

    return withRetry(async () => {
        const content = await callProvider([{ role: 'user', content: prompt }], provider, GROQ_PARSE_MODEL, true);
        const result = safeJsonParse(content);
        if (result.error) throw new Error(result.error);
        return Array.isArray(result) ? result : result.courses ?? result.requirements ?? [];
    }, 3, 'parseBulletin');
}

// ─── Analyze Progress (pure, no async needed) ────────────────────────────────
export function analyzeProgress(
    grades: StudentGrade[],
    bulletin: Course[],
    selectedEmphasis?: string,
    student?: ComprehensiveStudentProfile
): string {
    const completedGrades = grades.filter(g => isPassing(g.grade));
    const failedGrades = grades.filter(g => isFailing(g.grade));
    const completedCodes = new Set(completedGrades.map(g => g.courseCode));

    const sequenceToCheck = bulletin.filter(c =>
        !selectedEmphasis ||
        !c.emphasis ||
        c.emphasis.toLowerCase() === 'core' ||
        c.emphasis.toLowerCase() === selectedEmphasis.toLowerCase()
    );

    const nextCourses: Course[] = [];
    const retakeCourses: Course[] = [];

    for (const course of sequenceToCheck) {
        if (failedGrades.some(g => g.courseCode === course.id)) {
            retakeCourses.push(course);
            continue;
        }
        if (completedCodes.has(course.id)) continue;
        const missingPrereqs = course.prerequisites.filter(req => !completedCodes.has(req));
        if (missingPrereqs.length === 0) nextCourses.push(course);
    }

    const isMock = sequenceToCheck.length === 0 && bulletin.length === 0;

    let analysis = `### 🎓 Academic Advisor Report\n`;
    if (student) {
        analysis += `**Student Name:** ${student.name}  **Student ID:** ${student.student_id}  **Major:** ${student.major}  **Emphasis:** ${selectedEmphasis || 'Not Selected'}  **GPA:** ${student.gpa}\n\n`;
    } else if (selectedEmphasis) {
        analysis += `**Emphasis:** ${selectedEmphasis}\n\n`;
    }

    analysis += `*Source: ${isMock ? 'Incomplete Bulletin Data' : 'Uploaded Bulletin'}*\n\n`;
    analysis += `### ✅ Completed Courses\n\n`;

    if (completedGrades.length > 0) {
        const pages = [...new Set(completedGrades.map(g => g.pageNumber ?? 1))].sort((a, b) => a - b);
        pages.forEach(pageNum => {
            const pageCourses = completedGrades
                .filter(g => (g.pageNumber ?? 1) === pageNum)
                .map(g => g.courseCode);
            if (pageCourses.length > 0) analysis += `**Page ${pageNum}:** ${pageCourses.join(', ')}\n`;
        });
    } else {
        analysis += `*No completed courses identified in the bulletin track.*\n`;
    }

    analysis += `\n`;

    if (failedGrades.length > 0) {
        analysis += `### ⚠️ Immediate Action Required (Retakes)\n`;
        analysis += `You received failing grades in the following courses and must retake them:\n\n`;
        failedGrades.forEach(g => {
            analysis += `- **${g.courseCode}**: Grade **${g.grade}** (${g.semesterTerm})\n`;
        });
        analysis += `\n> [!IMPORTANT]\n`;
        analysis += `> Please consult with your academic advisor, ${student?.advisorName || 'your advisor'}, to create a recovery plan.\n\n`;
    } else {
        analysis += `### ✨ No retakes required based on provided transcript.\n\n`;
    }

    if (nextCourses.length > 0) {
        analysis += `### 📅 Recommended Next Courses\n`;
        const recommended = nextCourses.slice(0, 5);
        let tuitionTotal = 0;
        recommended.forEach(c => {
            const cost = c.credits * 100;
            tuitionTotal += cost;
            analysis += `- **${c.id}: ${c.title}** (${c.credits} Credits) — Cost: $${cost}\n`;
        });
        analysis += `\n**💰 Financial Summary**\n`;
        analysis += `- Semester Tuition Estimate: **$${tuitionTotal}**\n`;
        if (student) {
            analysis += `- Remaining Credits: **${student.totalCredits - student.completedCredits}** / ${student.totalCredits}\n`;
            analysis += `- Expected Graduation: **${student.expected_graduation_date}**\n`;
        }
    } else if (!isMock) {
        analysis += `🎉 **Congratulations!** You have completed all requirements in the ${selectedEmphasis || 'current'} track.\n`;
    }

    return analysis;
}

// ─── Build Context ────────────────────────────────────────────────────────────
/**
 * Builds a lean context string for chat messages.
 * Pre-computes completed, failed, and remaining course lists so the LLM
 * never has to guess — it can read the answer directly from the context.
 */
export function buildChatContext(
    student: ComprehensiveStudentProfile,
    grades: StudentGrade[],
    sequence: Course[],
    analysis: string,
    selectedEmphasis: string
): string {
    const emphases = [...new Set(sequence.map(c => c.emphasis).filter(Boolean))];

    // Pre-compute completion status so the bot never has to guess
    const completedCodes = new Set(
        grades.filter(g => PASSING_GRADE_RE.test(g.grade.trim())).map(g => g.courseCode)
    );
    const failedCodes = new Set(
        grades.filter(g => FAILING_GRADE_RE.test(g.grade.trim())).map(g => g.courseCode)
    );

    const relevantCourses = sequence.filter(c =>
        !selectedEmphasis ||
        !c.emphasis ||
        c.emphasis.toLowerCase() === 'core' ||
        c.emphasis.toLowerCase() === selectedEmphasis.toLowerCase()
    );

    const completedList = relevantCourses
        .filter(c => completedCodes.has(c.id))
        .map(c => `${c.id}: ${c.title}`);
    const failedList = relevantCourses
        .filter(c => failedCodes.has(c.id))
        .map(c => {
            const g = grades.find(g => g.courseCode === c.id && FAILING_GRADE_RE.test(g.grade.trim()));
            return `${c.id}: ${c.title} (Grade: ${g?.grade || 'F'}, ${g?.semesterTerm || 'Unknown Term'})`;
        });
    const remainingList = relevantCourses
        .filter(c => !completedCodes.has(c.id) && !failedCodes.has(c.id))
        .map(c => {
            const prereqStatus = c.prerequisites.length > 0
                ? c.prerequisites.map(p => `${p} ${completedCodes.has(p) ? '✅' : '❌'}`).join(', ')
                : 'None';
            return `${c.id}: ${c.title} (Prerequisites: ${prereqStatus})`;
        });

    return `
[STUDENT PROFILE]
${JSON.stringify(student)}

[SELECTED EMPHASIS]
${selectedEmphasis || 'Not yet selected'}

[AVAILABLE EMPHASES IN BULLETIN]
${emphases.join(', ') || 'None detected'}

[COMPLETED COURSES (from transcript — these courses have passing grades)]
${completedList.length > 0 ? completedList.join('\n') : 'None identified'}

[FAILED COURSES (from transcript — must be retaken)]
${failedList.length > 0 ? failedList.join('\n') : 'None'}

[REMAINING COURSES (in bulletin but NOT on transcript — NOT yet completed)]
${remainingList.length > 0 ? remainingList.join('\n') : 'All courses completed!'}

[FULL TRANSCRIPT DATA (Parsed JSON)]
${JSON.stringify(grades)}

[FULL BULLETIN DATA (Parsed JSON)]
${JSON.stringify(sequence)}

[ANALYSIS REPORT]
${analysis}
`.trim();
}

// ─── Advisor Response (Streaming) ────────────────────────────────────────────
/**
 * Primary chat function. Uses streaming for instant first-token response.
 * Falls back to non-streaming for Gemini/Bytez (they don't support SSE here).
 *
 * @param onChunk  Called with each token as it arrives (for streaming UI updates).
 *                 If omitted, falls back to buffered response (returns full string).
 */
export async function generateAdvisorResponse(
    userMessage: string,
    context: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    provider: AIProvider = 'groq',
    onChunk?: (token: string) => void
): Promise<string> {
    // Limit history to last 10 messages (5 turns) — enough context, not too many tokens
    const recentHistory = history.slice(-10);

    const systemPrompt = `You are an expert Academic Advisor. You MUST follow the rules below with absolute precision.

CRITICAL RULES FOR DETERMINING COURSE COMPLETION:
1. A course is COMPLETED if and ONLY if it appears in [COMPLETED COURSES] with a passing grade (A, B, C, or P).
2. A course is FAILED if it appears in [FAILED COURSES]. The student must retake it.
3. A course is NOT COMPLETED if it appears in [REMAINING COURSES]. This means the student has NOT taken it yet.
4. If a student asks "Did I complete X?" — check ONLY the [COMPLETED COURSES] list. If the course is NOT in that list, the answer is NO, regardless of prerequisites.
5. NEVER say a course is completed just because its prerequisites are done. Prerequisites being done only means the student is ELIGIBLE to take the course, not that they have taken it.
6. When listing what courses remain, use the [REMAINING COURSES] section. Courses with all prerequisites marked ✅ can be taken next. Courses with any ❌ prerequisites cannot be taken yet.

GENERAL RULES:
7. Use ONLY the context data below. Do not invent or assume any information.
8. If information is missing, say so clearly.
9. Always respond in Markdown (bold, bullet lists, headings).
10. Keep answers concise, helpful, and professional.
11. For full reports, use this structure:
    - Header: Name, ID, Major, Emphasis, GPA
    - Completed Courses
    - Failed/Retake Requirements
    - Remaining Courses (grouped by eligibility)
    - Recommendations & Next Steps

CONTEXT:
${context}`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user', content: userMessage },
    ];

    // ── Groq: streaming path ──────────────────────────────────────────────────
    if (provider === 'groq') {
        if (onChunk) {
            // Stream tokens directly to the UI callback
            await withRetry(
                () => groqStream(messages, GROQ_CHAT_MODEL, onChunk),
                3,
                'advisorStream'
            );
            return ''; // content was delivered via onChunk
        } else {
            // Buffered fallback (e.g. server-side use)
            return withRetry(
                () => groqFetch(messages, GROQ_CHAT_MODEL),
                3,
                'advisorFetch'
            );
        }
    }

    // ── Gemini / Bytez: non-streaming fallback ────────────────────────────────
    try {
        const text = provider === 'gemini'
            ? await generateGeminiResponse(messages)
            : await generateBytezResponse(messages);
        onChunk?.(text); // deliver entire response as one chunk if callback provided
        return text;
    } catch (error) {
        console.error(`[ai-agent] ${provider} provider error:`, error);
        const msg = `I'm having trouble connecting to ${provider}. Please try again or switch providers.`;
        onChunk?.(msg);
        return msg;
    }
}

// ─── Parallel Document Processing ────────────────────────────────────────────
/**
 * Processes transcript and bulletin in parallel, then builds the analysis.
 * This replaces the old sequential flow and cuts document processing time ~50%.
 */
export async function processDocuments(
    transcriptText: string,
    bulletinText: string,
    selectedEmphasis: string,
    student: ComprehensiveStudentProfile,
    provider: AIProvider = 'groq'
): Promise<{
    grades: StudentGrade[];
    sequence: Course[];
    analysis: string;
    chatContext: string;
}> {
    // Parse both documents simultaneously — no dependency between them
    const [grades, sequence] = await Promise.all([
        parseGradesToJSON(transcriptText, provider),
        parseBulletinToJSON(bulletinText, provider),
    ]);

    // analyzeProgress is now synchronous — no await needed
    const analysis = analyzeProgress(grades, sequence, selectedEmphasis, student);
    const chatContext = buildChatContext(student, grades, sequence, analysis, selectedEmphasis);

    return { grades, sequence, analysis, chatContext };
}
