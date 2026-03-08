import '../../../../core/network/api_client.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/errors/exceptions.dart';

/// Repository for announcement operations
class AnnouncementRepository {
  final ApiClient _apiClient;
  final HiveStorageService _storage;

  AnnouncementRepository(this._apiClient, this._storage);

  /// Get all announcements for an institution
  Future<Map<String, dynamic>> getAnnouncements(
    String institutionId, {
    int limit = 20,
    int skip = 0,
    String? type,
    String? priority,
  }) async {
    try {
      print('🌐 Fetching announcements for institution: $institutionId');
      
      final queryParams = {
        'limit': limit.toString(),
        'skip': skip.toString(),
        if (type != null) 'type': type,
        if (priority != null) 'priority': priority,
      };
      
      final queryString = queryParams.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
          .join('&');
      
      final response = await _apiClient.get(
        '/announcements/$institutionId?$queryString',
        requiresAuth: false,
      );

      final announcements = (response['announcements'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ?? [];

      print('✅ Fetched ${announcements.length} announcements');
      
      // Cache announcements locally
      _cacheAnnouncements(institutionId, announcements);
      
      return {
        'success': true,
        'announcements': announcements,
        'total': response['total'] ?? 0,
        'hasMore': response['hasMore'] ?? false,
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error fetching announcements: $e');
      throw ServerException(
        message: 'Failed to fetch announcements: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Create a new announcement (Admin/Teacher only)
  Future<Map<String, dynamic>> createAnnouncement({
    required String institutionId,
    required String title,
    required String content,
    String type = 'general',
    String priority = 'normal',
    List<String> targetAudience = const ['all'],
    List<Map<String, String>> attachments = const [],
    bool isPinned = false,
  }) async {
    try {
      print('🌐 Creating announcement: $title');
      
      final response = await _apiClient.post(
        '/announcements',
        body: {
          'institution': institutionId,
          'title': title,
          'content': content,
          'type': type,
          'priority': priority,
          'targetAudience': targetAudience,
          'attachments': attachments,
          'isPinned': isPinned,
        },
        requiresAuth: true,
      );

      print('✅ Announcement created successfully');
      
      final announcement = response['announcement'] as Map<String, dynamic>?;
      if (announcement != null) {
        // Add to local cache
        _addAnnouncementToCache(institutionId, announcement);
      }
      
      return {
        'success': true,
        'announcement': announcement,
        'message': response['message'] ?? 'Announcement created successfully',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error creating announcement: $e');
      throw ServerException(
        message: 'Failed to create announcement: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Update an announcement (Author only)
  Future<Map<String, dynamic>> updateAnnouncement(
    String announcementId,
    Map<String, dynamic> updates,
  ) async {
    try {
      print('🌐 Updating announcement: $announcementId');
      
      final response = await _apiClient.put(
        '/announcements/$announcementId',
        body: updates,
        requiresAuth: true,
      );

      print('✅ Announcement updated successfully');
      
      return {
        'success': true,
        'announcement': response['announcement'],
        'message': response['message'] ?? 'Announcement updated successfully',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error updating announcement: $e');
      throw ServerException(
        message: 'Failed to update announcement: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Delete an announcement (Author only)
  Future<Map<String, dynamic>> deleteAnnouncement(String announcementId) async {
    try {
      print('🌐 Deleting announcement: $announcementId');
      
      final response = await _apiClient.delete(
        '/announcements/$announcementId',
        requiresAuth: true,
      );

      print('✅ Announcement deleted successfully');
      
      // Remove from local cache
      _removeAnnouncementFromCache(announcementId);
      
      return {
        'success': true,
        'message': response['message'] ?? 'Announcement deleted successfully',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error deleting announcement: $e');
      throw ServerException(
        message: 'Failed to delete announcement: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Mark announcement as viewed
  Future<void> markAsViewed(String announcementId) async {
    try {
      await _apiClient.post(
        '/announcements/$announcementId/view',
        requiresAuth: true,
      );
      print('✅ Marked announcement as viewed: $announcementId');
    } catch (e) {
      print('⚠️ Failed to mark announcement as viewed: $e');
      // Don't throw - this is not critical
    }
  }

  /// Get cached announcements from local storage
  List<Map<String, dynamic>> getCachedAnnouncements(String institutionId) {
    try {
      return _storage.getAllAnnouncements(institutionId: institutionId);
    } catch (e) {
      print('❌ Error getting cached announcements: $e');
      return [];
    }
  }

  /// Cache announcements locally
  void _cacheAnnouncements(String institutionId, List<Map<String, dynamic>> announcements) {
    try {
      for (final announcement in announcements) {
        _storage.saveAnnouncement(announcement);
      }
      print('💾 Cached ${announcements.length} announcements');
    } catch (e) {
      print('⚠️ Failed to cache announcements: $e');
    }
  }

  /// Add single announcement to cache
  void _addAnnouncementToCache(String institutionId, Map<String, dynamic> announcement) {
    try {
      _storage.saveAnnouncement(announcement);
      print('💾 Added announcement to cache');
    } catch (e) {
      print('⚠️ Failed to add announcement to cache: $e');
    }
  }

  /// Remove announcement from cache
  void _removeAnnouncementFromCache(String announcementId) {
    try {
      _storage.deleteAnnouncement(announcementId);
      print('💾 Removed announcement from cache');
    } catch (e) {
      print('⚠️ Failed to remove announcement from cache: $e');
    }
  }
}
