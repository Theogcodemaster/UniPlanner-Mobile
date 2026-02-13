import * as pdfjsLib from 'pdfjs-dist';
import { COMPUTER_SCIENCE_SEQUENCE, Course } from '../data/course-sequence';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "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";

interface StudentGrade {
    courseCode: string;
    grade: string; // 'A', 'B', 'C', 'D', 'F', 'IP' (In Progress)
    semesterTerm: string; // e.g., "Fall 2023"
}

export interface AdvisorResponse {
    message: string;
    context?: any;
}

/**
 * Extracts raw text from a PDF file using PDF.js
 */
export async function extractPdfText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `Page ${i}:\n${pageText}\n\n`;
    }

    return fullText;
}

/**
 * Uses Groq LLM to parse raw text into structured JSON grades
 */
export async function parseGradesToJSON(rawText: string): Promise<StudentGrade[]> {
    const prompt = `
    You are a data extraction assistant. 
    FIRST, determine if the following text is an academic transcript or grade report.
    If it is NOT a transcript (e.g., if it's a research paper, syllabus, or random text), return ONLY: { "error": "Not a transcript" }
    
    If it IS a transcript, extract student grades and return a JSON array of objects with the fields: 
    "courseCode" (e.g., "CS101"), "grade" (Letter grade or "IP"), and "semesterTerm".
    Ignore non-course text.
    
    TEXT:
    ${rawText.substring(0, 15000)}
  `;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const jsonResult = JSON.parse(content);

        if (jsonResult.error) {
            throw new Error(jsonResult.error);
        }

        return Array.isArray(jsonResult) ? jsonResult : jsonResult.grades || jsonResult.courses || [];
    } catch (error: any) {
        console.error("Error parsing grades:", error);
        if (error.message.includes("Not a transcript")) {
            throw new Error("The uploaded file does not appear to be an academic transcript.");
        }
        return [];
    }
}

/**
 * Extracts Student Info (Name, Major, ID, GPA) from transcript text
 */
export async function extractStudentInfo(rawText: string): Promise<{ name?: string; studentId?: string; major?: string; minor?: string; gpa?: number }> {
    const prompt = `
    You are a data extraction assistant.
    Extract the following details from the academic transcript text provided below:
    1. Student Name (Full Name)
    2. Student ID (10-digit number if available)
    3. Major / Programme
    4. Minor (if any)
    5. Cumulative GPA (Look for "Cumulative GPA", "CGPA", or "Overall GPA". It is usually a number between 0.00 and 4.00)

    Return ONLY a JSON object with keys: "name", "studentId", "major", "minor", "gpa".
    If a field is not found, set it to null.
    Do not invent data.

    TEXT:
    ${rawText.substring(0, 15000)}
  `;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error(`Groq API Error: ${response.statusText}`);

        const data = await response.json();
        const content = data.choices[0].message.content;
        const result = JSON.parse(content);

        return result;
    } catch (error) {
        console.error("Error extracting student info:", error);
        return {};
    }
}

/**
 * Parses the Programme Bulletin PDF to extract course requirements
 */
export async function parseBulletinToJSON(rawText: string): Promise<Course[]> {
    const prompt = `
    You are a data extraction assistant. 
    FIRST, determine if the following text is an academic programme bulletin, curriculum sequence, or course catalog.
    If it is NOT a bulletin (e.g., if it's a transcript, essay, or random text), return ONLY: { "error": "Not a bulletin" }

    If it IS a bulletin, extract course requirements and return a JSON array of objects with the fields: 
    - "id" (Course Code, e.g., "CS101")
    - "title" (Course Name)
    - "credits" (Number, default to 3 if unknown)
    - "prerequisites" (Array of strings, e.g., ["CS101"])
    - "semester" (Recommended semester number 1-8, estimate if unknown)

    TEXT:
    ${rawText.substring(0, 20000)}
  `;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const jsonResult = JSON.parse(content);

        if (jsonResult.error) {
            throw new Error(jsonResult.error);
        }

        return Array.isArray(jsonResult) ? jsonResult : jsonResult.courses || jsonResult.requirements || [];
    } catch (error: any) {
        console.error("Error parsing bulletin:", error);
        if (error.message.includes("Not a bulletin")) {
            throw new Error("The uploaded file does not appear to be a programme bulletin.");
        }
        return [];
    }
}

