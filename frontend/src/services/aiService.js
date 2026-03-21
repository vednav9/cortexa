import axios from 'axios';
import { API_BASE_URL, AI_URL } from '../config/api';

const AI_DIRECT_URL = AI_URL;

const aiAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000,
  headers: { 'Content-Type': 'application/json' }
});

const aiDirectAxios = axios.create({
  baseURL: AI_DIRECT_URL,
  timeout: 180000,
  headers: { 'Content-Type': 'application/json' }
});

class AIService {

  async queryRAG(query, institutionId = null) {
    try {
      const response = await aiDirectAxios.post('/query', { query, institution_id: institutionId });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') throw new Error('Request timeout - AI is taking longer than expected.');
      throw new Error(error.response?.data?.error || 'Query failed');
    }
  }

  async queryAssistant(query, useWebFallback = true) {
    try {
      const response = await aiDirectAxios.post('/assistant', { query, use_web_fallback: useWebFallback });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') throw new Error('Request timeout - AI is taking longer than expected.');
      throw new Error(error.response?.data?.error || 'Assistant query failed');
    }
  }

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
      if (error.code === 'ECONNABORTED') throw new Error('Request timeout - MCQ generation taking too long.');
      throw new Error(error.response?.data?.error || 'MCQ generation failed');
    }
  }

  async scoreMCQs(mcqs, userAnswers) {
    try {
      const response = await aiDirectAxios.post('/mcq/score', { mcqs, user_answers: userAnswers });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Scoring failed');
    }
  }

  async uploadDocument(file, institutionId = null, courseId = null, uploadedBy = null) {
    try {
      if (!file) throw new Error('No file provided');
      let validFile = file;
      if (!(file instanceof File) && !(file instanceof Blob)) {
        if (file.name && file.size !== undefined && file.type !== undefined) {
          try {
            if (file instanceof Object && file.arrayBuffer) {
              const buffer = await file.arrayBuffer();
              validFile = new File([buffer], file.name, { type: file.type });
            } else {
              throw new Error('Cannot reconstruct File object');
            }
          } catch {
            throw new Error('Document upload failed: Invalid file object. Please refresh and try again.');
          }
        } else {
          throw new Error('Document upload failed: Invalid file object. Please select the file again.');
        }
      }
      const formData = new FormData();
      formData.append('file', validFile, validFile.name);
      if (institutionId) formData.append('institution_id', String(institutionId));
      if (courseId) formData.append('course_id', String(courseId));
      if (uploadedBy) formData.append('uploaded_by', String(uploadedBy));
      const response = await aiAxios.post('/ai/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') throw new Error('Upload timeout - File might be too large.');
      throw new Error(error.response?.data?.detail || error.response?.data?.error || error.message || 'Upload failed');
    }
  }

  async indexDocument(file, institutionId = null, courseId = null) {
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);
      if (institutionId) formData.append('institution_id', String(institutionId));
      if (courseId) formData.append('course_id', String(courseId));
      const response = await aiDirectAxios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Document processing timed out. The file was saved but may not be searchable yet.');
      }
      throw new Error(
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        'Document processing failed'
      );
    }
  }

  async checkHealth() {
    try {
      const response = await aiDirectAxios.get('/health', { timeout: 5000 });
      return response.data;
    } catch (error) {
      return { status: 'unavailable', error: error.message };
    }
  }
}

export default new AIService();
