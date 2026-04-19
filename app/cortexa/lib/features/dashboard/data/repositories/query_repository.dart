import '../../../../core/config/api_config.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../models/query_model.dart';

class QueryRepository {
  final ApiClient _apiClient;
  final HiveStorageService _storage;

  QueryRepository({ApiClient? apiClient, HiveStorageService? storage})
    : _apiClient = apiClient ?? getIt<ApiClient>(),
      _storage = storage ?? getIt<HiveStorageService>();

  String _buildQueryString(Map<String, dynamic> queryParams) {
    if (queryParams.isEmpty) return '';
    final entries = queryParams.entries
        .where(
          (entry) =>
              entry.value != null && entry.value.toString().trim().isNotEmpty,
        )
        .map(
          (entry) =>
              '${Uri.encodeQueryComponent(entry.key)}=${Uri.encodeQueryComponent(entry.value.toString())}',
        )
        .toList();

    if (entries.isEmpty) return '';
    return '?${entries.join('&')}';
  }

  List<Query> _mapQueriesFromResponse(Map<String, dynamic> response) {
    final list = (response['queries'] as List?) ?? const [];
    return list
        .whereType<Map>()
        .map((json) => Query.fromJson(Map<String, dynamic>.from(json)))
        .toList();
  }

  /// Get all queries for an institution
  /// Parameters:
  /// - institutionId: The institution ID
  /// - status: Filter by status (open, in-progress, resolved, closed, all)
  /// - category: Filter by category
  /// - priority: Filter by priority
  /// - search: Search term for title/description
  Future<List<Query>> getQueries({
    required String institutionId,
    String? status,
    String? category,
    String? priority,
    String? search,
  }) async {
    try {
      final queryParams = <String, dynamic>{};

      if (status != null && status != 'all') {
        queryParams['status'] = status;
      }
      if (category != null) {
        queryParams['category'] = category;
      }
      if (priority != null) {
        queryParams['priority'] = priority;
      }
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final endpoint =
          '${ApiConfig.queriesByInstitution(institutionId)}${_buildQueryString(queryParams)}';

      final response = await _apiClient.get(endpoint, requiresAuth: true);

      final success = response['success'];
      if (success == false) {
        throw Exception(response['message'] ?? 'Failed to fetch queries');
      }

      return _mapQueriesFromResponse(response);
    } catch (e) {
      throw Exception('Error fetching queries: $e');
    }
  }

  /// Get single query by ID
  Future<Query> getQueryById(String queryId) async {
    try {
      final response = await _apiClient.get(
        ApiConfig.queryById(queryId),
        requiresAuth: true,
      );

      if (response['success'] == false) {
        throw Exception(response['message'] ?? 'Failed to fetch query');
      }

      final query = response['query'];
      if (query is! Map) {
        throw Exception('Invalid query response');
      }

      return Query.fromJson(Map<String, dynamic>.from(query));
    } catch (e) {
      throw Exception('Error fetching query: $e');
    }
  }

  /// Create a new query
  Future<Query> createQuery({
    required String institutionId,
    required String title,
    required String description,
    String category = 'general',
    String priority = 'normal',
  }) async {
    try {
      final requestData = {
        'title': title,
        'description': description,
        'category': category,
        'priority': priority,
      };

      final response = await _apiClient.post(
        ApiConfig.createQuery(institutionId),
        body: requestData,
        requiresAuth: true,
      );

      if (response['success'] == false) {
        throw Exception(response['message'] ?? 'Failed to create query');
      }

      final query = response['query'];
      if (query is! Map) {
        throw Exception('Invalid query response');
      }

      return Query.fromJson(Map<String, dynamic>.from(query));
    } catch (e) {
      throw Exception('Error creating query: $e');
    }
  }

  /// Add a reply to a query
  Future<Query> addReply({
    required String queryId,
    required String text,
  }) async {
    try {
      final requestData = {'text': text};

      final response = await _apiClient.post(
        ApiConfig.addReply(queryId),
        body: requestData,
        requiresAuth: true,
      );

      if (response['success'] == false) {
        throw Exception(response['message'] ?? 'Failed to add reply');
      }

      final query = response['query'];
      if (query is! Map) {
        throw Exception('Invalid query response');
      }

      return Query.fromJson(Map<String, dynamic>.from(query));
    } catch (e) {
      throw Exception('Error adding reply: $e');
    }
  }

