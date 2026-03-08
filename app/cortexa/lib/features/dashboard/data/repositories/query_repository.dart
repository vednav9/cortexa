import 'package:dio/dio.dart';
import '../../../../core/config/api_config.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../models/query_model.dart';

class QueryRepository {
  final Dio _dio;
  final HiveStorageService _storage;

  QueryRepository({Dio? dio, HiveStorageService? storage})
      : _dio = dio ?? getIt<Dio>(),
        _storage = storage ?? getIt<HiveStorageService>();

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

      final token = _storage.getToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final response = await _dio.get(
        '${ApiConfig.baseUrl}/queries/institution/$institutionId',
        queryParameters: queryParams,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          final queries = (data['queries'] as List<dynamic>)
              .map((json) => Query.fromJson(json as Map<String, dynamic>))
              .toList();
          return queries;
        } else {
          throw Exception(data['message'] ?? 'Failed to fetch queries');
        }
      } else {
        throw Exception('Server error: ${response.statusCode}');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(
          e.response?.data['message'] ?? 'Failed to fetch queries',
        );
      } else {
        throw Exception('Network error: ${e.message}');
      }
    } catch (e) {
      throw Exception('Error fetching queries: $e');
    }
  }

  /// Get single query by ID
  Future<Query> getQueryById(String queryId) async {
    try {
      final token = _storage.getToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final response = await _dio.get(
        '${ApiConfig.baseUrl}/queries/$queryId',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return Query.fromJson(data['query'] as Map<String, dynamic>);
        } else {
          throw Exception(data['message'] ?? 'Failed to fetch query');
        }
      } else {
        throw Exception('Server error: ${response.statusCode}');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(
          e.response?.data['message'] ?? 'Failed to fetch query',
        );
      } else {
        throw Exception('Network error: ${e.message}');
      }
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
      final token = _storage.getToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final requestData = {
        'title': title,
        'description': description,
        'category': category,
        'priority': priority,
      };

      final response = await _dio.post(
        '${ApiConfig.baseUrl}${ApiConfig.queriesByInstitution(institutionId)}',
        data: requestData,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return Query.fromJson(data['query'] as Map<String, dynamic>);
        } else {
          throw Exception(data['message'] ?? 'Failed to create query');
        }
      } else {
        throw Exception('Server error: ${response.statusCode}');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(
          e.response?.data['message'] ?? 'Failed to create query',
        );
      } else {
        throw Exception('Network error: ${e.message}');
      }
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
      final token = _storage.getToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final requestData = {'text': text};

      final response = await _dio.post(
        '${ApiConfig.baseUrl}/queries/$queryId/reply',
        data: requestData,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return Query.fromJson(data['query'] as Map<String, dynamic>);
        } else {
          throw Exception(data['message'] ?? 'Failed to add reply');
        }
      } else {
        throw Exception('Server error: ${response.statusCode}');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(
          e.response?.data['message'] ?? 'Failed to add reply',
        );
      } else {
        throw Exception('Network error: ${e.message}');
      }
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
      final token = _storage.getToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final requestData = {'status': status};

      final response = await _dio.patch(
        '${ApiConfig.baseUrl}/queries/$queryId/status',
        data: requestData,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return Query.fromJson(data['query'] as Map<String, dynamic>);
        } else {
          throw Exception(data['message'] ?? 'Failed to update status');
        }
      } else {
        throw Exception('Server error: ${response.statusCode}');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(
          e.response?.data['message'] ?? 'Failed to update status',
        );
      } else {
        throw Exception('Network error: ${e.message}');
      }
    } catch (e) {
      throw Exception('Error updating status: $e');
    }
  }

  /// Delete a query (admin only)
  Future<void> deleteQuery(String queryId) async {
    try {
      final token = _storage.getToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final response = await _dio.delete(
        '${ApiConfig.baseUrl}/queries/$queryId',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] != true) {
          throw Exception(data['message'] ?? 'Failed to delete query');
        }
      } else {
        throw Exception('Server error: ${response.statusCode}');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(
          e.response?.data['message'] ?? 'Failed to delete query',
        );
      } else {
        throw Exception('Network error: ${e.message}');
      }
    } catch (e) {
      throw Exception('Error deleting query: $e');
    }
  }

  /// Get query statistics
  Future<QueryStats> getQueryStats(String institutionId) async {
    try {
      final token = _storage.getToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final response = await _dio.get(
        '${ApiConfig.baseUrl}/queries/institution/$institutionId/stats',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return QueryStats.fromJson(data['stats'] as Map<String, dynamic>);
        } else {
          throw Exception(data['message'] ?? 'Failed to fetch stats');
        }
      } else {
        throw Exception('Server error: ${response.statusCode}');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(
          e.response?.data['message'] ?? 'Failed to fetch stats',
        );
      } else {
        throw Exception('Network error: ${e.message}');
      }
    } catch (e) {
      throw Exception('Error fetching stats: $e');
    }
  }
}
