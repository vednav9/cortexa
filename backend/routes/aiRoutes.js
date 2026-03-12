import express from "express";
import aiService from "../services/aiService.js";
import documentService from "../services/documentService.js";
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

    const { institution_id, course_id, uploaded_by } = req.body;

    if (!institution_id || !course_id || !uploaded_by) {
      return res.status(400).json({ 
        error: 'institution_id, course_id, and uploaded_by are required' 
      });
    }

    // Get file type from extension
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    
    // Process and store document (R2 + MongoDB + AI server)
    const result = await documentService.processAndStoreDocument(
      req.file.buffer,
      req.file.originalname,
      {
        institutionId: institution_id,
        courseId: course_id,
        uploadedBy: uploaded_by,
        fileType: fileExtension,
        fileSize: req.file.size
      }
    );

    res.json({
      success: true,
      filename: result.document.fileName,
      fileUrl: result.r2Url,
      chunksCount: result.chunksCount,
      embeddingsCount: result.embeddingsCount,
      documentId: result.document._id,
      message: result.message
    });
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

// ============================================================
// SPEECH / VOICE-TO-TEXT ROUTES
// ============================================================

// POST /api/ai/speech/transcribe-and-upload
router.post('/speech/transcribe-and-upload', upload.single('audio_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'audio_file is required' });
    }
    const { lecture_title, teacher_id, institution_id, course_id } = req.body;
    const result = await aiService.transcribeAndUpload(
      req.file.buffer,
      req.file.originalname,
      { lecture_title, teacher_id, institution_id, course_id }
    );
    res.json(result);
  } catch (error) {
    console.error('Transcribe-and-upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/speech/upload-audio
router.post('/speech/upload-audio', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
    }
    const { teacher_id, lecture_title } = req.body;
    const result = await aiService.uploadAudio(
      req.file.buffer,
      req.file.originalname,
      { teacher_id, lecture_title }
    );
    res.json(result);
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/speech/transcribe
router.post('/speech/transcribe', async (req, res) => {
  try {
    const { audio_filename, include_timestamps, format_text, export_format } = req.body;
    if (!audio_filename) {
      return res.status(400).json({ error: 'audio_filename is required' });
    }
    const result = await aiService.transcribe(audio_filename, {
      include_timestamps,
      format_text,
      export_format
    });
    res.json(result);
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai/speech/transcripts
router.get('/speech/transcripts', async (req, res) => {
  try {
    const result = await aiService.listTranscripts();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai/speech/audio-files
router.get('/speech/audio-files', async (req, res) => {
  try {
    const result = await aiService.listAudioFiles();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai/speech/download/:filename - Proxy file download from AI server
router.get('/speech/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const url = aiService.getTranscriptDownloadUrl(filename);
    const response = await (await import('axios')).default.get(url, { responseType: 'stream' });
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    response.data.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
