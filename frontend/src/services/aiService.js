import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with longer timeout for AI operations
const aiAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes timeout for AI operations (increased from 2 min)
  headers: {
    'Content-Type': 'application/json',
  }
});

class AIService {
  // RAG Query
  async queryRAG(query, institutionId = null) {
    try {
      const response = await aiAxios.post('/ai/query', {
        query,
        institution_id: institutionId
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - AI is taking longer than expected. Please try a simpler query or restart the AI server.');
      }
      throw new Error(error.response?.data?.error || 'Query failed');
    }
  }

  // Hybrid Assistant
  async queryAssistant(query, useWebFallback = true) {
    try {
      const response = await aiAxios.post('/ai/assistant', {
        query,
        use_web_fallback: useWebFallback
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - AI is taking longer than expected. Please try a simpler query or restart the AI server.');
      }
      throw new Error(error.response?.data?.error || 'Assistant query failed');
    }
  }

  // Generate MCQs
  async generateMCQs(sourceType, source, numQuestions = 5, difficulty = 'medium') {
    try {
      const response = await aiAxios.post('/ai/mcq/generate', {
        source_type: sourceType,
        source,
        num_questions: numQuestions,
        difficulty
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - MCQ generation taking too long. Try fewer questions.');
      }
      throw new Error(error.response?.data?.error || 'MCQ generation failed');
    }
  }

  // Score MCQs
  async scoreMCQs(mcqs, userAnswers) {
    try {
      const response = await aiAxios.post('/ai/mcq/score', {
        mcqs,
        user_answers: userAnswers
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Scoring failed');
    }
  }

  // Upload Document
  async uploadDocument(file, institutionId = null, courseId = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (institutionId) formData.append('institution_id', institutionId);
      if (courseId) formData.append('course_id', courseId);

      const response = await aiAxios.post('/ai/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000, // 5 minutes for file uploads
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout - File might be too large or processing is taking too long.');
      }
      throw new Error(error.response?.data?.error || 'Upload failed');
    }
  }

  // Check AI Health
  async checkHealth() {
    try {
      const response = await aiAxios.get('/ai/health', { timeout: 5000 }); // Short timeout for health check
      return response.data;
    } catch (error) {
      return { status: 'unavailable', error: error.message };
    }
  }
}

export default new AIService();
