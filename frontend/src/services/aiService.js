import axios from 'axios';
import { API_BASE_URL, AI_URL } from '../config/api';

const AI_DIRECT_URL = AI_URL; // Direct AI connection

// Create axios instance for backend routes
const aiAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes timeout for AI operations (increased from 2 min)
  headers: {
    'Content-Type': 'application/json',
  }
});

// Create axios instance for direct AI server connection (RAG chatbot)
const aiDirectAxios = axios.create({
  baseURL: AI_DIRECT_URL,
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
  }
});

class AIService {
  // RAG Query - Direct to AI server (no backend)
  async queryRAG(query, institutionId = null) {
    try {
      const response = await aiDirectAxios.post('/query', {
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

  // Hybrid Assistant - Direct to AI server (no backend, no refresh)
  async queryAssistant(query, useWebFallback = true) {
    try {
      const response = await aiDirectAxios.post('/assistant', {
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

  // Generate MCQs - Through backend (for teacher features)
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

  // Score MCQs - Direct to AI server
  async scoreMCQs(mcqs, userAnswers) {
    try {
      const response = await aiDirectAxios.post('/mcq/score', {
        mcqs,
        user_answers: userAnswers
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Scoring failed');
    }
  }

  // Upload Document - Direct to AI server (for RAG chatbot)
  async uploadDocument(file, institutionId = null, courseId = null, uploadedBy = null) {
    try {
      // Validate file parameter
      if (!file) {
        throw new Error('No file provided');
      }

      console.log('uploadDocument called with:', {
        file: file,
        type: typeof file,
        constructor: file?.constructor?.name,
        isFile: file instanceof File,
        isBlob: file instanceof Blob,
        hasName: !!file?.name,
        hasSize: !!file?.size,
        hasType: !!file?.type
      });

      // If file-like object but not instanceof File/Blob, try to reconstruct it
      let validFile = file;
      
      if (!(file instanceof File) && !(file instanceof Blob)) {
        console.warn('File object lost prototype, attempting to reconstruct...');
        
        // Check if it has file-like properties
        if (file.name && file.size !== undefined && file.type !== undefined) {
          try {
            // Try to read as blob and create new File
            if (file instanceof Object && file.arrayBuffer) {
              const buffer = await file.arrayBuffer();
              validFile = new File([buffer], file.name, { type: file.type });
              console.log('✓ Successfully reconstructed File object');
            } else {
              throw new Error('Cannot reconstruct File object - missing arrayBuffer method');
            }
          } catch (reconstructError) {
            console.error('Failed to reconstruct file:', reconstructError);
            throw new Error('Document upload failed: Invalid file object. Please refresh the page and try again.');
          }
        } else {
          throw new Error('Document upload failed: Invalid file object. Please select the file again.');
        }
      }

      console.log('Final file validation:', {
        name: validFile.name,
        type: validFile.type,
        size: validFile.size,
        isFile: validFile instanceof File,
        isBlob: validFile instanceof Blob
      });

      const formData = new FormData();
      formData.append('file', validFile, validFile.name);
      
      if (institutionId) {
        formData.append('institution_id', String(institutionId));
      }
      if (courseId) {
        formData.append('course_id', String(courseId));
      }
      if (uploadedBy) {
        formData.append('uploaded_by', String(uploadedBy));
      }

      console.log('Sending upload request to backend /api/ai/upload...');

      // Send through backend API to handle R2 + MongoDB + AI processing
      const response = await aiAxios.post('/ai/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000, // 5 minutes for file uploads
      });

      console.log('Upload successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout - File might be too large or processing is taking too long.');
      }
      throw new Error(error.response?.data?.detail || error.response?.data?.error || error.message || 'Upload failed');
    }
  }

  // Index Document — direct to HF Space (avoids Vercel 60 s serverless timeout).
  // Mirrors the Flutter app's Step 2: POST {aiRoot}/upload with the raw File.
  // Returns { filename, chunks_added, status } from the AI server.
  async indexDocument(file, institutionId = null, courseId = null) {
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);
      if (institutionId) formData.append('institution_id', String(institutionId));
      if (courseId) formData.append('course_id', String(courseId));

      const response = await aiDirectAxios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 minutes — HF Space can be slow on cold start
      });
      return response.data; // { filename, chunks_added, status }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Document processing timed out. The file was saved but may not be available for search yet. Please try again later.');
      }
      throw new Error(
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        'Document processing failed'
      );
    }
  }

  // Check AI Health - Direct to AI server
  async checkHealth() {
    try {
      const response = await aiDirectAxios.get('/health', { timeout: 5000 }); // Short timeout for health check
      return response.data;
    } catch (error) {
      return { status: 'unavailable', error: error.message };
    }
  }
}

export default new AIService();