  /// Update query status (admin/teacher only)
  Future<Query> updateQueryStatus({
    required String queryId,
    required String status,
  }) async {
    try {
      final requestData = {'status': status};

      final response = await _apiClient.patch(
        ApiConfig.updateQueryStatus(queryId),
        body: requestData,
        requiresAuth: true,
      );

      if (response['success'] == false) {
        throw Exception(response['message'] ?? 'Failed to update status');
      }

      final query = response['query'];
      if (query is! Map) {
        throw Exception('Invalid query response');
      }

      return Query.fromJson(Map<String, dynamic>.from(query));
    } catch (e) {
      throw Exception('Error updating status: $e');
    }
  }

  /// Delete a query (admin only)
  Future<void> deleteQuery(String queryId) async {
    try {
      final response = await _apiClient.delete(
        ApiConfig.deleteQuery(queryId),
        requiresAuth: true,
      );

      if (response['success'] == false) {
        throw Exception(response['message'] ?? 'Failed to delete query');
      }
    } catch (e) {
      throw Exception('Error deleting query: $e');
    }
  }

  /// Get query statistics
  Future<QueryStats> getQueryStats(String institutionId) async {
    try {
      final response = await _apiClient.get(
        ApiConfig.queryStats(institutionId),
        requiresAuth: true,
      );

      if (response['success'] == false) {
        throw Exception(response['message'] ?? 'Failed to fetch stats');
      }

      final stats = response['stats'];
      if (stats is! Map) {
        return QueryStats(total: 0, open: 0, inProgress: 0, resolved: 0);
      }

      return QueryStats.fromJson(Map<String, dynamic>.from(stats));
    } catch (e) {
      throw Exception('Error fetching stats: $e');
    }
  }

  /// Resolve institution ID for current user in Cortexa-level dashboard contexts.
  ///
  /// Order:
  /// 1) User model's institutionId
  /// 2) Hive current institution map (id/_id)
  /// 3) Backend my-institution endpoint by role
  Future<String?> resolveInstitutionIdForCurrentUser() async {
    final currentUser = _storage.getCurrentUser();
    final fromUser = currentUser?.institutionId?.trim();
    if (fromUser != null && fromUser.isNotEmpty) {
      return fromUser;
    }

    final currentInstitution = _storage.getCurrentInstitution();
    final fromCurrentInstitution =
        (currentInstitution?['id'] ?? currentInstitution?['_id'])
            ?.toString()
            .trim();

    if (fromCurrentInstitution != null && fromCurrentInstitution.isNotEmpty) {
      if (currentUser != null &&
          (currentUser.institutionId == null ||
              currentUser.institutionId!.isEmpty)) {
        await _storage.saveUser(
          currentUser.copyWith(institutionId: fromCurrentInstitution),
        );
      }
      return fromCurrentInstitution;
    }

    if (currentUser == null) return null;

    String? endpoint;
    switch (currentUser.role.toLowerCase()) {
      case 'student':
        endpoint = ApiConfig.studentMyInstitution;
        break;
      case 'teacher':
        endpoint = ApiConfig.teacherMyInstitution;
        break;
      case 'admin':
        endpoint = ApiConfig.adminInstitution;
        break;
    }

    if (endpoint == null) return null;

    try {
      final response = await _apiClient.get(endpoint, requiresAuth: true);
      final institution = response['institution'];
      if (institution is! Map) return null;

      final institutionMap = Map<String, dynamic>.from(institution);
      final resolvedId = (institutionMap['_id'] ?? institutionMap['id'])
          ?.toString()
          .trim();

      if (resolvedId == null || resolvedId.isEmpty) return null;

      final normalizedInstitution = <String, dynamic>{
        ...institutionMap,
        'id': resolvedId,
      };

      await _storage.saveCurrentInstitution(normalizedInstitution);
      await _storage.saveInstitution(normalizedInstitution);

      await _storage.saveUser(currentUser.copyWith(institutionId: resolvedId));

      return resolvedId;
    } catch (_) {
      return null;
    }
  }
}
