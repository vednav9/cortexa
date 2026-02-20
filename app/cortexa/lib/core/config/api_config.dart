class ApiConfig {
  /* ===========================
     BASE URL CONFIGURATION
  =========================== */
  
  // Production backend URL (hosted on Vercel)
  static const String _productionUrl = 'https://cortexa-backend.vercel.app/api';
  
  // Local development URL (for testing with local backend)
  // For Android Emulator: use 10.0.2.2 (maps to host's localhost)
  // For iOS Simulator: use localhost
  // For Physical Device: use your computer's IP address (e.g., 192.168.x.x)
  static const String _localUrl = 'http://10.0.2.2:5000/api';
  
  // Set to true to use local backend for development, false for production
  static const bool _useLocalBackend = false;
  
  static String get baseUrl {
    // Allow override via environment variable
    const overridden = String.fromEnvironment('API_BASE_URL');
    if (overridden.isNotEmpty) return overridden;

    // Use production or local based on flag
    return _useLocalBackend ? _localUrl : _productionUrl;
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
  
  /// Build full URL from endpoint path
  static String buildUrl(String endpoint) => baseUrl + endpoint;
}
