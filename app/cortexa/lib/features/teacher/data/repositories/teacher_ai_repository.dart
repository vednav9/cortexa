import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart' as http_parser;
import '../../../../core/network/api_client.dart';
import '../../../../core/config/api_config.dart';
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
  /// Step 1 → Backend  (/teacher/notes/upload): R2 storage + MongoDB record.
  ///           Responds immediately — no HF round-trip inside Vercel.
  /// Step 2 → Flutter calls HF Space (/upload) directly with the file bytes.
  ///           Flutter has no serverless timeout, so it can handle HF cold-starts.
  Future<Map<String, dynamic>> uploadDocument({
    required Uint8List fileBytes,
    required String fileExtension,
    required String fileName,
    required String courseId,
  }) async {
    final mime = _mimeForExtension(fileExtension);
    final fullFileName = '$fileName.$fileExtension';

    // ── Step 1: backend (R2 + MongoDB) ────────────────────────────────────
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

    // Extract institutionId and documentId from the document the backend created.
    final doc = response['document'] as Map<String, dynamic>?;
    final institutionId = (doc?['institution'] ?? '').toString();
    final documentId   = (doc?['_id']         ?? '').toString();
    final statusSyncSupported = response['statusSyncSupported'] == true;

    // ── Step 2: HF Space AI indexing (directly from Flutter) ──────────────
    bool aiIndexed = false;
    bool statusSynced = false;
    int chunksAdded = 0;
    String? aiError;
    try {
      final parsedChunks = await _indexInAi(
        fileBytes: fileBytes,
        fileExtension: fileExtension,
        fileName: fullFileName,
        courseId: courseId,
        institutionId: institutionId,
      );
      chunksAdded = parsedChunks ?? 0;
      aiIndexed = true;
      // ── Step 3: flip isProcessed:true in MongoDB (if backend supports it) ─
      if (statusSyncSupported && documentId.isNotEmpty) {
        try {
          await _markDocumentProcessed(documentId, chunksCount: chunksAdded);
          statusSynced = true;
        } catch (_) {
          // Non-fatal: HF indexing succeeded; DB status sync can lag/fail.
          statusSynced = false;
        }
      }
    } catch (e) {
      aiError = e.toString();
      // Persist the failure reason when backend supports status sync.
      if (statusSyncSupported && documentId.isNotEmpty) {
        try {
          await _markDocumentFailed(documentId, aiError);
        } catch (_) {
          // Non-fatal: file remains uploaded and retry can happen later.
        }
      }
    }

    return {
      ...response,
      'aiIndexed': aiIndexed,
      'statusSynced': statusSynced,
      'chunksAdded': chunksAdded,
      if (aiError != null) 'aiError': aiError,
    };
  }

  /// Tells the backend that HF indexing succeeded -> sets isProcessed: true.
  Future<void> _markDocumentProcessed(
    String documentId, {
    required int chunksCount,
  }) async {
    await _apiClient.patch(
      '/teacher/notes/$documentId/mark-processed',
      body: {'chunksCount': chunksCount},
      requiresAuth: true,
    );
  }

  Future<void> _markDocumentFailed(String documentId, String errorMessage) async {
    await _apiClient.patch(
      '/teacher/notes/$documentId/mark-failed',
      body: {'error': errorMessage},
      requiresAuth: true,
    );
  }

  /// POST the file bytes directly to the HF Space /upload endpoint.
  /// Throws on any HTTP error so the caller can surface it.
  Future<int?> _indexInAi({
    required Uint8List fileBytes,
    required String fileExtension,
    required String fileName,
    required String courseId,
    required String institutionId,
  }) async {
    final base = ApiConfig.aiBaseUrl; 
    final aiRoot =
        base.endsWith('/api') ? base.substring(0, base.length - 4) : base;

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$aiRoot/upload'),
    );
    // institution_id and course_id are Form(None) params in the FastAPI endpoint
    if (institutionId.isNotEmpty) request.fields['institution_id'] = institutionId;
    if (courseId.isNotEmpty) request.fields['course_id'] = courseId;
    request.files.add(http.MultipartFile.fromBytes(
      'file',
      fileBytes,
      filename: fileName,
      contentType: http_parser.MediaType.parse(_mimeForExtension(fileExtension)),
    ));

    final streamed = await request.send().timeout(const Duration(minutes: 5));
    final aiResponse = await http.Response.fromStream(streamed);

    if (aiResponse.statusCode < 200 || aiResponse.statusCode >= 300) {
      final body = aiResponse.body.length > 200
          ? aiResponse.body.substring(0, 200)
          : aiResponse.body;
      throw Exception('AI service HTTP ${aiResponse.statusCode}: $body');
    }

    try {
      final decoded = jsonDecode(aiResponse.body);
      if (decoded is Map<String, dynamic>) {
        final chunks = decoded['chunks_added'];
        if (chunks is num) return chunks.toInt();
      }
    } catch (_) {
      // Response may not be JSON in edge cases; ignore and continue.
    }
    return null;
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
