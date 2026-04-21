import '../../../../core/config/api_config.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/network/api_client.dart';
import '../../../teacher/data/models/mcq_model.dart';

class StudentMcqRepository {
  final ApiClient _apiClient;

  StudentMcqRepository({ApiClient? apiClient})
    : _apiClient = apiClient ?? getIt<ApiClient>();

  /// Fetch MCQ sets assigned to this student for the given institution.
  Future<List<MCQSetModel>> getAssignedMCQSets(String institutionId) async {
    try {
      final endpoint =
          '${ApiConfig.studentGetAssignedMCQs}?institutionId=${Uri.encodeQueryComponent(institutionId)}';

      final response = await _apiClient.get(endpoint, requiresAuth: true);

      if (response['success'] == false) {
        return [];
      }

      final list = (response['mcqSets'] as List?) ?? const [];
      return list
          .whereType<Map>()
          .map((json) => MCQSetModel.fromJson(Map<String, dynamic>.from(json)))
          .toList();
    } catch (_) {
      rethrow;
    }
  }

  /// Fetch details of a selected MCQ set.
  Future<MCQSetModel> getMCQSetDetails(String mcqSetId) async {
    final response = await _apiClient.get(
      ApiConfig.studentGetMCQDetails(mcqSetId),
      requiresAuth: true,
    );

    if (response['success'] == false || response['mcqSet'] is! Map) {
      throw Exception(response['error'] ?? 'Failed to load test details');
    }

    return MCQSetModel.fromJson(Map<String, dynamic>.from(response['mcqSet']));
  }

  /// Submit a completed MCQ attempt to the backend.
  Future<bool> submitAttempt({
    required String mcqSetId,
    required Map<int, int> answers,
    required int timeTaken,
    int? score,
    int? totalQuestions,
    double? percentage,
  }) async {
    try {
      final answersList = answers.entries
          .map((e) => {'questionIndex': e.key, 'selectedAnswer': e.value})
          .toList();

      final response = await _apiClient.post(
        ApiConfig.studentSubmitMCQ(mcqSetId),
        body: {'answers': answersList, 'timeTaken': timeTaken},
        requiresAuth: true,
      );

      return response['success'] == true;
    } catch (_) {
      return false;
    }
  }
}
