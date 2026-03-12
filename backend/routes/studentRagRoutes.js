import express from "express";
import { authenticate } from "../middleware/auth.js";
import { queryRAG } from "../services/ragService.js";

const router = express.Router();

/**
 * POST /api/student/rag/query
 *
 * Authenticated students can query their institution's course materials.
 * Automatically falls back to web search if no relevant chunks are found.
 *
 * Body: { query: string, institutionId?: string }
 *
 * Response:
 * {
 *   query, answer, sources, search_method, used_web_search,
 *   num_sources
 * }
 *
 * Source objects:
 *   Document source: { type:"document", document_name, chunk_index,
 *                       similarity_score, chunk_text }
 *   Web source:      { type:"web", document_name (title), url, chunk_text (snippet) }
 */
router.post("/query", authenticate, async (req, res) => {
    const { query, institutionId } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
        return res.status(400).json({ error: "query is required and must be a non-empty string" });
    }

    try {
        const result = await queryRAG(query.trim(), institutionId || null);

        res.json({
            query,
            answer: result.answer,
            sources: result.sources,
            search_method: result.searchMethod,
            used_web_search: result.usedWebSearch,
            num_sources: result.sources.length,
        });
    } catch (err) {
        console.error("RAG query error:", err);
        res.status(500).json({
            error: "Failed to process your question. Please try again.",
            details: process.env.NODE_ENV !== "production" ? err.message : undefined,
        });
    }
});

export default router;
