import 'package:uuid/uuid.dart';
import '../models/user_hive_model.dart';
import '../models/auth_token_model.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/services/email_service.dart';
import '../../../../core/errors/exceptions.dart';

/// Mock repository - simulates API calls with delays
/// Replace this with real API repository later
class MockAuthRepository {
  final HiveStorageService _storage;
  final EmailService _emailService;
  final _uuid = const Uuid();
  
  // Mock users database (simulating backend) - now loaded from Hive
  final List<Map<String, dynamic>> _mockUsers = [];
  
  MockAuthRepository(this._storage, this._emailService) {
    // Load existing registered users from Hive on initialization
    _loadRegisteredUsers();
  }

  /// Load registered users from persistent storage
  void _loadRegisteredUsers() {
    print('🔄 [MockAuthRepository] Loading registered users from Hive...');
    final registeredUsers = _storage.getAllRegisteredUsers();
    _mockUsers.clear();
    _mockUsers.addAll(registeredUsers);
    print('✅ [MockAuthRepository] Loaded ${_mockUsers.length} registered users');
  }
  
  /// Simulate login with delay
  Future<Map<String, dynamic>> login({
    required String usernameOrEmail,
    required String password,
    required String role,
  }) async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 2));
    
    print('🔍 [MockAuthRepository] Login attempt - User: $usernameOrEmail, Role: $role');
    print('🔍 [MockAuthRepository] Current users in memory: ${_mockUsers.length}');
    
    // Reload users from Hive to ensure we have the latest data
    _loadRegisteredUsers();
    
    // First, find user by username/email and password regardless of role
    final userAnyRole = _mockUsers.firstWhere(
      (u) =>
          (u['username'] == usernameOrEmail || u['email'] == usernameOrEmail) &&
          u['password'] == password,
      orElse: () => {},
    );

    if (userAnyRole.isEmpty) {
      print('❌ [MockAuthRepository] Invalid credentials');
      throw ServerException(
        message: 'Invalid email/username or password',
        statusCode: 401,
      );
    }

    // Now check role match for clearer UX
    if (userAnyRole['role'] != role) {
      print('❌ [MockAuthRepository] Role mismatch - Expected: $role, Got: ${userAnyRole['role']}');
      throw ServerException(
        message:
            'Role mismatch: Your account is registered as "${userAnyRole['role']}". Please select that role to sign in.',
        statusCode: 400,
      );
    }
    final user = userAnyRole;
    
    print('✅ [MockAuthRepository] Login successful - User: ${user['username']}, Role: ${user['role']}');
    
    // Generate mock tokens
    final accessToken = _generateToken();
    final refreshToken = _generateToken();

    // CRITICAL FIX: Check if user has accepted invitations (institution data recovery)
    // If registeredUsersBox has null but user accepted an invitation, restore from invitations
    String? institutionId = user['institution_id'];
    String? institutionRole = user['institution_role'];
    DateTime? institutionJoinedAt = user['institution_joined_at'] != null 
        ? DateTime.parse(user['institution_joined_at']) 
        : null;
    
    if (institutionId == null) {
      // Check invitations for accepted invitation
      final userId = user['id'] as String;
      final allInvitations = _storage.getInvitationsForUser(userId);
      final acceptedInvitation = allInvitations.where((inv) => inv['status'] == 'accepted').firstOrNull;
      
      if (acceptedInvitation != null) {
        institutionId = acceptedInvitation['institution_id'] as String;
        institutionRole = acceptedInvitation['role'] as String;
        institutionJoinedAt = DateTime.parse(acceptedInvitation['invited_at'] as String);
        
        print('🔄 Recovered institution data from accepted invitation');
        print('   - Institution ID: $institutionId');
        print('   - Role: $institutionRole');
        
        // Update registeredUsersBox so we don't need to do this again
        await _storage.updateRegisteredUserInstitution(
          userId: userId,
          institutionId: institutionId,
          institutionRole: institutionRole,
          joinedAt: institutionJoinedAt,
        );
      }
    }
    
    // Create user model with institution fields
    final userModel = UserHiveModel(
      id: user['id'],
      username: user['username'],
      email: user['email'],
      fullName: user['full_name'],
      profileImage: user['profile_image'],
      role: user['role'],
      createdAt: DateTime.parse(user['created_at']),
      updatedAt: DateTime.now(),
      institutionId: institutionId,
      institutionRole: institutionRole,
      institutionJoinedAt: institutionJoinedAt,
    );
    
    // Create token model
    final tokenModel = AuthTokenModel(
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: DateTime.now().add(const Duration(days: 7)),
      createdAt: DateTime.now(),
    );
    
    // Save to local storage
    await _storage.saveUser(userModel);
    await _storage.saveAuthToken(tokenModel.accessToken);
    
    return {
      'user': userModel,
      'token': tokenModel,
      'message': 'Login successful',
    };
  }

  /// Register an admin user created via Institution signup flow without logging them in
  Future<void> registerAdminUser({
    required String username,
    required String email,
    required String password,
    required String fullName,
    String? institutionId,
  }) async {
    await Future.delayed(const Duration(milliseconds: 300));

    print('🔍 [MockAuthRepository] Checking for duplicate admin registration...');
    
    // Reload from Hive to ensure we have latest data
    _loadRegisteredUsers();
    
    // Check if already exists in memory or Hive
    final usernameExists = _mockUsers.any((u) => u['username'] == username) || 
                          _storage.isUsernameRegistered(username);
    final emailExists = _mockUsers.any((u) => u['email'] == email) || 
                       _storage.isEmailRegistered(email);
    
    if (usernameExists) {
      print('⚠️ [MockAuthRepository] Username already exists: $username');
      throw ServerException(
        message: 'Username already exists',
        statusCode: 400,
      );
    }
    
    if (emailExists) {
      print('⚠️ [MockAuthRepository] Email already exists: $email');
      throw ServerException(
        message: 'Email already exists',
        statusCode: 400,
      );
    }

    final userId = _uuid.v4();
    final newUser = {
      'id': userId,
      'username': username,
      'email': email,
      'password': password,
      'full_name': fullName,
      'profile_image': null,
      'role': 'admin',
      'created_at': DateTime.now().toIso8601String(),
      'institution_id': institutionId,
      'institution_role': institutionId != null ? 'admin' : null,
      'institution_joined_at': institutionId != null ? DateTime.now().toIso8601String() : null,
    };
    
    // Add to in-memory list
    _mockUsers.add(newUser);
    
    // ✅ Persist to Hive so it survives app restarts
    await _storage.saveRegisteredUser(newUser);
    
    print('✅ [MockAuthRepository] Admin user registered and persisted: $username');
  }
  
  /// Simulate signup with delay
  Future<Map<String, dynamic>> signup({
    required String username,
    required String email,
    required String password,
    required String fullName,
    required String role,
  }) async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 2));
    
    print('🔍 [MockAuthRepository] Signup attempt - Username: $username, Email: $email, Role: $role');
    
    // Reload from Hive to ensure we have latest data
    _loadRegisteredUsers();
    
    // Check if username exists (both in-memory and Hive for double safety)
    final usernameExists = _mockUsers.any((u) => u['username'] == username) || 
                          _storage.isUsernameRegistered(username);
    if (usernameExists) {
      print('❌ [MockAuthRepository] Username already exists: $username');
      throw ServerException(
        message: 'Username already exists',
        statusCode: 400,
      );
    }
    
    // Check if email exists (both in-memory and Hive for double safety)
    final emailExists = _mockUsers.any((u) => u['email'] == email) || 
                       _storage.isEmailRegistered(email);
    if (emailExists) {
      print('❌ [MockAuthRepository] Email already exists: $email');
      throw ServerException(
        message: 'Email already exists',
        statusCode: 400,
      );
    }
    
    // Create new user
    final userId = _uuid.v4();
    final newUser = {
      'id': userId,
      'username': username,
      'email': email,
      'password': password, // In real app, this would be hashed
      'full_name': fullName,
      'profile_image': null,
      'role': role,
      'created_at': DateTime.now().toIso8601String(),
    };
    
    // Add to mock database (in-memory)
    _mockUsers.add(newUser);
    
    // ✅ Persist to Hive so it survives app restarts
    await _storage.saveRegisteredUser(newUser);
    
    print('✅ [MockAuthRepository] User registered and persisted: $username');
    
    // Generate mock tokens
    final accessToken = _generateToken();
    final refreshToken = _generateToken();
    
    // Create user model
    final userModel = UserHiveModel(
      id: userId,
      username: username,
      email: email,
      fullName: fullName,
      profileImage: null,
      role: role,
      createdAt: DateTime.now(),
    );
    
    // Create token model
    final tokenModel = AuthTokenModel(
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: DateTime.now().add(const Duration(days: 7)),
      createdAt: DateTime.now(),
    );
    
    // Save to local storage (current user session)
    await _storage.saveUser(userModel);
    await _storage.saveAuthToken(tokenModel.accessToken);
    
    return {
      'user': userModel,
      'token': tokenModel,
      'message': 'Account created successfully',
    };
  }
  
  /// Logout
  Future<void> logout() async {
    await _storage.logout();
  }
  
  /// Check authentication status
  Future<Map<String, dynamic>?> checkAuthStatus() async {
    final isLoggedIn = _storage.isLoggedIn();
    if (!isLoggedIn) return null;
    
    final user = _storage.getCurrentUser();
    final token = _storage.getToken();
    
    if (user == null || token == null) return null;
    
    final tokenModel = AuthTokenModel(
      accessToken: token,
      refreshToken: '',
      expiresAt: DateTime.now().add(const Duration(days: 7)),
      createdAt: DateTime.now(),
    );
    
    return {
      'user': user,
      'token': tokenModel,
    };
  }
  
  /// Generate mock token
  String _generateToken() {
    return 'mock_token_${_uuid.v4()}';
  }
  
  /// Get current user (from local storage)
  UserHiveModel? getCurrentUser() {
    return _storage.getCurrentUser();
  }
  
  /// Simulate password reset
  Future<String> resetPassword({required String email}) async {
    await Future.delayed(const Duration(seconds: 1));
    
    final emailExists = _mockUsers.any((u) => u['email'] == email);
    if (!emailExists) {
      throw ServerException(
        message: 'No account found with this email address',
        statusCode: 404,
      );
    }
    
    // Send actual email using EmailService
    try {
      final message = await _emailService.sendPasswordResetEmail(email);
      return message;
    } catch (e) {
      // If email service fails, still return success to prevent email enumeration attacks
      // In production, log this error for monitoring
      print('⚠️ [MockAuthRepository] Failed to send reset email: $e');
      return 'If an account exists with this email, you will receive a password reset link.';
    }
  }
  
  /// Send email verification
  Future<String> sendEmailVerification({
    required String email,
    required String userId,
  }) async {
    try {
      final message = await _emailService.sendEmailVerificationEmail(
        email: email,
        userId: userId,
      );
      return message;
    } catch (e) {
      print('⚠️ [MockAuthRepository] Failed to send verification email: $e');
      throw ServerException(
        message: 'Failed to send verification email. Please try again.',
        statusCode: 500,
      );
    }
  }
}
