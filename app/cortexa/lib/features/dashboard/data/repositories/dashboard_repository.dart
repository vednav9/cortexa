import '../../../../core/network/api_client.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/errors/exceptions.dart';
import '../models/institution_display_model.dart';

/// Repository for dashboard data with API integration and Hive caching
class DashboardRepository {
  final ApiClient _apiClient;
  final HiveStorageService _storage;

  // Cache duration: 24 hours for institutions (relatively static data)
  static const Duration _institutionCacheDuration = Duration(hours: 24);
  
  // Cache duration: 5 minutes for notifications (more dynamic)
  static const Duration _notificationCacheDuration = Duration(minutes: 5);

  DashboardRepository(this._apiClient, this._storage);

  /* ===========================
     INSTITUTIONS
  =========================== */

  /// Get all institutions from API or cache
  /// Set forceRefresh=true to bypass cache
  Future<List<InstitutionDisplayModel>> getInstitutions({
    bool forceRefresh = false,
  }) async {
    try {
      // Check cache first unless forced refresh
      if (!forceRefresh) {
        final cached = _getCachedInstitutions();
        if (cached != null) {
          print('✅ Using cached institutions (${cached.length} items)');
          return cached;
        }
      }

      print('🌐 Fetching institutions from API...');
      final response = await _apiClient.get(
        '/institutions/browse',
        requiresAuth: false, // Public endpoint
      );

      if (response['success'] != true) {
        throw ServerException(
          message: response['message'] ?? 'Failed to fetch institutions',
          statusCode: 400,
        );
      }

      final institutions = (response['institutions'] as List)
          .map((json) => _mapBackendInstitutionToModel(json))
          .toList();

      // Save to cache with timestamp
      await _cacheInstitutions(institutions);

      print('✅ Fetched ${institutions.length} institutions from API');
      return institutions;
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      throw ServerException(
        message: 'Failed to fetch institutions: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Get single institution by ID with caching
  Future<InstitutionDisplayModel?> getInstitutionById(
    String institutionId, {
    bool forceRefresh = false,
  }) async {
    try {
      // Check cache first
      if (!forceRefresh) {
        final cached = _storage.findInstitutionById(institutionId);
        if (cached != null) {
          print('✅ Using cached institution: $institutionId');
          return _mapHiveInstitutionToModel(cached);
        }
      }

      print('🌐 Fetching institution $institutionId from API...');
      
      try {
        final response = await _apiClient.get(
          '/institutions/$institutionId',
          requiresAuth: true, // Backend route requires authentication
        );

        if (response['success'] != true || response['institution'] == null) {
          return null;
        }

        final model = _mapBackendInstitutionToModel(response['institution']);
        
        // Save to cache
        await _storage.saveInstitution(_mapModelToHive(model));

        return model;
      } catch (e) {
        print('⚠️ API call failed, checking cache as fallback: $e');
        
        // Try cache as fallback
        final cached = _storage.findInstitutionById(institutionId);
        if (cached != null) {
          print('✅ Using cached institution as fallback');
          return _mapHiveInstitutionToModel(cached);
        }
        
        // If no cache, rethrow error
        rethrow;
      }
    } catch (e) {
      print('❌ Error fetching institution: $e');
      return null;
    }
  }

  /// Get institution by slug (PUBLIC endpoint - like web frontend)
  /// This is the preferred method for browsing public institution details
  Future<InstitutionDisplayModel?> getInstitutionBySlug(
    String slug, {
    bool forceRefresh = false,
  }) async {
    try {
      print('🌐 Fetching institution by slug: $slug');
      
      final response = await _apiClient.get(
        '/institutions/slug/$slug',
        requiresAuth: false, // Public endpoint
      );

      if (response['success'] != true || response['institution'] == null) {
        print('⚠️ Institution not found for slug: $slug');
        return null;
      }

      final model = _mapBackendInstitutionToModel(response['institution']);
      
      // Save to cache
      await _storage.saveInstitution(_mapModelToHive(model));
      print('✅ Successfully fetched institution: ${model.name}');

      return model;
    } catch (e) {
      print('❌ Error fetching institution by slug: $e');
      return null;
    }
  }

  /// Refresh institution details (always fetches from API)
  Future<InstitutionDisplayModel?> refreshInstitution(String institutionId) async {
    return getInstitutionById(institutionId, forceRefresh: true);
  }

  /* ===========================
     NOTIFICATIONS
  =========================== */

  /// Get notifications for admin
  Future<List<Map<String, dynamic>>> getNotifications({
    bool forceRefresh = false,
  }) async {
    try {
      // Check cache first
      if (!forceRefresh) {
        final cached = _getCachedNotifications();
        if (cached != null) {
          print('✅ Using cached notifications (${cached.length} items)');
          return cached;
        }
      }

      print('🌐 Fetching notifications from API...');
      final response = await _apiClient.get(
        '/cortexa-admin/notifications',
        requiresAuth: true,
      );

      final notifications = (response['notifications'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ?? [];

      // Save to cache
      await _cacheNotifications(notifications);

      print('✅ Fetched ${notifications.length} notifications');
      return notifications;
    } catch (e) {
      print('❌ Error fetching notifications: $e');
      return [];
    }
  }

  /* ===========================
     QUERIES
  =========================== */

  /// Get queries for Cortexa-level support
  Future<List<Map<String, dynamic>>> getCortexaQueries({
    String? status,
    bool forceRefresh = false,
  }) async {
    try {
      // For queries, we'll use local Hive storage since they're user-specific
      final currentUser = _storage.getCurrentUser();
      if (currentUser == null) return [];

      // Get queries from local storage (already implemented in HiveStorageService)
      final queries = _storage.getAllQueries(userId: currentUser.id)
          .where((q) => q['query_level'] == 'cortexa' || q['query_level'] == null)
          .toList();

      if (status != null && status != 'all') {
        return queries.where((q) => q['status'] == status).toList();
      }

      return queries;
    } catch (e) {
      print('❌ Error fetching queries: $e');
      return [];
    }
  }

  /// Create a query (saves locally)
  Future<void> createQuery({
    required String title,
    required String description,
    required String category,
    required String priority,
  }) async {
    final currentUser = _storage.getCurrentUser();
    if (currentUser == null) {
      throw ServerException(message: 'No user logged in', statusCode: 401);
    }

    final queryData = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'title': title,
      'description': description,
      'category': category,
      'priority': priority,
      'status': 'open',
      'query_level': 'cortexa', // Cortexa-level query
      'created_at': DateTime.now().toIso8601String(),
      'user_id': currentUser.id,
      'user_name': currentUser.fullName,
      'user_email': currentUser.email,
    };

    await _storage.saveQuery(queryData);
  }

  /* ===========================
     CACHE HELPERS
  =========================== */

  /// Get cached institutions if not expired
  List<InstitutionDisplayModel>? _getCachedInstitutions() {
    final cacheTimestamp = _storage.getMetadata('institutions_cache_timestamp');
    if (cacheTimestamp == null) return null;

    final cachedTime = DateTime.tryParse(cacheTimestamp);
    if (cachedTime == null) return null;

    final age = DateTime.now().difference(cachedTime);
    if (age > _institutionCacheDuration) {
      print('⚠️ Institution cache expired (${age.inHours}h old)');
      return null;
    }

    final allInstitutions = _storage.getAllInstitutions();
    if (allInstitutions.isEmpty) return null;

    return allInstitutions
        .map((json) => _mapHiveInstitutionToModel(json))
        .toList();
  }

  /// Cache institutions with timestamp
  Future<void> _cacheInstitutions(List<InstitutionDisplayModel> institutions) async {
    // Clear old cache
    await _storage.clearInstitutions();

    // Save each institution
    for (final inst in institutions) {
      await _storage.saveInstitution(_mapModelToHive(inst));
    }

    // Save timestamp
    await _storage.saveMetadata(
      'institutions_cache_timestamp',
      DateTime.now().toIso8601String(),
    );
  }

  /// Get cached notifications if not expired
  List<Map<String, dynamic>>? _getCachedNotifications() {
    final cacheTimestamp = _storage.getMetadata('notifications_cache_timestamp');
    if (cacheTimestamp == null) return null;

    final cachedTime = DateTime.tryParse(cacheTimestamp);
    if (cachedTime == null) return null;

    final age = DateTime.now().difference(cachedTime);
    if (age > _notificationCacheDuration) {
      print('⚠️ Notification cache expired (${age.inMinutes}m old)');
      return null;
    }

    final cached = _storage.getMetadata('notifications_cache_data');
    if (cached == null) return null;

    // Parse JSON array
    try {
      final List<dynamic> parsed = List<dynamic>.from(
        cached.split('|||').map((e) => e.trim()).where((e) => e.isNotEmpty),
      );
      return parsed.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (e) {
      print('❌ Error parsing notification cache: $e');
      return null;
    }
  }

  /// Cache notifications with timestamp
  Future<void> _cacheNotifications(List<Map<String, dynamic>> notifications) async {
    // Save notifications as serialized string (Hive metadata limitation)
    final serialized = notifications.map((n) => n.toString()).join('|||');
    await _storage.saveMetadata('notifications_cache_data', serialized);
    
    // Save timestamp
    await _storage.saveMetadata(
      'notifications_cache_timestamp',
      DateTime.now().toIso8601String(),
    );
  }

  /* ===========================
     MAPPING HELPERS
  =========================== */

  /// Map backend institution JSON to display model
  InstitutionDisplayModel _mapBackendInstitutionToModel(Map<String, dynamic> json) {
    final stats = json['stats'] as Map<String, dynamic>?;
    
    return InstitutionDisplayModel(
      id: (json['_id'] ?? json['id'])?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unknown Institution',
      description: json['description']?.toString() ?? '',
      logoUrl: json['branding']?['logo']?.toString(),
      bannerImageUrl: json['branding']?['banner']?.toString(),
      type: json['type']?.toString() ?? 'Institute',
      city: json['address']?['city']?.toString() ?? 'Unknown',
      country: json['address']?['country']?.toString() ?? 'Unknown',
      studentCount: stats?['totalStudents'] as int? ?? 0,
      teacherCount: stats?['totalFaculty'] as int? ?? 0,
      departmentCount: stats?['totalDepartments'] as int? ?? 0,
      courseCount: stats?['totalCourses'] as int? ?? 0,
      semesterCount: stats?['activeSemesters'] as int? ?? 0,
      contactEmail: json['contact']?['email']?.toString(),
      contactPhone: json['contact']?['phone']?.toString(),
      contactWebsite: json['contact']?['website']?.toString(),
      customUrlSlug: json['slug']?.toString() ?? 'institution',
      primaryBrandColor: json['branding']?['primaryColor']?.toString() ?? '#34d399',
      createdAt: DateTime.tryParse(json['established']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  /// Map Hive storage JSON to display model
  InstitutionDisplayModel _mapHiveInstitutionToModel(Map<String, dynamic> json) {
    return InstitutionDisplayModel(
      id: json['id']?.toString() ?? '',
      name: json['institution_name']?.toString() ?? 'Unknown Institution',
      description: json['short_description']?.toString() ?? '',
      logoUrl: json['logo_path']?.toString(),
      bannerImageUrl: json['banner_image_path']?.toString(),
      type: json['institution_type']?.toString() ?? 'Institute',
      city: json['city']?.toString() ?? 'Unknown',
      country: json['country']?.toString() ?? 'Unknown',
      studentCount: 0,
      teacherCount: 0,
      departmentCount: 0,
      courseCount: 0,
      semesterCount: 0,
      customUrlSlug: json['custom_url_slug']?.toString() ?? 'institution',
      primaryBrandColor: json['primary_brand_color']?.toString() ?? '#34d399',
      createdAt: DateTime.now(),
    );
  }

  /// Map display model to Hive storage format
  Map<String, dynamic> _mapModelToHive(InstitutionDisplayModel model) {
    return {
      'id': model.id,
      'institution_name': model.name,
      'short_description': model.description,
      'logo_path': model.logoUrl,
      'banner_image_path': model.bannerImageUrl,
      'institution_type': model.type,
      'city': model.city,
      'country': model.country,
      'custom_url_slug': model.customUrlSlug,
      'primary_brand_color': model.primaryBrandColor,
    };
  }

  /* ===========================
     CACHE MANAGEMENT
  =========================== */

  /// Clear all dashboard caches
  Future<void> clearAllCaches() async {
    await _storage.clearInstitutions();
    await _storage.deleteMetadata('institutions_cache_timestamp');
    await _storage.deleteMetadata('notifications_cache_timestamp');
    await _storage.deleteMetadata('notifications_cache_data');
    print('✅ All dashboard caches cleared');
  }

  /// Check if institution cache is valid
  bool isInstitutionCacheValid() {
    final cacheTimestamp = _storage.getMetadata('institutions_cache_timestamp');
    if (cacheTimestamp == null) return false;

    final cachedTime = DateTime.tryParse(cacheTimestamp);
    if (cachedTime == null) return false;

    final age = DateTime.now().difference(cachedTime);
    return age <= _institutionCacheDuration;
  }
}
