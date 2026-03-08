import '../../../../core/network/api_client.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/errors/exceptions.dart';

/// Repository for academic calendar operations
class AcademicCalendarRepository {
  final ApiClient _apiClient;

  AcademicCalendarRepository(this._apiClient, HiveStorageService storage);

  /// Get all calendar events for an institution
  Future<Map<String, dynamic>> getCalendarEvents(
    String institutionId, {
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      print('🌐 Fetching calendar events for institution: $institutionId');
      
      final queryParams = <String, String>{};
      if (startDate != null) queryParams['startDate'] = startDate.toIso8601String();
      if (endDate != null) queryParams['endDate'] = endDate.toIso8601String();
      
      final queryString = queryParams.isEmpty
          ? ''
          : '?${queryParams.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&')}';
      
      final response = await _apiClient.get(
        '/academic/institutions/$institutionId/calendar$queryString',
        requiresAuth: true,
      );

      final events = (response['events'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ?? [];

      print('✅ Fetched ${events.length} calendar events');
      
      // Cache events locally
      _cacheEvents(institutionId, events);
      
      return {
        'success': true,
        'events': events,
        'count': response['count'] ?? events.length,
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error fetching calendar events: $e');
      throw ServerException(
        message: 'Failed to fetch calendar events: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Get cached calendar events from local storage
  List<Map<String, dynamic>> getCachedEvents(String institutionId) {
    // Note: Calendar events not cached locally yet - return empty list
    return [];
  }

  /// Create a new calendar event
  Future<Map<String, dynamic>> createCalendarEvent({
    required String institutionId,
    required String title,
    required DateTime startDate,
    required DateTime endDate,
    String? description,
    String eventType = 'event',
    String? location,
    String targetAudience = 'all',
  }) async {
    try {
      print('🌐 Creating calendar event: $title');
      
      final response = await _apiClient.post(
        '/academic/institutions/$institutionId/calendar',
        body: {
          'title': title,
          'startDate': startDate.toIso8601String(),
          'endDate': endDate.toIso8601String(),
          'description': description ?? '',
          'eventType': eventType,
          if (location != null && location.isNotEmpty) 'location': location,
          'targetAudience': targetAudience,
        },
        requiresAuth: true,
      );

      print('✅ Calendar event created successfully');
      
      final event = response['event'] as Map<String, dynamic>?;
      if (event != null) {
        // Add to local cache
        _addEventToCache(institutionId, event);
      }
      
      return {
        'success': true,
        'event': event,
        'message': response['message'] ?? 'Calendar event created successfully',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error creating calendar event: $e');
      throw ServerException(
        message: 'Failed to create calendar event: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Update a calendar event
  Future<Map<String, dynamic>> updateCalendarEvent({
    required String eventId,
    String? title,
    String? description,
    DateTime? startDate,
    DateTime? endDate,
    String? eventType,
    String? location,
    String? targetAudience,
  }) async {
    try {
      print('🌐 Updating calendar event: $eventId');
      
      final body = <String, dynamic>{};
      if (title != null) body['title'] = title;
      if (description != null) body['description'] = description;
      if (startDate != null) body['startDate'] = startDate.toIso8601String();
      if (endDate != null) body['endDate'] = endDate.toIso8601String();
      if (eventType != null) body['eventType'] = eventType;
      if (location != null) body['location'] = location;
      if (targetAudience != null) body['targetAudience'] = targetAudience;
      
      final response = await _apiClient.put(
        '/academic/calendar/$eventId',
        body: body,
        requiresAuth: true,
      );

      print('✅ Calendar event updated successfully');
      
      final event = response['event'] as Map<String, dynamic>?;
      if (event != null) {
        // Update in local cache
        _updateEventInCache(event);
      }
      
      return {
        'success': true,
        'event': event,
        'message': response['message'] ?? 'Calendar event updated successfully',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error updating calendar event: $e');
      throw ServerException(
        message: 'Failed to update calendar event: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Delete a calendar event
  Future<Map<String, dynamic>> deleteCalendarEvent(String eventId) async {
    try {
      print('🌐 Deleting calendar event: $eventId');
      
      final response = await _apiClient.delete(
        '/academic/calendar/$eventId',
        requiresAuth: true,
      );

      print('✅ Calendar event deleted successfully');
      
      // Remove from local cache
      _deleteEventFromCache(eventId);
      
      return {
        'success': true,
        'message': response['message'] ?? 'Calendar event deleted successfully',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error deleting calendar event: $e');
      throw ServerException(
        message: 'Failed to delete calendar event: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  // ==================== Cache Management ====================

  void _cacheEvents(String institutionId, List<Map<String, dynamic>> events) {
    // Note: Calendar events caching not yet implemented in HiveStorageService
    print('💾 Calendar events available for caching: ${events.length}');
  }

  void _addEventToCache(String institutionId, Map<String, dynamic> event) {
    // Note: Caching not yet implemented
    print('💾 Calendar event available for caching');
  }

  void _updateEventInCache(Map<String, dynamic> event) {
    // Note: Caching not yet implemented
    print('💾 Calendar event update available for caching');
  }

  void _deleteEventFromCache(String eventId) {
    // Note: Caching not yet implemented
    print('💾 Calendar event deletion available for caching');
  }
}
