import 'package:dio/dio.dart';
import '../../../../core/config/api_config.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../teacher/data/models/mcq_model.dart';

class StudentMcqRepository {
  final Dio _dio;
  final HiveStorageService _storage;

  StudentMcqRepository({Dio? dio, HiveStorageService? storage})
      : _dio = dio ?? getIt<Dio>(),
        _storage = storage ?? getIt<HiveStorageService>();

  Map<String, String> get _authHeaders {
    final token = _storage.getToken();
    return token != null ? {'Authorization': 'Bearer $token'} : {};
  }

  /// Fetch MCQ sets assigned to this student for the given institution.
  /// Returns an empty list when the backend endpoint is not yet available (404/405).
  Future<List<MCQSetModel>> getAssignedMCQSets(String institutionId) async {
    try {
      final response = await _dio.get(
        '${ApiConfig.baseUrl}${ApiConfig.studentGetAssignedMCQs}',
        queryParameters: {'institutionId': institutionId},
        options: Options(headers: _authHeaders),
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true) {
          final list = data['mcqSets'] as List<dynamic>? ?? [];
          return list
              .map((json) => MCQSetModel.fromJson(json as Map<String, dynamic>))
              .toList();
        }
      }
      return [];
    } on DioException catch (e) {
      // Endpoint not implemented yet — silently return empty list
      if (e.response?.statusCode == 404 || e.response?.statusCode == 405) {
        return [];
      }
      rethrow;
    }
  }

  /// Submit a completed MCQ attempt to the backend.
  /// Returns true on success, false on any failure (non-fatal).
  Future<bool> submitAttempt({
    required String mcqSetId,
    required Map<int, int> answers,
    required int timeTaken,
    required int score,
    required int totalQuestions,
    required double percentage,
  }) async {
    try {
      final answersList = answers.entries
          .map((e) => {'questionIndex': e.key, 'selectedAnswer': e.value})
          .toList();

      final response = await _dio.post(
        '${ApiConfig.baseUrl}${ApiConfig.studentSubmitMCQ(mcqSetId)}',
        data: {
          'answers': answersList,
          'timeTaken': timeTaken,
          'score': score,
          'totalQuestions': totalQuestions,
          'percentage': percentage,
        },
        options: Options(headers: _authHeaders),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException {
      return false;
    }
  }
}
