import 'package:flutter/services.dart';

class ApiConfig {
  // ─── Platform channel (Android side provides BuildConfig values) ───────────
  static const _channel = MethodChannel('com.example.cortexa/secrets');

  /// Call once in main() before anything else.
  /// Reads GEMINI_API_KEY / API_BASE_URL / AI_BASE_URL from the native
  /// BuildConfig (which was populated from android/local.properties at
  /// build time). Falls back to local dev URLs when running without secrets.
  static Future<void> initialize() async {
    try {
      final secrets =
          await _channel.invokeMapMethod<String, String>('getSecrets');
      _productionUrl  = secrets?['API_BASE_URL']   ?? '';
      _productionAiUrl = secrets?['AI_BASE_URL']    ?? '';
      geminiApiKey     = secrets?['GEMINI_API_KEY'] ?? '';
    } catch (_) {
      // Running on a non-Android platform or channel not available →
      // keep empty strings, getters will fall back to local dev URLs.
    }
  }

  /* ===========================
     BASE URL CONFIGURATION
  =========================== */

  // Local development URL (never a secret — only for machines running the backend locally)
  // Android Emulator: 10.0.2.2 maps to host localhost
  // Physical device:  use your machine's LAN IP (e.g. 192.168.x.x:5000)
  static const String _localUrl = 'http://10.0.2.2:5000/api';

  // Production URL — populated by ApiConfig.initialize() from local.properties.
  // NEVER hardcode this value here.
  static String _productionUrl = '';

  // Set to true to force the local backend during development.
  static const bool _useLocalBackend = false;

  static String get baseUrl {
    if (_useLocalBackend || _productionUrl.isEmpty) return _localUrl;
    return _productionUrl;
  }

  /* ===========================
     AI SERVICE CONFIGURATION
  =========================== */

  // Local AI URL (for testing with local AI service)
  static const String _localAiUrl = 'http://10.0.2.2:8000/api';

  // Production AI URL — populated by ApiConfig.initialize() from local.properties.
  // NEVER hardcode this value here.
  static String _productionAiUrl = '';

  static String get aiBaseUrl {
    if (_useLocalBackend || _productionAiUrl.isEmpty) return _localAiUrl;
    return _productionAiUrl;
  }
  
  /* ===========================
     AUTHENTICATION ENDPOINTS
  =========================== */
  
  // Student Auth
  static const String studentRegister = '/student/register';
  static const String studentLogin = '/student/login';
  static const String studentLogout = '/student/logout';
  static const String studentMyInstitution = '/student/my-institution';
  
  // Teacher Auth
  static const String teacherRegister = '/teacher/register';
  static const String teacherLogin = '/teacher/login';
  static const String teacherLogout = '/teacher/logout';
  static const String teacherMyInstitution = '/teacher/my-institution';
  
  // Teacher Courses & Students
  static const String teacherAuthorizedCourses = '/teacher/authorized-courses';
  static const String teacherStudents = '/teacher/students';
  
  // Teacher MCQ Management
  static const String teacherGenerateMCQs = '/teacher/mcq/generate';
  static const String teacherSaveMCQSet = '/teacher/mcq/save';
  static const String teacherGetMCQSets = '/teacher/mcq/sets';
  static const String teacherMCQSetBase = '/teacher/mcq';
  
  // Teacher Document Management
  static const String teacherUploadDocument = '/teacher/notes/upload';
  static const String teacherGetDocuments = '/teacher/notes'; // + /{courseId}
  static const String teacherDeleteDocument = '/teacher/notes'; // + /{documentId}
  
  // Admin Auth
  static const String adminRegister = '/admin/register';
  static const String adminLogin = '/admin/login';
  static const String adminLogout = '/admin/logout';
  static const String adminInstitution = '/admin/institution';
  
  // General Auth
  static const String login = '/auth/login';
  static const String signup = '/auth/signup';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String verifyEmail = '/auth/verify-email';
  static const String getProfile = '/auth/me';
  
  /* ===========================
     USER ENDPOINTS
  =========================== */
  
