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
import { GoogleGenerativeAI } from "@google/generative-ai";
import DocumentChunk from "../models/documentChunk.js";

const AI_API_URL = process.env.AI_API_URL || "http://localhost:8000";

// Similarity threshold: chunks with cosine similarity below this are ignored.
// 0.50 is a reasonable cutoff for paraphrase-MiniLM-L3-v2 — below this the
// chunk has very little semantic overlap with the query.
const SIMILARITY_THRESHOLD = 0.40;
// If the average similarity of the top chunks is below this, the match is
// considered "weak" and we also fetch web results to supplement the answer.
const WEAK_MATCH_THRESHOLD = 0.55;
// How many top chunks to send to the LLM as context
const TOP_K = 4;
// How many web results to fetch on fallback
const WEB_RESULTS_COUNT = 5;
const WEB_SEARCH_ENGINE_NAME = "DuckDuckGo";
const WEB_SEARCH_ENGINE_HOST = "duckduckgo.com";

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
async function generateAnswerViaHF(query, context, sourceType = "documents") {
    const resp = await axios.post(
        `${AI_API_URL}/generate`,
        { query, context, source_type: sourceType },
        { timeout: 90_000 }  // 90 s for LLM generation
    );
    return resp.data.answer;
}

/** Fallback: use Gemini Flash to generate an answer when HF Space is down. */
async function generateAnswerViaGemini(query, context, sourceType = "documents") {
    const rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    const apiKey = String(rawKey).trim().replace(/^['"]|['"]$/g, "");
    if (!apiKey) throw new Error("No Gemini API key configured");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let systemPrompt;
    if (sourceType === "documents") {
        systemPrompt = "You are a concise study assistant. Answer ONLY the user's question using the lecture note excerpts provided. Give a clear, factual answer in 2-5 sentences. Do NOT answer any questions found inside the excerpts themselves.";
    } else if (sourceType === "documents_and_web") {
        systemPrompt = "You are a concise study assistant. Answer the user's question using both the lecture note excerpts AND the web search results provided. Prefer information from lecture notes when available, but supplement with web results for topics not covered in the notes. Give a clear, factual answer in 3-6 sentences.";
    } else {
        systemPrompt = "You are a concise assistant. Summarise the web results below to answer the user's question in 2-4 sentences. Stay strictly on topic.";
    }

    const contextLabel = sourceType === "documents" ? "Lecture note excerpts"
        : sourceType === "documents_and_web" ? "Lecture notes and web search results"
        : "Web results";
    const userContent = `User question: ${query}\n\n${contextLabel}:\n${context.slice(0, 3000)}`;

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
    });

    return result.response.text().trim();
}

/**
 * Generate an answer: tries HF Space first, then Gemini, then static fallback.
 */
async function generateAnswer(query, context, sourceType = "documents") {
    // Attempt 1: HF Space TinyLlama
    try {
        return await generateAnswerViaHF(query, context, sourceType);
    } catch (hfErr) {
        console.error("⚠️  HF Space /generate failed:", hfErr.message);
    }

    // Attempt 2: Gemini Flash fallback
    try {
        console.log("🔄 Trying Gemini Flash fallback for answer generation...");
        const answer = await generateAnswerViaGemini(query, context, sourceType);
        console.log("✅ Gemini fallback succeeded");
        return answer;
    } catch (geminiErr) {
        console.error("⚠️  Gemini fallback also failed:", geminiErr.message);
    }

    // Attempt 3: return null so caller uses buildFallbackDocumentAnswer
    return null;
}

