import '../../../../core/network/api_client.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/errors/exceptions.dart';

/// Repository for department operations
class DepartmentRepository {
  final ApiClient _apiClient;
  final HiveStorageService _storage;

  DepartmentRepository(this._apiClient, this._storage);

  /// Get all departments for an institution
  Future<Map<String, dynamic>> getDepartments(String institutionId) async {
    try {
      print('🌐 Fetching departments for institution: $institutionId');
      
      final response = await _apiClient.get(
        '/academic/institutions/$institutionId/departments',
        requiresAuth: true,
      );

      final departments = (response['data'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ?? [];

      print('✅ Fetched ${departments.length} departments');
      
      // Cache departments locally
      _cacheDepartments(institutionId, departments);
      
      return {
        'success': true,
        'data': departments,
        'count': response['count'] ?? departments.length,
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error fetching departments: $e');
      throw ServerException(
        message: 'Failed to fetch departments: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Get cached departments from local storage
  List<Map<String, dynamic>> getCachedDepartments(String institutionId) {
    try {
      return _storage.getAllDepartments(institutionId: institutionId);
    } catch (e) {
      print('❌ Error getting cached departments: $e');
      return [];
    }
  }

  /// Create a new department
  Future<Map<String, dynamic>> createDepartment({
    required String institutionId,
    required String name,
    required String code,
    String? description,
    String? headOfDepartment,
  }) async {
    try {
      print('🌐 Creating department: $name');
      
      final response = await _apiClient.post(
        '/academic/institutions/$institutionId/departments',
        body: {
          'name': name,
          'code': code,
          'description': description ?? '',
          if (headOfDepartment != null) 'headOfDepartment': headOfDepartment,
        },
        requiresAuth: true,
      );

      print('✅ Department created successfully');
      
      final department = response['department'] as Map<String, dynamic>?;
      if (department != null) {
        // Add to local cache
        _addDepartmentToCache(institutionId, department);
      }
      
      return {
        'success': true,
        'department': department,
        'message': response['message'] ?? 'Department created successfully',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error creating department: $e');
      throw ServerException(
        message: 'Failed to create department: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Update a department
  Future<Map<String, dynamic>> updateDepartment({
    required String departmentId,
    String? name,
    String? code,
    String? description,
    String? headOfDepartment,
    bool? isActive,
  }) async {
    try {
      print('🌐 Updating department: $departmentId');
      
      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (code != null) body['code'] = code;
      if (description != null) body['description'] = description;
      if (headOfDepartment != null) body['headOfDepartment'] = headOfDepartment;
      if (isActive != null) body['isActive'] = isActive;
      
      final response = await _apiClient.put(
        '/academic/departments/$departmentId',
        body: body,
        requiresAuth: true,
      );

      print('✅ Department updated successfully');
      
      final department = response['department'] as Map<String, dynamic>?;
      if (department != null) {
        // Update in local cache
        _updateDepartmentInCache(department);
      }
      
      return {
        'success': true,
        'department': department,
        'message': response['message'] ?? 'Department updated successfully',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error updating department: $e');
      throw ServerException(
        message: 'Failed to update department: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Delete a department
  Future<Map<String, dynamic>> deleteDepartment(String departmentId) async {
    try {
      print('🌐 Deleting department: $departmentId');
      
      final response = await _apiClient.delete(
        '/academic/departments/$departmentId',
        requiresAuth: true,
      );

      print('✅ Department deleted successfully');
      
      // Remove from local cache
      _deleteDepartmentFromCache(departmentId);
      
      return {
        'success': true,
        'message': response['message'] ?? 'Department deleted successfully',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error deleting department: $e');
      throw ServerException(
        message: 'Failed to delete department: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  // ==================== Cache Management ====================

  void _cacheDepartments(String institutionId, List<Map<String, dynamic>> departments) {
    // Note: Batch caching handled at UI level via individual saveDepartment calls
    print('💾 Departments available for caching: ${departments.length}');
  }

  void _addDepartmentToCache(String institutionId, Map<String, dynamic> department) {
    // Note: Caching handled at UI level
    print('💾 Department available for caching');
  }

  void _updateDepartmentInCache(Map<String, dynamic> department) {
    // Note: Caching handled at UI level
    print('💾 Department update available for caching');
  }

  void _deleteDepartmentFromCache(String departmentId) {
    // Note: Caching handled at UI level
    print('💾 Department deletion available for caching');
  }
}
