import '../../../../core/network/api_client.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/errors/exceptions.dart';

/// Repository for institution admin operations
class InstitutionAdminRepository {
  final ApiClient _apiClient;

  InstitutionAdminRepository(this._apiClient, HiveStorageService storage);

  /// Get institution details with stats
  Future<Map<String, dynamic>> getMyInstitution() async {
    try {
      print('🌐 Fetching admin institution details...');
      
      final response = await _apiClient.get(
        '/admin/institution',
        requiresAuth: true,
      );

      if (response['institution'] == null) {
        throw ServerException(
          message: 'Institution not found',
          statusCode: 404,
        );
      }

      final institution = response['institution'] as Map<String, dynamic>;
      print('✅ Fetched institution: ${institution['name']}');
      print('   Students: ${institution['stats']?['students'] ?? 0}');
      print('   Teachers: ${institution['stats']?['teachers'] ?? 0}');

      return institution;
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      throw ServerException(
        message: 'Failed to fetch institution: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Get students for institution
  Future<List<Map<String, dynamic>>> getInstitutionStudents(
    String institutionId,
  ) async {
    try {
      print('🌐 Fetching students for institution: $institutionId');
      
      final response = await _apiClient.get(
        '/admin/institutions/$institutionId/students',
        requiresAuth: true,
      );

      final students = (response['students'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ?? [];

      print('✅ Fetched ${students.length} students');
      return students;
    } catch (e) {
      print('❌ Error fetching students: $e');
      return [];
    }
  }

  /// Get teachers for institution
  Future<List<Map<String, dynamic>>> getInstitutionTeachers(
    String institutionId,
  ) async {
    try {
      print('🌐 Fetching teachers for institution: $institutionId');
      
      final response = await _apiClient.get(
        '/admin/institutions/$institutionId/teachers',
        requiresAuth: true,
      );

      final teachers = (response['teachers'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ?? [];

      print('✅ Fetched ${teachers.length} teachers');
      return teachers;
    } catch (e) {
      print('❌ Error fetching teachers: $e');
      return [];
    }
  }

  /// Get all users in institution (for manage users page)
  Future<List<Map<String, dynamic>>> getUsers(
    String institutionId, {
    String role = 'all',
    String? status,
    String? department,
    String? search,
  }) async {
    try {
      print('🌐 Fetching users for institution: $institutionId (role: $role)');
      
      final queryParams = <String, String>{
        if (role != 'all') 'role': role,
        if (status != null) 'status': status,
        if (department != null) 'department': department,
        if (search != null && search.isNotEmpty) 'search': search,
      };

      final query = queryParams.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
          .join('&');

      final endpoint = '/admin/institutions/$institutionId/users${query.isNotEmpty ? '?$query' : ''}';
      
      final response = await _apiClient.get(
        endpoint,
        requiresAuth: true,
      );

      final users = (response['users'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ?? [];

      print('✅ Fetched ${users.length} users');
      return users;
    } catch (e) {
      print('❌ Error fetching users: $e');
      return [];
    }
  }

  /// Add user to institution
  Future<Map<String, dynamic>?> addUser(
    String institutionId,
    Map<String, dynamic> userData,
  ) async {
    try {
      print('🌐 Adding user to institution: $institutionId');
      
      final response = await _apiClient.post(
        '/admin/institutions/$institutionId/users',
        body: userData,
        requiresAuth: true,
      );

      print('✅ User added successfully');
      return response['user'] as Map<String, dynamic>?;
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      throw ServerException(
        message: 'Failed to add user: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Update user
  Future<Map<String, dynamic>> updateUser(
    String userId,
    Map<String, dynamic> userData,
  ) async {
    try {
      print('🌐 Updating user: $userId');
      
      final response = await _apiClient.put(
        '/admin/users/$userId',
        body: userData,
        requiresAuth: true,
      );

      print('✅ User updated successfully');
      return response;
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      throw ServerException(
        message: 'Failed to update user: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Toggle user status (active/inactive)
  Future<void> toggleUserStatus(
    String userId,
    String role,
  ) async {
    try {
      print('🌐 Toggling status for user: $userId ($role)');
      
      await _apiClient.put(
        '/admin/users/$userId/$role/status',
        requiresAuth: true,
      );

      print('✅ User status toggled');
    } catch (e) {
      print('❌ Error toggling user status: $e');
      rethrow;
    }
  }

  /// Delete user
  Future<Map<String, dynamic>> deleteUser(
    String userId,
    String role,
  ) async {
    try {
      print('🌐 Deleting user: $userId ($role)');
      
      final response = await _apiClient.delete(
        '/admin/users/$userId/$role',
        requiresAuth: true,
      );

      print('✅ User deleted successfully');
      return response;
    } catch (e) {
      print('❌ Error deleting user: $e');
      rethrow;
    }
  }
}
