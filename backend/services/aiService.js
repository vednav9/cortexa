import axios from "axios";
import FormData from "form-data"; // Node.js FormData

const AI_API_URL = process.env.AI_API_URL || 'http://localhost:8000';

// Increased timeouts for AI operations
const DEFAULT_TIMEOUT = 180000; // 3 minutes
const LONG_TIMEOUT = 300000; // 5 minutes

class AIService {
  // RAG Query
  async queryRAG(query, institutionId = null) {
    try {
      const response = await axios.post(`${AI_API_URL}/query`, {
        query,
        top_k: 5,
        institution_id: institutionId
      }, {
        timeout: DEFAULT_TIMEOUT // 3 minutes timeout
      });
      return response.data;
    } catch (error) {
      throw new Error(`RAG query failed: ${error.message}`);
    }
  }

  // Hybrid Assistant (RAG + Web)
  async queryHybridAssistant(query, useWebFallback = true) {
    try {
      const response = await axios.post(`${AI_API_URL}/assistant`, {
        query,
        use_web_fallback: useWebFallback
      }, {
        timeout: DEFAULT_TIMEOUT // 3 minutes timeout
      });
      return response.data;
    } catch (error) {
      throw new Error(`Hybrid query failed: ${error.message}`);
    }
  }

  // Generate MCQs
  async generateMCQs(sourceType, source, numQuestions = 5, difficulty = 'medium') {
    try {
      const response = await axios.post(`${AI_API_URL}/mcq/generate`, {
        source_type: sourceType, // 'text', 'document', 'topic'
        source: source,
        num_questions: numQuestions,
        difficulty: difficulty
      }, {
        timeout: LONG_TIMEOUT // 5 minutes - MCQ generation can take longer
      });
      return response.data;
    } catch (error) {
      throw new Error(`MCQ generation failed: ${error.message}`);
    }
  }

  // Score MCQs
  async scoreMCQs(mcqs, userAnswers) {
    try {
      const response = await axios.post(`${AI_API_URL}/mcq/score`, {
        mcqs,
        user_answers: userAnswers
      }, {
        timeout: 30000 // 30 seconds for scoring
      });
      return response.data;
    } catch (error) {
      throw new Error(`MCQ scoring failed: ${error.message}`);
    }
  }

  // Upload Document
  async uploadDocument(fileBuffer, fileName, institutionId = null, courseId = null) {
    try {
      const formData = new FormData();
      // Append buffer as blob with proper options
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'application/octet-stream'
      });
      if (institutionId) formData.append('institution_id', institutionId);
      if (courseId) formData.append('course_id', courseId);

      const response = await axios.post(`${AI_API_URL}/upload`, formData, {
        headers: {
          ...formData.getHeaders() // Get proper headers from form-data
        },
        timeout: LONG_TIMEOUT, // 5 minutes for file upload
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      return response.data;
    } catch (error) {
      console.error('Backend upload error:', error.response?.data || error.message);
      throw new Error(`Document upload failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  // Get document chunks with embeddings
  async getDocumentChunks(fileName) {
    try {
      const response = await axios.get(`${AI_API_URL}/documents/${encodeURIComponent(fileName)}/chunks`, {
        timeout: LONG_TIMEOUT
      });
      return response.data;
    } catch (error) {
      console.error('Get chunks error:', error.response?.data || error.message);
      throw new Error(`Failed to get document chunks: ${error.response?.data?.detail || error.message}`);
    }
  }

  // Health Check
  async checkHealth() {
    try {
      const response = await axios.get(`${AI_API_URL}/health`);
      return response.data;
    } catch (error) {
      return { status: 'unavailable', error: error.message };
    }
  }

  // ========================================
  // VOICE-TO-TEXT METHODS
  // ========================================

  /**
   * Transcribe audio and upload to RAG system
   * Complete workflow: Upload → Transcribe → Format → Add to RAG
   */
  async transcribeAndUpload(fileBuffer, fileName, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('audio_file', fileBuffer, {
        filename: fileName,
        contentType: 'audio/wav' // or detect from file
      });
      
      // Add metadata
      if (metadata.lecture_title) formData.append('lecture_title', metadata.lecture_title);
      if (metadata.teacher_id) formData.append('teacher_id', metadata.teacher_id);
      if (metadata.institution_id) formData.append('institution_id', metadata.institution_id);
      if (metadata.course_id) formData.append('course_id', metadata.course_id);

      const response = await axios.post(`${AI_API_URL}/speech/transcribe-and-upload`, formData, {
        headers: {
          ...formData.getHeaders()
        },
        timeout: LONG_TIMEOUT, // 5 minutes for audio processing
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      return response.data;
    } catch (error) {
      console.error('Transcription error:', error.response?.data || error.message);
      throw new Error(`Transcription failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Upload audio only (without transcription)
   */
  async uploadAudio(fileBuffer, fileName, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'audio/wav'
      });
      
      if (metadata.teacher_id) formData.append('teacher_id', metadata.teacher_id);
      if (metadata.lecture_title) formData.append('lecture_title', metadata.lecture_title);

      const response = await axios.post(`${AI_API_URL}/speech/upload-audio`, formData, {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 60000, // 1 minute for upload
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      return response.data;
    } catch (error) {
      throw new Error(`Audio upload failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Transcribe existing audio file
   */
  async transcribe(audioFilename, options = {}) {
    try {
      const response = await axios.post(`${AI_API_URL}/speech/transcribe`, {
        audio_filename: audioFilename,
        include_timestamps: options.include_timestamps !== false,
        format_text: options.format_text !== false,
        export_format: options.export_format || 'both'
      }, {
        timeout: LONG_TIMEOUT
      });
      return response.data;
    } catch (error) {
      throw new Error(`Transcription failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * List all transcripts
   */
  async listTranscripts() {
    try {
      const response = await axios.get(`${AI_API_URL}/speech/transcripts`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch transcripts');
    }
  }

  /**
   * List all audio files
   */
  async listAudioFiles() {
    try {
      const response = await axios.get(`${AI_API_URL}/speech/audio-files`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch audio files');
    }
  }

  /**
   * Get download URL for transcript
   */
  getTranscriptDownloadUrl(filename) {
    return `${AI_API_URL}/speech/download/${filename}`;
  }

  /**
   * Delete audio file
   */
  async deleteAudio(filename) {
    try {
      const response = await axios.delete(`${AI_API_URL}/speech/audio/${filename}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete audio');
    }
  }

  /**
   * Delete transcript
   */
  async deleteTranscript(filename) {
    try {
      const response = await axios.delete(`${AI_API_URL}/speech/transcript/${filename}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete transcript');
    }
  }
}

const aiService = new AIService();
export default aiService;