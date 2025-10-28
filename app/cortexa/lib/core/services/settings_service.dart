import 'package:shared_preferences/shared_preferences.dart';

class SettingsService {
  late SharedPreferences _prefs;
  
  // Keys
  static const String _themeKey = 'theme_mode';
  static const String _languageKey = 'language';
  static const String _notificationsKey = 'notifications_enabled';
  static const String _biometricsKey = 'biometrics_enabled';
  static const String _firstLaunchKey = 'first_launch';
  
  /// Initialize
  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }
  
  // ===== Theme =====
  
  Future<void> setThemeMode(String mode) async {
    await _prefs.setString(_themeKey, mode);
  }
  
  String getThemeMode() {
    return _prefs.getString(_themeKey) ?? 'dark';
  }
  
  // ===== Language =====
  
  Future<void> setLanguage(String languageCode) async {
    await _prefs.setString(_languageKey, languageCode);
  }
  
  String getLanguage() {
    return _prefs.getString(_languageKey) ?? 'en';
  }
  
  // ===== Notifications =====
  
  Future<void> setNotificationsEnabled(bool enabled) async {
    await _prefs.setBool(_notificationsKey, enabled);
  }
  
  bool getNotificationsEnabled() {
    return _prefs.getBool(_notificationsKey) ?? true;
  }
  
  // ===== Biometrics =====
  
  Future<void> setBiometricsEnabled(bool enabled) async {
    await _prefs.setBool(_biometricsKey, enabled);
  }
  
  bool getBiometricsEnabled() {
    return _prefs.getBool(_biometricsKey) ?? false;
  }
  
  // ===== First Launch =====
  
  Future<void> setFirstLaunchComplete() async {
    await _prefs.setBool(_firstLaunchKey, false);
  }
  
  bool isFirstLaunch() {
    return _prefs.getBool(_firstLaunchKey) ?? true;
  }
  
  // ===== Clear Settings =====
  
  Future<void> clearAll() async {
    await _prefs.clear();
  }
}
