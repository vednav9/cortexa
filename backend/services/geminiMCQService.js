/**
 * Gemini MCQ Generation Service
 *
 * Pipeline:
 *  Document mode → fetch public PDF URLs → send to Gemini as inline PDF data
 *  Topic mode    → fetch ALL course document URLs → send all to Gemini
 *
 * Gemini 1.5 Flash can natively read PDF content, so we just pass the file bytes.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set in environment variables");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Supported MIME types Gemini can read natively
const MIME_MAP = {
    pdf:  "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt:  "text/plain",
};

/**
 * Fetch a file from a URL and return it as base64 + mimeType.
 */
async function fetchFileAsBase64(url, fileType = "pdf") {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s per file

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { "User-Agent": "Cortexa-MCQ-Generator/1.0" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);

        const arrayBuffer = await res.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = MIME_MAP[String(fileType).toLowerCase()] || "application/pdf";
        return { base64, mimeType };
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Build the MCQ generation prompt.
 */
function buildPrompt(topic, numQuestions, difficulty) {
    const diffHint = {
        easy:   "straightforward definitions and core facts",
        medium: "applied understanding and concept connections",
        hard:   "analysis, edge cases, and critical thinking",
    }[difficulty] || "applied understanding";

    return `You are an expert exam question writer. Using ONLY the content from the document(s) provided, generate exactly ${numQuestions} multiple-choice questions.

Topic focus (if any): ${topic || "All topics in the document"}
Difficulty: ${difficulty.toUpperCase()} (${diffHint})

STRICT RULES:
- Base every question ONLY on the document content — do NOT use outside knowledge
- Question: maximum 15 words, must end with "?"
- Each option (A/B/C/D): 1–4 words only, no full sentences
- Only one correct answer per question
- Options must be clearly distinct from each other

OUTPUT FORMAT — respond with ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "question": "What is ...?",
    "options": { "A": "term1", "B": "term2", "C": "term3", "D": "term4" },
    "correct_answer": "A",
    "difficulty": "${difficulty}"
  }
]

Generate ${numQuestions} questions now:`;
}

/**
 * Parse Gemini's text output into a clean MCQ array.
 */
function parseGeminiResponse(text, numQuestions, difficulty) {
    // Strip any markdown code fences
    const cleaned = text
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

    let parsed = [];

    // Try JSON parse
    try {
        const json = JSON.parse(cleaned);
        parsed = Array.isArray(json) ? json : [];
    } catch (_) {
        // Attempt to extract JSON array substring
        const match = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) {
            try {
                parsed = JSON.parse(match[0]);
            } catch (_2) {
                parsed = [];
            }
        }
    }

    // Normalize each MCQ into the format the frontend expects
    return parsed
        .filter((q) => q && q.question)
        .map((q) => {
            const opts = q.options || {};
            const correctRaw = String(q.correct_answer || q.correctAnswer || "A").trim().toUpperCase();
            const correct = /^[A-D]$/.test(correctRaw) ? correctRaw : "A";

            return {
                question: String(q.question || "").trim(),
                options:  {
                    A: String(opts.A || opts.a || "Option A").trim(),
                    B: String(opts.B || opts.b || "Option B").trim(),
                    C: String(opts.C || opts.c || "Option C").trim(),
                    D: String(opts.D || opts.d || "Option D").trim(),
                },
                correct_answer: correct,
                difficulty: String(q.difficulty || difficulty).toLowerCase(),
            };
        })
        .slice(0, numQuestions);
}

/**
 * Main entry point.
 *
 * @param {object} params
 * @param {Array<{url: string, fileType: string, name: string}>} params.documents
 * @param {string}  params.topic
 * @param {number}  params.numQuestions
 * @param {string}  params.difficulty
 * @returns {Promise<Array>} Array of MCQ objects
 */
export async function generateMCQsWithGemini({ documents, topic, numQuestions, difficulty }) {
    if (!documents || documents.length === 0) {
        throw new Error("No documents provided for MCQ generation.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


    // Build parts: each document as inline PDF data
    const fileParts = [];
    const failedDocs = [];

    for (const doc of documents) {
        if (!doc.url) continue;
        try {
            console.log(`📄 Fetching document for Gemini: ${doc.name || doc.url}`);
            const { base64, mimeType } = await fetchFileAsBase64(doc.url, doc.fileType || "pdf");
            fileParts.push({
                inlineData: { mimeType, data: base64 },
            });
            console.log(`✅ Loaded: ${doc.name} (${mimeType})`);
        } catch (err) {
            console.warn(`⚠️ Could not load document "${doc.name}": ${err.message}`);
            failedDocs.push(doc.name);
        }
    }

    if (fileParts.length === 0) {
        throw new Error(
            `Could not load any documents. Failed: ${failedDocs.join(", ")}`
        );
    }

    const promptText = buildPrompt(topic, numQuestions, difficulty);

    const contents = [{
        role: "user",
        parts: [...fileParts, { text: promptText }],
    }];

    console.log(`🤖 Calling Gemini with ${fileParts.length} document(s), requesting ${numQuestions} MCQs...`);

    const result = await model.generateContent({
        contents,
        generationConfig: {
            temperature: 0.4,
            maxOutputTokens: numQuestions * 150 + 200,
        },
    });

    const responseText = result.response.text();
    console.log("📝 Gemini raw response (first 300 chars):", responseText.slice(0, 300));

    const mcqs = parseGeminiResponse(responseText, numQuestions, difficulty);
    console.log(`✅ Parsed ${mcqs.length} MCQs from Gemini response`);

    return mcqs;
}
