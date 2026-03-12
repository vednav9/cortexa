import '../../../../core/network/api_client.dart';
import '../../../../core/config/api_config.dart';
import '../models/mcq_model.dart';

class MCQRepository {
  final ApiClient _apiClient;

  MCQRepository(this._apiClient);

  /// Generate MCQs using AI
  Future<List<MCQModel>> generateMCQs({
    required String courseId,
    required String topic,
    required String sourceType, // 'topic' or 'document'
    required int count,
    required String difficulty,
  }) async {
    final normalizedDifficulty = difficulty.toLowerCase();
    final normalizedSourceType =
        (sourceType == 'topic' || sourceType == 'document' || sourceType == 'text')
            ? sourceType
            : 'topic';

    // AI-first strategy: guarantees real generated MCQs when local backend is
    // up but /teacher/mcq/generate may still be stale in some deployments.
    try {
      return await _generateViaAiRoute(
        topic: topic,
        sourceType: normalizedSourceType,
        count: count,
        difficulty: normalizedDifficulty,
      );
    } catch (firstError) {
      // Fallback to teacher route for compatibility.
      try {
        final response = await _apiClient.post(
          ApiConfig.teacherGenerateMCQs,
          body: {
            'courseId': courseId,
            'topic': topic,
            'sourceType': normalizedSourceType,
            'count': count,
            'difficulty': normalizedDifficulty,
          },
          requiresAuth: true,
        );

        if (response['success'] != true) {
          throw Exception(response['message'] ?? 'Failed to generate MCQs');
        }

        final mcqsData = response['mcqs'] as List? ?? [];
        if (_looksLikePlaceholderMcqs(mcqsData)) {
          throw Exception('Teacher endpoint returned placeholder MCQs');
        }

        if (mcqsData.isEmpty) {
          throw Exception('No MCQs returned');
        }

        return mcqsData.map((json) => MCQModel.fromJson(json)).toList();
      } catch (fallbackError) {
        throw Exception(
          'Failed to generate MCQs: ${fallbackError.toString()} | AI direct error: ${firstError.toString()}',
        );
      }
    }
  }

  bool _looksLikePlaceholderMcqs(List mcqsData) {
    if (mcqsData.isEmpty) return false;

    bool looksLikePlaceholder(dynamic item) {
      if (item is! Map) return false;
      final q = (item['question'] ?? '').toString().toLowerCase();
      final exp = (item['explanation'] ?? '').toString().toLowerCase();
      final options = [
        (item['option_a'] ?? '').toString().toLowerCase(),
        (item['option_b'] ?? '').toString().toLowerCase(),
        (item['option_c'] ?? '').toString().toLowerCase(),
        (item['option_d'] ?? '').toString().toLowerCase(),
      ];

      return q.startsWith('sample question') ||
          exp.contains('this is the explanation for question') ||
          options.every((o) => o.startsWith('option '));
    }

    // If most returned items look synthetic, treat the set as placeholder data.
    final sampleCount = mcqsData.where(looksLikePlaceholder).length;
    return sampleCount > 0 && sampleCount >= (mcqsData.length / 2).ceil();
  }

  Future<List<MCQModel>> _generateViaAiRoute({
    required String topic,
    required String sourceType,
    required int count,
    required String difficulty,
  }) async {
    final aiResponse = await _apiClient.aiPost(
      '/mcq/generate',
      body: {
        'source_type': sourceType,
        'source': topic,
        'num_questions': count,
        'difficulty': difficulty,
      },
    );

    final status = (aiResponse['status'] ?? '').toString().toLowerCase();
    if (status != 'success') {
      throw Exception(aiResponse['error'] ?? aiResponse['message'] ?? 'AI generation failed');
    }

    final mcqsData = aiResponse['mcqs'] as List? ?? [];
    if (mcqsData.isEmpty) {
      throw Exception('AI returned no MCQs');
    }
    return mcqsData.map((json) => MCQModel.fromJson(json)).toList();
  }

  /// Save MCQ set
  Future<MCQSetModel> saveMCQSet({
    required String courseId,
    required String title,
    String? description,
    required List<MCQModel> mcqs,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConfig.teacherSaveMCQSet,
        body: {
          'courseId': courseId,
          'title': title,
          'description': description ?? '',
          'mcqs': mcqs.map((mcq) => mcq.toJson()).toList(),
        },
        requiresAuth: true,
      );

      if (response['success'] == true) {
        return MCQSetModel.fromJson(response['mcqSet']);
      } else {
        throw Exception(response['message'] ?? 'Failed to save MCQ set');
      }
    } catch (e) {
      throw Exception('Failed to save MCQ set: ${e.toString()}');
    }
  }

  /// Add MCQs to existing set
  Future<MCQSetModel> addToMCQSet({
    required String mcqSetId,
    required List<MCQModel> mcqs,
  }) async {
    try {
      final response = await _apiClient.post(
        '${ApiConfig.teacherMCQSetBase}/$mcqSetId/add',
        body: {
          'mcqs': mcqs.map((mcq) => mcq.toJson()).toList(),
        },
        requiresAuth: true,
      );

      if (response['success'] == true) {
        return MCQSetModel.fromJson(response['mcqSet']);
      } else {
        throw Exception(response['message'] ?? 'Failed to add MCQs to set');
      }
    } catch (e) {
      throw Exception('Failed to add MCQs to set: ${e.toString()}');
    }
  }

  /// Get all MCQ sets
  Future<List<MCQSetModel>> getMCQSets({String? courseId}) async {
    try {
      String url = ApiConfig.teacherGetMCQSets;
      if (courseId != null) {
        url += '?courseId=$courseId';
      }

      final response = await _apiClient.get(
        url,
        requiresAuth: true,
      );

      if (response['success'] == true) {
        final setsData = response['mcqSets'] as List? ?? [];
        return setsData.map((json) => MCQSetModel.fromJson(json)).toList();
      } else {
        throw Exception(response['message'] ?? 'Failed to fetch MCQ sets');
      }
    } catch (e) {
      throw Exception('Failed to fetch MCQ sets: ${e.toString()}');
    }
  }

  /// Delete MCQ set
  Future<void> deleteMCQSet(String mcqSetId) async {
    try {
      final response = await _apiClient.delete(
        '${ApiConfig.teacherMCQSetBase}/$mcqSetId',
        requiresAuth: true,
      );

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Failed to delete MCQ set');
      }
    } catch (e) {
      throw Exception('Failed to delete MCQ set: ${e.toString()}');
    }
  }
}
