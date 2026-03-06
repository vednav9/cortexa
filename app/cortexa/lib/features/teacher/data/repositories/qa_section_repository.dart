import '../../../../core/network/api_client.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/di/service_locator.dart';
import '../models/qa_item_model.dart';

class QASectionRepository {
  final ApiClient _api;
  final HiveStorageService _storage;

  QASectionRepository({ApiClient? api, HiveStorageService? storage})
      : _api = api ?? getIt<ApiClient>(),
        _storage = storage ?? getIt<HiveStorageService>();

  /* -------------------------------------------------- */
  /*  COURSES                                           */
  /* -------------------------------------------------- */

  Future<List<CourseOption>> getCourses(String institutionId) async {
    final res = await _api.get(
      '/academic/institutions/$institutionId/courses',
      requiresAuth: true,
    );
    final list = (res['courses'] as List?) ?? [];
    return list
        .map((e) => CourseOption.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /* -------------------------------------------------- */
  /*  Q&A LISTING                                       */
  /* -------------------------------------------------- */

  Future<List<QAItem>> getQAsByCourse(
    String courseId, {
    String? status,
    String? category,
    String? search,
    String sort = '-createdAt',
  }) async {
    final params = <String, String>{'sort': sort};
    if (status != null && status != 'all') params['status'] = status;
    if (category != null && category != 'all') params['category'] = category;
    if (search != null && search.isNotEmpty) params['search'] = search;

    final query = params.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
        .join('&');

    final res = await _api.get(
      '/qa/course/$courseId${query.isEmpty ? '' : '?$query'}',
      requiresAuth: true,
    );
    final list = (res['qas'] as List?) ?? [];
    return list
        .map((e) => QAItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<QAStats> getQAStats(String courseId) async {
    final res = await _api.get(
      '/qa/course/$courseId/stats',
      requiresAuth: true,
    );
    final stats = res['stats'] as Map<String, dynamic>?;
    if (stats == null) return const QAStats.empty();
    return QAStats.fromJson(stats);
  }

  Future<QAItem> getQAById(String qaId) async {
    final res = await _api.get(
      '/qa/$qaId',
      requiresAuth: true,
    );
    return QAItem.fromJson(res['qa'] as Map<String, dynamic>);
  }

  /* -------------------------------------------------- */
  /*  CREATE / ANSWER                                   */
  /* -------------------------------------------------- */

  Future<QAItem> createQA(
    String courseId, {
    required String title,
    required String description,
    String category = 'general',
    String priority = 'normal',
    List<String> tags = const [],
    bool isAnonymous = false,
  }) async {
    final res = await _api.post(
      '/qa/course/$courseId',
      body: {
        'title': title,
        'description': description,
        'category': category,
        'priority': priority,
        'tags': tags,
        'isAnonymous': isAnonymous,
      },
      requiresAuth: true,
    );
    return QAItem.fromJson(res['qa'] as Map<String, dynamic>);
  }

  Future<QAItem> addAnswer(String qaId, String text) async {
    final res = await _api.post(
      '/qa/$qaId/answer',
      body: {'text': text},
      requiresAuth: true,
    );
    return QAItem.fromJson(res['qa'] as Map<String, dynamic>);
  }

  /* -------------------------------------------------- */
  /*  STATUS / ACCEPT                                   */
  /* -------------------------------------------------- */

  Future<QAItem> updateStatus(String qaId, String status) async {
    final res = await _api.patch(
      '/qa/$qaId/status',
      body: {'status': status},
      requiresAuth: true,
    );
    return QAItem.fromJson(res['qa'] as Map<String, dynamic>);
  }

  Future<QAItem> acceptAnswer(String qaId, String answerId) async {
    final res = await _api.patch(
      '/qa/$qaId/answer/$answerId/accept',
      requiresAuth: true,
    );
    return QAItem.fromJson(res['qa'] as Map<String, dynamic>);
  }

  /* -------------------------------------------------- */
  /*  UPVOTES                                           */
  /* -------------------------------------------------- */

  Future<(int, bool)> upvoteQA(String qaId) async {
    final res = await _api.post(
      '/qa/$qaId/upvote',
      requiresAuth: true,
    );
    return (res['upvotes'] as int? ?? 0, res['hasUpvoted'] as bool? ?? false);
  }

  Future<int> upvoteAnswer(String qaId, String answerId) async {
    final res = await _api.post(
      '/qa/$qaId/answer/$answerId/upvote',
      requiresAuth: true,
    );
    return res['upvotes'] as int? ?? 0;
  }

  String? get userId => _storage.getCurrentUser()?.id;
  String? get userRole => _storage.getCurrentUser()?.role;
}
