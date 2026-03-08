import '../../../../core/network/api_client.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/errors/exceptions.dart';

/// Repository for course operations
class CourseRepository {
  final ApiClient _apiClient;
  final HiveStorageService _storage;

  CourseRepository(this._apiClient, this._storage);

  /// Get all courses for an institution
  Future<Map<String, dynamic>> getCourses(
    String institutionId, {
    String? departmentId,
    int? semester,
    bool? isActive,
  }) async {
    try {
      print('🌐 Fetching courses for institution: $institutionId');
      
      final queryParams = <String, String>{};
      if (departmentId != null) queryParams['departmentId'] = departmentId;
      if (semester != null) queryParams['semester'] = semester.toString();
      if (isActive != null) queryParams['isActive'] = isActive.toString();
      
      final queryString = queryParams.isEmpty
          ? ''
          : '?${queryParams.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&')}';
      
      final response = await _apiClient.get(
        '/academic/institutions/$institutionId/courses$queryString',
        requiresAuth: true,
      );

      final courses = (response['courses'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ?? [];

      print('✅ Fetched ${courses.length} courses');
      
      // Cache courses locally
      _cacheCourses(institutionId, courses);
      
      return {
        'success': true,
        'courses': courses,
        'count': response['count'] ?? courses.length,
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error fetching courses: $e');
      throw ServerException(
        message: 'Failed to fetch courses: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Get cached courses from local storage
  List<Map<String, dynamic>> getCachedCourses(String institutionId) {
    try {
      return _storage.getAllCourses(institutionId: institutionId);
    } catch (e) {
      print('❌ Error getting cached courses: $e');
      return [];
    }
  }

  /// Create a new course
  Future<Map<String, dynamic>> createCourse({
    required String institutionId,
    required String departmentId,
    required String code,
    required String name,
    required int credits,
    String? description,
    int? semester,
    String? semesterAvailable,
    String? instructor,
    String? facultyAvailable,
    int? maxCapacity,
    String? syllabus,
  }) async {
    try {
      print('🌐 Creating course: $name');
      
      final response = await _apiClient.post(
        '/academic/institutions/$institutionId/courses',
        body: {
          'department': departmentId,
          'code': code,
          'name': name,
          'credits': credits,
          'description': description ?? '',
          if (semester != null) 'semester': semester,
          if (semesterAvailable != null) 'semesterAvailable': semesterAvailable,
          if (instructor != null) 'instructor': instructor,
          if (facultyAvailable != null) 'facultyAvailable': facultyAvailable,
          if (maxCapacity != null) 'maxCapacity': maxCapacity,
          if (syllabus != null) 'syllabus': syllabus,
        },
        requiresAuth: true,
      );

      print('✅ Course created successfully');
      
      final course = response['course'] as Map<String, dynamic>?;
      if (course != null) {
        // Add to local cache
        _addCourseToCache(institutionId, course);
      }
      
      return {
        'success': true,
        'course': course,
        'message': response['message'] ?? 'Course created successfully',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error creating course: $e');
      throw ServerException(
        message: 'Failed to create course: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Update a course
  Future<Map<String, dynamic>> updateCourse({
    required String courseId,
    String? code,
    String? name,
    String? description,
    int? credits,
    int? semester,
    String? semesterAvailable,
    String? instructor,
    String? facultyAvailable,
    int? maxCapacity,
    String? syllabus,
    bool? isActive,
  }) async {
    try {
      print('🌐 Updating course: $courseId');
      
      final body = <String, dynamic>{};
      if (code != null) body['code'] = code;
      if (name != null) body['name'] = name;
      if (description != null) body['description'] = description;
      if (credits != null) body['credits'] = credits;
      if (semester != null) body['semester'] = semester;
      if (semesterAvailable != null) body['semesterAvailable'] = semesterAvailable;
      if (instructor != null) body['instructor'] = instructor;
      if (facultyAvailable != null) body['facultyAvailable'] = facultyAvailable;
      if (maxCapacity != null) body['maxCapacity'] = maxCapacity;
      if (syllabus != null) body['syllabus'] = syllabus;
      if (isActive != null) body['isActive'] = isActive;
      
      final response = await _apiClient.put(
        '/academic/courses/$courseId',
        body: body,
        requiresAuth: true,
      );

      print('✅ Course updated successfully');
      
      final course = response['course'] as Map<String, dynamic>?;
      if (course != null) {
        // Update in local cache
        _updateCourseInCache(course);
      }
      
      return {
        'success': true,
        'course': course,
        'message': response['message'] ?? 'Course updated successfully',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error updating course: $e');
      throw ServerException(
        message: 'Failed to update course: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Delete a course
  Future<Map<String, dynamic>> deleteCourse(String courseId) async {
    try {
      print('🌐 Deleting course: $courseId');
      
      final response = await _apiClient.delete(
        '/academic/courses/$courseId',
        requiresAuth: true,
      );

      print('✅ Course deleted successfully');
      
      // Remove from local cache
      _deleteCourseFromCache(courseId);
      
      return {
        'success': true,
        'message': response['message'] ?? 'Course deleted successfully',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Error deleting course: $e');
      throw ServerException(
        message: 'Failed to delete course: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  // ==================== Cache Management ====================

  void _cacheCourses(String institutionId, List<Map<String, dynamic>> courses) {
    // Note: Batch caching handled at UI level via individual saveCourse calls
    print('💾 Courses available for caching: ${courses.length}');
  }

  void _addCourseToCache(String institutionId, Map<String, dynamic> course) {
    // Note: Caching handled at UI level
    print('💾 Course available for caching');
  }

  void _updateCourseInCache(Map<String, dynamic> course) {
    // Note: Caching handled at UI level
    print('💾 Course update available for caching');
  }

  void _deleteCourseFromCache(String courseId) {
    // Note: Caching handled at UI level
    print('💾 Course deletion available for caching');
  }
}
