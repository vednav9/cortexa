import express from "express";
import aiService from "../services/aiService.js";
import multer from "multer";
const router = express.Router();

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/ai/query - RAG Query
router.post('/query', async (req, res) => {
  try {
    const { query, institution_id } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await aiService.queryRAG(query, institution_id);
    res.json(result);
  } catch (error) {
    console.error('RAG query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/assistant - Hybrid Assistant
router.post('/assistant', async (req, res) => {
  try {
    const { query, use_web_fallback } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await aiService.queryHybridAssistant(query, use_web_fallback);
    res.json(result);
  } catch (error) {
    console.error('Hybrid assistant error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/mcq/generate - Generate MCQs
router.post('/mcq/generate', async (req, res) => {
  try {
    const { source_type, source, num_questions, difficulty } = req.body;

    if (!source_type || !source) {
      return res.status(400).json({ error: 'source_type and source are required' });
    }

    const result = await aiService.generateMCQs(
      source_type,
      source,
      num_questions || 5,
      difficulty || 'medium'
    );
    res.json(result);
  } catch (error) {
    console.error('MCQ generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/mcq/score - Score MCQs
router.post('/mcq/score', async (req, res) => {
  try {
    const { mcqs, user_answers } = req.body;

    if (!mcqs || !user_answers) {
      return res.status(400).json({ error: 'mcqs and user_answers are required' });
    }

    const result = await aiService.scoreMCQs(mcqs, user_answers);
    res.json(result);
  } catch (error) {
    console.error('MCQ scoring error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/upload - Upload Document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const { institution_id, course_id } = req.body;

    const result = await aiService.uploadDocument(
      req.file.buffer,
      req.file.originalname,
      institution_id,
      course_id
    );
    res.json(result);
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai/health - Check AI Server Health
router.get('/health', async (req, res) => {
  try {
    const health = await aiService.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

export default router;
