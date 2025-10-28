import 'package:flutter/material.dart';
import '../../features/auth/data/models/user_hive_model.dart';

/// Global app state using ChangeNotifier
/// Manages app-wide state that multiple screens need
class AppStateProvider extends ChangeNotifier {
  // Loading states
  bool _isLoading = false;
  bool _isInitialized = false;
  
  // User state
  UserHiveModel? _currentUser;
  String? _accessToken;
  bool _isAuthenticated = false;
  
  // App lifecycle
  AppLifecycleState _lifecycleState = AppLifecycleState.resumed;
  
  // Getters
  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  UserHiveModel? get currentUser => _currentUser;
  String? get accessToken => _accessToken;
  bool get isAuthenticated => _isAuthenticated;
  AppLifecycleState get lifecycleState => _lifecycleState;
  
  // Set loading state
  void setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
  
  // Set initialized state
  void setInitialized(bool value) {
    _isInitialized = value;
    notifyListeners();
  }
  
  // Set user and authentication state
  void setUser(UserHiveModel? user, String? token) {
    _currentUser = user;
    _accessToken = token;
    _isAuthenticated = user != null && token != null;
    notifyListeners();
  }
  
  // Clear user data (logout)
  void clearUser() {
    _currentUser = null;
    _accessToken = null;
    _isAuthenticated = false;
    notifyListeners();
  }
  
  // Update lifecycle state
  void updateLifecycleState(AppLifecycleState state) {
    _lifecycleState = state;
    notifyListeners();
  }
  
  // Reset app state
  void reset() {
    _isLoading = false;
    _isInitialized = false;
    _currentUser = null;
    _accessToken = null;
    _isAuthenticated = false;
    notifyListeners();
  }
}
