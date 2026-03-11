import 'dart:io';

import '../models/user_hive_model.dart';
import '../models/auth_models.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/config/api_config.dart';
import '../../../../core/errors/exceptions.dart';

class AuthRepository {
  final HiveStorageService _storage;
  final ApiClient _apiClient;

  AuthRepository(this._storage, this._apiClient);

  String _resolveUsernameForEmail(String email) {
    final normalizedEmail = email.trim().toLowerCase();

    final current = _storage.getCurrentUser();
    if (current != null &&
        current.email.trim().toLowerCase() == normalizedEmail &&
        current.username.trim().isNotEmpty) {
      return current.username;
    }

    final registered = _storage.findRegisteredUser(email: email);
    final registeredUsername = registered?['username']?.toString() ?? '';
    if (registeredUsername.trim().isNotEmpty) return registeredUsername.trim();

    return email.split('@').first;
  }

  String _extractTokenFromHeaders(Map<String, String> headers) {
    // Node/Express typically returns: set-cookie: token=<JWT>; Path=/; HttpOnly; ...
    final setCookie = headers.entries
        .firstWhere(
          (e) => e.key.toLowerCase() == 'set-cookie',
          orElse: () => const MapEntry('', ''),
        )
        .value;

    if (setCookie.isEmpty) return '';

    final match = RegExp(r'(?:(?:^|;)\s*)token=([^;]+)')
        .firstMatch(setCookie);
    return match?.group(1) ?? '';
  }

  Map<String, dynamic> _mapBackendInstitutionToHive(
    Map<String, dynamic> institution, {
    String? bannerImagePath,
  }) {
    final id = (institution['_id'] ?? institution['id'])?.toString() ?? '';

    final address = institution['address'] is Map
        ? Map<String, dynamic>.from(institution['address'] as Map)
        : <String, dynamic>{};
    final contact = institution['contact'] is Map
        ? Map<String, dynamic>.from(institution['contact'] as Map)
        : <String, dynamic>{};
    final branding = institution['branding'] is Map
        ? Map<String, dynamic>.from(institution['branding'] as Map)
        : <String, dynamic>{};

    final banner = bannerImagePath ?? branding['banner']?.toString();

    return {
      'id': id,
      'institution_name': institution['name']?.toString() ?? '',
      'institution_type': institution['type']?.toString() ?? '',
      'institution_website': contact['website']?.toString() ?? '',
      'address_line_1': address['street']?.toString() ?? '',
      'city': address['city']?.toString() ?? '',
      'state_province': address['state']?.toString() ?? '',
      'country': address['country']?.toString() ?? '',
      'postal_code': (address['zipCode'] ?? address['zip'])?.toString() ?? '',
      'short_description': institution['description']?.toString() ?? '',
      'logo_path': branding['logo']?.toString() ?? '',
      'custom_url_slug': institution['slug']?.toString() ?? '',
      'primary_brand_color':
          branding['primaryColor']?.toString() ?? '#10b981',
      if (banner != null && banner.isNotEmpty) 'banner_image_path': banner,
    };
  }

  Future<void> _fetchAndStoreMyInstitution({
    required String role,
    String? bannerImagePath,
  }) async {
    try {
      String endpoint;
      switch (role.toLowerCase()) {
        case 'student':
          endpoint = ApiConfig.studentMyInstitution;
          break;
        case 'teacher':
          endpoint = ApiConfig.teacherMyInstitution;
          break;
        case 'admin':
          endpoint = ApiConfig.adminInstitution;
          break;
        default:
          print('⚠️ Unknown role: $role, skipping institution fetch');
          return;
      }

      print('🔍 Fetching institution from $endpoint');
      final result = await _apiClient.get(endpoint, requiresAuth: true);
      print('📥 Institution response: $result');
      
      final institution = result['institution'];
      if (institution == null) {
        print('⚠️ No institution in response');
        return;
      }
      if (institution is! Map) {
        print('⚠️ Institution is not a Map: ${institution.runtimeType}');
        return;
      }

      final mapped = _mapBackendInstitutionToHive(
        Map<String, dynamic>.from(institution),
        bannerImagePath: bannerImagePath,
      );

      final institutionId = mapped['id'] as String;
      if (institutionId.isEmpty) {
        print('⚠️ Institution ID is empty');
        return;
      }

      print('💾 Saving institution: $institutionId');
      await _storage.saveInstitution(mapped);
      await _storage.saveCurrentInstitution(mapped);

      final user = _storage.getCurrentUser();
      if (user != null) {
        print('👤 Updating user with institution info');
        await _storage.saveUser(
          user.copyWith(
            institutionId: institutionId,
            institutionRole: role.toLowerCase(),
            institutionJoinedAt: DateTime.now(),
          ),
        );
      }
      print('✅ Institution stored successfully');
    } catch (e) {
      print('❌ Error fetching institution: $e');
      // Don't rethrow - institution fetch is optional
      // User login/registration should succeed even if institution data fetch fails
      // Institution can be fetched later when user accesses dashboard
    }
  }

