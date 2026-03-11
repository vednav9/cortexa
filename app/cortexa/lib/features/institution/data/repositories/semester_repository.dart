import '../../../../core/network/api_client.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/errors/exceptions.dart';

/// Repository for semester operations
class SemesterRepository {
  final ApiClient _apiClient;
  final HiveStorageService _storage;

  SemesterRepository(this._apiClient, this._storage);

  /// Get all semesters for an institution
  Future<Map<String, dynamic>> getSemesters(String institutionId) async {
    try {
      print('🌐 Fetching semesters for institution: $institutionId');
      
      final response = await _apiClient.get(
        '/academic/institutions/$institutionId/semesters',
        requiresAuth: true,
      );

      final semesters = (response['data'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ?? [];

      print('✅ Fetched ${semesters.length} semesters');
      
      // Cache semesters locally
      _cacheSemesters(institutionId, semesters);
      
      return {
        'success': true,
        'data': semesters,
        'count': response['count'] ?? semesters.length,
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error fetching semesters: $e');
      throw ServerException(
        message: 'Failed to fetch semesters: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Get cached semesters from local storage
  List<Map<String, dynamic>> getCachedSemesters(String institutionId) {
    try {
      return _storage.getAllSemesters(institutionId: institutionId);
    } catch (e) {
      print('❌ Error getting cached semesters: $e');
      return [];
    }
  }

  /// Create a new semester
  Future<Map<String, dynamic>> createSemester({
    required String institutionId,
    required String name,
    required String academicYear,
    required DateTime startDate,
    required DateTime endDate,
    bool isActive = false,
  }) async {
    try {
      print('🌐 Creating semester: $name');
      
      final response = await _apiClient.post(
        '/academic/institutions/$institutionId/semesters',
        body: {
          'name': name,
          'academicYear': academicYear,
          'startDate': startDate.toIso8601String(),
          'endDate': endDate.toIso8601String(),
          'isActive': isActive,
        },
        requiresAuth: true,
      );

      print('✅ Semester created successfully');
      
      final semester = response['semester'] as Map<String, dynamic>?;
      if (semester != null) {
        // Add to local cache
        _addSemesterToCache(institutionId, semester);
      }
      
      return {
        'success': true,
        'semester': semester,
        'message': response['message'] ?? 'Semester created successfully',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error creating semester: $e');
      throw ServerException(
        message: 'Failed to create semester: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Update a semester
  Future<Map<String, dynamic>> updateSemester({
    required String semesterId,
    String? name,
    String? academicYear,
    DateTime? startDate,
    DateTime? endDate,
    bool? isActive,
  }) async {
    try {
      print('🌐 Updating semester: $semesterId');
      
      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (academicYear != null) body['academicYear'] = academicYear;
      if (startDate != null) body['startDate'] = startDate.toIso8601String();
      if (endDate != null) body['endDate'] = endDate.toIso8601String();
      if (isActive != null) body['isActive'] = isActive;
      
      final response = await _apiClient.put(
        '/academic/semesters/$semesterId',
        body: body,
        requiresAuth: true,
      );

      print('✅ Semester updated successfully');
      
      final semester = response['semester'] as Map<String, dynamic>?;
      if (semester != null) {
        // Update in local cache
        _updateSemesterInCache(semester);
      }
      
      return {
        'success': true,
        'semester': semester,
        'message': response['message'] ?? 'Semester updated successfully',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error updating semester: $e');
      throw ServerException(
        message: 'Failed to update semester: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Delete a semester
  Future<Map<String, dynamic>> deleteSemester(String semesterId) async {
    try {
      print('🌐 Deleting semester: $semesterId');
      
      final response = await _apiClient.delete(
        '/academic/semesters/$semesterId',
        requiresAuth: true,
      );

      print('✅ Semester deleted successfully');
      
      // Remove from local cache
      _deleteSemesterFromCache(semesterId);
      
      return {
        'success': true,
        'message': response['message'] ?? 'Semester deleted successfully',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error deleting semester: $e');
      throw ServerException(
        message: 'Failed to delete semester: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  // ==================== Cache Management ====================

  void _cacheSemesters(String institutionId, List<Map<String, dynamic>> semesters) {
    // Note: Batch caching handled at UI level via individual saveSemester calls
    print('💾 Semesters available for caching: ${semesters.length}');
  }

  void _addSemesterToCache(String institutionId, Map<String, dynamic> semester) {
    // Note: Caching handled at UI level
    print('💾 Semester available for caching');
  }

  void _updateSemesterInCache(Map<String, dynamic> semester) {
    // Note: Caching handled at UI level
    print('💾 Semester update available for caching');
  }

  void _deleteSemesterFromCache(String semesterId) {
    // Note: Caching handled at UI level
    print('💾 Semester deletion available for caching');
  }
}
