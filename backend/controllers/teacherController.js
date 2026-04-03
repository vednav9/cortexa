// controllers/teacherController.js
import mongoose from "mongoose"; // Needed for native DB chunk verification
import Teacher from "../models/teacher.js";
import Student from "../models/student.js";
import Admin from "../models/admin.js";
import Course from "../models/course.js";
import Document from "../models/document.js";
import DocumentChunk from "../models/documentChunk.js";
import EmbeddingStore from "../models/embeddingStore.js";
import MCQSet from "../models/mcqSet.js";
import MCQAttempt from "../models/mcqAttempt.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { cookieOptions } from "../utils/cookieOptions.js";
import { uploadToR2, deleteFromR2 } from "../services/cloudflareR2.js";
import aiService from "../services/aiService.js";
import { generateMCQsWithGemini } from "../services/geminiMCQService.js";

const stripQuestionPrefix = (question = "") =>
    String(question)
        .replace(/^\s*(Q|Question)\s*\d+\s*[:.)-]\s*/i, "")
        .trim();

// Trim text to a maximum number of words
const trimToWords = (text = "", maxWords = 10) => {
    const str = String(text || "").trim();
    const words = str.split(/\s+/).filter(Boolean);
    return words.length <= maxWords ? str : words.slice(0, maxWords).join(" ");
};

const _CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;

const sanitizeReadableText = (value = "") =>
    String(value || "")
        .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const isLikelyReadableEnglish = (text = "") => {
    const cleaned = sanitizeReadableText(text);
    if (!cleaned || cleaned.length < 8) return false;
    if (_CJK_RE.test(cleaned)) return false;

    const alnum = (cleaned.match(/[A-Za-z0-9]/g) || []).length;
    const ratio = alnum / Math.max(1, cleaned.length);
    return ratio >= 0.4;
};

const normalizeOptions = (options, fallback = {}) => {
    if (Array.isArray(options)) {
        // Sanitize each option but do NOT filter by isLikelyReadableEnglish
        // (short valid answers like 'Yes', 'No', 'True', 'False' would be rejected)
        const result = options
            .map((o) => sanitizeReadableText(String(o ?? "")))
            .filter((opt) => opt.length > 0);
        if (result.length >= 4) return result.slice(0, 4);
        // Pad with fallbacks if fewer than 4
        const padded = [
            ...result,
            sanitizeReadableText(fallback.option_a ?? "Option A"),
            sanitizeReadableText(fallback.option_b ?? "Option B"),
            sanitizeReadableText(fallback.option_c ?? "Option C"),
            sanitizeReadableText(fallback.option_d ?? "Option D"),
        ];
        return padded.slice(0, 4);
    }

    if (options && typeof options === "object") {
        return [
            sanitizeReadableText(String(options.A ?? options.a ?? fallback.option_a ?? "Option A")),
            sanitizeReadableText(String(options.B ?? options.b ?? fallback.option_b ?? "Option B")),
            sanitizeReadableText(String(options.C ?? options.c ?? fallback.option_c ?? "Option C")),
            sanitizeReadableText(String(options.D ?? options.d ?? fallback.option_d ?? "Option D")),
        ];
    }

    return [
        sanitizeReadableText(String(fallback.option_a ?? "Option A")),
        sanitizeReadableText(String(fallback.option_b ?? "Option B")),
        sanitizeReadableText(String(fallback.option_c ?? "Option C")),
        sanitizeReadableText(String(fallback.option_d ?? "Option D")),
    ];
};

const normalizeCorrectAnswer = (correctAnswer, optionsLength = 4) => {
    const maxIndex = Math.max(0, Math.min(3, (optionsLength || 4) - 1));

    // Handle undefined/null
    if (correctAnswer === undefined || correctAnswer === null) return 0;

    if (typeof correctAnswer === "number" && Number.isFinite(correctAnswer)) {
        return Math.max(0, Math.min(maxIndex, Math.floor(correctAnswer)));
    }

    if (typeof correctAnswer === "string") {
        const raw = correctAnswer.trim().toUpperCase();
        // Letter mapping: A=0, B=1, C=2, D=3
        if (/^[A-D]$/.test(raw)) {
            return raw.charCodeAt(0) - 65;
        }
        const numeric = Number(raw);
        if (Number.isFinite(numeric)) {
            return Math.max(0, Math.min(maxIndex, Math.floor(numeric)));
        }
    }

    return 0;
};

const normalizeMCQ = (mcq, difficulty = "medium") => {
    const options = normalizeOptions(mcq.options, mcq);
    const correctRaw = mcq.correctAnswer ?? mcq.correct_answer;

    // Enforce word limits: question ≤ 10 words, each option ≤ 2 words
    const rawQuestion = sanitizeReadableText(stripQuestionPrefix(mcq.question || "Question"));
    let question = trimToWords(rawQuestion, 10);
    if (question && !question.endsWith("?")) question += "?";

    const limitedOptions = options.map((opt) => trimToWords(opt, 2));

    return {
        question,
        options: limitedOptions,
        correctAnswer: normalizeCorrectAnswer(correctRaw, limitedOptions.length),
        explanation: sanitizeReadableText(mcq.explanation || ""),
        difficulty: ["easy", "medium", "hard"].includes(String(mcq.difficulty || "").toLowerCase())
            ? String(mcq.difficulty).toLowerCase()
            : difficulty,
    };
};