  static const String userProfile = '/user/profile';
  static const String updateProfile = '/user/update';
  static const String changePassword = '/user/change-password';
  
  /* ===========================
     INSTITUTION ENDPOINTS
  =========================== */
  
  static const String institutionsBrowse = '/institutions/browse';
  static const String myInstitutions = '/institutions/my-institutions';
  static const String institutionDetails = '/institutions'; // + /{id}
  static String institutionById(String id) => '/institutions/$id';
  static String institutionBySlug(String slug) => '/institutions/slug/$slug';
  
  /* ===========================
     INVITATION ENDPOINTS
  =========================== */
  
  static const String invitations = '/invitations';
  static const String invitationsAdmin = '/invitations/admin';
  static const String myInvitations = '/invitations/my-invitations';
  static const String acceptInvitation = '/invitations/accept'; // + /{id}
  static const String rejectInvitation = '/invitations/reject'; // + /{id}
  static String invitationAccept(String id) => '/invitations/$id/accept';
  static String invitationReject(String id) => '/invitations/$id/reject';
  static String invitationDelete(String id) => '/invitations/$id';
  static const String invitationsBulk = '/invitations/bulk';
  
  /* ===========================
     QUERY DESK ENDPOINTS
  =========================== */
  
  static String queriesByInstitution(String institutionId) => 
      '/queries/institution/$institutionId';
  static String queryStats(String institutionId) => 
      '/queries/institution/$institutionId/stats';
  static String createQuery(String institutionId) => 
      '/queries/institution/$institutionId';
  static String queryById(String queryId) => '/queries/$queryId';
  static String addReply(String queryId) => '/queries/$queryId/reply';
  static String updateQueryStatus(String queryId) => '/queries/$queryId/status';
  static String deleteQuery(String queryId) => '/queries/$queryId';
  
  /* ===========================
     CONTENT ENDPOINTS
  =========================== */
  
  static const String uploadNotes = '/content/notes/upload';
  static const String getNotes = '/content/notes';
  static const String deleteNote = '/content/notes'; // + /{id}
  
  /* ===========================
     RAG ASSISTANT ENDPOINTS
  =========================== */
  
  static const String ragQuery = '/rag/query';
  static const String chatHistory = '/rag/history';
  
  /* ===========================
     GEMINI PERSONAL AI CONFIGURATION
  =========================== */

  // Populated by ApiConfig.initialize() from android/local.properties.
  // NEVER hardcode the key here.
  // Obtain a key at: https://aistudio.google.com/app/apikey
  static String geminiApiKey = '';

  /* ===========================
     AI SERVICE ENDPOINTS
  =========================== */

  // MCQ Generation (Teacher)
  static const String aiGenerateMcq = '/mcq/generate';
  static const String aiValidateMcq = '/mcq/validate';
  
  // Vector Database / Document Processing (Teacher)
  static const String aiUploadDocument = '/vectordb/upload';
  static const String aiProcessDocument = '/vectordb/process';
  static const String aiListDocuments = '/vectordb/documents';
  static const String aiDeleteDocument = '/vectordb/delete'; // + /{id}
  
  // RAG Query (Student)
  static const String aiRagQuery = '/rag/query';
  static const String aiRagHistory = '/rag/history';
  static const String aiWebSearch = '/hybrid/search'; // Web search + RAG
  
  /* ===========================
     NETWORK TIMEOUTS
  =========================== */
  
  // Increased for AI operations which can take longer
  static const Duration connectionTimeout = Duration(seconds: 60); // 1 minute
  static const Duration receiveTimeout = Duration(seconds: 60); // 1 minute

  // Multipart uploads (logo/banner) can take longer on slow networks
  static const Duration multipartTimeout = Duration(seconds: 120); // 2 minutes
  
  /* ===========================
     HELPER METHODS
  =========================== */
  
  /// Build full URL from endpoint path (for backend APIs)
  static String buildUrl(String endpoint) => baseUrl + endpoint;
  
  /// Build full AI URL from endpoint path (for AI services)
  static String buildAiUrl(String endpoint) => aiBaseUrl + endpoint;
}
