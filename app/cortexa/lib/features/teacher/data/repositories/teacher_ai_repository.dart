import 'dart:typed_data';
import '../../../../core/network/api_client.dart';
import '../../../rag_assistant/data/models/mcq_model.dart';

/// Repository for teacher-specific AI operations
/// Handles MCQ generation, document uploads, and RAG queries
class TeacherAiRepository {
  final ApiClient _apiClient;

  TeacherAiRepository(this._apiClient);

  /// Generate MCQs from topic, text, or document
  /// 
  /// [courseId] - Course ID for authorization check
  /// [topic] - Topic/subject for MCQ generation
  /// [count] - Number of MCQs to generate (default: 5)
  /// [difficulty] - Difficulty level: 'easy', 'medium', 'hard' (default: 'medium')
  /// 
  /// Returns: List of generated MCQs
  Future<List<McqQuestion>> generateMcqs({
    required String courseId,
    required String topic,
    int count = 5,
    String difficulty = 'medium',
  }) async {
    try {
      final response = await _apiClient.post(
        '/teacher/mcq/generate',
        body: {
          'courseId': courseId,
          'topic': topic,
          'count': count,
          'difficulty': difficulty,
        },
        requiresAuth: true,
      );

      if (response['success'] == true) {
        final mcqsData = response['mcqs'] as List;
        return mcqsData.map((json) => McqQuestion.fromJson(json)).toList();
      } else {
        throw Exception(response['message'] ?? 'Failed to generate MCQs');
      }
    } catch (e) {
      throw Exception('MCQ generation failed: ${e.toString()}');
    }
  }

  /// Save generated MCQ set
  /// 
  /// [title] - Title for the MCQ set
  /// [courseId] - Course ID
  /// [mcqs] - List of MCQ questions
  /// [timeLimit] - Time limit in minutes (optional)
  /// 
  /// Returns: Saved MCQ set ID
  Future<String> saveMcqSet({
    required String title,
    required String courseId,
    required List<McqQuestion> mcqs,
    int? timeLimit,
  }) async {
    try {
      final response = await _apiClient.post(
        '/teacher/mcq/save',
        body: {
          'title': title,
          'courseId': courseId,
          'mcqs': mcqs.map((mcq) => mcq.toJson()).toList(),
          if (timeLimit != null) 'timeLimit': timeLimit,
        },
        requiresAuth: true,
      );

      if (response['success'] == true) {
        return response['mcqSetId'] as String;
      } else {
        throw Exception(response['message'] ?? 'Failed to save MCQ set');
      }
    } catch (e) {
      throw Exception('Save MCQ set failed: ${e.toString()}');
    }
  }

  /// Add MCQs to existing set
  /// 
  /// [mcqSetId] - MCQ set ID
  /// [mcqs] - List of MCQ questions to add
  Future<void> addToMcqSet({
    required String mcqSetId,
    required List<McqQuestion> mcqs,
  }) async {
    try {
      final response = await _apiClient.post(
        '/teacher/mcq/$mcqSetId/add',
        body: {
          'mcqs': mcqs.map((mcq) => mcq.toJson()).toList(),
        },
        requiresAuth: true,
      );

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Failed to add MCQs');
      }
    } catch (e) {
      throw Exception('Add MCQs failed: ${e.toString()}');
    }
  }

  /// Get all MCQ sets created by teacher
  /// 
  /// Returns: List of MCQ sets with metadata
  Future<List<Map<String, dynamic>>> getMcqSets() async {
    try {
      final response = await _apiClient.get('/teacher/mcq/sets', requiresAuth: true);

      if (response['success'] == true) {
        return List<Map<String, dynamic>>.from(response['mcqSets']);
      } else {
        throw Exception(response['message'] ?? 'Failed to fetch MCQ sets');
      }
    } catch (e) {
      throw Exception('Fetch MCQ sets failed: ${e.toString()}');
    }
  }

  /// Assign MCQ set to students
  /// 
  /// [mcqSetId] - MCQ set ID
  /// [studentIds] - List of student IDs
  /// [dueDate] - Assignment due date (optional)
  Future<void> assignMcqSet({
    required String mcqSetId,
    required List<String> studentIds,
    DateTime? dueDate,
  }) async {
    try {
      final response = await _apiClient.post(
        '/teacher/mcq/$mcqSetId/assign',
        body: {
          'studentIds': studentIds,
          if (dueDate != null) 'dueDate': dueDate.toIso8601String(),
        },
        requiresAuth: true,
      );

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Failed to assign MCQ set');
      }
    } catch (e) {
      throw Exception('Assign MCQ set failed: ${e.toString()}');
    }
  }

  /// Get MCQ results for a set
  /// 
  /// [mcqSetId] - MCQ set ID
  /// 
  /// Returns: Results with student performance data
  Future<Map<String, dynamic>> getMcqResults(String mcqSetId) async {
    try {
      final response = await _apiClient.get('/teacher/mcq/$mcqSetId/results', requiresAuth: true);

      if (response['success'] == true) {
        return response['results'] as Map<String, dynamic>;
      } else {
        throw Exception(response['message'] ?? 'Failed to fetch results');
      }
    } catch (e) {
      throw Exception('Fetch results failed: ${e.toString()}');
    }
  }

  /// Upload document bytes for a course.
  ///
  /// Backend pipeline:
  /// 1) Upload to Cloudflare R2
  /// 2) AI indexing (/upload) for chunking + embeddings
  /// 3) Persist to MongoDB (DocumentChunk + EmbeddingStore)
  Future<Map<String, dynamic>> uploadDocument({
    required Uint8List fileBytes,
    required String fileExtension,
    required String fileName,
    required String courseId,
  }) async {
    final mime = _mimeForExtension(fileExtension);
    final fullFileName = '$fileName.$fileExtension';

    // Single backend call executes full pipeline and returns final status.
    final response = await _apiClient.uploadFileBytes(
      '/teacher/notes/upload',
      fileBytes: fileBytes,
      fileName: fullFileName,
      fieldName: 'file',
      mimeType: mime,
      additionalFields: {
        'courseId': courseId,
        'fileName': fileName,
      },
      requiresAuth: true,
    );
    if (response['success'] != true) {
      throw Exception(response['message'] ?? 'Failed to upload document');
    }

    return response;
  }

  String _mimeForExtension(String ext) {
    switch (ext.toLowerCase()) {
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'doc':
        return 'application/msword';
      case 'txt':
        return 'text/plain';
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'ppt':
        return 'application/vnd.ms-powerpoint';
      default:
        return 'application/octet-stream';
    }
  }

  /// Get documents for a course
  ///
  /// [courseId] - Course ID
  ///
  /// Returns: List of uploaded documents
  Future<List<Map<String, dynamic>>> getDocuments(String courseId) async {
    try {
      final response = await _apiClient.get('/teacher/notes/$courseId', requiresAuth: true);

      if (response['success'] == true) {
        return List<Map<String, dynamic>>.from(response['documents']);
      } else {
        throw Exception(response['message'] ?? 'Failed to fetch documents');
      }
    } catch (e) {
      throw Exception('Fetch documents failed: ${e.toString()}');
    }
  }

  /// Delete a document
  /// 
  /// [documentId] - Document ID
  Future<void> deleteDocument(String documentId) async {
    try {
      final response = await _apiClient.delete('/teacher/notes/$documentId', requiresAuth: true);

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Failed to delete document');
      }
    } catch (e) {
      throw Exception('Delete document failed: ${e.toString()}');
    }
  }
}