const mergeUniqueMcqs = (mcqs) => {
    const seen = new Set();
    return mcqs.filter((item) => {
        const questionKey = stripQuestionPrefix(item.question).toLowerCase();
        const optionsKey = Array.isArray(item.options)
            ? item.options.map((o) => sanitizeReadableText(o).toLowerCase()).join("|")
            : "";
        const key = `${questionKey}::${optionsKey}`;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const _FALLBACK_STOP_WORDS = new Set([
    "the", "and", "for", "with", "from", "that", "this", "have", "has", "are", "was", "were", "into", "about", "using", "use", "can", "will", "your", "their", "than", "then", "also", "more", "most", "such", "each", "only"
]);

const cleanFactLine = (line = "") =>
    String(line || "")
        .replace(/^\s*\[[^\]]+\]\s*/g, "")
        .replace(/^[\u2022\u25CF\u25AA\u25AB\u00B7\-\*\uF0B7\s]+/g, "")
        .replace(/\s+/g, " ");

const _PROMPT_JUNK_RE = /generate\s+mcq|use the following|reference context|selected documents|topic:\s*generate|\[source:/i;

const extractFactLines = (context = "", limit = 30) => {
    const rawLines = String(context || "")
        .split(/\n+/)
        .map(cleanFactLine)
        .map(sanitizeReadableText)
        .filter((line) => line.length >= 35 && line.length <= 220)
        .filter((line) => isLikelyReadableEnglish(line))
        // Exclude prompt-header fragments that may survive sanitization
        .filter((line) => !/^\[source/i.test(line))
        .filter((line) => !_PROMPT_JUNK_RE.test(line));

    const seen = new Set();
    const deduped = [];
    for (const line of rawLines) {
        const key = line.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(line);
        if (deduped.length >= limit) break;
    }

    return deduped;
};

const keywordStem = (text = "") =>
    String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !_FALLBACK_STOP_WORDS.has(w));

const buildDistractors = (correctFact, allFacts) => {
    const correctTokens = new Set(keywordStem(correctFact));

    const candidates = allFacts
        .filter((fact) => fact !== correctFact)
        .map((fact) => {
            const overlap = keywordStem(fact).filter((t) => correctTokens.has(t)).length;
            return { fact, overlap };
        })
        .sort((a, b) => a.overlap - b.overlap)
        .map((x) => x.fact)
        .slice(0, 6);

    const distractors = [];
    for (const c of candidates) {
        if (distractors.length >= 3) break;
        distractors.push(c.length > 150 ? `${c.slice(0, 147)}...` : c);
    }

    while (distractors.length < 3) {
        distractors.push([
            "It avoids using statistics, machine learning, and domain knowledge.",
            "It focuses only on storing data and not on extracting insights.",
            "It does not require data quality checks or preprocessing.",
        ][distractors.length]);
    }

    return distractors;
};

const shuffleOptions = (options, correctIndex = 0) => {
    const items = options.map((text, idx) => ({ text, isCorrect: idx === correctIndex }));
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    return {
        options: items.map((x) => x.text),
        correctAnswer: items.findIndex((x) => x.isCorrect),
    };
};

const buildFallbackMcqs = (context, count, difficulty = "medium") => {
    const facts = extractFactLines(context, 40);
    const fallback = [];

    for (let i = 0; i < count; i++) {
        const fact = facts[i] || facts[0] || `Core concept ${i + 1} is important for understanding this topic.`;
        const clippedFact = fact.length > 170 ? `${fact.slice(0, 167)}...` : fact;
        const distractors = buildDistractors(fact, facts);
        const packed = shuffleOptions([clippedFact, ...distractors], 0);

        fallback.push({
            question: `According to the selected study material, which statement is correct? (${i + 1})`,
            options: packed.options,
            correctAnswer: packed.correctAnswer,
            explanation: "This option is directly supported by the selected notes context.",
            difficulty,
        });
    }

    return fallback;
};

const withTimeout = async (promise, timeoutMs, label = "Operation") => {
    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
            reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)} seconds`));
        }, timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        clearTimeout(timeoutHandle);
    }
};

const getMcqTimeoutProfile = (count, difficulty = "medium", sourceType = "topic") => {
    const countBucket = Number(count) <= 5 ? 5 : Number(count) <= 10 ? 10 : 15;
    const primaryTimeoutMs = 600_000; // 10 minutes
    const topUpTimeoutMs = 300_000; // 5 minutes
    const retrievalTimeoutMs = sourceType === "document" ? 120_000 : 30_000;

    return {
        countBucket,
        primaryTimeoutMs,
        topUpTimeoutMs,
        retrievalTimeoutMs,
    };
};

const buildTopicWebContext = async (topic) => {
    const safeTopic = String(topic || "").trim();
    if (!safeTopic) return "";

    try {
        const webResult = await aiService.queryHybridAssistant(
            `Provide concise study notes with key facts, definitions, and examples for: ${safeTopic}`,
            true
        );

        const answer = String(webResult?.answer || "").trim();
        const sources = Array.isArray(webResult?.sources) ? webResult.sources : [];
        const sourceSnippets = sources
            .map((s) => `${s?.title || "Source"}: ${String(s?.snippet || s?.content || "").trim()}`)
            .filter((x) => x.length > 12)
            .slice(0, 4)
            .join("\n");

        const combined = `${answer}\n${sourceSnippets}`.trim();
        if (combined.length > 80) {
            return combined.slice(0, 5000);
        }
    } catch (_) {
        // Fall through to lightweight fallback prompt context.
    }

    return `Topic: ${safeTopic}`;
};

const cosineSimilarity = (a = [], b = []) => {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) return 0;
    const len = Math.min(a.length, b.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < len; i++) {
        const av = Number(a[i]) || 0;
        const bv = Number(b[i]) || 0;
        dot += av * bv;
        normA += av * av;
        normB += bv * bv;
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
};

const buildRelevantDocumentContextFromMongo = async ({
    teacherId,
    courseId,
    documentIds = [],
    queryText = "",
    maxChunks = 22,
}) => {
    const requestedDocIds = Array.from(new Set(
        (Array.isArray(documentIds) ? documentIds : [])
            .map((id) => String(id || "").trim())
            .filter((id) => Boolean(id) && mongoose.Types.ObjectId.isValid(id))
    ));

    if (requestedDocIds.length === 0) {
        return { contextText: "", sourceMeta: "" };
    }

    const documents = await Document.find({
        _id: { $in: requestedDocIds },
        course: courseId,
        uploadedBy: teacherId,
    }).select("_id originalName fileName").lean();

    if (!documents.length) {
        return { contextText: "", sourceMeta: "" };
    }

    const allowedDocIds = documents.map((doc) => doc._id);
    const docNameMap = new Map(
        documents.map((doc) => [
            String(doc._id),
            String(doc.originalName || doc.fileName || "Document").trim(),
        ])
    );

    const embeddingRows = await EmbeddingStore.find({
        documentId: { $in: allowedDocIds },
    })
        .select("documentId chunkId text embedding metadata createdAt")
        .limit(1200)
        .lean();

    if (!embeddingRows.length) {
        return { contextText: "", sourceMeta: "" };
    }

    let queryEmbedding = null;
    if (String(queryText || "").trim()) {
        queryEmbedding = await aiService.embedText(String(queryText || "").trim());
    }

    const rowsWithScore = embeddingRows.map((row) => {
        const score = (queryEmbedding && Array.isArray(row.embedding) && row.embedding.length > 0)
            ? cosineSimilarity(queryEmbedding, row.embedding)
            : 0;
        return { ...row, _score: Number.isFinite(score) ? score : 0 };
    });

    rowsWithScore.sort((a, b) => b._score - a._score);
    const picked = rowsWithScore.slice(0, maxChunks);

    const missingChunkIds = picked
        .filter((row) => !String(row.text || "").trim() && row.chunkId)
        .map((row) => row.chunkId)
        .filter((id) => mongoose.Types.ObjectId.isValid(String(id)));

    const chunkTextMap = new Map();
    if (missingChunkIds.length > 0) {
        const chunkRows = await DocumentChunk.find({ _id: { $in: missingChunkIds } })
            .select("_id text")
            .lean();
        for (const row of chunkRows) {
            chunkTextMap.set(String(row._id), String(row.text || "").trim());
        }
    }

    const contextParts = [];
    const sourceNames = new Set();

    for (const row of picked) {
        const docId = String(row.documentId || "");
        const sourceName = docNameMap.get(docId) || row?.metadata?.fileName || "Document";
        const text = String(row.text || chunkTextMap.get(String(row.chunkId || "")) || "").trim();
        if (!text) continue;

        sourceNames.add(sourceName);
        contextParts.push(`[Source: ${sourceName}]\n${text}`);
    }

    return {
        contextText: contextParts.join("\n\n").slice(0, 12000),
        sourceMeta: Array.from(sourceNames).join(", "),
    };
};

const buildDocumentChunkContext = async ({ documentId, documentName, teacherId, courseId }) => {
    let document = null;

    if (documentId) {
        document = await Document.findOne({
            _id: documentId,
            course: courseId,
            // FIX: Removed 'uploadedBy: teacherId' so any authorized teacher can generate from course docs
        });
    }

    if (!document && documentName) {
        const requestedName = String(documentName || "").trim();
        const requestedStem = requestedName.includes(".")
            ? requestedName.split(".").slice(0, -1).join(".").trim()
            : "";
        const nameCandidates = Array.from(new Set([requestedName, requestedStem].filter(Boolean)));
        const nameClauses = nameCandidates.flatMap((name) => {
            const safe = escapeRegex(name);
            return [
                { originalName: { $regex: `^${safe}$`, $options: "i" } },
                { fileName: { $regex: `^${safe}$`, $options: "i" } },
            ];
        });

        document = await Document.findOne({
            course: courseId,
            ...(nameClauses.length ? { $or: nameClauses } : {}),
        }).sort({ createdAt: -1 });
    }

    if (!document) {
        throw new Error("Selected document not found for this course.");
    }

    const chunks = await DocumentChunk.find({ document: document._id })
        .sort({ chunkIndex: 1 })
        .limit(25)
        .select("text chunkIndex");

    let text = chunks
        .map((chunk) => String(chunk.text || "").trim())
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 8000);

    // Fallback when model-linked chunks are missing: read native proxy chunks.
    if (!text) {
        try {
            const { chunksCollection } = getNativeVectorCollections();
            const query = buildChunkQuery({
                sourceCandidates: buildSourceCandidates(document, [documentName]),
                institutionId: document?.institution,
                courseId: document?.course,
            });
            const nativeChunks = await chunksCollection
                .find(query, { projection: { text: 1, metadata: 1 } })
                .sort({ "metadata.chunk_index": 1 })
                .limit(25)
                .toArray();

            const normalized = nativeChunks
                .map((c) => String(c?.text || "").trim())
                .filter(Boolean);
            text = normalized.join("\n\n").slice(0, 8000);
        } catch (_) {
            // Keep text empty and let caller fallback to broad topic context.
        }
    }

    if (!text) {
        text = `Document title: ${document.originalName || document.fileName || documentName || "Uploaded document"}`;
    }

    return {
        document,
        contextText: text,
    };
};

const expandDocumentNameCandidates = (name) => {
    const base = String(name || "").trim();
    if (!base) return [];

    const noExt = base.replace(/\.[^.]+$/, "");
    const withHyphen = base.replace(/[\u2010-\u2015]/g, "-");
    const withEnDash = base.replace(/-/g, "\u2013");
    const noExtHyphen = noExt.replace(/[\u2010-\u2015]/g, "-");
    const noExtEnDash = noExt.replace(/-/g, "\u2013");

    return [base, noExt, withHyphen, withEnDash, noExtHyphen, noExtEnDash]
        .map((v) => String(v || "").trim())
        .filter(Boolean);
};

const persistDocumentVectorsToMongo = async (document, preferredNames = []) => {
    const normalizeDocumentKey = (value) =>
        String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[\u2010-\u2015]/g, "-")
            .replace(/\.[^.]+$/, "");

    const persistFromChunksPayload = async (chunks, embeddingModel, sourceName = "") => {
        const normalizedChunks = Array.isArray(chunks) ? chunks : [];

        if (!normalizedChunks.length) {
            return { chunkCount: 0, embeddingCount: 0, sourceName };
        }

        await Promise.all([
            DocumentChunk.deleteMany({ document: document._id }),
            EmbeddingStore.deleteMany({ documentId: document._id }),
        ]);

        const chunkDocs = normalizedChunks.map((chunk, i) => {
            const metadata = chunk?.metadata || {};
            const embedding = Array.isArray(chunk?.embedding)
                ? chunk.embedding.map((value) => Number(value)).filter((n) => Number.isFinite(n))
                : [];

            return {
                document: document._id,
                chunkIndex: Number.isFinite(Number(metadata?.chunk_index))
                    ? Number(metadata.chunk_index)
                    : i,
                text: String(chunk?.text || "").trim(),
                embedding,
                embeddingModel: embeddingModel || 'paraphrase-MiniLM-L3-v2',
                metadata: {
                    institution_id: document.institution?.toString() ?? '',
                    course_id: document.course?.toString() ?? '',
                    fileName: document.originalName,
                    fileType: document.fileType,
                    uploadedBy: document.uploadedBy?.toString() ?? '',
                },
            };
        }).filter((doc) => doc.text.length > 0);

        const insertedChunks = chunkDocs.length
            ? await DocumentChunk.insertMany(chunkDocs, { ordered: false })
            : [];

        const embeddingDocs = insertedChunks.map((chunkDoc) => ({
            documentId: document._id,
            chunkId: chunkDoc._id,
            text: chunkDoc.text,
            embedding: Array.isArray(chunkDoc.embedding) ? chunkDoc.embedding : [],
            embeddingDimension: Array.isArray(chunkDoc.embedding) ? chunkDoc.embedding.length : 0,
            embeddingModel: chunkDoc.embeddingModel || 'paraphrase-MiniLM-L3-v2',
            metadata: {
                institution_id: document.institution?.toString() ?? '',
                course_id: document.course?.toString() ?? '',
                fileName: document.originalName,
                fileType: document.fileType,
                uploadedBy: document.uploadedBy?.toString() ?? '',
            },
        }));

        if (embeddingDocs.length) {
            await EmbeddingStore.insertMany(embeddingDocs, { ordered: false });
        }

        const persistedChunkCount = await DocumentChunk.countDocuments({ document: document._id });
        const persistedEmbeddingCount = await EmbeddingStore.countDocuments({ documentId: document._id });

        if (normalizedChunks.length > 0 && persistedChunkCount === 0) {
            throw new Error("Chunk persistence verification failed: no DocumentChunk rows were saved.");
        }

        return {
            chunkCount: persistedChunkCount,
            embeddingCount: persistedEmbeddingCount,
            sourceName,
        };
    };

    const tryRecoverFromMongoAiStore = async (candidateNames) => {
        const db = mongoose.connection?.db;
        if (!db) return null;

        const chunksCollection = db.collection("documentchunks");
        const embeddingsCollection = db.collection("embeddingstores");

        const chunkRows = await chunksCollection.find(
            {
                "metadata.institution_id": document.institution?.toString?.() ?? "",
                "metadata.course_id": document.course?.toString?.() ?? "",
            },
            {
                projection: {
                    chunk_id: 1,
                    text: 1,
                    metadata: 1,
                },
            }
        ).toArray();

        if (!chunkRows.length) return null;

        const candidateSet = new Set(candidateNames.map((name) => normalizeDocumentKey(name)).filter(Boolean));
        const matchedChunks = chunkRows.filter((row) => {
            const source = row?.metadata?.source || row?.metadata?.fileName || row?.metadata?.file_name || "";
            return candidateSet.has(normalizeDocumentKey(source));
        });

        if (!matchedChunks.length) return null;

        const chunkIds = matchedChunks
            .map((row) => String(row?.chunk_id || "").trim())
            .filter(Boolean);

        const embeddingRows = await embeddingsCollection.find(
            { chunk_id: { $in: chunkIds } },
            { projection: { chunk_id: 1, embedding: 1 } }
        ).toArray();

        const embeddingMap = new Map(
            embeddingRows.map((row) => [String(row?.chunk_id || ""), Array.isArray(row?.embedding) ? row.embedding : []])
        );

        const normalized = matchedChunks
            .map((row, index) => ({
                text: String(row?.text || "").trim(),
                embedding: embeddingMap.get(String(row?.chunk_id || "")) || [],
                metadata: {
                    ...(row?.metadata || {}),
                    chunk_index: Number.isFinite(Number(row?.metadata?.chunk_index))
                        ? Number(row.metadata.chunk_index)
                        : index,
                },
            }))
            .filter((row) => row.text.length > 0 && Array.isArray(row.embedding) && row.embedding.length > 0);

        if (!normalized.length) return null;

        return persistFromChunksPayload(normalized, 'paraphrase-MiniLM-L3-v2', 'mongo-ai-fallback');
    };

    const seedChunks = Array.isArray(preferredNames?.seedChunks) ? preferredNames.seedChunks : [];
    const seedEmbeddingModel = preferredNames?.seedEmbeddingModel || 'paraphrase-MiniLM-L3-v2';
    if (seedChunks.length > 0) {
        return persistFromChunksPayload(seedChunks, seedEmbeddingModel, "upload-response");
    }

    const rawNames = [
        ...(Array.isArray(preferredNames) ? preferredNames : []),
        document?.originalName,
        document?.fileName,
        document?.fileName && document?.fileType ? `${document.fileName}.${document.fileType}` : null,
    ];

    const candidateNames = Array.from(new Set(
        rawNames.flatMap((name) => expandDocumentNameCandidates(name))
    ));

    const chunkQuery = buildChunkQuery({
        sourceCandidates,
        institutionId: document?.institution,
        courseId: document?.course,
    });

    const chunkRows = await chunksCollection
        .find(chunkQuery, { projection: { chunk_id: 1, metadata: 1 } })
        .sort({ "metadata.chunk_index": 1 })
        .toArray();

    if (!chunksData) {
        const mongoRecovered = await tryRecoverFromMongoAiStore(candidateNames);
        if (mongoRecovered) {
            return mongoRecovered;
        }

        console.error("Chunk persistence lookup failed", {
            documentId: String(document?._id || ""),
            sourceCandidates,
            chunkQuery,
        });
        throw new Error(`No chunks available in AI store for document names: ${candidateNames.join(", ")}`);
    }

    const chunks = Array.isArray(chunksData.chunks) ? chunksData.chunks : [];
    return persistFromChunksPayload(chunks, chunksData?.embedding_model || 'paraphrase-MiniLM-L3-v2', usedName || '');
};





/* =========================
   REGISTER TEACHER
========================= */
export const registerTeacher = async (req, res) => {
    try {
        const { fullName, email, password, username } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (!username || username.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Username is required",
            });
        }

        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({
                success: false,
                message: "Teacher already exists",
            });
        }

        // Check if username is already taken
        const existingUsername = await Teacher.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: "Username already exists",
            });
        }

        const teacher = await Teacher.create({
            fullName,
            email,
            password,
            username,
            role: "teacher",
        });

        const token = generateToken({
            id: teacher._id,
            role: "teacher",
            name: teacher.fullName,
            email: teacher.email
        });

        res.cookie("token", token, cookieOptions);

        res.status(201).json({
            success: true,
            user: {
                id: teacher._id,
                _id: teacher._id,
                name: teacher.fullName,
                email: teacher.email,
                role: teacher.role,
            },
        });
    } catch (error) {
        console.error("Register Teacher Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during registration",
        });
    }
};

/* =========================
   LOGIN TEACHER
========================= */
export const loginTeacher = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const teacher = await Teacher.findOne({ 
            $or: [{ email }, { username: email }] 
        }).select("+password");
        
        if (!teacher) {
            // Check if email/username exists in other roles
            const student = await Student.findOne({ 
                $or: [{ email }, { username: email }] 
            });
            if (student) {
                return res.status(400).json({
                    success: false,
                    message: "This account is registered as a Student. Please select Student role.",
                });
            }

            const admin = await Admin.findOne({ 
                $or: [{ email }, { username: email }] 
            });
            if (admin) {
                return res.status(400).json({
                    success: false,
                    message: "This account is registered as an Admin. Please select Admin role.",
                });
            }

            return res.status(404).json({
                success: false,
                message: "Invalid email/username or password",
            });
        }

        const isMatch = await bcrypt.compare(password, teacher.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email/username or password",
            });
        }

        const token = generateToken({
            id: teacher._id,
            role: "teacher",
            name: teacher.fullName,
            email: teacher.email
        });

        res.cookie("token", token, cookieOptions);

        res.status(200).json({
            success: true,
            user: {
                id: teacher._id,
                _id: teacher._id,
                name: teacher.fullName,
                email: teacher.email,
                role: teacher.role,
            },
        });
    } catch (error) {
        console.error("Login Teacher Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during login",
        });
    }
};

/* =========================
   LOGOUT TEACHER
========================= */
export const logoutTeacher = (req, res) => {
    res.clearCookie("token", cookieOptions);
    res.status(200).json({
        success: true,
        message: "Teacher logged out successfully",
    });
};


export const getMyInstitution = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.user.id).populate("institution");

        if (!teacher || !teacher.institution) {
            return res.json({ institution: null });
        }

        const institutionId = teacher.institution._id;

        const [studentsCount, teachersCount] = await Promise.all([
            Student.countDocuments({ institution: institutionId }),
            Teacher.countDocuments({ institution: institutionId }),
        ]);

        res.json({
            institution: {
                ...teacher.institution.toObject(),
                role: "teacher",
                stats: {
                    students: studentsCount,
                    teachers: teachersCount,
                    courses: 0,
                },
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch institution" });
    }
};

/* =========================
   GET AUTHORIZED COURSES
========================= */
export const getAuthorizedCourses = async (req, res) => {
    try {
        const teacherId = req.user.id;
        
        console.log('📚 [GET AUTHORIZED COURSES] Teacher ID:', teacherId);
        
        // Get teacher with populated authorized courses
        const teacher = await Teacher.findById(teacherId)
            .populate({
                path: "authorizedCourses",
                populate: [
                    { path: "department", select: "name code" },
                    { path: "semesterAvailable", select: "name academicYear" }
                ]
            });

        if (!teacher) {
            console.log('❌ Teacher not found');
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        console.log('👨‍🏫 Teacher found:', teacher.fullName);
        console.log('📋 Raw authorizedCourses:', teacher.authorizedCourses);
        console.log('📊 Number of authorized courses:', teacher.authorizedCourses?.length || 0);

        if (!teacher.authorizedCourses || teacher.authorizedCourses.length === 0) {
            console.log('⚠️ No authorized courses found for teacher');
            return res.status(200).json({
                success: true,
                count: 0,
                courses: [],
                message: "No courses assigned yet. Please contact your admin to assign courses."
            });
        }

        // Filter out null/undefined courses and check if active
        const validCourses = teacher.authorizedCourses.filter(course => {
            if (!course) {
                console.log('⚠️ Found null/undefined course in authorizedCourses');
                return false;
            }
            console.log(`📖 Course: ${course.name} (${course.code}), isActive: ${course.isActive}`);
            return course.isActive !== false; // Include if isActive is true or undefined
        });
        
        console.log('✅ Valid courses after filtering:', validCourses.length);

        res.status(200).json({
            success: true,
            count: validCourses.length,
            courses: validCourses
        });
    } catch (error) {
        console.error("❌ Get authorized courses error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch authorized courses",
            error: error.message
        });
    }
};

/* =========================
   GET STUDENTS IN AUTHORIZED COURSES
========================= */
export const getStudentsInAuthorizedCourses = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { courseId, departmentId, semesterId } = req.query;

        // Get teacher with authorized courses
        const teacher = await Teacher.findById(teacherId)
            .select('authorizedCourses institution department semester');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        // Build query for students
        let studentQuery = {
            institution: teacher.institution,
            status: 'active'
        };

        // If specific course is requested, check if teacher is authorized
        if (courseId) {
            const isAuthorized = teacher.authorizedCourses.some(
                course => course.toString() === courseId
            );
            
            if (!isAuthorized) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to view students for this course"
                });
            }
            
            studentQuery.enrolledCourses = courseId;
        } else {
            // Show students enrolled in ANY of teacher's authorized courses
            if (teacher.authorizedCourses.length > 0) {
                studentQuery.enrolledCourses = { $in: teacher.authorizedCourses };
            }
        }

        // Add optional filters
        if (departmentId) {
            studentQuery.department = departmentId;
        }
        if (semesterId) {
            studentQuery.semester = semesterId;
        }

        // Fetch students with populated fields
        const students = await Student.find(studentQuery)
            .populate('department', 'name code')
            .populate('semester', 'name academicYear')
            .populate('enrolledCourses', 'name code')
            .select('fullName email phone username enrolledCourses department semester status')
            .sort({ fullName: 1 });

        res.status(200).json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {
        console.error("Get students error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch students"
        });
    }
};

/* =========================
   UPLOAD NOTES/DOCUMENTS
========================= */
export const uploadNotes = async (req, res) => {
    try {
        const { courseId, fileName } = req.body;
        const file = req.file;
        const teacherId = req.user.id;

        if (!file || !courseId) {
            return res.status(400).json({
                success: false,
                message: "File and course ID are required"
            });
        }

        // Verify teacher is authorized for this course
        const teacher = await Teacher.findById(teacherId).select('authorizedCourses institution');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        const isAuthorized = teacher.authorizedCourses.some(
            course => course.toString() === courseId
        );

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to upload notes for this course"
            });
        }

        // Upload to Cloudflare R2
        let fileUrl;
        try {
            fileUrl = await uploadToR2(file.buffer, file.originalname, 'docs', file.mimetype);
        } catch (r2Err) {
            console.error("R2 upload error:", r2Err);
            return res.status(500).json({
                success: false,
                message: "Failed to store file. Please try again."
            });
        }

        // Determine canonical file type for the Document schema enum
        const mime = file.mimetype;
        const fileType = mime.includes('pdf') ? 'pdf'
            : mime.includes('word') ? 'docx'
            : mime.includes('text') ? 'txt'
            : 'pptx';

        // Create document record
        const displayName = fileName || file.originalname.replace(/\.[^.]+$/, '');
        const document = await Document.create({
            fileName: displayName,
            originalName: file.originalname,
            fileUrl,
            fileType,
            fileSize: file.size,
            course: courseId,
            institution: teacher.institution,
            uploadedBy: teacherId,
            isProcessed: false
        });

        // Backend-owned pipeline:
        // 1) Upload to AI /upload for chunking + embeddings
        // 2) Persist AI chunks into Mongo DocumentChunk + EmbeddingStore
        try {
            const aiUpload = await aiService.uploadDocument(
                file.buffer,
                file.originalname,
                teacher.institution?.toString(),
                courseId
            );

            const persisted = await persistDocumentVectorsToMongo(document, {
                seedChunks: Array.isArray(aiUpload?.chunks) ? aiUpload.chunks : [],
                seedEmbeddingModel: aiUpload?.embedding_model || 'paraphrase-MiniLM-L3-v2',
            });

            await Document.findByIdAndUpdate(document._id, {
                isProcessed: true,
                processingError: null,
                chunksCount: persisted.chunkCount,
            });

            const updatedDocument = await Document.findById(document._id);

            return res.status(201).json({
                success: true,
                message: "Document uploaded and indexed successfully",
                document: updatedDocument?.toObject?.() || document.toObject(),
                aiIndexed: true,
                statusSynced: true,
                chunksAddedByAi: Number(aiUpload?.chunks_added || 0),
                chunksPersisted: persisted.chunkCount,
                embeddingsPersisted: persisted.embeddingCount,
            });
        } catch (indexErr) {
            const errMsg = indexErr?.message || "AI indexing pipeline failed";

            await Document.findByIdAndUpdate(document._id, {
                isProcessed: false,
                processingError: errMsg,
            });

            return res.status(502).json({
                success: false,
                message: "Document uploaded to storage, but AI indexing failed",
                document: document.toObject(),
                error: errMsg,
                aiIndexed: false,
                statusSynced: false,
            });
        }
    } catch (error) {
        console.error("Upload notes error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to upload document",
            error: error.message
        });
    }
};

/* =========================
   GET DOCUMENTS BY COURSE
========================= */
export const getDocuments = async (req, res) => {
    try {
        const { courseId } = req.params;
        const teacherId = req.user.id;

        // Verify teacher is authorized for this course
        const teacher = await Teacher.findById(teacherId).select('authorizedCourses');
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        const isAuthorized = teacher.authorizedCourses.some(
            course => course.toString() === courseId
        );

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view documents for this course"
            });
        }

        // Fetch documents
        const documents = await Document.find({ course: courseId })
            .populate('uploadedBy', 'fullName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: documents.length,
            documents
        });
    } catch (error) {
        console.error("Get documents error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch documents",
            error: error.message
        });
    }
};

/* =========================
   DELETE DOCUMENT
========================= */
export const deleteDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        const teacherId = req.user.id;

        // Find document
        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        // Verify teacher owns this document
        if (document.uploadedBy.toString() !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own documents"
            });
        }

        // Delete from R2 first so we do not orphan storage objects.
        if (document.fileUrl) {
            const r2Deleted = await deleteFromR2(document.fileUrl);
            if (!r2Deleted) {
                return res.status(502).json({
                    success: false,
                    message: "Failed to delete file from storage. Please retry."
                });
            }
        }

        try {
            const db = mongoose.connection.db;
            const chunksCollection = db.collection('documentchunks');
            const embeddingsCollection = db.collection('embeddingstores');

            // Escape strings for safe RegEx searches
            const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const safeOriginalName = escapeRegex(document.originalName || "");
            const safeFileName = escapeRegex(document.fileName || "");

            const query = {
                $or: [
                    { "metadata.document_id": document._id.toString() },
                    ...(safeOriginalName ? [{ "metadata.source": { $regex: safeOriginalName, $options: "i" } }] : []),
                    ...(safeFileName ? [{ "metadata.source": { $regex: safeFileName, $options: "i" } }] : [])
                ]
            };

            const chunksToDelete = await chunksCollection.find(query, { projection: { chunk_id: 1 } }).toArray();

            if (chunksToDelete.length > 0) {
                const chunkIds = chunksToDelete.map(c => c.chunk_id);
                // Wipe massive vector arrays first
                const embResult = await embeddingsCollection.deleteMany({ chunk_id: { $in: chunkIds } });
                // Wipe text chunks
                const chunkResult = await chunksCollection.deleteMany(query);
                
                console.log(`✓ Cleaned up ${chunkResult.deletedCount} chunks and ${embResult.deletedCount} vectors for ${document.originalName}`);
            }
        } catch (aiDeleteErr) {
            console.error("Warning: DB AI Chunk Cleanup Failed:", aiDeleteErr);
            // We proceed to delete document record even if this fails to prevent orphan UI blocks
        }

        // // Best-effort cleanup in AI JSON store as well so deleted documents do
        // // not remain queryable from stale vectors.
        // const aiNames = [
        //     document.originalName,
        //     document.fileName,
        //     document.fileName && document.fileType ? `${document.fileName}.${document.fileType}` : null,
        // ].filter(Boolean);
        // for (const name of aiNames) {
        //     try {
        //         await aiService.deleteDocumentChunks(name);
        //     } catch (_) {
        //         // Non-fatal: continue with core delete in R2 + MongoDB.
        //     }
        // }

        // Delete from MongoDB only after storage deletion succeeds
        await Document.findByIdAndDelete(documentId);

        // Delete all chunks and embeddings associated with this document
        await Promise.all([
            DocumentChunk.deleteMany({ document: documentId }),
            EmbeddingStore.deleteMany({ documentId: documentId }),
        ]);

        res.status(200).json({
            success: true,
            message: "Document deleted successfully"
        });
    } catch (error) {
        console.error("Delete document error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete document",
            error: error.message
        });
    }
};

/* =========================
   MARK DOCUMENT PROCESSED
========================= */
export const markDocumentProcessed = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { chunksCount, chunks, embeddingModel } = req.body || {};
    const teacherId = req.user.id;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    if (document.uploadedBy.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const incomingChunks = Array.isArray(chunks) ? chunks : [];
    const requestedCount = Number.isFinite(Number(chunksCount))
      ? Math.max(0, Math.floor(Number(chunksCount)))
      : 0;

    // Guard: if frontend says chunks were added but sent none, reject early
    if (requestedCount > 0 && incomingChunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: `AI reported ${requestedCount} chunks but none were included in the request body`,
      });
    }

    let persisted = { chunkCount: 0, embeddingCount: 0 };
    if (incomingChunks.length > 0) {
      persisted = await persistChunksToMongo(document, incomingChunks, embeddingModel || 'paraphrase-MiniLM-L3-v2');
    }

        if ((requestedCount ?? 0) > 0 && persisted.chunkCount === 0) {
            throw new Error("Document marked processed but no chunks were persisted in DocumentChunk.");
        }

    const update = {
        isProcessed: true,
        processingError: null,
        chunksCount: Math.max(0, persisted.chunkCount),
    };

    await Document.findByIdAndUpdate(documentId, {
      isProcessed: true,
      processingError: null,
      chunksCount: Math.max(0, persisted.chunkCount),
    });

    return res.status(200).json({
      success: true,
      message: 'Document marked as processed',
      chunksPersisted: persisted.chunkCount,
      embeddingsPersisted: persisted.embeddingCount,
    });
  } catch (error) {
    console.error('Mark processed error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update document',
      error: error.message,
    });
  }
};

/* =========================
   MARK DOCUMENT FAILED
========================= */
export const markDocumentFailed = async (req, res) => {
    try {
        const { documentId } = req.params;
        const { error } = req.body || {};
        const teacherId = req.user.id;

        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        if (document.uploadedBy.toString() !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "Not authorized"
            });
        }

        // 👉 THE FIX: Intercept False Positives!
        // We manually check the DB using RegEx. If we find the chunks, we force it to Success.
        try {
            const db = mongoose.connection.db;
            const chunksCollection = db.collection('documentchunks');
            
            const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const safeOriginalName = escapeRegex(document.originalName || "");
            const safeFileName = escapeRegex(document.fileName || "");

            const query = {
                $or: [
                    { "metadata.document_id": document._id.toString() },
                    ...(safeOriginalName ? [{ "metadata.source": { $regex: safeOriginalName, $options: "i" } }] : []),
                    ...(safeFileName ? [{ "metadata.source": { $regex: safeFileName, $options: "i" } }] : [])
                ]
            };

            const actualChunksCount = await chunksCollection.countDocuments(query);

            if (actualChunksCount > 0) {
                console.log(`✅ Intercepted false failure! Found ${actualChunksCount} chunks in DB for ${document.originalName}. Forcing success state.`);
                
                await Document.findByIdAndUpdate(documentId, {
                    isProcessed: true,
                    processingError: null,
                    chunksCount: actualChunksCount
                });

                return res.status(200).json({
                    success: true,
                    message: "Document uploaded successfully" // App will show this exact success message
                });
            }
        } catch (dbErr) {
            console.error("Error during manual chunk verification intercept:", dbErr);
        }

        const message = typeof error === "string" && error.trim().length > 0
            ? error.trim().slice(0, 500)
            : "AI indexing failed";

        await Document.findByIdAndUpdate(documentId, {
            isProcessed: false,
            processingError: message,
        });

        res.status(200).json({
            success: true,
            message: "Document marked as failed"
        });
    } catch (err) {
        console.error("Mark failed error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update document",
            error: err.message
        });
    }
};

/* =========================
   GENERATE MCQs  (Gemini Pipeline)
========================= */
export const generateMCQs = async (req, res) => {
    try {
        const { courseId, topic, count, difficulty, sourceType, documentId, documentIds } = req.body;
        const teacherId = req.user.id;

        if (!courseId) {
            return res.status(400).json({ success: false, message: "Course is required" });
        }

        // Verify teacher is authorized for this course
        const teacher = await Teacher.findById(teacherId).select("authorizedCourses");
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        const isAuthorized = teacher.authorizedCourses.some(
            (course) => course.toString() === courseId
        );
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: "Not authorized for this course" });
        }

        const normalizedSourceType = ["topic", "document"].includes(sourceType) ? sourceType : "topic";
        const normalizedDifficulty = ["easy", "medium", "hard"].includes((difficulty || "").toLowerCase())
            ? difficulty.toLowerCase()
            : "medium";
        const requestedCount = Number.isFinite(Number(count))
            ? Math.max(1, Math.min(15, Number(count)))
            : 5;

        // ── Fetch document URLs ──────────────────────────────────────────────
        let docsForGemini = []; // [{url, fileType, name}]
        let sourceMeta = topic || "Course Documents";

        if (normalizedSourceType === "document") {
            // Use the explicitly selected document IDs
            const normalizedDocIds = Array.isArray(documentIds)
                ? Array.from(new Set(documentIds.map((id) => String(id)).filter(Boolean)))
                : [];
            const idsToUse = normalizedDocIds.length > 0
                ? normalizedDocIds.slice(0, 8)
                : documentId ? [String(documentId)] : [];

            if (idsToUse.length === 0) {
                return res.status(400).json({ success: false, message: "No documents selected" });
            }

            const docs = await Document.find({
                _id: { $in: idsToUse },
                course: courseId,
            }).select("fileUrl fileType originalName fileName");

            docsForGemini = docs.map((d) => ({
                url:      d.fileUrl,
                fileType: d.fileType || "pdf",
                name:     d.originalName || d.fileName,
            }));
            sourceMeta = docs.map((d) => d.originalName || d.fileName).filter(Boolean).join(", ");

        } else {
            // Topic mode: use all processed documents in the course
            const allDocs = await Document.find({
                course:       courseId,
                uploadedBy:   teacherId,
                isProcessed:  true,
            }).select("fileUrl fileType originalName fileName");

            if (allDocs.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No processed documents found in this course. Upload and process documents first.",
                });
            }

            // Cap at 6 documents to keep payload within Gemini limits
            docsForGemini = allDocs.slice(0, 6).map((d) => ({
                url:      d.fileUrl,
                fileType: d.fileType || "pdf",
                name:     d.originalName || d.fileName,
            }));
            sourceMeta = docsForGemini.map((d) => d.name).join(", ");

            if (!topic?.trim()) {
                return res.status(400).json({ success: false, message: "Topic is required for topic mode" });
            }
        }

        console.log(`🚀 Gemini MCQ: ${normalizedSourceType} mode, ${docsForGemini.length} doc(s), ${requestedCount} Qs, ${normalizedDifficulty}`);

        // ── Call Gemini ──────────────────────────────────────────────────────
        const rawMcqs = await generateMCQsWithGemini({
            documents:    docsForGemini,
            topic:        topic || sourceMeta,
            numQuestions: requestedCount,
            difficulty:   normalizedDifficulty,
        });

        // Normalize through existing helpers (word limits, option sanitization, etc.)
        let mcqs = mergeUniqueMcqs(rawMcqs.map((mcq) => normalizeMCQ(mcq, normalizedDifficulty)));
        mcqs = mcqs.slice(0, requestedCount);

        if (mcqs.length === 0) {
            return res.status(502).json({
                success: false,
                message: "Gemini returned no MCQs. Try selecting different documents or a more specific topic.",
            });
        }

        res.status(200).json({
            success:       true,
            mcqs,
            generatedCount: mcqs.length,
            sourceType:    normalizedSourceType,
            source:        sourceMeta,
            message:       "MCQs generated successfully",
        });

    } catch (error) {
        console.error("Generate MCQs error:", error);
        res.status(500).json({
            success:  false,
            message:  "Failed to generate MCQs",
            error:    error.message,
        });
    }
};


/* =========================
   SAVE MCQ SET
========================= */
export const saveMCQSet = async (req, res) => {
    try {
        const { courseId, title, description, mcqs } = req.body;
        const teacherId = req.user.id;

        if (!courseId || !title || !mcqs || mcqs.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Course, title, and MCQs are required"
            });
        }

        // Verify teacher is authorized for this course
        const teacher = await Teacher.findById(teacherId).select('authorizedCourses institution');
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        const isAuthorized = teacher.authorizedCourses.some(
            course => course.toString() === courseId
        );

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to create MCQ sets for this course"
            });
        }

        const normalizedQuestions = mcqs.map((mcq) => normalizeMCQ(mcq));

        // Create MCQ set
        const mcqSet = await MCQSet.create({
            title,
            description: description || "",
            course: courseId,
            institution: teacher.institution,
            createdBy: teacherId,
            questions: normalizedQuestions,
        });

        res.status(201).json({
            success: true,
            message: "MCQ set saved successfully",
            mcqSet
        });
    } catch (error) {
        console.error("Save MCQ set error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to save MCQ set",
            error: error.message
        });
    }
};

/* =========================
   ADD TO MCQ SET
========================= */
export const addToMCQSet = async (req, res) => {
    try {
        const { mcqSetId } = req.params;
        const { mcqs } = req.body;
        const teacherId = req.user.id;

        if (!mcqs || mcqs.length === 0) {
            return res.status(400).json({
                success: false,
                message: "MCQs are required"
            });
        }

        // Find MCQ set
        const mcqSet = await MCQSet.findById(mcqSetId);

        if (!mcqSet) {
            return res.status(404).json({
                success: false,
                message: "MCQ set not found"
            });
        }

        // Verify teacher owns this set
        if (mcqSet.createdBy.toString() !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "You can only add questions to your own MCQ sets"
            });
        }

        const newQuestions = mcqs.map((mcq) => normalizeMCQ(mcq));

        mcqSet.questions.push(...newQuestions);
        await mcqSet.save();

        res.status(200).json({
            success: true,
            message: "MCQs added to set successfully",
            mcqSet
        });
    } catch (error) {
        console.error("Add to MCQ set error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add MCQs to set",
            error: error.message
        });
    }
};

/* =========================
   GET MCQ SETS
========================= */
export const getMCQSets = async (req, res) => {
    try {
        const { courseId } = req.query;
        const teacherId = req.user.id;

        // Build query
        const query = { createdBy: teacherId };
        if (courseId) {
            query.course = courseId;
        }

        // Fetch MCQ sets
        const mcqSets = await MCQSet.find(query)
            .populate('course', 'name code')
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: mcqSets.length,
            mcqSets
        });
    } catch (error) {
        console.error("Get MCQ sets error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch MCQ sets",
            error: error.message
        });
    }
};

/* =========================
   ASSIGN MCQ SET
========================= */
export const assignMCQSet = async (req, res) => {
    try {
        const { mcqSetId } = req.params;
        const { studentIds, dueDate, duration } = req.body;
        const teacherId = req.user.id;

        if (!studentIds || studentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Student IDs are required"
            });
        }

        // Find MCQ set
        const mcqSet = await MCQSet.findById(mcqSetId);

        if (!mcqSet) {
            return res.status(404).json({
                success: false,
                message: "MCQ set not found"
            });
        }

        // Verify teacher owns this set
        if (mcqSet.createdBy.toString() !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "You can only assign your own MCQ sets"
            });
        }

        // Update assignment
        mcqSet.isAssigned = true;
        mcqSet.assignedTo = studentIds;
        mcqSet.dueDate = dueDate;
        mcqSet.duration = duration || 30;
        await mcqSet.save();

        res.status(200).json({
            success: true,
            message: "MCQ set assigned successfully",
            mcqSet
        });
    } catch (error) {
        console.error("Assign MCQ set error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to assign MCQ set",
            error: error.message
        });
    }
};

/* =========================
   GET MCQ RESULTS
========================= */
export const getMCQResults = async (req, res) => {
    try {
        const { mcqSetId } = req.params;
        const teacherId = req.user.id;

        // Verify teacher owns this MCQ set
        const mcqSet = await MCQSet.findById(mcqSetId);

        if (!mcqSet) {
            return res.status(404).json({
                success: false,
                message: "MCQ set not found"
            });
        }

        if (mcqSet.createdBy.toString() !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "You can only view results for your own MCQ sets"
            });
        }

        // Fetch attempts
        const attempts = await MCQAttempt.find({ mcqSet: mcqSetId })
            .populate('student', 'fullName email username')
            .sort({ submittedAt: -1 });

        res.status(200).json({
            success: true,
            count: attempts.length,
            results: attempts
        });
    } catch (error) {
        console.error("Get MCQ results error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch MCQ results",
            error: error.message
        });
    }
};
