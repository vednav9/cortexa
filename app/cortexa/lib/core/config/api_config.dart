import 'package:flutter/foundation.dart';

class ApiConfig {
  // NGROK SETUP: When ngrok is running, paste your ngrok URL here (without /api)
  // Example: 'https://abc123-def456.ngrok-free.app'
  // To run ngrok: ngrok http 5000
  static const String _ngrokUrl = 'https://b7d2-223-181-63-240.ngrok-free.app';
  
  // Fallback local IP for when NOT using ngrok
  static const String _physicalDeviceIP = '192.168.11.213';
  static const int _backendPort = 5000;
  
  static String get baseUrl {
    const overridden = String.fromEnvironment('API_BASE_URL');
    if (overridden.isNotEmpty) return overridden;

    // If ngrok URL is set, use it (works on any network!)
    if (_ngrokUrl != '') {
      return '$_ngrokUrl/api';
    }

    // Fallback to local IP
    if (kIsWeb) {
      return 'http://localhost:$_backendPort/api';
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://$_physicalDeviceIP:$_backendPort/api';
      case TargetPlatform.iOS:
        return 'http://$_physicalDeviceIP:$_backendPort/api';
      default:
        return 'http://$_physicalDeviceIP:$_backendPort/api';
    }
  }
  
  static int get port => _backendPort;
  
  // Auth endpoints
  static const String studentRegister = '/student/register';
  static const String studentLogin = '/student/login';
  static const String studentLogout = '/student/logout';
  static const String studentMyInstitution = '/student/my-institution';
  
  static const String teacherRegister = '/teacher/register';
  static const String teacherLogin = '/teacher/login';
  static const String teacherLogout = '/teacher/logout';
  static const String teacherMyInstitution = '/teacher/my-institution';
  
  static const String adminRegister = '/admin/register';
  static const String adminLogin = '/admin/login';
  static const String adminLogout = '/admin/logout';
  static const String adminInstitution = '/admin/institution';
  
  static const String getProfile = '/auth/me';
  
  // Timeouts
  // Increased for AI operations which can take longer (especially through ngrok)
  static const Duration connectionTimeout = Duration(seconds: 360); // 6 minutes
  static const Duration receiveTimeout = Duration(seconds: 360); // 6 minutes

  // Multipart uploads (logo/banner) can take longer on slow networks.
  static const Duration multipartTimeout = Duration(seconds: 600); // 10 minutes
}
