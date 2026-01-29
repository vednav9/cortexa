import 'package:hive_flutter/hive_flutter.dart';
import '../../features/auth/data/models/user_hive_model.dart';
import '../../features/auth/data/models/auth_token_model.dart';

class HiveStorageService {
  // Single unified box for all app data
  static const String _appDataBoxName = 'appDataBox';
  
  // Minimal keys for efficient storage
  static const String _currentUserKey = 'current_user';
  static const String _currentTokenKey = 'current_token';
  static const String _currentInstitutionKey = 'current_institution';
  static const String _registeredUsersKey = 'registered_users';
  static const String _institutionsKey = 'institutions';
  static const String _invitationsKey = 'invitations';
  static const String _departmentsKey = 'departments';
  static const String _coursesKey = 'courses';
  static const String _semestersKey = 'semesters';
  static const String _eventsKey = 'events';
  static const String _announcementsKey = 'announcements';
  static const String _queriesKey = 'queries';
  static const String _teachersKey = 'teachers';
  static const String _settingsKey = 'settings';

  late Box<dynamic> _appBox;

  /// Initialize Hive and open boxes
  Future<void> init() async {
    print('🔧 Initializing Hive...');

    // Initialize Hive
    await Hive.initFlutter();
    print('✅ Hive initialized');

    // Register adapters
    if (!Hive.isAdapterRegistered(0)) {
      print('📝 Registering UserHiveModel adapter');
      Hive.registerAdapter(UserHiveModelAdapter());
    }
    if (!Hive.isAdapterRegistered(1)) {
      print('📝 Registering AuthTokenModel adapter');
      Hive.registerAdapter(AuthTokenModelAdapter());
    }

    // Open single unified box
    print('📂 Opening unified app data box...');
    _appBox = await Hive.openBox(_appDataBoxName);
    print('✅ App data box opened');

    // Initialize empty collections if they don't exist
    _appBox.put(_registeredUsersKey, _appBox.get(_registeredUsersKey, defaultValue: <String, dynamic>{}));
    _appBox.put(_institutionsKey, _appBox.get(_institutionsKey, defaultValue: <String, dynamic>{}));
    _appBox.put(_invitationsKey, _appBox.get(_invitationsKey, defaultValue: <String, dynamic>{}));
    _appBox.put(_departmentsKey, _appBox.get(_departmentsKey, defaultValue: <String, dynamic>{}));
    _appBox.put(_coursesKey, _appBox.get(_coursesKey, defaultValue: <String, dynamic>{}));
    _appBox.put(_semestersKey, _appBox.get(_semestersKey, defaultValue: <String, dynamic>{}));
    _appBox.put(_eventsKey, _appBox.get(_eventsKey, defaultValue: <String, dynamic>{}));
    _appBox.put(_announcementsKey, _appBox.get(_announcementsKey, defaultValue: <String, dynamic>{}));
    _appBox.put(_queriesKey, _appBox.get(_queriesKey, defaultValue: <String, dynamic>{}));
    _appBox.put(_teachersKey, _appBox.get(_teachersKey, defaultValue: <String, dynamic>{}));
    _appBox.put(_settingsKey, _appBox.get(_settingsKey, defaultValue: <String, dynamic>{}));

    print('🎉 HiveStorageService initialized successfully');
  }

  // ===== User Methods =====

  /// Save current user
  Future<void> saveUser(UserHiveModel user) async {
    await _appBox.put(_currentUserKey, user);
    print('💾 User saved: ${user.username} (Institution: ${user.institutionId ?? "None"})');
  }

  /// Get current user
  UserHiveModel? getCurrentUser() {
    return _appBox.get(_currentUserKey) as UserHiveModel?;
  }

  /// Delete current user
  Future<void> deleteUser() async {
    await _appBox.delete(_currentUserKey);
  }

  /// Check if user exists
  bool hasUser() {
    return _appBox.containsKey(_currentUserKey);
  }

  // ===== Token Methods =====

  /// Save authentication token (just the string)
  Future<void> saveAuthToken(String token) async {
    await _appBox.put(_currentTokenKey, token);
    print('🔐 Auth token saved');
  }

