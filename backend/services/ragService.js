/**
 * RAG Service — orchestrates the full pipeline from the Node backend:
 *
 *  1. Embed query      → calls AI HF Space  POST /embed  (sentence-transformer, fast)
 *  2. Retrieve chunks  → MongoDB DocumentChunk cosine-similarity per institution
 *  3a. If hits ≥ threshold → calls AI POST /generate with chunk context (LLM, ~10-20 s)
 *  3b. Else fallback   → DuckDuckGo web search, then AI POST /generate with web context
 *
 * This approach:
 *  - Avoids the slow /assistant cold-start (no retrieval inside HF Space)
 *  - Keeps the HF Space call minimal (only generation, not retrieval)
 *  - Uses the MongoDB chunks that were already stored during document upload
 */

import axios from "axios";
import DocumentChunk from "../models/documentChunk.js";

const AI_API_URL = process.env.AI_API_URL || "http://localhost:8000";

// Similarity threshold: chunks with cosine similarity below this are ignored
const SIMILARITY_THRESHOLD = 0.30;
// How many top chunks to send to the LLM as context
const TOP_K = 4;
// How many web results to fetch on fallback
const WEB_RESULTS_COUNT = 5;

// English stop-words to strip before keyword matching
const STOP_WORDS = new Set([
    'what','is','the','a','an','of','in','are','how','does','explain',
    'describe','tell','me','about','and','or','to','for','with','on',
    'at','by','this','that','was','be','as','from','it','its','can',
    'do','did','has','have','had','will','would','could','should','may',
    'might','which','when','where','who','why','any','all','not','no',
]);

// ──────────────────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────────────────

function cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot   += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
}

/** Embed a query string using the HF Space sentence-transformer endpoint. */
async function embedQuery(query) {
    try {
        const resp = await axios.post(
            `${AI_API_URL}/embed`,
            { text: query },
            { timeout: 30_000 }  // embedding is fast, 30 s max
        );
        return resp.data.embedding;   // float[]
    } catch (err) {
        console.error("⚠️  /embed failed:", err.message);
        return null;                  // caller will skip retrieval on null
    }
}

/** Call LLM on HF Space to generate an answer given pre-built context. */
async function generateAnswer(query, context, sourceType = "documents") {
    const resp = await axios.post(
        `${AI_API_URL}/generate`,
        { query, context, source_type: sourceType },
        { timeout: 90_000 }  // 90 s for LLM generation
    );
    return resp.data.answer;
}