/**
 * Analyzes progress by comparing Transcript vs Bulletin
 */
export async function analyzeProgress(grades: StudentGrade[], bulletin: Course[]): Promise<string> {
    // 1. Identify completed courses (Grade C or better)
    const completedStats = new Set(
        grades
            .filter(g => ['A', 'B', 'C', 'P'].some(pass => g.grade.startsWith(pass)))
            .map(g => g.courseCode)
    );

    const failedCourses = grades
        .filter(g => ['D', 'F', 'NP'].some(fail => g.grade.startsWith(fail)))
        .map(g => g.courseCode);

    // 2. Check Sequence from Bulletin
    const nextCourses: Course[] = [];
    const retakeCourses: Course[] = [];

    // Use Bulletin data instead of mock data
    const sequenceToCheck = bulletin.length > 0 ? bulletin : COMPUTER_SCIENCE_SEQUENCE;

    for (const course of sequenceToCheck) {
        // Check for Retakes
        if (failedCourses.includes(course.id)) {
            retakeCourses.push(course);
            continue; // Don't recommend as "new" if it's a retake
        }

        if (completedStats.has(course.id)) continue;

        // Check Logic: Prerequisites
        const missingPrereqs = course.prerequisites.filter(req => !completedStats.has(req));

        if (missingPrereqs.length === 0) {
            nextCourses.push(course);
        }
    }

    // 3. Generate Analysis Message
    let analysis = `### 🎓 Academic Advisor Report\n\n`;

    // Reasoning / Status
    analysis += `**Status:** You have completed ${completedStats.size} courses from the bulletin.\n\n`;

    if (retakeCourses.length > 0) {
        analysis += `### ⚠️ Immediate Action Required (Retakes)\n`;
        analysis += `You obtained low grades in the following courses. You must retake them to proceed:\n`;
        retakeCourses.forEach(c => {
            analysis += `- **${c.id}: ${c.title}** (${c.credits} Credits) - Cost: $${c.credits * 100}\n`;
        });
        analysis += `**Total Retake Cost:** $${retakeCourses.reduce((sum, c) => sum + (c.credits * 100), 0)}\n\n`;
    }

    if (nextCourses.length > 0) {
        analysis += `### ✅ Recommended Next Courses\n`;
        analysis += `Based on the bulletin and your completed prerequisites, here is your recommended schedule:\n`;

        const recommended = nextCourses.slice(0, 5);
        let totalCost = 0;

        recommended.forEach(c => {
            const cost = c.credits * 100;
            totalCost += cost;
            analysis += `- **${c.id}: ${c.title}** (${c.credits} Credits) - Cost: $${cost}\n`;
        });

        const totalRetakeCost = retakeCourses.reduce((sum, c) => sum + (c.credits * 100), 0);

        analysis += `\n**💰 Financial Breakdown**\n`;
        analysis += `- Semester Tuition (approx 5 courses): $${totalCost}\n`;
        if (totalRetakeCost > 0) analysis += `- + Retake Fees: $${totalRetakeCost}\n`;
        analysis += `- **Estimated Total:** $${totalCost + totalRetakeCost}\n`;

    } else {
        analysis += `🎉 **Congratulations!**\nYou seem to have completed all requirements in the uploaded bulletin.\n`;
    }

    return analysis;
}

/**
 * General Chat with context
 */
export async function generateAdvisorResponse(
    userMessage: string,
    context: string,
    history: { role: 'user' | 'assistant', content: string }[]
): Promise<string> {

    // Keep history short
    const recentHistory = history.slice(-4);

    const messages = [
        {
            role: "system",
            content: `You are an academic advisor. Answer the student's question based ONLY on the provided context (their extracted grades and analysis).
        
        CONTEXT:
        ${context}
        
        Be encouraging but firm about prerequisites. Keep answers concise.`
        },
        ...recentHistory,
        { role: "user", content: userMessage }
    ];

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // Updated to current supported model
                messages: messages,
                temperature: 0.7
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        return "I'm having trouble connecting to the AI services. Please try again.";
    }
}
