import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AIService {
  // RAG Query
  async queryRAG(query, institutionId = null) {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/query`, {
        query,
        institution_id: institutionId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Query failed');
    }
  }

  // Hybrid Assistant
  async queryAssistant(query, useWebFallback = true) {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/assistant`, {
        query,
        use_web_fallback: useWebFallback
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Assistant query failed');
    }
  }

  // Generate MCQs
  async generateMCQs(sourceType, source, numQuestions = 5, difficulty = 'medium') {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/mcq/generate`, {
        source_type: sourceType,
        source,
        num_questions: numQuestions,
        difficulty
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'MCQ generation failed');
    }
  }

  // Score MCQs
  async scoreMCQs(mcqs, userAnswers) {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/mcq/score`, {
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

      const response = await axios.post(`${API_BASE_URL}/ai/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Upload failed');
    }
  }

  // Check AI Health
  async checkHealth() {
    try {
      const response = await axios.get(`${API_BASE_URL}/ai/health`);
      return response.data;
    } catch (error) {
      return { status: 'unavailable' };
    }
  }
}

export default new AIService();
