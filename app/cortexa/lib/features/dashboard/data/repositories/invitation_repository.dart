import '../../../../core/network/api_client.dart';
import '../../../../core/errors/exceptions.dart';

/// Repository for invitation operations
class InvitationRepository {
  final ApiClient _apiClient;

  InvitationRepository(this._apiClient);

  /// Send a single invitation (manual entry)
  /// 
  /// For students: requires emailOrUsername, institutionId, department, semester
  /// For teachers: requires emailOrUsername, institutionId, department, semester, courses
  Future<Map<String, dynamic>> createInvitation({
    required String institutionId,
    required String recipientType, // 'Student' or 'Teacher'
    required String emailOrUsername,
    String? message,
    required String department,
    required String semester,
    List<String>? courses, // Required for teachers
  }) async {
    try {
      print('🌐 Creating invitation for: $emailOrUsername as $recipientType');
      
      final payload = {
        'institutionId': institutionId,
        'recipientType': recipientType,
        'emailOrUsername': emailOrUsername,
        'message': message ?? 'You are invited to join the institution',
        'department': department,
        'semester': semester,
        if (courses != null && courses.isNotEmpty) 'courses': courses,
      };

      final response = await _apiClient.post(
        '/invitations',
        body: payload,
        requiresAuth: true,
      );

      print('✅ Invitation created successfully');
      return response;
    } on ApiException catch (e) {
      print('❌ API error creating invitation: ${e.message}');
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error creating invitation: $e');
      throw ServerException(
        message: 'Failed to send invitation: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Send bulk invitations (CSV upload for students only)
  /// 
  /// Requires institutionId, department, semester
  /// Each user must have emailOrUsername
  Future<Map<String, dynamic>> bulkInviteUsers({
    required String institutionId,
    required String recipientType, // Must be 'Student'
    required List<Map<String, String>> users,
    required String department,
    required String semester,
  }) async {
    try {
      print('🌐 Bulk inviting ${users.length} users as $recipientType');
      
      if (recipientType != 'Student') {
        throw ServerException(
          message: 'Bulk invite is only available for students. Use manual entry for teachers.',
          statusCode: 400,
        );
      }

      final payload = {
        'institutionId': institutionId,
        'recipientType': recipientType,
        'users': users.map((u) => {
          'emailOrUsername': u['emailOrUsername'] ?? u['username'] ?? u['email'] ?? '',
          'message': u['message'] ?? 'You are invited to join the institution',
        }).toList(),
        'department': department,
        'semester': semester,
      };

      final response = await _apiClient.post(
        '/invitations/bulk',
        body: payload,
        requiresAuth: true,
      );

      final successCount = response['successCount'] ?? 0;
      final errors = response['errors'] as List? ?? [];
      
      print('✅ Bulk invite completed: $successCount successful, ${errors.length} errors');
      return response;
    } on ApiException catch (e) {
      print('❌ API error with bulk invite: ${e.message}');
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error with bulk invite: $e');
      throw ServerException(
        message: 'Failed to send bulk invitations: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Get invitations for current user
  Future<List<Map<String, dynamic>>> getMyInvitations({String? status}) async {
    try {
      print('🌐 Fetching my invitations...');
      
      final queryParams = status != null ? '?status=$status' : '';
      
      final response = await _apiClient.get(
        '/invitations$queryParams',
        requiresAuth: true,
      );

      final invitations = (response['invitations'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ?? [];

      print('✅ Fetched ${invitations.length} invitations');
      return invitations;
    } catch (e) {
      print('❌ Error fetching invitations: $e');
      return [];
    }
  }

  /// Accept an invitation
  Future<Map<String, dynamic>> acceptInvitation(String invitationId) async {
    try {
      print('🌐 Accepting invitation: $invitationId');
      
      final response = await _apiClient.post(
        '/invitations/$invitationId/accept',
        requiresAuth: true,
      );

      print('✅ Invitation accepted');
      return response;
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      throw ServerException(
        message: 'Failed to accept invitation: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Reject an invitation
  Future<Map<String, dynamic>> rejectInvitation(String invitationId) async {
    try {
      print('🌐 Rejecting invitation: $invitationId');
      
      final response = await _apiClient.post(
        '/invitations/$invitationId/reject',
        requiresAuth: true,
      );

      print('✅ Invitation rejected');
      return response;
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      throw ServerException(
        message: 'Failed to reject invitation: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Get all invitations (admin only)
  Future<List<Map<String, dynamic>>> getAdminInvitations({
    String? status,
    String? recipientType,
  }) async {
    try {
      print('🌐 Fetching admin invitations...');
      
      final queryParams = <String>[];
      if (status != null) queryParams.add('status=$status');
      if (recipientType != null) queryParams.add('recipientType=$recipientType');
      
      final query = queryParams.isNotEmpty ? '?${queryParams.join('&')}' : '';
      
      final response = await _apiClient.get(
        '/invitations/admin$query',
        requiresAuth: true,
      );

      final invitations = (response['invitations'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ?? [];

      print('✅ Fetched ${invitations.length} admin invitations');
      return invitations;
    } catch (e) {
      print('❌ Error fetching admin invitations: $e');
      return [];
    }
  }

  /// Delete an invitation (admin only)
  Future<Map<String, dynamic>> deleteInvitation(String invitationId) async {
    try {
      print('🌐 Deleting invitation: $invitationId');
      
      final response = await _apiClient.delete(
        '/invitations/$invitationId',
        requiresAuth: true,
      );

      print('✅ Invitation deleted');
      return response;
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      throw ServerException(
        message: 'Failed to delete invitation: ${e.toString()}',
        statusCode: 500,
      );
    }
  }
}