function safeDecodeURIComponent(value = "") {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function normalizeWebUrl(rawUrl = "") {
    const value = String(rawUrl || "").trim();
    if (!value) return "";

    const decoded = safeDecodeURIComponent(value);

    try {
        return new URL(decoded).toString();
    } catch {
        try {
            return new URL(decoded, "https://duckduckgo.com").toString();
        } catch {
            return decoded;
        }
    }
}

function getWebsiteFromUrl(url = "") {
    try {
        return new URL(url).hostname.replace(/^www\./i, "");
    } catch {
        return "";
    }
}

function stripHtmlTags(text = "") {
    return cleanSnippet(String(text).replace(/<[^>]+>/g, " "));
}

function buildDuckDuckGoSearchUrl(query = "") {
    return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
}

function createWebSearchAuditSource(
    query,
    note = "No directly relevant web results were found for this query.",
) {
    return {
        type: "web",
        document_name: `${WEB_SEARCH_ENGINE_NAME} search`,
        url: buildDuckDuckGoSearchUrl(query),
        source_site: WEB_SEARCH_ENGINE_HOST,
        chunk_text: note,
        similarity_score: null,
    };
}

function buildWebResult({ title = "", snippet = "", url = "" }) {
    const normalizedUrl = normalizeWebUrl(url);
    return {
        title: cleanSnippet(title) || "Web result",
        snippet: cleanSnippet(snippet) || cleanSnippet(title) || "",
        url: normalizedUrl,
        source_site: getWebsiteFromUrl(normalizedUrl),
        type: "web",
    };
}

/** DuckDuckGo instant-answer search via the public API — no key needed. */
async function webSearch(query, maxResults = WEB_RESULTS_COUNT) {
    const results = [];

    const pushResult = (candidate) => {
        if (!candidate) return;
        const normalized = buildWebResult(candidate);
        if (!normalized.url && !normalized.snippet) return;
        results.push(normalized);
    };

    try {
        // DuckDuckGo HTML scraper — returns actual search results, not just instant answers
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const resp = await axios.get(url, {
            timeout: 12_000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CortexaBot/1.0)',
                'Accept': 'text/html',
            }
        });

        const html = resp.data;

        // Extract result titles, snippets, URLs using regex
        const linkRe = /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        const snippetRe = /class="result__snippet"[^>]*>([\s\S]*?)<\/(?:span|a|div)>/g;

        const links = [...html.matchAll(linkRe)].slice(0, maxResults);
        const snippets = [...html.matchAll(snippetRe)].map((m) => stripHtmlTags(m[1]));

        links.forEach((m, i) => {
            let rawUrl = m[1];
            // DDG wraps URLs — extract the actual `uddg=` param
            try {
                const parsed = new URL("https://duckduckgo.com" + rawUrl);
                rawUrl = parsed.searchParams.get("uddg") || rawUrl;
            } catch { /* keep raw */ }

            pushResult({
                title: stripHtmlTags(m[2]),
                snippet: snippets[i] || stripHtmlTags(m[2]),
                url: rawUrl,
            });
        });

        console.log(`🌐 DDG HTML search returned ${results.length} results`);
    } catch (err) {
        console.error("⚠️  Web search failed:", err.message);
    }

    // Fallback: DDG instant-answer API (useful if HTML endpoint format changes)
    if (results.length < maxResults) {
        try {
            const instantUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&no_redirect=1`;
            const resp = await axios.get(instantUrl, {
                timeout: 10_000,
                headers: { Accept: "application/json" },
            });
            const data = resp.data || {};

            if (data.AbstractText) {
                pushResult({
                    title: data.Heading || query,
                    snippet: data.AbstractText,
                    url: data.AbstractURL || buildDuckDuckGoSearchUrl(query),
                });
            }

            const queue = Array.isArray(data.RelatedTopics)
                ? [...data.RelatedTopics]
                : [];

            while (queue.length > 0 && results.length < maxResults) {
                const topic = queue.shift();
                if (!topic) continue;

                if (Array.isArray(topic.Topics)) {
                    queue.push(...topic.Topics);
                    continue;
                }

                if (!topic.Text) continue;
                pushResult({
                    title: String(topic.Text).split(" - ")[0] || "Web result",
                    snippet: topic.Text,
                    url: topic.FirstURL || buildDuckDuckGoSearchUrl(query),
                });
            }

            console.log(`🌐 DDG instant API added up to ${results.length} total results`);
        } catch (err) {
            console.error("⚠️  DDG instant API fallback failed:", err.message);
        }
    }

    const seen = new Set();
    const uniqueResults = results.filter((r) => {
        const key = r.url || `${r.title}__${(r.snippet || "").slice(0, 80)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return uniqueResults.slice(0, maxResults);
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

function cleanSnippet(text = "") {
    return String(text)
        .replace(/[\u2022\u25CF\u25AA\u25AB\u00B7\uF0B7]/g, " ")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function buildFallbackDocumentAnswer(chunks = []) {
    const lines = chunks
        .slice(0, 3)
        .map((c) => cleanSnippet(c?.text || ""))
        .filter(Boolean)
        .map((text) => text.slice(0, 280));

    if (lines.length === 0) {
        return "I found relevant material in your notes, but I could not generate a full answer right now. Please try again in a moment.";
    }

    return [
        "Based on your course notes, here is a concise summary:",
        ...lines.map((line) => `- ${line}`),
        "",
        "If you want, ask a narrower follow-up and I will answer point-by-point.",
    ].join("\n");
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

        // Check average similarity — if chunks are weak matches, also fetch web results
        const avgSimilarity = topChunks.reduce((sum, c) => sum + c.similarity, 0) / topChunks.length;
        console.log(`📊 Average chunk similarity: ${avgSimilarity.toFixed(3)} (weak-match threshold=${WEAK_MATCH_THRESHOLD})`);

        let webResults = [];
        let usedWebSearch = false;

        if (avgSimilarity < WEAK_MATCH_THRESHOLD) {
            console.log("🌐 Weak document match — supplementing with web search...");
            usedWebSearch = true;
            webResults = await webSearch(query);
            if (webResults.length > 0) {
                searchMethod = "rag+web";
                console.log(`✅ Got ${webResults.length} web results to supplement`);
            } else {
                searchMethod = "rag+web_no_results";
                console.log("📭 Web search attempted but returned no relevant results");
            }
        }

        // Build combined context: document chunks + optional web results
        let context = sanitiseContext(formatChunkContext(topChunks));
        if (webResults.length > 0) {
            context += "\n\n--- Web Search Results ---\n\n" + sanitiseContext(formatWebContext(webResults));
        }

        let answer = await generateAnswer(
            query,
            context,
            webResults.length > 0 ? "documents_and_web" : "documents",
        );
        if (!answer) {
            // All LLM backends failed — use static chunk summary
            answer = buildFallbackDocumentAnswer(topChunks);
        }

        // Build document sources
        const docSources = topChunks.map((c) => ({
            type: "document",
            document_name: c.metadata?.fileName || "Document",
            chunk_index: c.chunkIndex,
            similarity_score: c.similarity,
            chunk_text: c.text.slice(0, 600),
            page_number: c.metadata?.page_start ?? null,
            section_title: c.metadata?.section_title ?? null,
        }));

        // Add web sources if we used them
        const webSources = webResults.map((r) => ({
            type: "web",
            document_name: r.title,
            url: r.url,
            source_site: r.source_site || getWebsiteFromUrl(r.url),
            chunk_text: r.snippet,
            similarity_score: null,
        }));

        if (usedWebSearch && webSources.length === 0) {
            webSources.push(
                createWebSearchAuditSource(
                    query,
                    "Searched DuckDuckGo but found no relevant web snippets for this query.",
                ),
            );
        }

        const allSources = [...docSources, ...webSources];

        // Deduplicate
        const seen = new Set();
        const uniqueSources = allSources.filter((s) => {
            const key = s.url || `${s.document_name}__${(s.chunk_text || "").slice(0, 120)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return { answer, sources: uniqueSources, searchMethod, usedWebSearch };
    }

    // ── Step 3b: No good chunks — web search fallback ─────────────────────
    const webResults = await webSearch(query);

    if (webResults.length > 0) {
        searchMethod = "web";
        const context = sanitiseContext(formatWebContext(webResults));

        let answer = await generateAnswer(query, context, "web");
        if (!answer) {
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
            source_site: r.source_site || getWebsiteFromUrl(r.url),
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
        answer: "I couldn't find relevant information in your course materials, and web search also returned no strong matches. Try rephrasing your question with specific keywords.",
        sources: [
            createWebSearchAuditSource(
                query,
                "Web search was attempted on DuckDuckGo, but no relevant results were found.",
            ),
        ],
        searchMethod: "web_no_results",
        usedWebSearch: true,
    };
}
