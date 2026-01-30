import 'package:flutter/foundation.dart';

class ApiConfig {
  // For physical devices, update this IP to your PC's LAN IP
  // Find it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
  static const String _physicalDeviceIP = '192.168.1.5';
  static const int _backendPort = 5000;
  
  static String get baseUrl {
    const overridden = String.fromEnvironment('API_BASE_URL');
    if (overridden.isNotEmpty) return overridden;

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
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Multipart uploads (logo/banner) can take longer on slow networks.
  static const Duration multipartTimeout = Duration(seconds: 120);
}
