import '../../../../core/network/api_client.dart';
import '../../../../core/di/service_locator.dart';

class FacultyRepository {
  final _apiClient = getIt<ApiClient>();

  /// Get all faculty members for an institution
  Future<Map<String, dynamic>> getFaculty({
    required String institutionId,
    String? departmentId,
  }) async {
    try {
      print('🌐 Fetching faculty for institution: $institutionId');
      
      String endpoint = '/academic/institutions/$institutionId/faculty';
      if (departmentId != null && departmentId.isNotEmpty) {
        endpoint += '?departmentId=$departmentId';
      }
      
      final response = await _apiClient.get(
        endpoint,
        requiresAuth: true,
      );

      print('✅ Faculty fetched successfully: ${response['count']} members');
      
      return response;
    } catch (e) {
      print('❌ Error fetching faculty: $e');
      rethrow;
    }
  }
}
