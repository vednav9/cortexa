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
    try {
      final response = await _apiClient.post(
        ApiConfig.teacherGenerateMCQs,
        body: {
          'courseId': courseId,
          'topic': topic,
          'sourceType': sourceType,
          'count': count,
          'difficulty': difficulty.toLowerCase(),
        },
        requiresAuth: true,
      );

      if (response['success'] == true) {
        final mcqsData = response['mcqs'] as List? ?? [];
        return mcqsData.map((json) => MCQModel.fromJson(json)).toList();
      } else {
        throw Exception(response['message'] ?? 'Failed to generate MCQs');
      }
    } catch (e) {
      throw Exception('Failed to generate MCQs: ${e.toString()}');
    }
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