  /// Get authentication token string
  String? getToken() {
    return _appBox.get(_currentTokenKey) as String?;
  }

  /// Delete tokens
  Future<void> deleteTokens() async {
    await _appBox.delete(_currentTokenKey);
    print('🗑️ Auth token deleted');
  }

  /// Check if user is logged in (has valid token)
  bool isLoggedIn() {
    return _appBox.containsKey(_currentTokenKey) && 
           _appBox.get(_currentTokenKey) != null;
  }

  /// Clear auth data (user + token)
  Future<void> clearAuthData() async {
    await deleteUser();
    await deleteTokens();
    print('🧹 Auth data cleared');
  }

  // ===== Settings Methods =====

  /// Save a setting
  Future<void> saveSetting(String key, dynamic value) async {
    final settings = _appBox.get(_settingsKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedSettings = Map<String, dynamic>.from(settings);
    updatedSettings[key] = value;
    await _appBox.put(_settingsKey, updatedSettings);
  }

  /// Get a setting
  dynamic getSetting(String key, {dynamic defaultValue}) {
    final settings = _appBox.get(_settingsKey, defaultValue: <String, dynamic>{}) as Map;
    return settings[key] ?? defaultValue;
  }

  /// Delete a setting
  Future<void> deleteSetting(String key) async {
    final settings = _appBox.get(_settingsKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedSettings = Map<String, dynamic>.from(settings);
    updatedSettings.remove(key);
    await _appBox.put(_settingsKey, updatedSettings);
  }

  // ===== Clear All Data =====

  /// Logout - clear all user data
  Future<void> logout() async {
    await clearAuthData();
    await _appBox.delete(_currentInstitutionKey);
    print('👋 User logged out');
    // Keep settings and other data
  }

  /// Clear everything (for testing or account deletion)
  Future<void> clearAll() async {
    await _appBox.clear();
    // Reinitialize empty collections
    await init();
  }

  /// Close all boxes (call when app closes)
  Future<void> closeBoxes() async {
    await _appBox.close();
  }

  // ===== Registered Users Methods (for MockAuthRepository persistence) =====

  /// Save a registered user (for auth validation across app restarts)
  Future<void> saveRegisteredUser(Map<String, dynamic> userData) async {
    final users = _appBox.get(_registeredUsersKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedUsers = Map<String, dynamic>.from(users);
    final userId = userData['id'] as String;
    updatedUsers[userId] = userData;
    await _appBox.put(_registeredUsersKey, updatedUsers);
    print('💾 Registered user saved: ${userData['username']}');
  }

  /// Get all registered users
  List<Map<String, dynamic>> getAllRegisteredUsers() {
    final users = _appBox.get(_registeredUsersKey, defaultValue: <String, dynamic>{}) as Map;
    return users.values.map((user) => Map<String, dynamic>.from(user as Map)).toList();
  }

  /// Check if a username exists
  bool isUsernameRegistered(String username) {
    final users = _appBox.get(_registeredUsersKey, defaultValue: <String, dynamic>{}) as Map;
    return users.values.any((user) => (user as Map)['username'] == username);
  }

  /// Check if an email exists
  bool isEmailRegistered(String email) {
    final users = _appBox.get(_registeredUsersKey, defaultValue: <String, dynamic>{}) as Map;
    return users.values.any((user) => (user as Map)['email'] == email);
  }

  /// Update registered user's institution information
  Future<void> updateRegisteredUserInstitution({
    required String userId,
    required String institutionId,
    required String institutionRole,
    required DateTime joinedAt,
  }) async {
    final users = _appBox.get(_registeredUsersKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedUsers = Map<String, dynamic>.from(users);
    
    if (updatedUsers.containsKey(userId)) {
      final userData = Map<String, dynamic>.from(updatedUsers[userId] as Map);
      userData['institution_id'] = institutionId;
      userData['institution_role'] = institutionRole;
      userData['institution_joined_at'] = joinedAt.toIso8601String();
      updatedUsers[userId] = userData;
      await _appBox.put(_registeredUsersKey, updatedUsers);
      print('✅ Updated registered user institution data');
    } else {
      print('⚠️ User not found in registered users: $userId');
    }
  }

  /// Find a registered user by username or email
  Map<String, dynamic>? findRegisteredUser({String? username, String? email}) {
    final users = _appBox.get(_registeredUsersKey, defaultValue: <String, dynamic>{}) as Map;
    try {
      final user = users.values.firstWhere((user) {
        final userData = user as Map;
        if (username != null && userData['username'] == username) return true;
        if (email != null && userData['email'] == email) return true;
        return false;
      });
      return Map<String, dynamic>.from(user as Map);
    } catch (e) {
      return null;
    }
  }

  /// Clear all registered users (for testing)
  Future<void> clearRegisteredUsers() async {
    await _appBox.put(_registeredUsersKey, <String, dynamic>{});
  }

  // ===== Institutions Methods =====

  /// Save current institution for logged-in user
  Future<void> saveCurrentInstitution(Map<String, dynamic> institutionData) async {
    await _appBox.put(_currentInstitutionKey, institutionData);
    print('✅ Current institution saved: ${institutionData['name'] ?? 'Unknown'}');
  }

  /// Get current institution
  Map<String, dynamic>? getCurrentInstitution() {
    final data = _appBox.get(_currentInstitutionKey);
    return data != null ? Map<String, dynamic>.from(data as Map) : null;
  }

  /// Save an institution to global institutions list
  Future<void> saveInstitution(Map<String, dynamic> institutionData) async {
    final institutions = _appBox.get(_institutionsKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedInstitutions = Map<String, dynamic>.from(institutions);
    final institutionId = institutionData['id'] as String;
    // Preserve banner image if backend doesn't support it.
    final existing = updatedInstitutions[institutionId];
    if (existing is Map) {
      final existingMap = Map<String, dynamic>.from(existing);
      final existingBanner = existingMap['banner_image_path'];
      final newBanner = institutionData['banner_image_path'];
      if ((newBanner == null || (newBanner is String && newBanner.isEmpty)) &&
          existingBanner is String &&
          existingBanner.isNotEmpty) {
        institutionData = Map<String, dynamic>.from(institutionData)
          ..['banner_image_path'] = existingBanner;
      }
    }

    updatedInstitutions[institutionId] = institutionData;
    await _appBox.put(_institutionsKey, updatedInstitutions);
    print('💾 Institution saved: ${institutionData['institution_name'] ?? institutionData['name'] ?? 'Unknown'}');
  }

  /// Get all institutions
  List<Map<String, dynamic>> getAllInstitutions() {
    final institutions = _appBox.get(_institutionsKey, defaultValue: <String, dynamic>{}) as Map;
    return institutions.values.map((inst) => Map<String, dynamic>.from(inst as Map)).toList();
  }

  /// Find an institution by ID
  Map<String, dynamic>? findInstitutionById(String id) {
    final institutions = _appBox.get(_institutionsKey, defaultValue: <String, dynamic>{}) as Map;
    final institution = institutions[id];
    return institution != null ? Map<String, dynamic>.from(institution as Map) : null;
  }

  /// Clear all institutions (for testing)
  Future<void> clearInstitutions() async {
    await _appBox.put(_institutionsKey, <String, dynamic>{});
  }

  // ===== Invitations Methods =====

  /// Save an invitation
  Future<void> saveInvitation(Map<String, dynamic> invitationData) async {
    final invitations = _appBox.get(_invitationsKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedInvitations = Map<String, dynamic>.from(invitations);
    final invitationId = invitationData['id'] as String;
    updatedInvitations[invitationId] = invitationData;
    await _appBox.put(_invitationsKey, updatedInvitations);
    print('💾 Invitation saved for user: ${invitationData['invited_user_id'] ?? 'Unknown'}');
  }

  /// Get all invitations for a specific user
  List<Map<String, dynamic>> getInvitationsForUser(String userId) {
    final invitations = _appBox.get(_invitationsKey, defaultValue: <String, dynamic>{}) as Map;
    return invitations.values
        .where((inv) => (inv as Map)['invited_user_id'] == userId)
        .map((inv) => Map<String, dynamic>.from(inv as Map))
        .toList();
  }

  /// Get all invitations (for admin view)
  List<Map<String, dynamic>> getAllInvitations() {
    final invitations = _appBox.get(_invitationsKey, defaultValue: <String, dynamic>{}) as Map;
    return invitations.values.map((inv) => Map<String, dynamic>.from(inv as Map)).toList();
  }

  /// Update invitation status
  Future<void> updateInvitationStatus(String invitationId, String status) async {
    final invitations = _appBox.get(_invitationsKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedInvitations = Map<String, dynamic>.from(invitations);
    
    if (updatedInvitations.containsKey(invitationId)) {
      final invitation = Map<String, dynamic>.from(updatedInvitations[invitationId] as Map);
      invitation['status'] = status;
      updatedInvitations[invitationId] = invitation;
      await _appBox.put(_invitationsKey, updatedInvitations);
      print('✅ Invitation $invitationId status updated to: $status');
    }
  }

  /// Delete an invitation
  Future<void> deleteInvitation(String invitationId) async {
    final invitations = _appBox.get(_invitationsKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedInvitations = Map<String, dynamic>.from(invitations);
    updatedInvitations.remove(invitationId);
    await _appBox.put(_invitationsKey, updatedInvitations);
    print('✅ Invitation deleted: $invitationId');
  }

  /// Clear all invitations (for testing)
  Future<void> clearInvitations() async {
    await _appBox.put(_invitationsKey, <String, dynamic>{});
  }

  // ===== Departments Methods =====

  /// Save a department
  Future<void> saveDepartment(Map<String, dynamic> departmentData) async {
    final departments = _appBox.get(_departmentsKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedDepartments = Map<String, dynamic>.from(departments);
    final departmentId = departmentData['id'] as String;
    updatedDepartments[departmentId] = departmentData;
    await _appBox.put(_departmentsKey, updatedDepartments);
    print('💾 Department saved: ${departmentData['name'] ?? 'Unknown'}');
  }

  /// Get all departments for current institution
  List<Map<String, dynamic>> getAllDepartments({String? institutionId}) {
    final departments = _appBox.get(_departmentsKey, defaultValue: <String, dynamic>{}) as Map;
    final allDepts = departments.values.map((dept) => Map<String, dynamic>.from(dept as Map)).toList();
    
    if (institutionId != null) {
      return allDepts.where((dept) => dept['institution_id'] == institutionId).toList();
    }
    return allDepts;
  }

  /// Find a department by ID
  Map<String, dynamic>? findDepartmentById(String id) {
    final departments = _appBox.get(_departmentsKey, defaultValue: <String, dynamic>{}) as Map;
    final department = departments[id];
    return department != null ? Map<String, dynamic>.from(department as Map) : null;
  }

  /// Update a department
  Future<void> updateDepartment(String id, Map<String, dynamic> departmentData) async {
    final departments = _appBox.get(_departmentsKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedDepartments = Map<String, dynamic>.from(departments);
    updatedDepartments[id] = departmentData;
    await _appBox.put(_departmentsKey, updatedDepartments);
    print('✅ Department updated: ${departmentData['name'] ?? 'Unknown'}');
  }

  /// Delete a department
  Future<void> deleteDepartment(String id) async {
    final departments = _appBox.get(_departmentsKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedDepartments = Map<String, dynamic>.from(departments);
    updatedDepartments.remove(id);
    await _appBox.put(_departmentsKey, updatedDepartments);
    print('✅ Department deleted: $id');
  }

  /// Clear all departments
  Future<void> clearDepartments() async {
    await _appBox.put(_departmentsKey, <String, dynamic>{});
  }

  // ===== Courses/Subjects Methods =====

  /// Save a course/subject
  Future<void> saveCourse(Map<String, dynamic> courseData) async {
    final courses = _appBox.get(_coursesKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedCourses = Map<String, dynamic>.from(courses);
    final courseId = courseData['id'] as String;
    updatedCourses[courseId] = courseData;
    await _appBox.put(_coursesKey, updatedCourses);
    print('💾 Course saved: ${courseData['name'] ?? 'Unknown'}');
  }

  /// Get all courses for institution or department
  List<Map<String, dynamic>> getAllCourses({String? institutionId, String? departmentId}) {
    final courses = _appBox.get(_coursesKey, defaultValue: <String, dynamic>{}) as Map;
    final allCourses = courses.values.map((course) => Map<String, dynamic>.from(course as Map)).toList();
    
    if (institutionId != null && departmentId != null) {
      return allCourses.where((course) =>
        course['institution_id'] == institutionId &&
        course['department_id'] == departmentId
      ).toList();
    } else if (institutionId != null) {
      return allCourses.where((course) => course['institution_id'] == institutionId).toList();
    }
    return allCourses;
  }

  /// Find a course by ID
  Map<String, dynamic>? findCourseById(String id) {
    final courses = _appBox.get(_coursesKey, defaultValue: <String, dynamic>{}) as Map;
    final course = courses[id];
    return course != null ? Map<String, dynamic>.from(course as Map) : null;
  }

  /// Update a course
  Future<void> updateCourse(String id, Map<String, dynamic> courseData) async {
    final courses = _appBox.get(_coursesKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedCourses = Map<String, dynamic>.from(courses);
    updatedCourses[id] = courseData;
    await _appBox.put(_coursesKey, updatedCourses);
    print('✅ Course updated: ${courseData['name'] ?? 'Unknown'}');
  }

  /// Delete a course
  Future<void> deleteCourse(String id) async {
    final courses = _appBox.get(_coursesKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedCourses = Map<String, dynamic>.from(courses);
    updatedCourses.remove(id);
    await _appBox.put(_coursesKey, updatedCourses);
    print('✅ Course deleted: $id');
  }

  /// Clear all courses
  Future<void> clearCourses() async {
    await _appBox.put(_coursesKey, <String, dynamic>{});
  }

  // ===== Semesters/Grades Methods =====

  /// Save a semester/grade
  Future<void> saveSemester(Map<String, dynamic> semesterData) async {
    final semesters = _appBox.get(_semestersKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedSemesters = Map<String, dynamic>.from(semesters);
    final semesterId = semesterData['id'] as String;
    updatedSemesters[semesterId] = semesterData;
    await _appBox.put(_semestersKey, updatedSemesters);
    print('💾 Semester saved: ${semesterData['name'] ?? 'Unknown'}');
  }

  /// Get all semesters for current institution
  List<Map<String, dynamic>> getAllSemesters({String? institutionId}) {
    final semesters = _appBox.get(_semestersKey, defaultValue: <String, dynamic>{}) as Map;
    final allSemesters = semesters.values.map((sem) => Map<String, dynamic>.from(sem as Map)).toList();
    
    if (institutionId != null) {
      return allSemesters.where((sem) => sem['institution_id'] == institutionId).toList();
    }
    return allSemesters;
  }

  /// Find a semester by ID
  Map<String, dynamic>? findSemesterById(String id) {
    final semesters = _appBox.get(_semestersKey, defaultValue: <String, dynamic>{}) as Map;
    final semester = semesters[id];
    return semester != null ? Map<String, dynamic>.from(semester as Map) : null;
  }

  /// Update a semester
  Future<void> updateSemester(String id, Map<String, dynamic> semesterData) async {
    final semesters = _appBox.get(_semestersKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedSemesters = Map<String, dynamic>.from(semesters);
    updatedSemesters[id] = semesterData;
    await _appBox.put(_semestersKey, updatedSemesters);
    print('✅ Semester updated: ${semesterData['name'] ?? 'Unknown'}');
  }

  /// Delete a semester
  Future<void> deleteSemester(String id) async {
    final semesters = _appBox.get(_semestersKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedSemesters = Map<String, dynamic>.from(semesters);
    updatedSemesters.remove(id);
    await _appBox.put(_semestersKey, updatedSemesters);
    print('✅ Semester deleted: $id');
  }

  /// Clear all semesters
  Future<void> clearSemesters() async {
    await _appBox.put(_semestersKey, <String, dynamic>{});
  }

  // ===== Events Methods =====

  /// Save an event
  Future<void> saveEvent(Map<String, dynamic> eventData) async {
    final events = _appBox.get(_eventsKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedEvents = Map<String, dynamic>.from(events);
    final eventId = eventData['id'] as String;
    updatedEvents[eventId] = eventData;
    await _appBox.put(_eventsKey, updatedEvents);
    print('💾 Event saved: ${eventData['title'] ?? 'Unknown'}');
  }

  /// Get all events for current institution
  List<Map<String, dynamic>> getAllEvents({String? institutionId}) {
    final events = _appBox.get(_eventsKey, defaultValue: <String, dynamic>{}) as Map;
    final allEvents = events.values.map((event) => Map<String, dynamic>.from(event as Map)).toList();
    
    if (institutionId != null) {
      return allEvents.where((event) => event['institution_id'] == institutionId).toList();
    }
    return allEvents;
  }

  /// Find an event by ID
  Map<String, dynamic>? findEventById(String id) {
    final events = _appBox.get(_eventsKey, defaultValue: <String, dynamic>{}) as Map;
    final event = events[id];
    return event != null ? Map<String, dynamic>.from(event as Map) : null;
  }

  /// Update an event
  Future<void> updateEvent(String id, Map<String, dynamic> eventData) async {
    final events = _appBox.get(_eventsKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedEvents = Map<String, dynamic>.from(events);
    updatedEvents[id] = eventData;
    await _appBox.put(_eventsKey, updatedEvents);
    print('✅ Event updated: ${eventData['title'] ?? 'Unknown'}');
  }

  /// Delete an event
  Future<void> deleteEvent(String id) async {
    final events = _appBox.get(_eventsKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedEvents = Map<String, dynamic>.from(events);
    updatedEvents.remove(id);
    await _appBox.put(_eventsKey, updatedEvents);
    print('✅ Event deleted: $id');
  }

  /// Clear all events
  Future<void> clearEvents() async {
    await _appBox.put(_eventsKey, <String, dynamic>{});
  }

  // ===== Announcements Methods =====

  /// Save an announcement
  Future<void> saveAnnouncement(Map<String, dynamic> announcementData) async {
    final announcements = _appBox.get(_announcementsKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedAnnouncements = Map<String, dynamic>.from(announcements);
    final announcementId = announcementData['id'] as String;
    updatedAnnouncements[announcementId] = announcementData;
    await _appBox.put(_announcementsKey, updatedAnnouncements);
    print('💾 Announcement saved: ${announcementData['title'] ?? 'Unknown'}');
  }

  /// Get all announcements for current institution
  List<Map<String, dynamic>> getAllAnnouncements({String? institutionId, String? audience}) {
    final announcements = _appBox.get(_announcementsKey, defaultValue: <String, dynamic>{}) as Map;
    final allAnnouncements = announcements.values.map((ann) => Map<String, dynamic>.from(ann as Map)).toList();
    
    if (institutionId != null && audience != null) {
      return allAnnouncements.where((ann) =>
        ann['institution_id'] == institutionId &&
        ann['audience'] == audience
      ).toList();
    } else if (institutionId != null) {
      return allAnnouncements.where((ann) => ann['institution_id'] == institutionId).toList();
    }
    return allAnnouncements;
  }

  /// Find an announcement by ID
  Map<String, dynamic>? findAnnouncementById(String id) {
    final announcements = _appBox.get(_announcementsKey, defaultValue: <String, dynamic>{}) as Map;
    final announcement = announcements[id];
    return announcement != null ? Map<String, dynamic>.from(announcement as Map) : null;
  }

  /// Update an announcement
  Future<void> updateAnnouncement(String id, Map<String, dynamic> announcementData) async {
    final announcements = _appBox.get(_announcementsKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedAnnouncements = Map<String, dynamic>.from(announcements);
    updatedAnnouncements[id] = announcementData;
    await _appBox.put(_announcementsKey, updatedAnnouncements);
    print('✅ Announcement updated: ${announcementData['title'] ?? 'Unknown'}');
  }

  /// Delete an announcement
  Future<void> deleteAnnouncement(String id) async {
    final announcements = _appBox.get(_announcementsKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedAnnouncements = Map<String, dynamic>.from(announcements);
    updatedAnnouncements.remove(id);
    await _appBox.put(_announcementsKey, updatedAnnouncements);
    print('✅ Announcement deleted: $id');
  }

  /// Clear all announcements
  Future<void> clearAnnouncements() async {
    await _appBox.put(_announcementsKey, <String, dynamic>{});
  }

  // ===== Queries Methods (Query Desk) =====

  /// Save a query
  Future<void> saveQuery(Map<String, dynamic> queryData) async {
    final queries = _appBox.get(_queriesKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedQueries = Map<String, dynamic>.from(queries);
    final queryId = queryData['id'] as String;
    updatedQueries[queryId] = queryData;
    await _appBox.put(_queriesKey, updatedQueries);
    print('💾 Query saved: ${queryData['title'] ?? 'Unknown'}');
  }

  /// Get all queries for current institution
  List<Map<String, dynamic>> getAllQueries({String? institutionId, String? userId}) {
    final queries = _appBox.get(_queriesKey, defaultValue: <String, dynamic>{}) as Map;
    final allQueries = queries.values.map((query) => Map<String, dynamic>.from(query as Map)).toList();
    
    if (userId != null) {
      return allQueries.where((query) => query['user_id'] == userId).toList();
    } else if (institutionId != null) {
      return allQueries.where((query) => query['institution_id'] == institutionId).toList();
    }
    return allQueries;
  }

  /// Find a query by ID
  Map<String, dynamic>? findQueryById(String id) {
    final queries = _appBox.get(_queriesKey, defaultValue: <String, dynamic>{}) as Map;
    final query = queries[id];
    return query != null ? Map<String, dynamic>.from(query as Map) : null;
  }

  /// Update a query (for adding responses, changing status, etc.)
  Future<void> updateQuery(String id, Map<String, dynamic> queryData) async {
    final queries = _appBox.get(_queriesKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedQueries = Map<String, dynamic>.from(queries);
    updatedQueries[id] = queryData;
    await _appBox.put(_queriesKey, updatedQueries);
    print('✅ Query updated: ${queryData['title'] ?? 'Unknown'}');
  }

  /// Delete a query
  Future<void> deleteQuery(String id) async {
    final queries = _appBox.get(_queriesKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedQueries = Map<String, dynamic>.from(queries);
    updatedQueries.remove(id);
    await _appBox.put(_queriesKey, updatedQueries);
    print('✅ Query deleted: $id');
  }

  /// Clear all queries
  Future<void> clearQueries() async {
    await _appBox.put(_queriesKey, <String, dynamic>{});
  }

  // ===== Teachers Methods =====

  /// Save a teacher assignment to department/subject
  Future<void> saveTeacher(Map<String, dynamic> teacherData) async {
    final teachers = _appBox.get(_teachersKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedTeachers = Map<String, dynamic>.from(teachers);
    final teacherId = teacherData['id'] as String;
    updatedTeachers[teacherId] = teacherData;
    await _appBox.put(_teachersKey, updatedTeachers);
    print('💾 Teacher assignment saved: ${teacherData['teacher_name'] ?? 'Unknown'}');
  }

  /// Get all teachers for institution or department
  List<Map<String, dynamic>> getAllTeachers({String? institutionId, String? departmentId}) {
    final teachers = _appBox.get(_teachersKey, defaultValue: <String, dynamic>{}) as Map;
    final allTeachers = teachers.values.map((teacher) => Map<String, dynamic>.from(teacher as Map)).toList();
    
    if (institutionId != null && departmentId != null) {
      return allTeachers.where((teacher) =>
        teacher['institution_id'] == institutionId &&
        teacher['department_id'] == departmentId
      ).toList();
    } else if (institutionId != null) {
      return allTeachers.where((teacher) => teacher['institution_id'] == institutionId).toList();
    }
    return allTeachers;
  }

  /// Delete a teacher assignment
  Future<void> deleteTeacher(String id) async {
    final teachers = _appBox.get(_teachersKey, defaultValue: <String, dynamic>{}) as Map;
    final updatedTeachers = Map<String, dynamic>.from(teachers);
    updatedTeachers.remove(id);
    await _appBox.put(_teachersKey, updatedTeachers);
    print('✅ Teacher assignment deleted: $id');
  }

  /// Clear all teacher assignments
  Future<void> clearTeachers() async {
    await _appBox.put(_teachersKey, <String, dynamic>{});
  }
}

