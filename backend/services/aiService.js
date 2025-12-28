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

  // Health Check
  async checkHealth() {
    try {
      const response = await axios.get(`${AI_API_URL}/health`);
      return response.data;
    } catch (error) {
      return { status: 'unavailable', error: error.message };
    }
  }
}

const aiService = new AIService();
export default aiService;