/** DuckDuckGo instant-answer search via the public API — no key needed. */
async function webSearch(query, maxResults = WEB_RESULTS_COUNT) {
    try {
        const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const resp = await axios.get(url, { timeout: 10_000 });
        const data = resp.data;

        const results = [];

        // Abstract (best single hit)
        if (data.AbstractText) {
            results.push({
                title: data.Heading || query,
                snippet: data.AbstractText,
                url: data.AbstractURL || "",
                type: "web",
            });
        }

        // Related topics
        for (const topic of (data.RelatedTopics || [])) {
            if (results.length >= maxResults) break;
            if (topic.Text && topic.FirstURL) {
                results.push({
                    title: topic.Text.split(" - ")[0] || query,
                    snippet: topic.Text,
                    url: topic.FirstURL,
                    type: "web",
                });
            }
        }

        // If DDG instant answers gave nothing, try the lite search fallback
        if (results.length === 0) {
            const liteUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&t=cortexa`;
            const liteResp = await axios.get(liteUrl, { timeout: 8_000 });
            const liteData = liteResp.data;
            for (const topic of (liteData.RelatedTopics || [])) {
                if (results.length >= maxResults) break;
                if (topic.Text) {
                    results.push({
                        title: topic.Text.split(" - ")[0] || "Web result",
                        snippet: topic.Text,
                        url: topic.FirstURL || "",
                        type: "web",
                    });
                }
            }
        }

        return results;
    } catch (err) {
        console.error("⚠️  Web search failed:", err.message);
        return [];
    }
}

/**
 * Keyword-based chunk retrieval — used when /embed is unavailable (404 / timeout).
 * Extracts meaningful words from the query and runs a MongoDB $regex OR search
 * directly against the stored chunk text.  Slower than cosine similarity but
 * requires NO AI server, so it always works as long as MongoDB is up.
 */
async function keywordSearch(query, institutionId, courseId = null, documentIds = []) {
    const keywords = query
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    if (keywords.length === 0) return [];

    // Build an OR regex from the top 6 keywords — avoids huge regexes
    const pattern = keywords.slice(0, 6).join("|");
    const filter = { text: { $regex: pattern, $options: "i" } };
    if (institutionId) filter["metadata.institution_id"] = institutionId;
    if (courseId) filter["metadata.course_id"] = courseId;
    if (Array.isArray(documentIds) && documentIds.length > 0) {
        filter.document = { $in: documentIds };
    }

    try {
        const chunks = await DocumentChunk.find(filter)
            .select("text chunkIndex metadata")
            .limit(TOP_K * 2)   // fetch more then re-rank by keyword hit count
            .lean();

        if (chunks.length === 0) return [];

        // Re-rank: count how many distinct keywords each chunk contains
        const scored = chunks.map((chunk) => {
            const lower = chunk.text.toLowerCase();
            const hits = keywords.filter((kw) => lower.includes(kw)).length;
            return { chunk, hits };
        });
        scored.sort((a, b) => b.hits - a.hits);

        return scored.slice(0, TOP_K).map(({ chunk, hits }) => ({
            text: chunk.text,
            metadata: chunk.metadata,
            similarity: Math.min(0.5 + hits * 0.1, 0.95),  // synthetic score
            chunkIndex: chunk.chunkIndex,
        }));
    } catch (err) {
        console.error("⚠️  Keyword search failed:", err.message);
        return [];
    }
}

// Exam/assignment question patterns to strip from context before LLM call.
// These lines appear inside Indian university PDF notes and confuse small LLMs.
const _EXAM_LINE_RE = /^\s*(?:Q\.?\d*[.:\)\s]|[0-9]{1,3}[.\):]\s+)(?:Discuss|Explain|Describe|Define|What|How|Why|List|Enumerate|Compare|Differentiate|Write|State|Elaborate|Outline|Summarize|Summarise|Illustrate|Analyse|Analyze|Give|Show|Prove|Derive|Find|Calculate|Evaluate|Justify)/i;

/**
 * Remove exam-question lines and noise headers from the context string so the
 * LLM cannot latch onto embedded questions and answer the wrong thing.
 */
function sanitiseContext(text) {
    return text
        .split('\n')
        .filter(line => !_EXAM_LINE_RE.test(line))
        .join('\n');
}

function formatWebContext(webResults) {
    return webResults.map((r, i) =>
        `[Web ${i + 1}: ${r.title}]\n${r.snippet}`
    ).join("\n\n");
}

function formatChunkContext(chunks) {
    return chunks.map((c, i) =>
        `[Source ${i + 1}: ${c.metadata?.fileName || "Document"}]\n${c.text}`
    ).join("\n\n");
}

// ──────────────────────────────────────────────────────────
//  Main query function
// ──────────────────────────────────────────────────────────

/**
 * @param {string} query          - Student question
 * @param {string} institutionId  - Restrict chunks to this institution
 * @param {string} courseId       - Restrict chunks to this course (optional)
 * @param {string[]} documentIds  - Restrict chunks to selected documents (optional)
 * @returns {{ answer, sources, searchMethod, usedWebSearch }}
 */
export async function queryRAG(query, institutionId, courseId = null, documentIds = []) {
    // ── Step 1: Embed the query ──────────────────────────────────────────
    const queryEmbedding = await embedQuery(query);

    let topChunks = [];
    let searchMethod = "none";

    // ── Step 2a: Cosine-similarity retrieval (requires /embed endpoint) ──
    if (queryEmbedding) {
        try {
            // Fetch chunks for this institution (limit 200 to keep it fast)
            const filter = {};
            if (institutionId) filter["metadata.institution_id"] = institutionId;
            if (courseId) filter["metadata.course_id"] = courseId;
            if (Array.isArray(documentIds) && documentIds.length > 0) {
                filter.document = { $in: documentIds };
            }

            const allChunks = await DocumentChunk.find(filter)
                .select("text embedding chunkIndex metadata document")
                .limit(200)
                .lean();

            console.log(`📚 Loaded ${allChunks.length} chunks from MongoDB for cosine search`);

            // Cosine similarity in JS — fast for ≤200 chunks
            const scored = allChunks
                .map((chunk) => ({
                    chunk,
                    score: cosineSimilarity(queryEmbedding, chunk.embedding),
                }))
                .filter((r) => r.score >= SIMILARITY_THRESHOLD)
                .sort((a, b) => b.score - a.score)
                .slice(0, TOP_K);

            topChunks = scored.map(({ chunk, score }) => ({
                text: chunk.text,
                metadata: chunk.metadata,
                similarity: Math.round(score * 100) / 100,
                chunkIndex: chunk.chunkIndex,
            }));

            console.log(`🔍 Cosine search found ${topChunks.length} matching chunks (threshold=${SIMILARITY_THRESHOLD})`);
        } catch (dbErr) {
            console.error("⚠️  MongoDB chunk fetch failed:", dbErr.message);
        }
    } else {
        console.warn("⚠️  /embed unavailable — skipping cosine search");
    }

    // ── Step 2b: Keyword fallback — runs when embedding failed OR cosine returned nothing ──
    if (topChunks.length === 0) {
        console.log("🔑 Trying keyword-based search in teacher notes...");
        topChunks = await keywordSearch(query, institutionId, courseId, documentIds);
        if (topChunks.length > 0) {
            console.log(`✅ Keyword search found ${topChunks.length} chunks`);
            searchMethod = "keyword";
        } else {
            console.log("📭 No matching chunks found via keyword search either");
        }
    }

    // ── Step 3a: Good document hits — generate from RAG/keyword context ──
    if (topChunks.length > 0) {
        // searchMethod is already "keyword" if set by step 2b, else mark as "rag"
        if (searchMethod !== "keyword") searchMethod = "rag";
        const context = sanitiseContext(formatChunkContext(topChunks));

        let answer;
        try {
            answer = await generateAnswer(query, context, "documents");
        } catch (genErr) {
            console.error("⚠️  LLM /generate failed:", genErr.message);
            // /generate is down (404 or timeout) — format chunks directly as the answer
            // This is still useful: student sees the actual relevant paragraphs from their notes
            answer = `Here is what I found in your course materials:\n\n` +
                topChunks.map((c, i) =>
                    `**[${c.metadata?.fileName || `Source ${i + 1}`}]**\n${c.text.trim()}`
                ).join("\n\n---\n\n");
        }

        const sources = topChunks.map((c) => ({
            type: "document",
            document_name: c.metadata?.fileName || "Document",
            chunk_index: c.chunkIndex,
            similarity_score: c.similarity,
            chunk_text: c.text.slice(0, 600),
            page_number: c.metadata?.page_start ?? null,
            section_title: c.metadata?.section_title ?? null,
        }));

        // Deduplicate: keep only the highest-scoring chunk per unique chunk text
        const seen = new Set();
        const uniqueSources = sources.filter((s) => {
            const key = `${s.document_name}__${s.chunk_text.slice(0, 120)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return { answer, sources: uniqueSources, searchMethod, usedWebSearch: false };
    }

    // ── Step 3b: No good chunks — web search fallback ─────────────────────
    const webResults = await webSearch(query);

    if (webResults.length > 0) {
        searchMethod = "web";
        const context = sanitiseContext(formatWebContext(webResults));

        let answer;
        try {
            answer = await generateAnswer(query, context, "web");
        } catch (genErr) {
            console.error("⚠️  LLM /generate failed on web context:", genErr.message);
            // Summarize snippets without LLM
            answer = webResults
                .slice(0, 3)
                .map((r, i) => `[Web ${i + 1}: ${r.title}]\n${r.snippet}`)
                .join("\n\n");
        }

        const sources = webResults.map((r) => ({
            type: "web",
            document_name: r.title,
            url: r.url,
            chunk_text: r.snippet,
            similarity_score: null,
        }));

        // Deduplicate web results by URL (or snippet prefix if no URL)
        const webSeen = new Set();
        const uniqueWebSources = sources.filter((s) => {
            const key = s.url || s.chunk_text.slice(0, 80);
            if (webSeen.has(key)) return false;
            webSeen.add(key);
            return true;
        });

        return { answer, sources: uniqueWebSources, searchMethod, usedWebSearch: true };
    }

    // ── Step 4: Total fallback ────────────────────────────────────────────
    return {
        answer: "I couldn't find relevant information in your course materials or on the web for this question. Try rephrasing or ask your teacher.",
        sources: [],
        searchMethod: "none",
        usedWebSearch: false,
    };
}