  /// Login Student
  Future<Map<String, dynamic>> loginStudent({
    required String email,
    required String password,
  }) async {
    try {
      final request = LoginRequest(
        email: email,
        password: password,
        userType: 'student',
      );
      
      final raw = await _apiClient.postRaw(
        ApiConfig.studentLogin,
        body: request.toJson(),
      );

      final authResponse = AuthResponse.fromJson(raw.data);

      if (!authResponse.success || authResponse.user == null) {
        throw ServerException(
          message: authResponse.message ?? 'Login failed',
          statusCode: 400,
        );
      }

      final token = _extractTokenFromHeaders(raw.headers);
      if (token.isEmpty) {
        throw ServerException(
          message:
              'Login succeeded but no auth token was received from server (missing Set-Cookie).',
          statusCode: 500,
        );
      }

        final resolvedUsername = _resolveUsernameForEmail(authResponse.user!.email);

      // Create user model
      final userModel = UserHiveModel(
        id: authResponse.user!.id,
        username: resolvedUsername,
        email: authResponse.user!.email,
        fullName: authResponse.user!.name,
        profileImage: null,
        role: authResponse.user!.role,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        institutionId: null,
        institutionRole: null,
        institutionJoinedAt: null,
      );

      // Save to local storage
      await _storage.saveUser(userModel);
      await _storage.saveRegisteredUser(userModel.toJson());
      await _storage.saveAuthToken(token);

      // Populate institution in Hive if user already belongs to one.
      await _fetchAndStoreMyInstitution(role: 'student');

      return {
        'user': userModel,
        'token': token,
        'message': authResponse.message ?? 'Login successful',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      throw ServerException(
        message: 'Login failed: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Login Teacher
  Future<Map<String, dynamic>> loginTeacher({
    required String email,
    required String password,
  }) async {
    try {
      final request = LoginRequest(
        email: email,
        password: password,
        userType: 'teacher',
      );
      
      final raw = await _apiClient.postRaw(
        ApiConfig.teacherLogin,
        body: request.toJson(),
      );

      final authResponse = AuthResponse.fromJson(raw.data);

      if (!authResponse.success || authResponse.user == null) {
        throw ServerException(
          message: authResponse.message ?? 'Login failed',
          statusCode: 400,
        );
      }

      final token = _extractTokenFromHeaders(raw.headers);
      if (token.isEmpty) {
        throw ServerException(
          message:
              'Login succeeded but no auth token was received from server (missing Set-Cookie).',
          statusCode: 500,
        );
      }

        final resolvedUsername = _resolveUsernameForEmail(authResponse.user!.email);

      final userModel = UserHiveModel(
        id: authResponse.user!.id,
        username: resolvedUsername,
        email: authResponse.user!.email,
        fullName: authResponse.user!.name,
        profileImage: null,
        role: authResponse.user!.role,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        institutionId: null,
        institutionRole: null,
        institutionJoinedAt: null,
      );

      await _storage.saveUser(userModel);
      await _storage.saveRegisteredUser(userModel.toJson());
      await _storage.saveAuthToken(token);

      await _fetchAndStoreMyInstitution(role: 'teacher');

      return {
        'user': userModel,
        'token': token,
        'message': authResponse.message ?? 'Login successful',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      throw ServerException(
        message: 'Login failed: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Login Admin
  Future<Map<String, dynamic>> loginAdmin({
    required String email,
    required String password,
  }) async {
    try {
      final request = LoginRequest(
        email: email,
        password: password,
        userType: 'admin',
      );
      
      final raw = await _apiClient.postRaw(
        ApiConfig.adminLogin,
        body: request.toJson(),
      );

      final authResponse = AuthResponse.fromJson(raw.data);

      if (!authResponse.success || authResponse.user == null) {
        throw ServerException(
          message: authResponse.message ?? 'Login failed',
          statusCode: 400,
        );
      }

      final token = _extractTokenFromHeaders(raw.headers);
      if (token.isEmpty) {
        throw ServerException(
          message:
              'Login succeeded but no auth token was received from server (missing Set-Cookie).',
          statusCode: 500,
        );
      }

        final resolvedUsername = _resolveUsernameForEmail(authResponse.user!.email);

      final userModel = UserHiveModel(
        id: authResponse.user!.id,
        username: resolvedUsername,
        email: authResponse.user!.email,
        fullName: authResponse.user!.name,
        profileImage: null,
        role: authResponse.user!.role,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        institutionId: null,
        institutionRole: null,
        institutionJoinedAt: null,
      );

      await _storage.saveUser(userModel);
      await _storage.saveRegisteredUser(userModel.toJson());
      await _storage.saveAuthToken(token);

      await _fetchAndStoreMyInstitution(role: 'admin');

      return {
        'user': userModel,
        'token': token,
        'message': authResponse.message ?? 'Login successful',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      throw ServerException(
        message: 'Login failed: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Unified Login (detects role from backend)
  Future<Map<String, dynamic>> login({
    required String usernameOrEmail,
    required String password,
    required String role,
  }) async {
    // Backend accepts both email and username, so pass it directly
    final emailOrUsername = usernameOrEmail.trim();

    switch (role.toLowerCase()) {
      case 'student':
        return await loginStudent(email: emailOrUsername, password: password);
      case 'teacher':
        return await loginTeacher(email: emailOrUsername, password: password);
      case 'admin':
        return await loginAdmin(email: emailOrUsername, password: password);
      default:
        throw ServerException(
          message: 'Invalid role selected',
          statusCode: 400,
        );
    }
  }

  /// Register Student
  Future<Map<String, dynamic>> registerStudent({
    required String fullName,
    required String email,
    required String password,
    String? username,
  }) async {
    try {
      final resolvedUsername = (username != null && username.trim().isNotEmpty)
          ? username.trim()
          : email.split('@').first;

      final request = SignupRequest(
        fullName: fullName,
        email: email,
        password: password,
        username: resolvedUsername,
      );

      final raw = await _apiClient.postRaw(
        ApiConfig.studentRegister,
        body: request.toJson(),
      );

      final authResponse = AuthResponse.fromJson(raw.data);

      if (!authResponse.success || authResponse.user == null) {
        throw ServerException(
          message: authResponse.message ?? 'Registration failed',
          statusCode: 400,
        );
      }

      final token = _extractTokenFromHeaders(raw.headers);
      if (token.isEmpty) {
        throw ServerException(
          message:
              'Registration succeeded but no auth token was received from server (missing Set-Cookie).',
          statusCode: 500,
        );
      }

      final userModel = UserHiveModel(
        id: authResponse.user!.id,
        username: resolvedUsername,
        email: authResponse.user!.email,
        fullName: authResponse.user!.name,
        profileImage: null,
        role: authResponse.user!.role,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        institutionId: null,
        institutionRole: null,
        institutionJoinedAt: null,
      );

      await _storage.saveUser(userModel);
      await _storage.saveRegisteredUser(userModel.toJson());
      await _storage.saveAuthToken(token);

      await _fetchAndStoreMyInstitution(role: 'student');

      return {
        'user': userModel,
        'token': token,
        'message': authResponse.message ?? 'Registration successful',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      throw ServerException(
        message: 'Registration failed: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Register Teacher
  Future<Map<String, dynamic>> registerTeacher({
    required String fullName,
    required String email,
    required String password,
    String? username,
  }) async {
    try {
      final resolvedUsername = (username != null && username.trim().isNotEmpty)
          ? username.trim()
          : email.split('@').first;

      final request = SignupRequest(
        fullName: fullName,
        email: email,
        password: password,
        username: resolvedUsername,
      );

      final raw = await _apiClient.postRaw(
        ApiConfig.teacherRegister,
        body: request.toJson(),
      );

      final authResponse = AuthResponse.fromJson(raw.data);

      if (!authResponse.success || authResponse.user == null) {
        throw ServerException(
          message: authResponse.message ?? 'Registration failed',
          statusCode: 400,
        );
      }

      final token = _extractTokenFromHeaders(raw.headers);
      if (token.isEmpty) {
        throw ServerException(
          message:
              'Registration succeeded but no auth token was received from server (missing Set-Cookie).',
          statusCode: 500,
        );
      }

      final userModel = UserHiveModel(
        id: authResponse.user!.id,
        username: resolvedUsername,
        email: authResponse.user!.email,
        fullName: authResponse.user!.name,
        profileImage: null,
        role: authResponse.user!.role,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        institutionId: null,
        institutionRole: null,
        institutionJoinedAt: null,
      );

      await _storage.saveUser(userModel);
      await _storage.saveRegisteredUser(userModel.toJson());
      await _storage.saveAuthToken(token);

      await _fetchAndStoreMyInstitution(role: 'teacher');

      return {
        'user': userModel,
        'token': token,
        'message': authResponse.message ?? 'Registration successful',
      };
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      throw ServerException(
        message: 'Registration failed: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Unified Signup
  Future<Map<String, dynamic>> signup({
    required String username,
    required String email,
    required String password,
    required String fullName,
    required String role,
  }) async {
    switch (role.toLowerCase()) {
      case 'student':
        return await registerStudent(
          fullName: fullName,
          email: email,
          password: password,
          username: username,
        );
      case 'teacher':
        return await registerTeacher(
          fullName: fullName,
          email: email,
          password: password,
          username: username,
        );
      default:
        throw ServerException(
          message: 'Invalid role for signup',
          statusCode: 400,
        );
    }
  }

  /// Register Admin with Institution
  Future<Map<String, dynamic>> registerAdminWithInstitution(
    AdminRegisterRequest request, {
    File? logoFile,
    File? bannerFile,
    String? bannerImagePath,
    String? username,
  }) async {
    try {
      print('🔧 registerAdminWithInstitution called');
      print('📋 Request data: ${request.toJson()}');
      print('🖼️ Logo file: ${logoFile?.path ?? 'none'}');
      print('🎨 Banner file: ${bannerFile?.path ?? 'none'}');
      
      final body = request.toJson();
      final fields = <String, String>{};
      for (final entry in body.entries) {
        final value = entry.value;
        if (value == null) continue;
        fields[entry.key] = value.toString();
      }

      print('📤 Sending multipart request to ${ApiConfig.adminRegister}');
      final raw = await _apiClient.multipartPost(
        ApiConfig.adminRegister,
        fields: fields,
        files: {
          'logo': logoFile,
          'banner': bannerFile,
        },
      );

      print('📥 Response received: ${raw.data}');
      final authResponse = AuthResponse.fromJson(raw.data);

      if (!authResponse.success || authResponse.user == null) {
        print('❌ Registration failed: ${authResponse.message}');
        throw ServerException(
          message: authResponse.message ?? 'Registration failed',
          statusCode: 400,
        );
      }

      print('✅ Registration successful');
      print('🔍 Extracting token from headers...');
      final token = _extractTokenFromHeaders(raw.headers);
      if (token.isEmpty) {
        print('⚠️ No token in headers!');
        throw ServerException(
          message:
              'Registration succeeded but no auth token was received from server (missing Set-Cookie).',
          statusCode: 500,
        );
      }
      print('🔑 Token extracted: ${token.substring(0, 20)}...');

      final resolvedUsername = (username != null && username.trim().isNotEmpty)
          ? username.trim()
          : authResponse.user!.email.split('@').first;

      print('👤 Creating user model...');
      final userModel = UserHiveModel(
        id: authResponse.user!.id,
        username: resolvedUsername,
        email: authResponse.user!.email,
        fullName: request.fullName, // Use fullName from request to ensure it's stored
        profileImage: null,
        role: authResponse.user!.role,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        institutionId: null,
        institutionRole: 'admin',
        institutionJoinedAt: DateTime.now(),
      );

      print('💾 Saving user to storage...');
      await _storage.saveUser(userModel);
      await _storage.saveRegisteredUser(userModel.toJson());
      await _storage.saveAuthToken(token);
      print('✅ User and token saved');

      // Store institution from backend, but keep banner locally.
      print('🏫 Fetching institution data...');
      try {
        await _fetchAndStoreMyInstitution(
          role: 'admin',
          bannerImagePath: bannerImagePath,
        );
        print('✅ Institution data fetched and stored');
      } catch (e) {
        print('⚠️ Failed to fetch institution: $e');
        // Don't throw - registration was successful, institution fetch is optional
      }

      print('🎉 Registration complete!');
      return {
        'user': userModel,
        'token': token,
        'message': authResponse.message ?? 'Registration successful',
      };
    } on ApiException catch (e) {
      print('❌ API Exception: ${e.message}');
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      print('❌ Unexpected error: $e');
      throw ServerException(
        message: 'Registration failed: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      final user = _storage.getCurrentUser();
      if (user == null) return;

      // Call appropriate logout endpoint
      String logoutEndpoint;
      switch (user.role.toLowerCase()) {
        case 'student':
          logoutEndpoint = ApiConfig.studentLogout;
          break;
        case 'teacher':
          logoutEndpoint = ApiConfig.teacherLogout;
          break;
        case 'admin':
          logoutEndpoint = ApiConfig.adminLogout;
          break;
        default:
          logoutEndpoint = ApiConfig.studentLogout;
      }

      try {
        await _apiClient.post(logoutEndpoint, requiresAuth: true);
      } catch (e) {
        // Ignore logout API errors, still clear local data
        print('Logout API call failed: $e');
      }

      // Clear local storage
      await _storage.clearAuthData();
    } catch (e) {
      // Always clear local storage even if API call fails
      await _storage.clearAuthData();
      throw ServerException(
        message: 'Logout failed: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Check if user is logged in
  bool isLoggedIn() {
    return _storage.isLoggedIn();
  }

  /// Get current user from storage
  UserHiveModel? getCurrentUser() {
    return _storage.getCurrentUser();
  }

  /// Get stored token
  String? getToken() {
    return _storage.getToken();
  }
}
