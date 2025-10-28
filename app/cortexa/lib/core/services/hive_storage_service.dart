import 'package:hive_flutter/hive_flutter.dart';
import '../../features/auth/data/models/user_hive_model.dart';
import '../../features/auth/data/models/auth_token_model.dart';

class HiveStorageService {
  // Box names
  static const String _userBoxName = 'userBox';
  static const String _tokenBoxName = 'tokenBox';
  static const String _settingsBoxName = 'settingsBox';
  static const String _registeredUsersBoxName = 'registeredUsersBox';

  // Keys
  static const String _currentUserKey = 'current_user';
  static const String _currentTokenKey = 'current_token';

  late Box<UserHiveModel> _userBox;
  late Box<AuthTokenModel> _tokenBox;
  late Box<dynamic> _settingsBox;
  late Box<Map<dynamic, dynamic>> _registeredUsersBox;

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

    // Open boxes
    print('📂 Opening boxes...');
    _userBox = await Hive.openBox<UserHiveModel>(_userBoxName);
     print('✅ User box opened');
    _tokenBox = await Hive.openBox<AuthTokenModel>(_tokenBoxName);
    print('✅ Token box opened');
    _settingsBox = await Hive.openBox(_settingsBoxName);
    print('✅ Settings box opened');
    _registeredUsersBox = await Hive.openBox<Map<dynamic, dynamic>>(_registeredUsersBoxName);
    print('✅ Registered users box opened');

    print('🎉 HiveStorageService initialized successfully');
  }

  // ===== User Methods =====

  /// Save current user
  Future<void> saveUser(UserHiveModel user) async {
    await _userBox.put(_currentUserKey, user);
  }

  /// Get current user
  UserHiveModel? getCurrentUser() {
    return _userBox.get(_currentUserKey);
  }

  /// Delete current user
  Future<void> deleteUser() async {
    await _userBox.delete(_currentUserKey);
  }

  /// Check if user exists
  bool hasUser() {
    return _userBox.containsKey(_currentUserKey);
  }

  // ===== Token Methods =====

  /// Save authentication tokens
  Future<void> saveToken(AuthTokenModel token) async {
    await _tokenBox.put(_currentTokenKey, token);
  }

  /// Get current token
  AuthTokenModel? getToken() {
    return _tokenBox.get(_currentTokenKey);
  }

  /// Get access token string
  Future<String?> getAccessToken() async {
    final token = getToken();
    if (token != null && !token.isExpired) {
      return token.accessToken;
    }
    return null;
  }

  /// Delete tokens
  Future<void> deleteTokens() async {
    await _tokenBox.delete(_currentTokenKey);
  }

  /// Check if user is logged in (has valid token)
  Future<bool> isLoggedIn() async {
    final token = getToken();
    return token != null && !token.isExpired;
  }

  // ===== Settings Methods =====

  /// Save a setting
  Future<void> saveSetting(String key, dynamic value) async {
    await _settingsBox.put(key, value);
  }

  /// Get a setting
  dynamic getSetting(String key, {dynamic defaultValue}) {
    return _settingsBox.get(key, defaultValue: defaultValue);
  }

  /// Delete a setting
  Future<void> deleteSetting(String key) async {
    await _settingsBox.delete(key);
  }

  // ===== Clear All Data =====

  /// Logout - clear all user data
  Future<void> logout() async {
    await deleteUser();
    await deleteTokens();
    // Keep settings
  }

  /// Clear everything (for testing or account deletion)
  Future<void> clearAll() async {
    await _userBox.clear();
    await _tokenBox.clear();
    await _settingsBox.clear();
  }

  /// Close all boxes (call when app closes)
  Future<void> closeBoxes() async {
    await _userBox.close();
    await _tokenBox.close();
    await _settingsBox.close();
    await _registeredUsersBox.close();
  }

  // ===== Registered Users Methods (for MockAuthRepository persistence) =====

  /// Save a registered user (for auth validation across app restarts)
  Future<void> saveRegisteredUser(Map<String, dynamic> userData) async {
    final key = userData['id'] as String;
    await _registeredUsersBox.put(key, userData);
  }

  /// Get all registered users
  List<Map<String, dynamic>> getAllRegisteredUsers() {
    return _registeredUsersBox.values
        .map((user) => Map<String, dynamic>.from(user))
        .toList();
  }

  /// Check if a username exists
  bool isUsernameRegistered(String username) {
    return _registeredUsersBox.values.any(
      (user) => user['username'] == username,
    );
  }

  /// Check if an email exists
  bool isEmailRegistered(String email) {
    return _registeredUsersBox.values.any(
      (user) => user['email'] == email,
    );
  }

  /// Find a registered user by username or email
  Map<String, dynamic>? findRegisteredUser({
    String? username,
    String? email,
  }) {
    try {
      final user = _registeredUsersBox.values.firstWhere(
        (user) {
          if (username != null && user['username'] == username) return true;
          if (email != null && user['email'] == email) return true;
          return false;
        },
      );
      return Map<String, dynamic>.from(user);
    } catch (e) {
      return null;
    }
  }

  /// Clear all registered users (for testing)
  Future<void> clearRegisteredUsers() async {
    await _registeredUsersBox.clear();
  }
}
